import { Pool, PoolClient } from 'pg';
import { TurnkeyServiceError, ErrorCodes } from './error-handler';
import { TenantEncryption } from './tenant-encryption';
import type { TenantStatus } from './database-types';

export interface TenantConnectionConfig {
  originatorId: string;
  connectionString: string;
  poolConfig?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    allowExitOnIdle?: boolean;
  };
  isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  databaseName: string;
  schemaName?: string;
}

export interface TenantRegistryEntry {
  originatorId: string;
  displayName: string;
  status: TenantStatus;
  databaseName?: string; // Nullable during provisioning
  databaseSchema?: string;
  encryptedConnectionString?: string; // Nullable during provisioning
  isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  turnkeySubOrgId?: string;
  lastAccessedAt?: Date;
  connectionPoolConfig?: Record<string, unknown>;
}

/**
 * Manages database connections for multiple tenants with complete isolation
 */
export class TenantConnectionRegistry {
  private static instance: TenantConnectionRegistry;
  private readonly controlPlanePool: Pool;
  private readonly tenantPools = new Map<string, Pool>();
  private readonly connectionCache = new Map<string, TenantConnectionConfig>();
  private readonly encryption: TenantEncryption = TenantEncryption.getInstance();
  
  private constructor(controlPlaneConnectionString?: string) {
    // Control plane database connection - fallback to DATABASE_URL for backward compatibility
    const connectionString = controlPlaneConnectionString ?? 
                           process.env.CONTROL_PLANE_DATABASE_URL ?? 
                           process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new TurnkeyServiceError(
        'CONTROL_PLANE_DATABASE_URL or DATABASE_URL environment variable is required. ' +
        'For multi-tenant operation, use CONTROL_PLANE_DATABASE_URL pointing to a dedicated control plane database.',
        ErrorCodes.INVALID_CONFIG
      );
    }

