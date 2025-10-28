import { Pool, PoolClient } from 'pg';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TurnkeyServiceError, ErrorCodes } from './error-handler';

export interface TenantDatabaseConfig {
  originatorId: string;
  databaseName: string;
  databaseUser: string;
  connectionString: string;
  encryptedConnectionString: string;
  isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  schemaName?: string;
}

export interface TenantProvisioningOptions {
  originatorId: string;
  displayName: string;
  isolationType?: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  environment?: 'sandbox' | 'staging' | 'production';
  
  // Database configuration
  databaseHost?: string;
  databasePort?: number;
  adminConnectionString?: string;
  
  // Security configuration
  encryptionKey?: string;
  generateRandomPassword?: boolean;
}

export interface TenantMigrationResult {
  migrationsApplied: string[];
  totalMigrations: number;
  executionTimeMs: number;
}

export class TenantDatabaseProvisioner {
  private readonly adminPool: Pool;
  private readonly encryptionKey: string;
  private readonly adminConnectionString: string;
  
  constructor(options: {
    adminConnectionString?: string;
    encryptionKey?: string;
  } = {}) {
    // Admin connection for creating databases and users
    const adminConnectionString = options.adminConnectionString ?? process.env.ADMIN_DATABASE_URL;
    
    if (typeof adminConnectionString !== 'string' || adminConnectionString.length === 0) {
      throw new TurnkeyServiceError(
        'ADMIN_DATABASE_URL environment variable is required for tenant database provisioning. ' +
        'This should be a PostgreSQL connection with database creation privileges.',
        ErrorCodes.INVALID_CONFIG
      );
    }
    
    this.adminConnectionString = adminConnectionString;

    this.adminPool = new Pool({
      connectionString: adminConnectionString,
      max: 5,
      idleTimeoutMillis: 10000,
    });
    
    // Encryption key for storing connection strings
    const encryptionKey = options.encryptionKey ?? process.env.TENANT_DB_ENCRYPTION_KEY;
    
    if (typeof encryptionKey !== 'string' || encryptionKey.length === 0) {
      throw new TurnkeyServiceError(
        'TENANT_DB_ENCRYPTION_KEY environment variable is required. ' +
        'Generate one with: openssl rand -hex 32',
        ErrorCodes.INVALID_CONFIG
      );
    }
    
    this.encryptionKey = encryptionKey;
    
    this.adminPool.on('error', (err: Error) => {
      console.error('Admin pool error:', err);
    });
  }

  /**
   * Provision a complete database environment for a new tenant
   */
  async provisionTenant(options: TenantProvisioningOptions): Promise<TenantDatabaseConfig> {
    const { originatorId, isolationType = 'dedicated_database' } = options;
    
    // Validate originator ID format
    this.validateOriginatorId(originatorId);
    
    console.warn(`🏗️ Provisioning tenant database for: ${originatorId}`);
    console.warn(`📋 Isolation type: ${isolationType}`);
    
    try {
      switch (isolationType) {
        case 'dedicated_database':
          return await this.provisionDedicatedDatabase(options);
        case 'dedicated_schema':
          return await this.provisionDedicatedSchema(options);
        case 'shared_with_rls':
          return await this.provisionSharedWithRLS(options);
        default:
          throw new TurnkeyServiceError(
            `Unsupported isolation type: ${isolationType as string}`,
            ErrorCodes.INVALID_CONFIG
          );
      }
    } catch (error) {
      console.error(`❌ Failed to provision tenant ${originatorId}:`, error);
      throw error;
    }
  }

