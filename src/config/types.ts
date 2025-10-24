import type { ApprovalWorkflowDefinition } from '../approvals/types';

export const WORKSPACE_ENVIRONMENTS = ['sandbox', 'testnet', 'mainnet'] as const;
export type WorkspaceEnvironment = (typeof WORKSPACE_ENVIRONMENTS)[number];

export type PartnerId = string;
export type UserId = string;

export type DecimalString = string;

export type IsoDateString = string;

export interface WorkspaceConfig {
  name: string;
  environment: WorkspaceEnvironment;
}

export interface LendingPartner {
  id: PartnerId; 
  name: string; 
  enabled: boolean; 
  
  config?: {
    customApprovalThreshold?: number; 
    allowedAssets?: SupportedAsset[]; 
    webhookUrl?: string; 
  };
}

export interface LendingPartnersConfig {
  partners: ReadonlyArray<LendingPartner>;
}

export interface VaultNamingConvention {
  prefix: string;
  distributionSuffix: string;
  collectionSuffix: string;
}

export type SupportedAsset =
  | 'USDC_ETH'
  | 'USDC_POLYGON'
  | 'USDC_ETH5'
  | (string & {});

export interface VaultStructureConfig {
  namingConvention: VaultNamingConvention;
  defaultAsset: SupportedAsset;
  
  
  vaultDefaults?: {
    autoFuel?: boolean; 
    hiddenOnUI?: boolean; 
  };
}

export interface TransactionAutomationLimits {
  singleTransaction: number;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface TransactionLimitsConfig {
  automated: TransactionAutomationLimits;
}

export interface ApiSettingsConfig {
  ipWhitelist: ReadonlyArray<string>;
  webhookEndpoint?: string;
}

export interface BorrowerInfo {
  borrowerId: string;
  name: string;
  email?: string;
  [key: string]: unknown;
}

export interface LoanTerms {
  startDate: string;
  maturityDate: string;
  interestRateBps: number;
  paymentFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  [key: string]: unknown;
}

export interface DisbursementMetadata {
  borrowerInfo?: BorrowerInfo;
  loanTerms?: LoanTerms;
  [key: string]: unknown;
}

export interface RolePermissions {
  viewDistributions: boolean;
  viewCollections: boolean;
  initiateDisbursements: boolean;
  approveDisbursements: boolean;
  viewReports?: boolean;
  manageRoles?: boolean;
  configureSettings?: boolean;
}

export interface RoleDefinition {
  roleId: string;
  roleName: string;
  description: string;
  permissions: RolePermissions;
  requiresApproval: boolean;
  maxUsers?: number;
}

export interface ApprovalConfiguration {
  workflows: ReadonlyArray<ApprovalWorkflowDefinition>;
}

export interface OriginatorConfiguration {
  workspace: WorkspaceConfig;
  lendingPartners: LendingPartnersConfig;
  vaultStructure: VaultStructureConfig;
  approval: ApprovalConfiguration;
  transactionLimits: TransactionLimitsConfig;
  apiSettings: ApiSettingsConfig;
  roleDefinitions?: RoleDefinition[];
}

export interface PortolaWorkspace {
  
  workspace: WorkspaceConfig;
  fireblocksWorkspaceId: string; 
  
  
  partners: {
    total: number; 
    active: number; 
    vaultPairs: Readonly<Record<PartnerId, LendingPartnerVaults>>; 
  };
  
  
  stats: {
    totalVaultAccounts: number; 
    totalDisbursedAllTime: DecimalString; 
    totalCollectedAllTime: DecimalString; 
    lastUpdated: IsoDateString;
  };
  
  
  globalSettings: {
    defaultWorkflowId?: string;
    defaultTransactionLimits: TransactionAutomationLimits;
    masterWebhookUrl?: string; 
  };
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export interface RoleRequest {
  requestedRoleId: string;
  justification: string;
  department: string;
  managerId?: string;
}

export interface UserAccessRequest {
  userInfo: UserInfo;
  roleRequest: RoleRequest;
  metadata: {
    requestId: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;
  };
}

export interface UserWithRole {
  userId: UserId;
  userInfo: UserInfo;
  assignedRoleId: string;
  department: string;
  managerId?: string;
  assignedAt: IsoDateString;
  assignedBy: UserId;
  expiresAt?: IsoDateString;
  status: 'active' | 'suspended' | 'revoked';
}

export interface VaultAccount {
  id: string; 
  name: string; 
  assetId: string; 
}

export interface PartnerTransactionPolicy {
  
  tapRuleIds: ReadonlyArray<string>;
  
  pendingDraftRuleId?: string;
  
  lastSyncedAt: IsoDateString;
}

export interface LendingPartnerVaults {
  partnerId: PartnerId; 
  partnerName: string; 
  distribution: VaultAccount; 
  collection: VaultAccount; 
  
  
  permissions: {
    allowedUsers?: ReadonlyArray<UserId>; 
    allowedRoles?: ReadonlyArray<RoleDefinition['roleId']>; 
    transactionPolicy?: PartnerTransactionPolicy;
  };
  
  
  metadata: {
    createdAt: IsoDateString; 
    lastActivityAt?: IsoDateString; 
    totalDisbursed?: DecimalString; 
    totalCollected?: DecimalString; 
    activeLoans?: number; 
  };
}

export interface VaultPair {
  distribution: VaultAccount;
  collection: VaultAccount;
}

export interface DisbursementRequest {
  loanId: string;
  partnerId: PartnerId;
  amount: string;
  recipientWalletId: string;
  metadata?: DisbursementMetadata;
}

export type DisbursementResult =
  | {
      status: 'executed';
      transactionId: string;
    }
  | {
      status: 'awaiting_approval';
      pendingId: string;
      requiredApprovals: number;
    }
  | {
      status: 'failed';
      error: string;
      transactionId?: string;
      pendingId?: string;
    };

export interface ApprovalRequest {
  userId: string;
  role: string;
  comments?: string;
}

export interface ApprovalRecord {
  userId: string;
  role: string;
  approvedAt: Date;
  comments?: string;
}

export interface PendingDisbursement {
  id: string; 
  loanId: string; 
  partnerId: PartnerId; 
  amount: string; 
  recipientAddress: string; 
  requiredApprovals: number; 
  currentApprovals: ReadonlyArray<ApprovalRecord>; 
  status: 'awaiting_approval' | 'approved' | 'rejected'; 
  createdAt: IsoDateString; 
  metadata?: DisbursementMetadata; 
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