    this.controlPlanePool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      application_name: 'custody_control_plane'
    });
    
    this.controlPlanePool.on('error', (err: Error) => {
      console.error('Control plane pool error:', err);
    });
    
  }

  public static getInstance(controlPlaneConnectionString?: string): TenantConnectionRegistry {
    if (!TenantConnectionRegistry.instance) {
      TenantConnectionRegistry.instance = new TenantConnectionRegistry(controlPlaneConnectionString);
    }
    return TenantConnectionRegistry.instance;
  }

  /**
   * Get a database connection for a specific tenant
   */
  async getConnection(originatorId: string): Promise<Pool> {
    if (!originatorId || typeof originatorId !== 'string') {
      throw new TurnkeyServiceError(
        'Originator ID is required',
        ErrorCodes.INVALID_CONFIG
      );
    }

    // Check if we already have a connection pool for this tenant
    if (this.tenantPools.has(originatorId)) {
      return this.tenantPools.get(originatorId)!;
    }

    // Load tenant configuration from control plane
    const tenantConfig = await this.loadTenantConfig(originatorId);
    
    // Create connection pool for tenant
    const pool = await this.createTenantPool(tenantConfig);
    
    // Cache the pool
    this.tenantPools.set(originatorId, pool);
    
    console.info(`✅ Established connection pool for tenant: ${originatorId}`);
    
    return pool;
  }

  /**
   * Get a client connection for a specific tenant
   */
  async getClient(originatorId: string): Promise<PoolClient> {
    const pool = await this.getConnection(originatorId);
    return pool.connect();
  }

  /**
   * Execute a query on a tenant's database
   */
  async query<T = unknown>(originatorId: string, text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    const pool = await this.getConnection(originatorId);
    const result = await pool.query(text, params);
    
    // Update last accessed time
    await this.updateLastAccessed(originatorId);
    
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0
    };
  }

  /**
   * Execute a query on the control plane database
   */
  async queryControlPlane<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    const result = await this.controlPlanePool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount ?? 0
    };
  }

  /**
   * Execute a transaction on a tenant's database
   */
  async transaction<T>(
    originatorId: string, 
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient(originatorId);
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      // Update last accessed time
      await this.updateLastAccessed(originatorId);
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Register a new tenant in the control plane
   */
  async registerTenant(config: {
    originatorId: string;
    displayName: string;
    databaseConfig: {
      databaseName: string;
      encryptedConnectionString: string;
      isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
      schemaName?: string;
    };
    turnkeySubOrgId?: string;
    connectionPoolConfig?: Record<string, unknown>;
  }): Promise<void> {
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        INSERT INTO tenant_registry (
          originator_id,
          display_name,
          database_name,
          database_schema,
          encrypted_connection_string,
          isolation_type,
          turnkey_suborg_id,
          connection_pool_config,
          status,
          provisioned_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (originator_id) 
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          database_name = EXCLUDED.database_name,
          database_schema = EXCLUDED.database_schema,
          encrypted_connection_string = EXCLUDED.encrypted_connection_string,
          turnkey_suborg_id = EXCLUDED.turnkey_suborg_id,
          connection_pool_config = EXCLUDED.connection_pool_config,
          status = EXCLUDED.status,
          provisioned_at = EXCLUDED.provisioned_at
      `, [
        config.originatorId,
        config.displayName,
        config.databaseConfig.databaseName,
        config.databaseConfig.schemaName,
        config.databaseConfig.encryptedConnectionString,
        config.databaseConfig.isolationType,
        config.turnkeySubOrgId,
        JSON.stringify(config.connectionPoolConfig || {}),
      ]);
      
      console.info(`📝 Registered tenant in control plane: ${config.originatorId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant information from control plane
   */
  async getTenantInfo(originatorId: string): Promise<TenantRegistryEntry | null> {
    const client = await this.controlPlanePool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          originator_id,
          display_name,
          status,
          database_name,
          database_schema,
          encrypted_connection_string,
          isolation_type,
          turnkey_suborg_id,
          last_accessed_at,
          connection_pool_config
        FROM tenant_registry
        WHERE originator_id = $1
      `, [originatorId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        originatorId: row.originator_id,
        displayName: row.display_name,
        status: row.status,
        databaseName: row.database_name ?? undefined,
        databaseSchema: row.database_schema ?? undefined,
        encryptedConnectionString: row.encrypted_connection_string ?? undefined,
        isolationType: row.isolation_type,
        turnkeySubOrgId: row.turnkey_suborg_id ?? undefined,
        lastAccessedAt: row.last_accessed_at ?? undefined,
        connectionPoolConfig: row.connection_pool_config ?? undefined
      };
    } finally {
      client.release();
    }
  }

  /**
   * List all registered tenants
   */
  async listTenants(): Promise<TenantRegistryEntry[]> {
    const client = await this.controlPlanePool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          originator_id,
          display_name,
          status,
          database_name,
          encrypted_connection_string,
          isolation_type,
          turnkey_suborg_id,
          last_accessed_at,
          connection_pool_config
        FROM tenant_registry
        WHERE status != 'terminated'
        ORDER BY display_name
      `);
      
      return result.rows.map(row => ({
        originatorId: row.originator_id,
        displayName: row.display_name,
        status: row.status,
        databaseName: row.database_name ?? undefined,
        encryptedConnectionString: row.encrypted_connection_string ?? undefined,
        isolationType: row.isolation_type,
        turnkeySubOrgId: row.turnkey_suborg_id ?? undefined,
        lastAccessedAt: row.last_accessed_at ?? undefined,
        connectionPoolConfig: row.connection_pool_config ?? undefined
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Suspend a tenant (prevent new connections)
   */
  async suspendTenant(originatorId: string): Promise<void> {
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        UPDATE tenant_registry 
        SET status = 'suspended' 
        WHERE originator_id = $1
      `, [originatorId]);
      
      // Close existing connection pool
      if (this.tenantPools.has(originatorId)) {
        await this.tenantPools.get(originatorId)!.end();
        this.tenantPools.delete(originatorId);
      }
      
      // Clear cache
      this.connectionCache.delete(originatorId);
      
      console.info(`⏸️ Suspended tenant: ${originatorId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Reactivate a suspended tenant
   */
  async reactivateTenant(originatorId: string): Promise<void> {
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        UPDATE tenant_registry 
        SET status = 'active' 
        WHERE originator_id = $1
      `, [originatorId]);
      
      console.info(`▶️ Reactivated tenant: ${originatorId}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close connection pool for a specific tenant
   */
  async closeTenantConnection(originatorId: string): Promise<void> {
    if (this.tenantPools.has(originatorId)) {
      await this.tenantPools.get(originatorId)!.end();
      this.tenantPools.delete(originatorId);
      this.connectionCache.delete(originatorId);
      console.info(`🔌 Closed connection pool for tenant: ${originatorId}`);
    }
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    // Close all tenant pools
    const closePromises = Array.from(this.tenantPools.entries()).map(
      async ([originatorId, pool]) => {
        await pool.end();
        console.info(`🔌 Closed pool for tenant: ${originatorId}`);
      }
    );
    
    await Promise.all(closePromises);
    
    // Close control plane pool
    await this.controlPlanePool.end();
    
    // Clear caches
    this.tenantPools.clear();
    this.connectionCache.clear();
    
    console.info('📴 Closed all tenant connections');
  }

  /**
   * Private helper methods
   */
  private async loadTenantConfig(originatorId: string): Promise<TenantConnectionConfig> {
    // Check cache first
    if (this.connectionCache.has(originatorId)) {
      return this.connectionCache.get(originatorId)!;
    }

    const tenantInfo = await this.getTenantInfo(originatorId);
    
    if (!tenantInfo) {
      throw new TurnkeyServiceError(
        `Tenant not found: ${originatorId}`,
        ErrorCodes.NOT_FOUND
      );
    }
    
    if (tenantInfo.status !== 'active') {
      throw new TurnkeyServiceError(
        `Tenant is not active: ${originatorId} (status: ${tenantInfo.status})`,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Verify required fields are present for active tenants
    if (!tenantInfo.databaseName || !tenantInfo.encryptedConnectionString) {
      throw new TurnkeyServiceError(
        `Tenant database configuration incomplete: ${originatorId}`,
        ErrorCodes.INVALID_CONFIG
      );
    }

    // Decrypt connection string using standalone utility (no admin DB required)
    const connectionString = this.encryption.decryptConnectionString(
      tenantInfo.encryptedConnectionString
    );

    const config: TenantConnectionConfig = {
      originatorId,
      connectionString,
      isolationType: tenantInfo.isolationType,
      databaseName: tenantInfo.databaseName,
      schemaName: tenantInfo.databaseSchema,
      poolConfig: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        allowExitOnIdle: true,
        ...tenantInfo.connectionPoolConfig
      }
    };

    // Cache the configuration
    this.connectionCache.set(originatorId, config);
    
    return config;
  }

  private async createTenantPool(config: TenantConnectionConfig): Promise<Pool> {
    const pool = new Pool({
      connectionString: config.connectionString,
      application_name: `custody_tenant_${config.originatorId}`,
      ...config.poolConfig,
    });

    pool.on('error', (err: Error) => {
      console.error(`Tenant pool error for ${config.originatorId}:`, err);
    });

    pool.on('connect', (client: PoolClient) => {
      if (config.isolationType === 'dedicated_schema' && config.schemaName) {
        client
          .query(`SET search_path TO "${config.schemaName}"`)
          .catch((err) => {
            console.error(`Failed to set schema for ${config.originatorId}:`, err);
          });
      }

      if (config.isolationType === 'shared_with_rls') {
        client
          .query(`SET app.current_originator_id = '${config.originatorId}'`)
          .catch((err) => {
            console.error(`Failed to set RLS context for ${config.originatorId}:`, err);
          });
      }
    });

    // Test the connection
    try {
      const testClient = await pool.connect();
      await testClient.query('SELECT 1');
      testClient.release();
    } catch (error) {
      await pool.end();
      throw new TurnkeyServiceError(
        `Failed to connect to tenant database: ${config.originatorId}`,
        ErrorCodes.NETWORK_ERROR,
        undefined,
        error
      );
    }

    return pool;
  }

  private async updateLastAccessed(originatorId: string): Promise<void> {
    // Update asynchronously to avoid blocking the main query
    setImmediate(async () => {
      try {
        const client = await this.controlPlanePool.connect();
        try {
          await client.query(`
            UPDATE tenant_registry 
            SET last_accessed_at = CURRENT_TIMESTAMP 
            WHERE originator_id = $1
          `, [originatorId]);
        } finally {
          client.release();
        }
      } catch (error) {
        const details = error instanceof Error ? error : new Error(String(error));
        console.error(`Failed to update last accessed time for ${originatorId}:`, details);
      }
    });
  }
}
