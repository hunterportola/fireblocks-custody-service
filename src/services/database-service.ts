import { Pool, PoolClient } from 'pg';
import * as crypto from 'crypto';
import type {
  DisbursementStatus,
} from './disbursement-service';
import type { ProvisioningArtifacts, ProvisioningRuntimeSnapshot } from '../provisioner/runtime-snapshots';
import { TurnkeyServiceError, ErrorCodes } from '../core/error-handler';

// Database row type definitions
interface OriginatorRow {
  id: string;
  name: string;
  display_name: string;
  branding: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

interface DisbursementRow {
  id: string;
  originator_id: string;
  loan_id: string;
  borrower_address: string;
  amount: string | number;
  status: string;
  chain: string;
  tx_hash: string | null;
  turnkey_activity_id: string | null;
  turnkey_suborg_id: string | null;
  initiated_at: Date | null;
  policies_evaluated_at: Date | null;
  signed_at: Date | null;
  broadcasted_at: Date | null;
  confirmed_at: Date | null;
  error_code: string | null;
  error_message: string | null;
  error_details: unknown;
  approval_url: string | null;
  metadata: Record<string, unknown> | null;
}

interface WalletRow {
  id: string;
  originator_id: string;
  turnkey_wallet_id: string;
  turnkey_suborg_id: string;
  flow_id: string;
  address: string;
  chain: string;
  balance: string | number;
  balance_updated_at: Date | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

interface ProvisioningRow {
  platform_config_hash: string;
  snapshot_data: unknown;
}

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface OriginatorRecord {
  id: string;
  name: string;
  displayName: string;
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings: {
    features?: {
      bulkUpload?: boolean;
      approvalWorkflow?: boolean;
      webhooks?: boolean;
    };
    limits?: {
      dailyLimit?: string;
      transactionLimit?: string;
    };
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyRecord {
  id: string;
  keyHash: string;
  originatorId: string;
  name?: string;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface WalletRecord {
  id: string;
  originatorId: string;
  turnkeyWalletId: string;
  turnkeySuborgId: string;
  flowId: string;
  address: string;
  chain: string;
  balance: string;
  balanceUpdatedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisbursementFilters {
  originatorId?: string;
  status?: DisbursementStatus['status'];
  loanId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class DatabaseService {
  private pool: Pool;
  private static instance: DatabaseService;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString ?? process.env.DATABASE_URL,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ?? process.env.NODE_ENV === 'production',
      max: config.max ?? 20,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected database pool error', err);
    });
  }

  static getInstance(config?: DatabaseConfig): DatabaseService {
    if (DatabaseService.instance === undefined) {
      if (config === undefined && (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === '')) {
        throw new TurnkeyServiceError(
          'Database configuration is required',
          ErrorCodes.INVALID_CONFIG
        );
      }
      DatabaseService.instance = new DatabaseService(config || {});
    }
    return DatabaseService.instance;
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Originator operations
  async getOriginator(id: string): Promise<OriginatorRecord | null> {
    const query = `
      SELECT 
        id, name, display_name, branding, settings, metadata,
        created_at, updated_at
      FROM originators
      WHERE id = $1
    `;
    
    const result = await this.pool.query<OriginatorRow>(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapOriginatorRow(row);
  }

  async getOriginatorByApiKey(apiKey: string): Promise<OriginatorRecord | null> {
    // In production, use proper hashing (bcrypt/argon2)
    const keyHash = this.simpleHash(apiKey);
    
    const query = `
      SELECT 
        o.id, o.name, o.display_name, o.branding, o.settings, o.metadata,
        o.created_at, o.updated_at
      FROM originators o
      INNER JOIN api_keys ak ON ak.originator_id = o.id
      WHERE ak.key_hash = $1 AND ak.revoked_at IS NULL
      AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `;
    
    const result = await this.pool.query<OriginatorRow>(query, [keyHash]);
    if (result.rows.length === 0) {
      return null;
    }

    // Update last used timestamp
    await this.updateApiKeyLastUsed(keyHash);

    const row = result.rows[0];
    return this.mapOriginatorRow(row);
  }

  private async updateApiKeyLastUsed(keyHash: string): Promise<void> {
    const query = 'UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1';
    await this.pool.query(query, [keyHash]);
  }

  // Disbursement operations
  async saveDisbursement(disbursement: DisbursementStatus): Promise<void> {
    const query = `
      INSERT INTO disbursements (
        id, originator_id, loan_id, borrower_address, amount, asset_type, chain, status,
        tx_hash, turnkey_activity_id, turnkey_suborg_id,
        initiated_at, policies_evaluated_at, signed_at, broadcasted_at, confirmed_at,
        error_code, error_message, error_details,
        approval_url, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        tx_hash = EXCLUDED.tx_hash,
        turnkey_activity_id = EXCLUDED.turnkey_activity_id,
        policies_evaluated_at = EXCLUDED.policies_evaluated_at,
        signed_at = EXCLUDED.signed_at,
        broadcasted_at = EXCLUDED.broadcasted_at,
        confirmed_at = EXCLUDED.confirmed_at,
        error_code = EXCLUDED.error_code,
        error_message = EXCLUDED.error_message,
        error_details = EXCLUDED.error_details,
        approval_url = EXCLUDED.approval_url,
        updated_at = NOW()
    `;

    const timeline = disbursement.timeline ?? {};
    const error = disbursement.error;
    
    const values = [
      disbursement.disbursementId,
      disbursement.originatorId ?? 'unknown',
      disbursement.loanId,
      disbursement.borrowerAddress,
      disbursement.amount,
      'USDC', // Currently hardcoded
      disbursement.chain,
      disbursement.status,
      disbursement.txHash,
      disbursement.turnkeyActivityId,
      disbursement.turnkeySubOrgId,
      timeline.initiated !== undefined && timeline.initiated !== '' ? new Date(timeline.initiated) : new Date(),
      timeline.policiesEvaluated !== undefined && timeline.policiesEvaluated !== '' ? new Date(timeline.policiesEvaluated) : null,
      timeline.signed !== undefined && timeline.signed !== '' ? new Date(timeline.signed) : null,
      timeline.broadcasted !== undefined && timeline.broadcasted !== '' ? new Date(timeline.broadcasted) : null,
      timeline.confirmed !== undefined && timeline.confirmed !== '' ? new Date(timeline.confirmed) : null,
      error?.code ?? null,
      error?.message ?? null,
      error?.details !== undefined ? JSON.stringify(error.details) : null,
      disbursement.approvalUrl,
      disbursement.metadata !== undefined ? JSON.stringify(disbursement.metadata) : null,
    ];

    await this.pool.query(query, values);
  }

  async getDisbursement(id: string): Promise<DisbursementStatus | null> {
    const query = `
      SELECT * FROM disbursements WHERE id = $1
    `;
    
    const result = await this.pool.query<DisbursementRow>(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDisbursementRow(result.rows[0]);
  }

  async listDisbursements(filters: DisbursementFilters): Promise<{
    disbursements: DisbursementStatus[];
    total: number;
  }> {
    const whereConditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let valueIndex = 1;

    if (filters.originatorId !== undefined && filters.originatorId !== '') {
      whereConditions.push(`originator_id = $${valueIndex}`);
      values.push(filters.originatorId);
      valueIndex++;
    }

    if (filters.status !== undefined) {
      whereConditions.push(`status = $${valueIndex}`);
      values.push(filters.status);
      valueIndex++;
    }

    if (filters.loanId !== undefined && filters.loanId !== '') {
      whereConditions.push(`loan_id = $${valueIndex}`);
      values.push(filters.loanId);
      valueIndex++;
    }

    if (filters.startDate) {
      whereConditions.push(`created_at >= $${valueIndex}`);
      values.push(filters.startDate);
      valueIndex++;
    }

    if (filters.endDate) {
      whereConditions.push(`created_at <= $${valueIndex}`);
      values.push(filters.endDate);
      valueIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM disbursements WHERE ${whereClause}`;
    const countResult = await this.pool.query<{ count: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    
    const query = `
      SELECT * FROM disbursements 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;
    
    values.push(limit, offset);
    const result = await this.pool.query<DisbursementRow>(query, values);

    const disbursements = result.rows.map((row) => this.mapDisbursementRow(row));

    return { disbursements, total };
  }

  // Wallet operations
  async getWallet(originatorId: string, flowId: string, chain: string): Promise<WalletRecord | null> {
    const query = `
      SELECT * FROM wallets 
      WHERE originator_id = $1 AND flow_id = $2 AND chain = $3
    `;
    
    const result = await this.pool.query<WalletRow>(query, [originatorId, flowId, chain]);
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapWalletRow(result.rows[0]);
  }

  async getWalletsByOriginator(originatorId: string): Promise<WalletRecord[]> {
    const query = `
      SELECT * FROM wallets 
      WHERE originator_id = $1
      ORDER BY flow_id, chain
    `;
    
    const result = await this.pool.query<WalletRow>(query, [originatorId]);
    return result.rows.map((row) => this.mapWalletRow(row));
  }

  async updateWalletBalance(
    walletId: string, 
    balance: string
  ): Promise<void> {
    const query = `
      UPDATE wallets 
      SET balance = $1, balance_updated_at = NOW()
      WHERE id = $2
    `;
    
    await this.pool.query(query, [balance, walletId]);
  }

  // Provisioning snapshot operations
  async saveProvisioningSnapshot(
    originatorId: string,
    artifacts: ProvisioningArtifacts
  ): Promise<void> {
    const query = `
      INSERT INTO provisioning_snapshots (
        originator_id, platform_config_hash, snapshot_data
      ) VALUES ($1, $2, $3)
      ON CONFLICT (originator_id) DO UPDATE SET
        platform_config_hash = EXCLUDED.platform_config_hash,
        snapshot_data = EXCLUDED.snapshot_data,
        updated_at = NOW()
    `;
    
    const values = [
      originatorId,
      artifacts.platformConfigHash,
      JSON.stringify(artifacts.provisioningSnapshot),
    ];

    await this.pool.query(query, values);
  }

  async getProvisioningSnapshot(originatorId: string): Promise<ProvisioningArtifacts | null> {
    const query = `
      SELECT platform_config_hash, snapshot_data
      FROM provisioning_snapshots
      WHERE originator_id = $1
    `;
    
    const result = await this.pool.query<ProvisioningRow>(query, [originatorId]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      platformConfigHash: row.platform_config_hash,
      provisioningSnapshot: row.snapshot_data as ProvisioningRuntimeSnapshot,
    };
  }

  // Utility methods
  private simpleHash(input: string): string {
    // In production, use bcrypt or argon2
    // This is just for demo purposes
    return `sha256$${crypto.createHash('sha256').update(input).digest('hex')}$${input.slice(-8)}`;
  }

  private mapOriginatorRow(row: OriginatorRow): OriginatorRecord {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      branding: row.branding ?? {},
      settings: row.settings ?? {},
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDisbursementRow(row: DisbursementRow): DisbursementStatus {
    const timeline: Record<string, string> = {};
    if (row.initiated_at !== null) timeline.initiated = row.initiated_at.toISOString();
    if (row.policies_evaluated_at !== null) timeline.policiesEvaluated = row.policies_evaluated_at.toISOString();
    if (row.signed_at !== null) timeline.signed = row.signed_at.toISOString();
    if (row.broadcasted_at !== null) timeline.broadcasted = row.broadcasted_at.toISOString();
    if (row.confirmed_at !== null) timeline.confirmed = row.confirmed_at.toISOString();

    const error = row.error_code !== null ? {
      code: row.error_code,
      message: row.error_message ?? '',
      details: row.error_details,
    } : undefined;

    return {
      disbursementId: row.id,
      status: row.status as 'pending' | 'failed' | 'completed' | 'signing' | 'broadcasting' | 'pending_approval',
      loanId: row.loan_id,
      amount: row.amount.toString(),
      borrowerAddress: row.borrower_address,
      chain: row.chain,
      txHash: row.tx_hash ?? undefined,
      turnkeyActivityId: row.turnkey_activity_id ?? undefined,
      timeline: Object.keys(timeline).length > 0 ? timeline : undefined,
      approvalUrl: row.approval_url ?? undefined,
      error,
      originatorId: row.originator_id,
      turnkeySubOrgId: row.turnkey_suborg_id ?? undefined,
      metadata: row.metadata ?? undefined,
    };
  }

  private mapWalletRow(row: WalletRow): WalletRecord {
    return {
      id: row.id,
      originatorId: row.originator_id,
      turnkeyWalletId: row.turnkey_wallet_id,
      turnkeySuborgId: row.turnkey_suborg_id,
      flowId: row.flow_id,
      address: row.address,
      chain: row.chain,
      balance: row.balance.toString(),
      balanceUpdatedAt: row.balance_updated_at ?? undefined,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Transaction management
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}