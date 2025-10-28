import { Pool, PoolClient } from 'pg';
import { TenantConnectionRegistry } from '../core/tenant-connection-registry';
import { TurnkeyServiceError, ErrorCodes } from '../core/error-handler';
import { logError, logWarn } from '../api/middleware/request-logger';
import type {
  OriginatorRecord,
  TenantUserRecord,
  DisbursementFilters,
  DisbursementStatus,
  DisbursementRecord,
  DisbursementRow,
  TransactionCallback,
} from '../core/database-types';
import { mapDisbursementRowToRecord } from '../core/database-types';
import type { ProvisioningArtifacts, ProvisioningRuntimeSnapshot } from '../provisioner/runtime-snapshots';
import type { WalletTemplate, WalletAccountTemplate } from '../config/types';

export interface OriginatorBootstrapData {
  originatorId: string;
  displayName: string;
  legalEntityName?: string;
  environment?: 'sandbox' | 'staging' | 'production';
  turnkeyOrganizationId?: string;
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  slug?: string;
}
interface DisbursementWritePayload {
  disbursementId: string;
  loanId: string;
  borrowerAddress: string;
  amount: string;
  assetType?: string;
  status: DisbursementStatus; // Use proper typed status
  chain: string;
  txHash?: string;
  turnkeyActivityId?: string;
  turnkeySubOrgId?: string;
  timeline?: {
    initiated?: string;
    policiesEvaluated?: string;
    signed?: string;
    broadcasted?: string;
    confirmed?: string;
    failed?: string;
  };
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  approvalUrl?: string;
  requiredApprovals?: number;
  currentApprovals?: number;
  metadata?: Record<string, unknown>;
  originatorId?: string;
}

// Re-export shared types for backward compatibility
export type {
  OriginatorRecord,
  TenantUserRecord,
  DisbursementFilters,
} from '../core/database-types';

// Updated interface with proper typing
export interface DisbursementListResult {
  data: DisbursementRecord[];
  total: number;
}

/**
 * Tenant-aware database service providing isolated access per originator.
 */
// Removed normalizeTimestamp - using mapDisbursementRowToRecord mapper instead

export class TenantDatabaseService {
  private readonly originatorId: string;
  private readonly connectionRegistry: TenantConnectionRegistry;
  private pool?: Pool;
  private missingUserTablesDetected = false;

  private constructor(originatorId: string) {
    this.originatorId = originatorId;
    this.connectionRegistry = TenantConnectionRegistry.getInstance();
  }

  /**
   * Create a tenant-specific database service instance
   */
  static async forOriginator(originatorId: string): Promise<TenantDatabaseService> {
    if (!originatorId || typeof originatorId !== 'string') {
      throw new TurnkeyServiceError(
        'Originator ID is required',
        ErrorCodes.INVALID_CONFIG
      );
    }

    const service = new TenantDatabaseService(originatorId);
    await service.initialize();
    return service;
  }

