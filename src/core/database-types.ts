import { PoolClient } from 'pg';

// =============================================================================
// CORE DATABASE TYPES
// =============================================================================

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

export interface DatabaseResult<T> {
  rows: T[];
  rowCount: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface InsertParams<T> {
  data: T;
  onConflict?: 'update' | 'ignore' | 'error';
}

export interface UpdateParams<T> {
  data: Partial<T>;
  where: Record<string, unknown>;
}

export interface TransactionCallback<T> {
  (client: PoolClient): Promise<T>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

// =============================================================================
// ORIGINATOR TYPES
// =============================================================================

// Raw database row (snake_case matching DB schema)
export interface OriginatorRow {
  id: string;
  name: string;
  display_name: string;
  branding: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

// Application-level record (camelCase for TypeScript)
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

export interface OriginatorFilters extends QueryFilter {
  id?: string;
  name?: string;
  status?: string;
}

// =============================================================================
// API KEY / USER CREDENTIAL TYPES
// =============================================================================

export interface ApiKeyRow {
  id: string;
  api_key_hash: string;
  originator_id: string;
  name: string | null;
  permissions: string[];
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  revoked_at: Date | null;
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

export interface TenantUserRow {
  id: string;
  api_key_hash: string;
  user_id: string;
  api_key_name: string | null;
  permissions: string[];
  expires_at: Date | null;
  revoked_at: Date | null;
  last_used_at: Date | null;
  username: string;
  email: string | null;
  user_type: 'root' | 'automation' | 'role_based' | 'lender';
  role: string | null;
  turnkey_user_id: string | null;
  metadata: Record<string, unknown> | null;
  user_tags: string[] | null;
}

export interface TenantUserRecord {
  id: string;
  keyHash: string;
  userId: string;
  keyName?: string;
  permissions: string[];
  expiresAt?: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
  username: string;
  email?: string;
  userType: 'root' | 'automation' | 'role_based' | 'lender';
  role?: string;
  turnkeyUserId?: string;
  originatorId?: string;
  metadata?: Record<string, unknown>;
  userTags?: string[];
}

export interface ApiKeyFilters extends QueryFilter {
  originatorId?: string;
  isRevoked?: boolean;
  isExpired?: boolean;
}

// =============================================================================
// DISBURSEMENT TYPES
// =============================================================================

export interface DisbursementRow {
  id: string;
  originator_id: string;
  loan_id: string;
  borrower_address: string;
  amount: string | number;
  asset_type: string;
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
  failed_at: Date | null;
  error_code: string | null;
  error_message: string | null;
  error_details: unknown;
  approval_url: string | null;
  required_approvals: number | null;
  current_approvals: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export type DisbursementStatus = 'pending' | 'signing' | 'broadcasting' | 'completed' | 'failed' | 'pending_approval';

export interface DisbursementRecord {
  disbursementId: string;
  originatorId: string;
  loanId: string;
  borrowerAddress: string;
  amount: string;
  assetType: string;
  status: DisbursementStatus;
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
    code: string;
    message: string;
    details?: unknown;
  };
  approvalUrl?: string;
  requiredApprovals?: number;
  currentApprovals?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisbursementFilters extends QueryFilter, PaginationParams {
  originatorId?: string;
  status?: DisbursementStatus;
  loanId?: string;
  chain?: string;
  borrowerAddress?: string;
}

// =============================================================================
// WALLET TYPES
// =============================================================================

export interface WalletRow {
  id: string;
  originator_id: string;
  turnkey_wallet_id: string;
  turnkey_suborg_id: string;
  template_id: string;
  name: string;
  flow_id: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface WalletRecord {
  id: string;
  originatorId: string;
  turnkeyWalletId: string;
  turnkeySuborgId: string;
  templateId: string;
  name: string;
  flowId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletFilters extends QueryFilter, PaginationParams {
  originatorId?: string;
  flowId?: string;
  chain?: string;
  address?: string;
  turnkeyWalletId?: string;
}

// =============================================================================
// PROVISIONING SNAPSHOT TYPES
// =============================================================================

export interface ProvisioningRow {
  originator_id?: string;
  platform_config_hash: string;
  snapshot_data: Record<string, unknown>; // JSONB from database
  root_user_ids?: string[];
  automation_user_ids?: string[];
  wallet_ids?: string[];
  policy_ids?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ProvisioningRecord {
  originatorId?: string;
  platformConfigHash: string;
  snapshotData: Record<string, unknown>; // Parsed JSONB as object
  rootUserIds?: string[];
  automationUserIds?: string[];
  walletIds?: string[];
  policyIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CONTROL PLANE TYPES
// =============================================================================

export type TenantStatus = 
  | 'registering' 
  | 'provisioning' 
  | 'kyc_pending' 
  | 'active' 
  | 'suspended' 
  | 'terminated';

export interface TenantRegistrationRow {
  originator_id: string;
  display_name: string;
  legal_entity_name: string | null;
  environment: 'sandbox' | 'staging' | 'production';
  status: TenantStatus;
  isolation_type: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  database_name: string | null;
  database_schema: string | null;
  encrypted_connection_string: string | null;
  turnkey_suborg_id: string | null;
  last_accessed_at: Date | null;
  connection_pool_config: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface TenantRegistrationRecord {
  originatorId: string;
  displayName: string;
  legalEntityName?: string;
  environment: 'sandbox' | 'staging' | 'production';
  status: TenantStatus;
  isolationType: 'dedicated_database' | 'dedicated_schema' | 'shared_with_rls';
  databaseName?: string;
  databaseSchema?: string;
  encryptedConnectionString?: string;
  turnkeySuborgId?: string;
  lastAccessedAt?: Date;
  connectionPoolConfig?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// GENERIC DATABASE SERVICE INTERFACE
// =============================================================================

export interface DatabaseService<_TRow, TRecord> {
  // Basic CRUD operations
  create(data: Omit<TRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TRecord>;
  findById(id: string): Promise<TRecord | null>;
  findMany(filters?: Record<string, unknown>): Promise<TRecord[]>;
  update(id: string, data: Partial<TRecord>): Promise<TRecord>;
  delete(id: string): Promise<void>;
  
  // Pagination support
  findManyPaginated(
    filters?: Record<string, unknown>, 
    pagination?: PaginationParams
  ): Promise<PaginatedResult<TRecord>>;
  
  // Transaction support
  withTransaction<T>(callback: TransactionCallback<T>): Promise<T>;
  
  // Connection management
  testConnection(): Promise<boolean>;
  close(): Promise<void>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Helper type to convert snake_case row to camelCase record
export type RowToRecord<_TRow> = {
  [K in keyof _TRow as CamelCase<K>]: _TRow[K];
};

// Helper type for camelCase conversion
type CamelCase<S extends string | number | symbol> = 
  S extends `${infer T}_${infer U}` 
    ? `${T}${Capitalize<CamelCase<U>>}` 
    : S;

// Type guards for runtime type checking
export function isDisbursementStatus(value: string): value is DisbursementStatus {
  return ['pending', 'signing', 'broadcasting', 'completed', 'failed', 'pending_approval'].includes(value);
}

export function isValidEnvironment(value: string): value is 'sandbox' | 'staging' | 'production' {
  return ['sandbox', 'staging', 'production'].includes(value);
}

export function isValidUserType(value: string): value is 'root' | 'automation' | 'role_based' | 'lender' {
  return ['root', 'automation', 'role_based', 'lender'].includes(value);
}

// =============================================================================
// MAPPER UTILITY FUNCTIONS
// =============================================================================

export function mapOriginatorRowToRecord(row: OriginatorRow): OriginatorRecord {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    branding: row.branding ?? {},
    settings: row.settings ?? {},
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDisbursementRowToRecord(row: DisbursementRow): DisbursementRecord {
  const timeline: DisbursementRecord['timeline'] = {};
  if (row.initiated_at) timeline.initiated = row.initiated_at.toISOString();
  if (row.policies_evaluated_at) timeline.policiesEvaluated = row.policies_evaluated_at.toISOString();
  if (row.signed_at) timeline.signed = row.signed_at.toISOString();
  if (row.broadcasted_at) timeline.broadcasted = row.broadcasted_at.toISOString();
  if (row.confirmed_at) timeline.confirmed = row.confirmed_at.toISOString();
  if (row.failed_at) timeline.failed = row.failed_at.toISOString();

  const error = row.error_code !== null ? {
    code: row.error_code,
    message: row.error_message !== null ? row.error_message : '',
    details: row.error_details,
  } : undefined;

  return {
    disbursementId: row.id,
    originatorId: row.originator_id,
    loanId: row.loan_id,
    borrowerAddress: row.borrower_address,
    amount: row.amount.toString(),
    assetType: row.asset_type,
    status: row.status as DisbursementStatus,
    chain: row.chain,
    txHash: row.tx_hash ?? undefined,
    turnkeyActivityId: row.turnkey_activity_id ?? undefined,
    turnkeySubOrgId: row.turnkey_suborg_id ?? undefined,
    timeline: Object.keys(timeline).length > 0 ? timeline : undefined,
    error,
    approvalUrl: row.approval_url ?? undefined,
    requiredApprovals: row.required_approvals ?? undefined,
    currentApprovals: row.current_approvals ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapWalletRowToRecord(row: WalletRow): WalletRecord {
  return {
    id: row.id,
    originatorId: row.originator_id,
    turnkeyWalletId: row.turnkey_wallet_id,
    turnkeySuborgId: row.turnkey_suborg_id,
    templateId: row.template_id,
    name: row.name,
    flowId: row.flow_id,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTenantUserRowToRecord(row: TenantUserRow): TenantUserRecord {
  return {
    id: row.id,
    keyHash: row.api_key_hash,
    userId: row.user_id,
    keyName: row.api_key_name ?? undefined,
    permissions: row.permissions,
    expiresAt: row.expires_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    username: row.username,
    email: row.email ?? undefined,
    userType: row.user_type,
    role: row.role ?? undefined,
    turnkeyUserId: row.turnkey_user_id ?? undefined,
    metadata: row.metadata ?? undefined,
    userTags: row.user_tags ?? undefined,
  };
}

export function mapTenantRegistrationRowToRecord(row: TenantRegistrationRow): TenantRegistrationRecord {
  return {
    originatorId: row.originator_id,
    displayName: row.display_name,
    legalEntityName: row.legal_entity_name !== null ? row.legal_entity_name : undefined,
    environment: row.environment,
    status: row.status,
    isolationType: row.isolation_type,
    databaseName: row.database_name !== null ? row.database_name : undefined,
    databaseSchema: row.database_schema !== null ? row.database_schema : undefined,
    encryptedConnectionString: row.encrypted_connection_string !== null ? row.encrypted_connection_string : undefined,
    turnkeySuborgId: row.turnkey_suborg_id !== null ? row.turnkey_suborg_id : undefined,
    lastAccessedAt: row.last_accessed_at !== null ? row.last_accessed_at : undefined,
    connectionPoolConfig: row.connection_pool_config !== null ? row.connection_pool_config : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
