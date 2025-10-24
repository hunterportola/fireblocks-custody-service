/**
 * Configuration types for the Fireblocks Custody Service
 * These interfaces define the structure for originator configuration and user access
 */

/**
 * Main configuration interface for loan originators
 * This configuration is provided when setting up the custody service
 */
export interface OriginatorConfiguration {
  // Basic workspace information
  workspace: {
    name: string;                    // Company/originator name
    environment: 'sandbox' | 'testnet' | 'mainnet';
  };
  
  // Lending partners who will receive disbursements
  lendingPartners: {
    partners: Array<{
      id: string;                    // Unique partner identifier
      name: string;                  // Partner display name
      enabled: boolean;              // Active/inactive status
    }>;
  };
  
  // Vault naming and structure configuration
  vaultStructure: {
    namingConvention: {
      prefix: string;                // Company prefix (e.g., "ACME")
      distributionSuffix: string;    // Suffix for distribution vaults (e.g., "_DIST_USDC")
      collectionSuffix: string;      // Suffix for collection vaults (e.g., "_COLL_USDC")
    };
    defaultAsset: string;            // Fireblocks asset ID (e.g., "USDC_ETH", "USDC_POLYGON")
  };
  
  // Approval workflow configuration
  approvalStructure: {
    mode: 'none' | 'single' | 'multi' | 'threshold';
    requirements?: {
      numberOfApprovers?: number;    // 0 = fully automated, 1+ = human approval required
      approverRoles?: Array<{
        role: string;                // Role name (e.g., "Risk Officer", "Compliance Manager")
        required: boolean;           // Is this role required for approval?
      }>;
      thresholdAmount?: number;      // Amount (in USD) above which approval is required
      alwaysRequireApproval?: boolean; // Force approval for ALL transactions
    };
  };
  
  // Transaction limits and controls
  transactionLimits: {
    automated: {
      singleTransaction: number;     // Max amount for a single automated transaction
      dailyLimit?: number;           // Optional daily aggregate limit
      monthlyLimit?: number;         // Optional monthly aggregate limit
    };
  };
  
  // API and integration settings
  apiSettings: {
    ipWhitelist: string[];           // IP addresses allowed to use the API
    webhookEndpoint?: string;        // Endpoint for transaction status updates
  };
}

/**
 * User access request interface
 * Used when individuals request access to the custody service
 */
export interface UserAccessRequest {
  // Personal information
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  
  // Role and department information
  roleRequest: {
    requestedRole: string;           // Role being requested (e.g., "Loan Officer", "Risk Approver")
    justification: string;           // Why they need this access
    department: string;              // Their department
    managerId?: string;              // Manager ID for approval routing
  };
  
  // Specific access needs
  accessNeeds: {
    viewDistributions: boolean;      // Can view distribution vaults
    viewCollections: boolean;        // Can view collection vaults
    initiateDisbursements: boolean;  // Can create loan disbursements
    approveDisbursements: boolean;   // Can approve pending disbursements
  };
  
  // Request metadata
  metadata: {
    requestId: string;               // Unique request identifier
    timestamp: string;               // ISO timestamp of request
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;             // Admin comments on approval/rejection
  };
}

/**
 * Vault pair interface for partner vaults
 */
export interface VaultPair {
  distribution: {
    id: string;
    name: string;
    assetId: string;
  };
  collection: {
    id: string;
    name: string;
    assetId: string;
  };
}

/**
 * Disbursement request interface
 */
export interface DisbursementRequest {
  loanId: string;                    // Unique loan identifier (used for idempotency)
  partnerId: string;                 // Lending partner ID
  amount: string;                    // Amount to disburse (as string for precision)
  recipientWalletId: string;         // Whitelisted wallet ID in Fireblocks
  metadata?: {                       // Optional metadata
    borrowerInfo?: any;
    loanTerms?: any;
    [key: string]: any;
  };
}

/**
 * Disbursement result interface
 */
export interface DisbursementResult {
  status: 'completed' | 'pending_approval' | 'failed';
  transactionId?: string;            // Fireblocks transaction ID if completed
  pendingId?: string;                // Pending disbursement ID if approval required
  error?: string;                    // Error message if failed
  requiredApprovals?: number;        // Number of approvals needed
}

/**
 * Approval request interface
 */
export interface ApprovalRequest {
  userId: string;
  role: string;
  comments?: string;
}

/**
 * Pending disbursement interface
 */
export interface PendingDisbursement {
  id: string;
  loanId: string;
  partnerId: string;
  amount: string;
  recipientAddress: string;
  requiredApprovals: number;
  currentApprovals: ApprovalRecord[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  metadata?: any;
}

/**
 * Approval record interface
 */
export interface ApprovalRecord {
  userId: string;
  role: string;
  approvedAt: Date;
  comments?: string;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}