  /**
   * Initialize the service and establish database connection
   */
  private async initialize(): Promise<void> {
    try {
      this.pool = await this.connectionRegistry.getConnection(this.originatorId);
    } catch (error) {
      throw new TurnkeyServiceError(
        `Failed to initialize database service for originator: ${this.originatorId}`,
        ErrorCodes.NETWORK_ERROR,
        undefined,
        error
      );
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logError(`Database connection test failed for ${this.originatorId}:`, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Get a database client
   */
  private async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new TurnkeyServiceError(
        'Database service not initialized',
        ErrorCodes.INVALID_CONFIG
      );
    }
    return this.pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  async query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> {
    return this.connectionRegistry.query<T>(this.originatorId, text, params);
  }

  private isMissingUserTablesError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const pgError = error as { code?: string; message?: string };
    if (pgError.code !== '42P01') {
      return false;
    }
    const message = typeof pgError.message === 'string' ? pgError.message.toLowerCase() : '';
    return message.includes('user_credentials') || message.includes('users');
  }

  private logMissingUserTablesWarning(error: unknown): void {
    if (this.missingUserTablesDetected) {
      return;
    }
    this.missingUserTablesDetected = true;
    logWarn(
      `[TenantDatabaseService] User credential tables are missing for originator ${this.originatorId}; falling back to control-plane context`,
      {
        originatorId: this.originatorId,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    return this.connectionRegistry.transaction(this.originatorId, callback);
  }

  // =============================================
  // ORIGINATOR BOOTSTRAP
  // =============================================

  async bootstrapOriginator(data: OriginatorBootstrapData): Promise<void> {
    if (data.originatorId !== this.originatorId) {
      throw new TurnkeyServiceError(
        `Bootstrap originator mismatch: service is bound to ${this.originatorId}`,
        ErrorCodes.INVALID_CONFIG
      );
    }

    const slug = data.slug ?? data.originatorId;

    const metadataPayload: Record<string, unknown> = {
      ...(data.metadata ?? {}),
    };

    if (data.legalEntityName) {
      metadataPayload.legalEntityName = data.legalEntityName;
    }

    if (data.environment) {
      metadataPayload.environment = data.environment;
    }

    if (data.turnkeyOrganizationId) {
      metadataPayload.turnkeyOrganizationId = data.turnkeyOrganizationId;
    }

    await this.query(
      `
        INSERT INTO originators (
          id,
          name,
          display_name,
          branding,
          settings,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3,
          COALESCE($4::jsonb, '{}'::jsonb),
          COALESCE($5::jsonb, '{}'::jsonb),
          COALESCE($6::jsonb, '{}'::jsonb)
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          display_name = EXCLUDED.display_name,
          branding = EXCLUDED.branding,
          settings = EXCLUDED.settings,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        data.originatorId,
        slug,
        data.displayName,
        data.branding ? JSON.stringify(data.branding) : null,
        data.settings ? JSON.stringify(data.settings) : null,
        Object.keys(metadataPayload).length > 0 ? JSON.stringify(metadataPayload) : null,
      ]
    );
  }

  // =============================================
  // DISBURSEMENT OPERATIONS
  // =============================================

  async saveDisbursement(disbursement: DisbursementWritePayload): Promise<void> {
    const originatorId = disbursement.originatorId ?? this.originatorId;

    const query = `
      INSERT INTO disbursements (
        id,
        originator_id,
        loan_id,
        borrower_address,
        amount,
        asset_type,
        chain,
        status,
        tx_hash,
        turnkey_activity_id,
        turnkey_suborg_id,
        initiated_at,
        policies_evaluated_at,
        signed_at,
        broadcasted_at,
        confirmed_at,
        failed_at,
        error_code,
        error_message,
        error_details,
        approval_url,
        required_approvals,
        current_approvals,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
      ON CONFLICT (id) DO UPDATE SET
        originator_id = EXCLUDED.originator_id,
        loan_id = EXCLUDED.loan_id,
        borrower_address = EXCLUDED.borrower_address,
        amount = EXCLUDED.amount,
        asset_type = EXCLUDED.asset_type,
        status = EXCLUDED.status,
        chain = EXCLUDED.chain,
        tx_hash = EXCLUDED.tx_hash,
        turnkey_activity_id = EXCLUDED.turnkey_activity_id,
        turnkey_suborg_id = EXCLUDED.turnkey_suborg_id,
        initiated_at = EXCLUDED.initiated_at,
        policies_evaluated_at = EXCLUDED.policies_evaluated_at,
        signed_at = EXCLUDED.signed_at,
        broadcasted_at = EXCLUDED.broadcasted_at,
        confirmed_at = EXCLUDED.confirmed_at,
        failed_at = EXCLUDED.failed_at,
        error_code = EXCLUDED.error_code,
        error_message = EXCLUDED.error_message,
        error_details = EXCLUDED.error_details,
        approval_url = EXCLUDED.approval_url,
        required_approvals = EXCLUDED.required_approvals,
        current_approvals = EXCLUDED.current_approvals,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
    `;

    const timeline = disbursement.timeline ?? {};

    await this.query(query, [
      disbursement.disbursementId,
      originatorId,
      disbursement.loanId,
      disbursement.borrowerAddress,
      disbursement.amount,
      disbursement.assetType ?? 'USDC',
      disbursement.chain,
      disbursement.status,
      disbursement.txHash,
      disbursement.turnkeyActivityId,
      disbursement.turnkeySubOrgId,
      timeline.initiated ? new Date(timeline.initiated) : null,
      timeline.policiesEvaluated ? new Date(timeline.policiesEvaluated) : null,
      timeline.signed ? new Date(timeline.signed) : null,
      timeline.broadcasted ? new Date(timeline.broadcasted) : null,
      timeline.confirmed ? new Date(timeline.confirmed) : null,
      timeline.failed ? new Date(timeline.failed) : null,
      disbursement.error?.code ?? null,
      disbursement.error?.message ?? null,
      disbursement.error?.details ? JSON.stringify(disbursement.error.details) : null,
      disbursement.approvalUrl ?? null,
      disbursement.requiredApprovals ?? null,
      disbursement.currentApprovals ?? null,
      disbursement.metadata ? JSON.stringify(disbursement.metadata) : null,
    ]);
  }

  async getDisbursement(disbursementId: string): Promise<DisbursementRecord | null> {
    const query = `
      SELECT 
        id,
        originator_id,
        loan_id,
        borrower_address,
        amount,
        asset_type,
        status,
        chain,
        tx_hash,
        turnkey_activity_id,
        turnkey_suborg_id,
        initiated_at,
        policies_evaluated_at,
        signed_at,
        broadcasted_at,
        confirmed_at,
        failed_at,
        error_code,
        error_message,
        error_details,
        approval_url,
        required_approvals,
        current_approvals,
        metadata,
        created_at,
        updated_at
      FROM disbursements
      WHERE id = $1
    `;

    const result = await this.query<DisbursementRow>(query, [disbursementId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return mapDisbursementRowToRecord(row);
  }

  async listDisbursements(filters: DisbursementFilters = {}): Promise<DisbursementListResult> {
    const baseSelect = `
      SELECT 
        id,
        originator_id,
        loan_id,
        borrower_address,
        amount,
        asset_type,
        status,
        chain,
        tx_hash,
        turnkey_activity_id,
        turnkey_suborg_id,
        initiated_at,
        policies_evaluated_at,
        signed_at,
        broadcasted_at,
        confirmed_at,
        failed_at,
        error_code,
        error_message,
        error_details,
        approval_url,
        required_approvals,
        current_approvals,
        metadata,
        created_at,
        updated_at
      FROM disbursements
      WHERE 1=1
    `;

    let filtersSql = '';
    const params: unknown[] = [];
    let paramCount = 0;

    // No need to filter by originator_id - already isolated by database/schema

    if (filters.status) {
      paramCount++;
      filtersSql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.loanId) {
      paramCount++;
      filtersSql += ` AND loan_id = $${paramCount}`;
      params.push(filters.loanId);
    }

    if (filters.startDate) {
      paramCount++;
      filtersSql += ` AND initiated_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      filtersSql += ` AND initiated_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    const selectQuery = `${baseSelect}${filtersSql}`;

    const countQuery = `
      SELECT COUNT(*)::bigint as total
      FROM disbursements
      WHERE 1=1${filtersSql}
    `;

    const countResult = await this.query<{ total: string }>(countQuery, params);
    const total =
      countResult.rows.length > 0 ? Number.parseInt(countResult.rows[0].total, 10) : 0;

    // Add pagination
    let paginatedQuery = `${selectQuery} ORDER BY initiated_at DESC`;

    if (filters.limit) {
      paramCount++;
      paginatedQuery += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      paginatedQuery += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await this.query<DisbursementRow>(paginatedQuery, params);

    const disbursements = result.rows.map((row: DisbursementRow) => 
      mapDisbursementRowToRecord(row)
    );

    return { data: disbursements, total };
  }

  // =============================================
  // PROVISIONING OPERATIONS
  // =============================================

  async saveProvisioningSnapshot(originatorId: string, snapshot: ProvisioningArtifacts): Promise<void> {
    if (originatorId !== this.originatorId) {
      throw new TurnkeyServiceError(
        `Provisioning snapshot mismatch: service is bound to ${this.originatorId}`,
        ErrorCodes.INVALID_CONFIG
      );
    }

    const query = `
      INSERT INTO provisioning_snapshots (
        originator_id,
        platform_config_hash,
        snapshot_data
      ) VALUES ($1, $2, $3)
      ON CONFLICT (originator_id) DO UPDATE SET
        snapshot_data = EXCLUDED.snapshot_data,
        platform_config_hash = EXCLUDED.platform_config_hash,
        updated_at = CURRENT_TIMESTAMP
    `;

    const provisioningSnapshot = snapshot.provisioningSnapshot;
    
    await this.query(query, [
      originatorId,
      snapshot.platformConfigHash,
      JSON.stringify(provisioningSnapshot),
    ]);
  }

  async persistProvisionedWallets(
    snapshot: ProvisioningRuntimeSnapshot,
    walletsByTemplate: Record<string, WalletTemplate>
  ): Promise<void> {
    for (const flow of snapshot.walletFlows) {
      const template = walletsByTemplate[flow.walletTemplateId];
      if (!template) {
        continue;
      }

      const metadata = {
        ...(flow.metadata ?? {}),
        walletTemplateId: flow.walletTemplateId,
      } as Record<string, unknown>;

      const walletInsert = await this.query<{ id: string }>(
        `
          INSERT INTO wallets (
            originator_id,
            turnkey_wallet_id,
            turnkey_suborg_id,
            template_id,
            name,
            flow_id,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
          ON CONFLICT (turnkey_wallet_id)
          DO UPDATE SET
            template_id = EXCLUDED.template_id,
            name = EXCLUDED.name,
            flow_id = EXCLUDED.flow_id,
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `,
        [
          this.originatorId,
          flow.walletId,
          snapshot.subOrganizationId,
          flow.walletTemplateId,
          flow.walletName,
          flow.flowId,
          JSON.stringify(metadata),
        ]
      );

      const walletRowId = walletInsert.rows[0]?.id;
      if (!walletRowId) {
        continue;
      }

      const accountAliases = Object.keys(flow.accountIdByAlias);
      for (const alias of accountAliases) {
        const accountId = flow.accountIdByAlias[alias];
        if (!accountId || accountId === 'pending') {
          continue;
        }

        const templateAccount = template.accounts.find((account) => account.alias === alias);
        if (!templateAccount) {
          continue;
        }

        const chain = this.resolveAccountChain(templateAccount);
        const address = flow.accountAddressByAlias?.[alias] ?? 'pending';

        await this.query(
          `
            INSERT INTO wallet_accounts (
              wallet_id,
              turnkey_account_id,
              alias,
              address,
              curve,
              path_format,
              path,
              address_format,
              chain
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (turnkey_account_id)
            DO UPDATE SET
              address = EXCLUDED.address,
              chain = EXCLUDED.chain,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            walletRowId,
            accountId,
            alias,
            address,
            templateAccount.curve,
            templateAccount.pathFormat,
            templateAccount.path,
            templateAccount.addressFormat,
            chain,
          ]
        );
      }

      const partnerId = flow.metadata?.partnerId;
      if (partnerId) {
        await this.query(
          `
            INSERT INTO partner_wallet_flows (partner_id, originator_id, flow_id, wallet_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (partner_id, flow_id)
            DO UPDATE SET
              wallet_id = EXCLUDED.wallet_id,
              updated_at = CURRENT_TIMESTAMP
          `,
          [partnerId, this.originatorId, flow.flowId, walletRowId]
        );
      }
    }
  }

  async getProvisioningSnapshot(originatorId: string): Promise<ProvisioningArtifacts | null> {
    const query = `
      SELECT 
        originator_id as "originatorId",
        platform_config_hash as "platformConfigHash",
        snapshot_data as "snapshotData"
      FROM provisioning_snapshots
      WHERE originator_id = $1
    `;

    const result = await this.query(query, [originatorId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      platformConfigHash: row.platformConfigHash,
      provisioningSnapshot: row.snapshotData as ProvisioningRuntimeSnapshot,
    };
  }

  // =============================================
  // API KEY OPERATIONS
  // =============================================

  async getUserByApiKey(apiKeyHashes: string | string[]): Promise<TenantUserRecord | null> {
    const hashes = Array.isArray(apiKeyHashes) ? apiKeyHashes : [apiKeyHashes];
    const uniqueHashes = Array.from(
      new Set(
        hashes.filter((hash): hash is string => typeof hash === 'string' && hash.length > 0)
      )
    );

    if (uniqueHashes.length === 0) {
      return null;
    }

    const query = `
      SELECT 
        uc.id,
        uc.api_key_hash AS "keyHash",
        uc.user_id AS "userId",
        uc.api_key_name AS "keyName",
        uc.permissions,
        uc.expires_at AS "expiresAt",
        uc.revoked_at AS "revokedAt",
        uc.last_used_at AS "lastUsedAt",
        u.username,
        u.email,
        u.user_type AS "userType",
        u.role,
        u.turnkey_user_id AS "turnkeyUserId",
        u.metadata,
        u.tags AS "userTags"
      FROM user_credentials uc
      JOIN users u ON uc.user_id = u.id
      WHERE uc.api_key_hash = ANY($1::text[]) 
        AND uc.revoked_at IS NULL
        AND (uc.expires_at IS NULL OR uc.expires_at > CURRENT_TIMESTAMP)
    `;

    try {
      const result = await this.query<TenantUserRecord>(query, [uniqueHashes]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as any;
      return {
        id: row.id,
        keyHash: row.keyHash,
        userId: row.userId,
        keyName: row.keyName ?? undefined,
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        expiresAt: row.expiresAt ?? undefined,
        revokedAt: row.revokedAt ?? undefined,
        lastUsedAt: row.lastUsedAt ?? undefined,
        username: row.username,
        email: row.email ?? undefined,
        userType: row.userType,
        role: row.role ?? undefined,
        turnkeyUserId: row.turnkeyUserId ?? undefined,
        metadata: row.metadata ?? undefined,
        userTags: Array.isArray(row.userTags) ? row.userTags : [],
        originatorId: this.originatorId,
      };
    } catch (error) {
      if (this.isMissingUserTablesError(error)) {
        this.logMissingUserTablesWarning(error);
        return null;
      }
      throw error;
    }
  }

  async updateApiKeyLastUsed(apiKeyHashes: string | string[]): Promise<void> {
    const hashes = Array.isArray(apiKeyHashes) ? apiKeyHashes : [apiKeyHashes];
    const uniqueHashes = Array.from(
      new Set(
        hashes.filter((hash): hash is string => typeof hash === 'string' && hash.length > 0)
      )
    );

    if (uniqueHashes.length === 0) {
      return;
    }

    const query = `
      UPDATE user_credentials 
      SET last_used_at = CURRENT_TIMESTAMP 
      WHERE api_key_hash = ANY($1::text[])
    `;

    try {
      await this.query(query, [uniqueHashes]);
    } catch (error) {
      if (this.isMissingUserTablesError(error)) {
        this.logMissingUserTablesWarning(error);
        return;
      }
      throw error;
    }
  }

  /**
   * Seed initial admin user for a newly provisioned tenant
   * Creates both user record and user credentials with matching API key hash
   */
  async seedInitialAdminUser(
    apiKeyHash: string, 
    permissions: string[] = [
      'disbursements:create', 
      'disbursements:read', 
      'wallets:read', 
      'users:read', 
      'users:create', 
      'policies:read',
      'lenders:read'
    ]
  ): Promise<void> {
    const username = `admin@${this.originatorId}`;
    
    try {
      // Create user record first (tenant schema doesn't have originator_id - it's isolated)
      const userResult = await this.query<{ id: string }>(
        `
          INSERT INTO users (
            originator_id,
            username,
            email,
            user_type,
            role
          )
          VALUES ($1, $2, $3, 'root', 'administrator')
          ON CONFLICT (originator_id, username) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `,
        [this.originatorId, username, username]
      );
      
      let actualUserId = userResult.rows.length > 0 ? userResult.rows[0].id : null;
      if (!actualUserId) {
        // Try to get existing user if insert was skipped
        const existingResult = await this.query<{ id: string }>(
          `
            SELECT id FROM users WHERE originator_id = $1 AND username = $2
          `,
          [this.originatorId, username]
        );
        if (existingResult.rows.length === 0) {
          throw new Error('Failed to create or find admin user');
        }
        actualUserId = existingResult.rows[0].id;
      }
      
      // Create user credentials record linked to the API key
      await this.query(
        `
          INSERT INTO user_credentials (
            user_id,
            auth_type,
            api_key_hash,
            api_key_name,
            permissions
          ) VALUES (
            $1,
            'api_key',
            $2,
            $3,
            $4::jsonb
          )
          ON CONFLICT (api_key_hash) DO NOTHING
        `,
        [
          actualUserId,
          apiKeyHash,
          'Initial Admin Key',
          JSON.stringify(permissions),
        ]
      );
      
    } catch (error) {
      throw new TurnkeyServiceError(
        `Failed to seed initial admin user for originator: ${this.originatorId}`,
        ErrorCodes.API_ERROR,
        undefined,
        error
      );
    }
  }

  // =============================================
  // ORIGINATOR OPERATIONS
  // =============================================

  async getOriginatorRecord(): Promise<OriginatorRecord | null> {
    const query = `
      SELECT 
        id,
        name,
        display_name as "displayName",
        branding,
        settings,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM originators
      WHERE id = $1
    `;

    const result = await this.query(query, [this.originatorId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      branding: row.branding || {},
      settings: row.settings || {},
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateOriginatorRecord(updates: Partial<OriginatorRecord>): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    let paramCount = 0;

    if (updates.displayName) {
      paramCount++;
      fields.push(`display_name = $${paramCount}`);
      params.push(updates.displayName);
    }

    if (updates.branding) {
      paramCount++;
      fields.push(`branding = $${paramCount}`);
      params.push(JSON.stringify(updates.branding));
    }

    if (updates.settings) {
      paramCount++;
      fields.push(`settings = $${paramCount}`);
      params.push(JSON.stringify(updates.settings));
    }

    if (updates.metadata) {
      paramCount++;
      fields.push(`metadata = $${paramCount}`);
      params.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      return; // Nothing to update
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    paramCount++;
    params.push(this.originatorId);

    const query = `
      UPDATE originators 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
    `;

    await this.query(query, params);
  }

  /**
   * Get the originator ID this service is bound to
   */
  getOriginatorId(): string {
    return this.originatorId;
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    // Close the specific tenant connection
    await this.connectionRegistry.closeTenantConnection(this.originatorId);
    this.pool = undefined;
  }

  private resolveAccountChain(account: WalletAccountTemplate): string {
    if (typeof account.chainId === 'string' && account.chainId.trim().length > 0) {
      const segments = account.chainId.split(/[-_]/);
      const candidate = segments[segments.length - 1]?.trim();
      if (candidate) {
        return candidate.toLowerCase();
      }
    }

    if (account.addressFormat === 'ADDRESS_FORMAT_ETHEREUM') {
      return 'sepolia';
    }

    return 'sepolia';
  }
}