  /**
   * Provision a dedicated database for the tenant (recommended)
   */
  private async provisionDedicatedDatabase(options: TenantProvisioningOptions): Promise<TenantDatabaseConfig> {
    const { originatorId } = options;
    const databaseName = `custody_${originatorId}`;
    const databaseUser = `${originatorId}_user`;
    const databasePassword = this.generateSecurePassword();
    
    let adminClient: PoolClient | undefined;
    
    try {
      adminClient = await this.adminPool.connect();
      
      // 1. Check if database already exists
      const dbExists = await this.checkDatabaseExists(adminClient, databaseName);
      if (dbExists) {
        throw new TurnkeyServiceError(
          `Database ${databaseName} already exists`,
          ErrorCodes.INVALID_CONFIG
        );
      }
      
      // 2. Create database
      console.warn(`📀 Creating database: ${databaseName}`);
      await adminClient.query(`CREATE DATABASE "${databaseName}"`);
      
      // 3. Create dedicated user
      console.warn(`👤 Creating database user: ${databaseUser}`);
      const userExists = await this.checkUserExists(adminClient, databaseUser);
      if (!userExists) {
        await adminClient.query(`CREATE USER "${databaseUser}" WITH PASSWORD '${databasePassword}'`);
      }
      
      // 4. Grant permissions
      await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${databaseName}" TO "${databaseUser}"`);
      await adminClient.query(`ALTER DATABASE "${databaseName}" OWNER TO "${databaseUser}"`);
      
      // 5. Create connection string
      const host = options.databaseHost ?? 'localhost';
      const port = options.databasePort ?? 5432;
      const connectionString = `postgresql://${databaseUser}:${databasePassword}@${host}:${port}/${databaseName}`;
      
      // 6. Encrypt connection string for storage
      const encryptedConnectionString = this.encryptConnectionString(connectionString);
      
      // 7. Create extensions with admin privileges
      await this.createTenantExtensions(databaseName);
      
      // 8. Run migrations on new database
      await this.runTenantMigrations(connectionString, undefined, {
        runAsAdmin: true,
        databaseName,
        role: databaseUser,
      });
      
      console.warn(`✅ Successfully provisioned dedicated database for ${originatorId}`);
      
      return {
        originatorId,
        databaseName,
        databaseUser,
        connectionString,
        encryptedConnectionString,
        isolationType: 'dedicated_database'
      };
    } finally {
      if (adminClient) {
        adminClient.release();
      }
    }
  }

