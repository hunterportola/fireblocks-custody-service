import { Pool, PoolClient } from 'pg';
import type { QueryResult } from 'pg';
import * as crypto from 'crypto';
import { TenantDatabaseProvisioner, TenantDatabaseConfig } from '../core/tenant-database-provisioner';
import { TenantConnectionRegistry } from '../core/tenant-connection-registry';
import { TenantDatabaseService } from './tenant-database-service';
import { TurnkeyServiceError, ErrorCodes } from '../core/error-handler';
import { ControlPlaneOnboardingRepository } from './control-plane/onboarding-repository';
import type {
  OnboardingPhase,
  OnboardingSessionRecord,
  OnboardingSessionStatus,
  OnboardingStepStatus,
  TurnkeyProvisioningArtifact,
} from './onboarding/types';
import type { TenantStatus } from '../core/database-types';

export interface OriginatorRegistrationData {
  // Company Information
  company: {
    legalName: string;
    displayName: string;
    originatorId: string;
    taxId?: string;
    incorporationState?: string;
    businessType?: 'corporation' | 'llc' | 'partnership';
  };
  
  // Primary Contact (becomes first admin)
  primaryContact: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
  };
  
  // Business Details
  businessInfo: {
    lendingLicense?: string;
    yearEstablished?: number;
    averageMonthlyVolume?: string;
    primaryMarkets?: string[];
  };
  
  // Initial Configuration Preferences
  configuration: {
    environment: 'sandbox' | 'staging' | 'production';
    preferredChains?: string[];
    complianceLevel?: 'basic' | 'enhanced';
    multiSigRequirement?: boolean;
    isolationType?: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  };
}

export interface TenantProvisioningResult {
  originatorId: string;
  databaseConfig: TenantDatabaseConfig;
  initialApiKey: {
    keyId: string;
    apiKey: string; // Only returned once
    keyHash: string;
    permissions: string[];
    expiresAt: Date;
  };
  controlPlaneRegistration: {
    registeredAt: Date;
    status: 'provisioning' | 'active';
  };
}

export interface TenantInfo {
  originatorId: string;
  displayName: string;
  legalEntityName?: string;
  environment: 'sandbox' | 'staging' | 'production';
  status: 'registering' | 'provisioning' | 'kyc_pending' | 'active' | 'suspended' | 'terminated';
  isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  databaseName?: string;
  databaseSchema?: string;
  databaseHost?: string;
  encryptedConnectionString?: string;
  turnkeySubOrgId?: string;
  turnkeyOrganizationId?: string;
  apiBaseUrl?: string;
  apiRateLimits?: Record<string, number>;
  brandingConfig?: Record<string, unknown>;
  featureFlags?: Record<string, unknown>;
  kycStatus?: string;
  complianceLevel?: string;
  businessMetadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
  provisionedAt?: Date;
  activatedAt?: Date;
  lastAccessedAt?: Date;
  connectionPoolConfig?: Record<string, unknown>;
}

export interface ApiKeyInfo {
  keyId: string;
  originatorId: string;
  keyName?: string;
  keyType: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
}

// Database result type interfaces (removed unused interfaces)

/**
 * Control plane service for managing tenant lifecycle and metadata
 */
export class ControlPlaneService {
  private static instance: ControlPlaneService;
  private readonly controlPlanePool: Pool;
  private _provisioner?: TenantDatabaseProvisioner;
  private readonly connectionRegistry: TenantConnectionRegistry;
  private readonly onboardingRepository: ControlPlaneOnboardingRepository;
  private readonly controlPlaneConnectionString?: string;

  private constructor(controlPlaneConnectionString?: string) {
    this.controlPlaneConnectionString = controlPlaneConnectionString;
    
    this.controlPlanePool = new Pool({
      connectionString: controlPlaneConnectionString ?? process.env.CONTROL_PLANE_DATABASE_URL ?? process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      application_name: 'custody_control_plane_service'
    });

    this.controlPlanePool.on('error', (err: Error) => {
      console.error('Control plane pool error:', err);
    });

    this.connectionRegistry = TenantConnectionRegistry.getInstance(controlPlaneConnectionString);
    this.onboardingRepository = new ControlPlaneOnboardingRepository(this.controlPlanePool);
  }