  /**
   * Provision a dedicated schema within the shared database
   */
  private async provisionDedicatedSchema(options: TenantProvisioningOptions): Promise<TenantDatabaseConfig> {
    const { originatorId } = options;
    const schemaName = `tenant_${originatorId}`;
    const databaseUser = `${originatorId}_user`;
    const databasePassword = this.generateSecurePassword();
    
    let adminClient: PoolClient | undefined;
    
    try {
      adminClient = await this.adminPool.connect();
      
      // 1. Create schema
      console.warn(`📁 Creating schema: ${schemaName}`);
      await adminClient.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      
      // 2. Create user if doesn't exist
      const userExists = await this.checkUserExists(adminClient, databaseUser);
      if (!userExists) {
        console.warn(`👤 Creating schema user: ${databaseUser}`);
        await adminClient.query(`CREATE USER "${databaseUser}" WITH PASSWORD '${databasePassword}'`);
      }
      
      // 3. Grant schema permissions
      await adminClient.query(`GRANT ALL ON SCHEMA "${schemaName}" TO "${databaseUser}"`);
      await adminClient.query(`ALTER SCHEMA "${schemaName}" OWNER TO "${databaseUser}"`);
      await adminClient.query(`GRANT ALL ON ALL TABLES IN SCHEMA "${schemaName}" TO "${databaseUser}"`);
      await adminClient.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA "${schemaName}" TO "${databaseUser}"`);
      await adminClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}" GRANT ALL ON TABLES TO "${databaseUser}"`);
      
      // 4. Create connection string with schema search path
      const host = options.databaseHost ?? 'localhost';
      const port = options.databasePort ?? 5432;
      // Get database name from connection string since PoolClient doesn't expose database property
      const dbName = 'custody_shared'; // Use configured shared database name
      const connectionString = `postgresql://${databaseUser}:${databasePassword}@${host}:${port}/${dbName}?options=-c%20search_path=${schemaName}`;
      
      // 5. Encrypt connection string
      const encryptedConnectionString = this.encryptConnectionString(connectionString);
      
      // 6. Run schema-specific migrations
      await this.runTenantMigrations(connectionString, schemaName, {
        runAsAdmin: true,
        databaseName: dbName,
        role: databaseUser,
      });
      
      console.warn(`✅ Successfully provisioned dedicated schema for ${originatorId}`);
      
      return {
        originatorId,
        databaseName: dbName,
        databaseUser,
        connectionString,
        encryptedConnectionString,
        isolationType: 'dedicated_schema',
        schemaName
      };
    } finally {
      if (adminClient) {
        adminClient.release();
      }
    }
  }

  /**
   * Set up shared database with row-level security
   */
  private async provisionSharedWithRLS(options: TenantProvisioningOptions): Promise<TenantDatabaseConfig> {
    const { originatorId } = options;
    const databaseUser = `${originatorId}_user`;
    const databasePassword = this.generateSecurePassword();
    
    let adminClient: PoolClient | undefined;
    
    try {
      adminClient = await this.adminPool.connect();
      
      // 1. Create user
      const userExists = await this.checkUserExists(adminClient, databaseUser);
      if (!userExists) {
        console.warn(`👤 Creating RLS user: ${databaseUser}`);
        await adminClient.query(`CREATE USER "${databaseUser}" WITH PASSWORD '${databasePassword}'`);
      }
      
      // 2. Grant permissions to shared tables
      await adminClient.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${databaseUser}"`);
      await adminClient.query(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO "${databaseUser}"`);
      
      // 3. Set up RLS policies (will be done in migrations)
      console.warn(`🔒 Setting up RLS policies for ${originatorId}`);
      
      // 4. Create connection string
      const host = options.databaseHost ?? 'localhost';
      const port = options.databasePort ?? 5432;
      // Use configured shared database name
      const dbName = 'custody_shared';
      const connectionString = `postgresql://${databaseUser}:${databasePassword}@${host}:${port}/${dbName}`;
      
      // 5. Encrypt connection string
      const encryptedConnectionString = this.encryptConnectionString(connectionString);
      
      console.warn(`✅ Successfully provisioned RLS access for ${originatorId}`);
      
      return {
        originatorId,
        databaseName: dbName,
        databaseUser,
        connectionString,
        encryptedConnectionString,
        isolationType: 'shared_with_rls'
      };
    } finally {
      if (adminClient) {
        adminClient.release();
      }
    }
  }

  /**
   * Run tenant-specific database migrations
   */
  async runTenantMigrations(
    connectionString: string,
    schema?: string,
    options: { runAsAdmin?: boolean; databaseName?: string; role?: string } = {}
  ): Promise<TenantMigrationResult> {
    const startTime = Date.now();
    const migrationsApplied: string[] = [];
    
    const useAdmin = options.runAsAdmin === true;
    let poolConfigConnectionString = connectionString;

    if (useAdmin) {
      if (!options.databaseName) {
        throw new TurnkeyServiceError(
          'databaseName is required when running migrations with admin privileges',
          ErrorCodes.INVALID_CONFIG
        );
      }

      poolConfigConnectionString = this.buildAdminConnectionStringForDatabase(options.databaseName);
    }

    const tenantPool = new Pool({ connectionString: poolConfigConnectionString, max: 5 });
    let client: PoolClient | undefined;
    
    try {
      client = await tenantPool.connect();

      if (useAdmin && options.role) {
        await client.query(`SET ROLE ${this.quoteIdentifier(options.role)}`);
      }
      
      // Set schema if provided
      if (typeof schema === 'string' && schema.length > 0) {
        await client.query(`SET search_path TO "${schema}"`);
      }
      
      // Get migration files
      const migrationFiles = await this.getTenantMigrationFiles();
      
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Apply migrations
      for (const migrationFile of migrationFiles) {
        const version = path.basename(migrationFile, '.sql');
        
        // Check if migration already applied
        const result = await client.query(
          'SELECT version FROM schema_migrations WHERE version = $1',
          [version]
        );
        
        if (result.rows.length === 0) {
          console.warn(`📝 Applying migration: ${version}`);
          
          // Read and execute migration
          const migrationSQL = await fs.readFile(migrationFile, 'utf-8');
          await client.query(migrationSQL);
          
          // Record migration
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1)',
            [version]
          );
          
          migrationsApplied.push(version);
        }
      }
      
      const executionTimeMs = Date.now() - startTime;
      
      console.warn(`✅ Applied ${migrationsApplied.length} migrations in ${executionTimeMs}ms`);
      
      return {
        migrationsApplied,
        totalMigrations: migrationFiles.length,
        executionTimeMs
      };
    } finally {
      if (client) {
        if (useAdmin && options.role) {
          await client.query('RESET ROLE').catch(() => undefined);
        }
        client.release();
      }
      await tenantPool.end();
    }
  }

  /**
   * Cleanup tenant database resources
   */
  async deprovisionTenant(originatorId: string, config: TenantDatabaseConfig): Promise<void> {
    let adminClient: PoolClient | undefined;
    
    try {
      adminClient = await this.adminPool.connect();
      
      console.warn(`🗑️ Deprovisioning tenant: ${originatorId}`);
      
      switch (config.isolationType) {
        case 'dedicated_database':
          // Terminate connections and drop database
          await adminClient.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '${config.databaseName}' AND pid <> pg_backend_pid()
          `);
          await adminClient.query(`DROP DATABASE IF EXISTS "${config.databaseName}"`);
          await adminClient.query(`DROP USER IF EXISTS "${config.databaseUser}"`);
          break;
          
        case 'dedicated_schema':
          await adminClient.query(`DROP SCHEMA IF EXISTS "tenant_${originatorId}" CASCADE`);
          await adminClient.query(`DROP USER IF EXISTS "${config.databaseUser}"`);
          break;
          
        case 'shared_with_rls':
          await adminClient.query(`DROP USER IF EXISTS "${config.databaseUser}"`);
          break;
      }
      
      console.warn(`✅ Successfully deprovisioned tenant: ${originatorId}`);
    } finally {
      if (adminClient) {
        adminClient.release();
      }
    }
  }

  /**
   * Utility methods
   */
  private validateOriginatorId(originatorId: string): void {
    if (!/^[a-z0-9_]+$/.test(originatorId)) {
      throw new TurnkeyServiceError(
        'Originator ID must contain only lowercase letters, numbers, and underscores',
        ErrorCodes.INVALID_CONFIG
      );
    }
    
    if (originatorId.length > 50) {
      throw new TurnkeyServiceError(
        'Originator ID must be 50 characters or less',
        ErrorCodes.INVALID_CONFIG
      );
    }
  }

  private async checkDatabaseExists(client: PoolClient, databaseName: string): Promise<boolean> {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );
    return result.rows.length > 0;
  }

  private async checkUserExists(client: PoolClient, username: string): Promise<boolean> {
    const result = await client.query(
      'SELECT 1 FROM pg_user WHERE usename = $1',
      [username]
    );
    return result.rows.length > 0;
  }

  private generateSecurePassword(): string {
    // Generate a 32-byte random password and convert to base64
    return crypto.randomBytes(32).toString('base64').slice(0, 32);
  }

  // Removed generateEncryptionKey - using explicit key from environment

  private encryptConnectionString(connectionString: string): string {
    // Use secure AES-256-GCM with random IV
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(connectionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  public decryptConnectionString(encryptedConnectionString: string): string {
    try {
      const parts = encryptedConnectionString.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted connection string format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new TurnkeyServiceError(
        'Failed to decrypt connection string - encryption key may be incorrect',
        ErrorCodes.INVALID_CONFIG,
        undefined,
        error
      );
    }
  }

  private async getTenantMigrationFiles(): Promise<string[]> {
    const migrationDir = path.join(__dirname, '../../database/tenant-migrations');
    
    try {
      const files = await fs.readdir(migrationDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => path.join(migrationDir, file));
    } catch {
      console.warn('No tenant migration directory found, using main schema');
      // Fallback to main schema file
      return [path.join(__dirname, '../../database/init/01-schema-complete.sql')];
    }
  }

  private buildAdminConnectionStringForDatabase(databaseName: string): string {
    try {
      const url = new URL(this.adminConnectionString);
      url.pathname = `/${databaseName}`;
      return url.toString();
    } catch (error) {
      throw new TurnkeyServiceError(
        'Invalid ADMIN_DATABASE_URL connection string',
        ErrorCodes.INVALID_CONFIG,
        undefined,
        error
      );
    }
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  /**
   * Create required PostgreSQL extensions with admin privileges
   */
  private async createTenantExtensions(databaseName: string): Promise<void> {
    const connectionString = this.buildAdminConnectionStringForDatabase(databaseName);
    const pool = new Pool({ connectionString, max: 1 });
    let client: PoolClient | undefined;

    try {
      client = await pool.connect();
      console.warn(`🔧 Creating extensions in database: ${databaseName}`);

      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

      console.warn(`✅ Extensions created in database: ${databaseName}`);
    } finally {
      if (client) {
        client.release();
      }
      await pool.end();
    }
  }

  async close(): Promise<void> {
    await this.adminPool.end();
  }
}