  public static getInstance(controlPlaneConnectionString?: string): ControlPlaneService {
    if (!ControlPlaneService.instance) {
      ControlPlaneService.instance = new ControlPlaneService(controlPlaneConnectionString);
    }
    return ControlPlaneService.instance;
  }

  /**
   * Lazy getter for provisioner - only creates it when needed for provisioning operations
   */
  private get provisioner(): TenantDatabaseProvisioner {
    if (!this._provisioner) {
      this._provisioner = new TenantDatabaseProvisioner({
        adminConnectionString: this.controlPlaneConnectionString,
        encryptionKey: process.env.TENANT_DB_ENCRYPTION_KEY
      });
    }
    return this._provisioner;
  }

  /**
   * Complete tenant provisioning workflow
   */
  async provisionTenant(registrationData: OriginatorRegistrationData): Promise<TenantProvisioningResult> {
    const { originatorId } = registrationData.company;
    
    console.log(`🚀 Starting tenant provisioning for: ${originatorId}`);
    
    // Start transaction in control plane
    const controlPlaneClient = await this.controlPlanePool.connect();
    
    try {
      await controlPlaneClient.query('BEGIN');
      
      // 1. Check if tenant already exists
      const existingTenant = await this.getTenantInfo(originatorId);
      if (existingTenant) {
        throw new TurnkeyServiceError(
          `Tenant already exists: ${originatorId}`,
          ErrorCodes.INVALID_CONFIG
        );
      }
      
      // 2. Register tenant in control plane (initial state)
      await this.registerTenantInitial(controlPlaneClient, registrationData);
      
      // 3. Provision tenant database
      const databaseConfig = await this.provisioner.provisionTenant({
        originatorId,
        displayName: registrationData.company.displayName,
        isolationType: registrationData.configuration.isolationType || 'dedicated_database',
        environment: registrationData.configuration.environment
      });
      
      // 4. Generate initial API key using the same transaction
      const initialApiKey = await this.generateInitialApiKeyWithClient(controlPlaneClient, originatorId);
      
      // 5. Update control plane with provisioning results
      await this.updateTenantProvisioningComplete(controlPlaneClient, {
        originatorId,
        databaseConfig,
        initialApiKey
      });
      
      // Commit the transaction before calling registry methods that open new connections
      await controlPlaneClient.query('COMMIT');
      
      // 6. Register tenant in connection registry (after transaction commit)
      await this.connectionRegistry.registerTenant({
        originatorId,
        displayName: registrationData.company.displayName,
        databaseConfig: {
          databaseName: databaseConfig.databaseName,
          encryptedConnectionString: databaseConfig.encryptedConnectionString,
          isolationType: databaseConfig.isolationType,
          schemaName: databaseConfig.schemaName
        }
      });
      
      // 7. Seed initial admin user in tenant database
      try {
        const tenantService = await TenantDatabaseService.forOriginator(originatorId);
        await tenantService.seedInitialAdminUser(initialApiKey.keyHash, initialApiKey.permissions);
        console.log(`✅ Seeded initial admin user for tenant: ${originatorId}`);
      } catch (error) {
        console.error(`⚠️ Failed to seed initial admin user for tenant ${originatorId}:`, error);
        // Don't fail the entire provisioning for user seeding errors
        // The tenant is functional, just needs manual user setup
      }
      
      const result: TenantProvisioningResult = {
        originatorId,
        databaseConfig,
        initialApiKey,
        controlPlaneRegistration: {
          registeredAt: new Date(),
          status: 'active'
        }
      };
      
      console.log(`✅ Successfully provisioned tenant: ${originatorId}`);
      
      return result;
      
    } catch (error) {
      await controlPlaneClient.query('ROLLBACK');
      
      // Cleanup any partially created resources
      try {
        await this.cleanupFailedProvisioning(originatorId);
      } catch (cleanupError) {
        console.error('Failed to cleanup after provisioning failure:', cleanupError);
      }
      
      throw error;
    } finally {
      controlPlaneClient.release();
    }
  }

  /**
   * Get tenant information
   */
  async getTenantInfo(originatorId: string): Promise<TenantInfo | null> {
    const client = await this.controlPlanePool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          originator_id,
          display_name,
          legal_entity_name,
          environment,
          status,
          isolation_type,
          database_name,
          database_schema,
          encrypted_connection_string,
          database_host,
          turnkey_suborg_id,
          turnkey_organization_id,
          api_base_url,
          api_rate_limits,
          branding_config,
          feature_flags,
          kyc_status,
          compliance_level,
          business_metadata,
          connection_pool_config,
          created_at,
          updated_at,
          provisioned_at,
          activated_at,
          last_accessed_at
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
        legalEntityName: row.legal_entity_name,
        environment: row.environment,
        status: row.status,
        isolationType: row.isolation_type,
        databaseName: row.database_name,
        databaseSchema: row.database_schema,
        encryptedConnectionString: row.encrypted_connection_string,
        databaseHost: row.database_host,
        turnkeySubOrgId: row.turnkey_suborg_id,
        turnkeyOrganizationId: row.turnkey_organization_id,
        apiBaseUrl: row.api_base_url,
        apiRateLimits: row.api_rate_limits,
        brandingConfig: row.branding_config,
        featureFlags: row.feature_flags,
        kycStatus: row.kyc_status,
        complianceLevel: row.compliance_level,
        businessMetadata: row.business_metadata,
        connectionPoolConfig: row.connection_pool_config,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        provisionedAt: row.provisioned_at,
        activatedAt: row.activated_at,
        lastAccessedAt: row.last_accessed_at,
      };
    } finally {
      client.release();
    }
  }

  /**
   * List all tenants
   */
  async listTenants(filters: {
    status?: TenantStatus;
    environment?: 'sandbox' | 'staging' | 'production';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tenants: TenantInfo[]; total: number }> {
    const client = await this.controlPlanePool.connect();
    
    try {
      let query = `
        SELECT 
          originator_id,
          display_name,
          legal_entity_name,
          environment,
          status,
          isolation_type,
          database_name,
          database_host,
          turnkey_suborg_id,
          turnkey_organization_id,
          api_base_url,
          api_rate_limits,
          branding_config,
          feature_flags,
          kyc_status,
          compliance_level,
          business_metadata,
          created_at,
          provisioned_at,
          activated_at,
          last_accessed_at
        FROM tenant_registry
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramCount = 0;
      
      if (filters.status) {
        // Validate status against TenantStatus union
        const validStatuses: TenantStatus[] = [
          'registering', 'provisioning', 'kyc_pending', 'active', 'suspended', 'terminated'
        ];
        if (validStatuses.includes(filters.status)) {
          paramCount++;
          query += ` AND status = $${paramCount}`;
          params.push(filters.status);
        }
      }
      
      if (filters.environment) {
        // Validate environment against known values
        const validEnvironments = ['sandbox', 'staging', 'production'];
        if (validEnvironments.includes(filters.environment)) {
          paramCount++;
          query += ` AND environment = $${paramCount}`;
          params.push(filters.environment);
        }
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS tenant_matches`;
      const countResult = await client.query(countQuery, params);
      const totalRow = countResult.rows[0];
      const total =
        totalRow && totalRow.total != null ? Number.parseInt(String(totalRow.total), 10) : 0;
      
      // Add ordering and pagination
      query += ' ORDER BY created_at DESC';
      
      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }
      
      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }
      
      const result = await client.query(query, params);
      
      const tenants = result.rows.map(row => ({
        originatorId: row.originator_id,
        displayName: row.display_name,
        legalEntityName: row.legal_entity_name,
        environment: row.environment,
        status: row.status,
        isolationType: row.isolation_type,
        databaseName: row.database_name,
        databaseHost: row.database_host,
        turnkeySubOrgId: row.turnkey_suborg_id,
        turnkeyOrganizationId: row.turnkey_organization_id,
        apiBaseUrl: row.api_base_url,
        apiRateLimits: row.api_rate_limits,
        brandingConfig: row.branding_config,
        featureFlags: row.feature_flags,
        kycStatus: row.kyc_status,
        complianceLevel: row.compliance_level,
        businessMetadata: row.business_metadata,
        createdAt: row.created_at,
        provisionedAt: row.provisioned_at,
        activatedAt: row.activated_at,
        lastAccessedAt: row.last_accessed_at,
      }));
      
      return { tenants, total };
    } finally {
      client.release();
    }
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(originatorId: string, status: string): Promise<void> {
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        UPDATE tenant_registry 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE originator_id = $2
      `, [status, originatorId]);
      
      // Also update in connection registry if suspending/reactivating
      if (status === 'suspended') {
        await this.connectionRegistry.suspendTenant(originatorId);
      } else if (status === 'active') {
        await this.connectionRegistry.reactivateTenant(originatorId);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Generate API key for tenant
   */
  async generateApiKey(originatorId: string, options: {
    keyName?: string;
    permissions?: string[];
    expiresAt?: Date;
    keyType?: string;
  } = {}): Promise<{ keyId: string; apiKey: string; keyHash: string }> {
    // Generate secure API key
    const apiKey = this.generateSecureApiKey();
    const keyHash = this.hashApiKey(apiKey);
    const keyId = crypto.randomUUID();
    
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        INSERT INTO control_plane_api_keys (
          key_id,
          originator_id,
          api_key_hash,
          api_key_name,
          key_type,
          permissions,
          expires_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      `, [
        keyId,
        originatorId,
        keyHash,
        options.keyName || `API Key ${new Date().toISOString()}`,
        options.keyType || 'tenant_api_key',
        JSON.stringify(options.permissions || ['disbursements:create', 'disbursements:read', 'lenders:read']),
        options.expiresAt
      ]);
      
      return { keyId, apiKey, keyHash };
    } finally {
      client.release();
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string, reason?: string): Promise<void> {
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query(`
        UPDATE control_plane_api_keys 
        SET 
          revoked_at = CURRENT_TIMESTAMP,
          revoked_reason = $2
        WHERE key_id = $1
      `, [keyId, reason]);
    } finally {
      client.release();
    }
  }

  /**
   * Parse and validate permissions from database JSONB field
   */
  private parsePermissions(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string');
        }
      } catch {
        // Fall through to default
      }
    }
    
    return [];
  }

  /**
   * List API keys for tenant
   */
  async listApiKeys(originatorId: string): Promise<ApiKeyInfo[]> {
    const client = await this.controlPlanePool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          key_id,
          originator_id,
          api_key_name,
          key_type,
          permissions,
          created_at,
          expires_at,
          revoked_at,
          last_used_at,
          usage_count
        FROM control_plane_api_keys
        WHERE originator_id = $1
        ORDER BY created_at DESC
      `, [originatorId]);
      
      return result.rows.map(row => ({
        keyId: row.key_id,
        originatorId: row.originator_id,
        keyName: row.api_key_name ?? undefined,
        keyType: row.key_type,
        permissions: this.parsePermissions(row.permissions),
        createdAt: row.created_at,
        expiresAt: row.expires_at ?? undefined,
        revokedAt: row.revoked_at ?? undefined,
        lastUsedAt: row.last_used_at ?? undefined,
        usageCount: row.usage_count || 0,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Onboarding session helpers
   */
  async upsertOnboardingSession(params: {
    originatorId: string;
    phase: OnboardingPhase;
    status: OnboardingSessionStatus;
    lastStep?: string;
    lastError?: unknown;
    completedAt?: Date;
  }): Promise<void> {
    await this.onboardingRepository.upsertSession({
      originatorId: params.originatorId,
      currentPhase: params.phase,
      status: params.status,
      lastStep: params.lastStep,
      lastError: params.lastError,
      completedAt: params.completedAt ?? null,
    });
  }

  async appendOnboardingStep(params: {
    originatorId: string;
    stepName: string;
    phase: OnboardingPhase;
    status: OnboardingStepStatus;
    message?: string;
    context?: Record<string, unknown>;
    error?: unknown;
    startedAt?: Date;
    completedAt?: Date;
  }): Promise<void> {
    await this.onboardingRepository.appendStep({
      originatorId: params.originatorId,
      stepName: params.stepName,
      phase: params.phase,
      status: params.status,
      message: params.message,
      context: params.context,
      error: params.error,
      startedAt: params.startedAt,
      completedAt: params.completedAt ?? null,
    });
  }

  async getOnboardingSession(originatorId: string): Promise<OnboardingSessionRecord | null> {
    return this.onboardingRepository.getSession(originatorId);
  }

  async storeTurnkeyProvisioningArtifacts(
    originatorId: string,
    artifact: TurnkeyProvisioningArtifact
  ): Promise<void> {
    await this.onboardingRepository.storeTurnkeyArtifacts(originatorId, artifact);
  }

  async storeAutomationCredential(params: {
    originatorId: string;
    templateId: string;
    partnerId?: string | null;
    encryptedPayload: string;
    metadata?: Record<string, unknown>;
    rotatedAt?: Date;
  }): Promise<void> {
    await this.onboardingRepository.storeAutomationCredentials({
      originatorId: params.originatorId,
      templateId: params.templateId,
      partnerId: params.partnerId ?? null,
      encryptedPayload: params.encryptedPayload,
      metadata: params.metadata,
      rotatedAt: params.rotatedAt ?? null,
    });
  }

  async listAutomationCredentials(originatorId: string): Promise<
    Array<{
      originatorId: string;
      templateId: string;
      partnerId?: string;
      encryptedCredentials: string;
      metadata: Record<string, unknown>;
      createdAt: Date;
      rotatedAt?: Date;
    }>
  > {
    return this.onboardingRepository.listAutomationCredentials(originatorId);
  }

  async updateTenantTurnkeyAssignment(params: {
    originatorId: string;
    subOrganizationId?: string | null;
    turnkeyOrganizationId?: string | null;
    encryptedCredentials?: string | null;
    status?: TenantInfo['status'];
  }): Promise<void> {
    const client = await this.controlPlanePool.connect();
    try {
      await client.query(
        `
          UPDATE tenant_registry
          SET
            turnkey_suborg_id = COALESCE($2, turnkey_suborg_id),
            turnkey_organization_id = COALESCE($3, turnkey_organization_id),
            encrypted_turnkey_credentials = COALESCE($4, encrypted_turnkey_credentials),
            status = COALESCE($5, status),
            updated_at = CURRENT_TIMESTAMP
          WHERE originator_id = $1
        `,
        [
          params.originatorId,
          params.subOrganizationId ?? null,
          params.turnkeyOrganizationId ?? null,
          params.encryptedCredentials ?? null,
          params.status ?? null,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Cleanup and terminate tenant
   */
  async terminateTenant(originatorId: string): Promise<void> {
    console.log(`🗑️ Terminating tenant: ${originatorId}`);
    
    const tenantInfo = await this.getTenantInfo(originatorId);
    if (!tenantInfo) {
      throw new TurnkeyServiceError(
        `Tenant not found: ${originatorId}`,
        ErrorCodes.NOT_FOUND
      );
    }
    
    const client = await this.controlPlanePool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Update status to terminated
      await client.query(`
        UPDATE tenant_registry 
        SET status = 'terminated'
        WHERE originator_id = $1
      `, [originatorId]);
      
      // 2. Revoke all API keys
      await client.query(`
        UPDATE control_plane_api_keys 
        SET revoked_at = CURRENT_TIMESTAMP, revoked_reason = 'tenant_terminated'
        WHERE originator_id = $1 AND revoked_at IS NULL
      `, [originatorId]);
      
      // 3. Close connection pool
      await this.connectionRegistry.closeTenantConnection(originatorId);
      
      // 4. Deprovision database (if not in production)
      if (tenantInfo.environment !== 'production') {
        const databaseConfig: TenantDatabaseConfig = {
          originatorId,
          databaseName: tenantInfo.databaseName!,
          databaseUser: `${originatorId}_user`,
          connectionString: '',
          encryptedConnectionString: '',
          isolationType: tenantInfo.isolationType
        };
        
        await this.provisioner.deprovisionTenant(originatorId, databaseConfig);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Successfully terminated tenant: ${originatorId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Private helper methods
   */
  private async registerTenantInitial(
    client: PoolClient, 
    registrationData: OriginatorRegistrationData
  ): Promise<void> {
    await client.query(`
      INSERT INTO tenant_registry (
        originator_id,
        display_name,
        legal_entity_name,
        environment,
        status,
        isolation_type,
        kyc_status,
        compliance_level,
        business_metadata,
        branding_config,
        created_at
      ) VALUES ($1, $2, $3, $4, 'provisioning', $5, 'pending', $6, $7, $8, CURRENT_TIMESTAMP)
    `, [
      registrationData.company.originatorId,
      registrationData.company.displayName,
      registrationData.company.legalName,
      registrationData.configuration.environment,
      registrationData.configuration.isolationType || 'dedicated_database',
      registrationData.configuration.complianceLevel || 'basic',
      JSON.stringify(registrationData.businessInfo || {}),
      JSON.stringify({}) // Empty branding config initially
    ]);
  }

  private async updateTenantProvisioningComplete(
    client: PoolClient,
    data: {
      originatorId: string;
      databaseConfig: TenantDatabaseConfig;
      initialApiKey: any;
      turnkeySubOrgId?: string;
      turnkeyOrganizationId?: string;
      encryptedTurnkeyCredentials?: string | null;
      statusOverride?: TenantInfo['status'];
    }
  ): Promise<void> {
    await client.query(`
      UPDATE tenant_registry 
      SET 
        status = $4,
        database_name = $2,
        encrypted_connection_string = $3,
        turnkey_suborg_id = COALESCE($5, turnkey_suborg_id),
        turnkey_organization_id = COALESCE($6, turnkey_organization_id),
        encrypted_turnkey_credentials = COALESCE($7, encrypted_turnkey_credentials),
        provisioned_at = CURRENT_TIMESTAMP
      WHERE originator_id = $1
    `, [
      data.originatorId,
      data.databaseConfig.databaseName,
      data.databaseConfig.encryptedConnectionString,
      data.statusOverride ?? 'active',
      data.turnkeySubOrgId ?? null,
      data.turnkeyOrganizationId ?? null,
      data.encryptedTurnkeyCredentials ?? null
    ]);
  }

  // Keep this method for potential future use
  // Currently using generateInitialApiKeyWithClient for transaction safety  
  public async generateInitialApiKey(originatorId: string): Promise<any> {
    const client = await this.controlPlanePool.connect();
    
    try {
      return await this.generateInitialApiKeyWithClient(client, originatorId);
    } finally {
      client.release();
    }
  }

  private async generateInitialApiKeyWithClient(client: PoolClient, originatorId: string): Promise<any> {
    const apiKey = this.generateSecureApiKey();
    const keyHash = this.hashApiKey(apiKey);
    const keyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiration
    
    await client.query(`
      INSERT INTO control_plane_api_keys (
        key_id,
        originator_id,
        api_key_hash,
        api_key_name,
        key_type,
        permissions,
        expires_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [
      keyId,
      originatorId,
      keyHash,
      'Initial Admin API Key',
      'admin_api_key',
      JSON.stringify([
        'disbursements:create',
        'disbursements:read',
        'wallets:read',
        'users:read',
        'users:create',
        'policies:read',
        'lenders:read'
      ]),
      expiresAt
    ]);
    
    return {
      keyId,
      apiKey,
      keyHash,
      permissions: [
        'disbursements:create',
        'disbursements:read',
        'wallets:read',
        'users:read',
        'users:create',
        'policies:read',
        'lenders:read'
      ],
      expiresAt
    };
  }

  private async cleanupFailedProvisioning(originatorId: string): Promise<void> {
    console.log(`🧹 Cleaning up failed provisioning for: ${originatorId}`);
    
    const client = await this.controlPlanePool.connect();
    
    try {
      // Remove from tenant registry
      await client.query('DELETE FROM tenant_registry WHERE originator_id = $1', [originatorId]);
      
      // Remove any API keys
      await client.query('DELETE FROM control_plane_api_keys WHERE originator_id = $1', [originatorId]);
      
      // Close any connections
      await this.connectionRegistry.closeTenantConnection(originatorId);
    } finally {
      client.release();
    }
  }

  private generateSecureApiKey(): string {
    // Generate a 40-character API key
    return crypto.randomBytes(20).toString('hex');
  }

  private normalizeTimestamp(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async withControlPlaneClient<T>(handler: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.controlPlanePool.connect();
    try {
      return await handler(client);
    } finally {
      client.release();
    }
  }

  async queryControlPlane<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    return this.controlPlanePool.query<T>(text, params);
  }

  /**
   * Resolve tenant by API key hash for authentication middleware
   */
  async resolveTenantByApiKey(keyHash: string): Promise<{
    originatorId: string;
    displayName: string;
    turnkeySubOrgId?: string;
    status: TenantStatus;
    createdAt?: Date;
    keyId: string;
    keyName?: string;
    apiKeyHash: string;
    permissions: string[];
    expiresAt?: Date;
  } | null> {
    const result = await this.queryControlPlane<{
      originator_id: string;
      display_name: string;
      turnkey_suborg_id: string | null;
      status: TenantStatus;
      created_at: Date | null;
      key_id: string;
      api_key_name: string | null;
      api_key_hash: string;
      permissions: unknown;
      expires_at: Date | null;
    }>(
      `
        SELECT
          tr.originator_id,
          tr.display_name,
          tr.turnkey_suborg_id,
          tr.status,
          tr.provisioned_at as created_at,
          ak.key_id,
          ak.api_key_name,
          ak.api_key_hash,
          ak.permissions,
          ak.expires_at
        FROM control_plane_api_keys ak
        JOIN tenant_registry tr ON ak.originator_id = tr.originator_id
        WHERE ak.api_key_hash = $1
          AND ak.revoked_at IS NULL
          AND (ak.expires_at IS NULL OR ak.expires_at > CURRENT_TIMESTAMP)
      `,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const permissions = this.parsePermissions(row.permissions);
    const expiresAt = this.normalizeTimestamp(row.expires_at);

    // Check if API key has expired
    if (expiresAt && expiresAt <= new Date()) {
      return null;
    }

    // Update last used timestamp
    await this.queryControlPlane(
      `
        UPDATE control_plane_api_keys
        SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
        WHERE api_key_hash = $1
      `,
      [keyHash]
    );

    return {
      originatorId: row.originator_id,
      displayName: row.display_name,
      turnkeySubOrgId: row.turnkey_suborg_id ?? undefined,
      status: row.status,
      createdAt: this.normalizeTimestamp(row.created_at),
      keyId: row.key_id,
      keyName: row.api_key_name ?? undefined,
      apiKeyHash: keyHash,
      permissions,
      expiresAt,
    };
  }

  async close(): Promise<void> {
    await this.controlPlanePool.end();
    if (this._provisioner) {
      await this._provisioner.close();
    }
    await this.connectionRegistry.close();
  }
}
