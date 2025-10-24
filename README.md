# Fireblocks Custody Service - Low-Code SDK for Loan Originators

## Executive Summary

The Fireblocks Custody Service is a low-code SDK designed to enable loan originators to programmatically configure and deploy secure, automated loan disbursement environments within the Fireblocks platform. This service abstracts the complexity of Fireblocks' comprehensive API while enforcing institutional-grade security best practices.

By filling out a simple configuration form, originators can instantiate a fully compliant disbursement infrastructure that includes:
- Segregated vault architecture for partner capital isolation
- Role-Based Access Control (RBAC) with API-only automation
- Transaction Authorization Policies (TAP) enforcing disbursement rules
- Automated compliance screening and reporting
- Complete audit trails and reconciliation capabilities

## Architecture Overview

### Core Design Principles

1. **Segregated Architecture** (Non-negotiable)
   - Each lending partner receives a dedicated vault account
   - Complete cryptographic and logical isolation of funds
   - Risk containment within individual partner vaults
   - Clear accounting and reporting boundaries

2. **Automation-First** (Non-negotiable)
   - API-only transaction initiation for disbursements
   - Hidden vaults from console UI to prevent manual intervention
   - Programmatic enforcement of business rules

3. **Principle of Least Privilege** (Non-negotiable)
   - Dedicated API users with minimal required permissions
   - IP whitelisting and secure key management
   - Role separation between administrative and operational functions

4. **Policy-Driven Governance** (Configurable with constraints)
   - TAP rules defining allowed operations
   - Automated transaction limits with emergency overrides
   - Multi-signature approvals for exceptional cases

## Configuration Model

### Originator Configuration Form

The SDK accepts a configuration object that captures the originator's specific requirements while enforcing security best practices:

```typescript
interface OriginatorConfiguration {
  // Basic Information
  workspace: {
    name: string;                    // Originator's company name
    environment: 'sandbox' | 'testnet' | 'mainnet';
  };
  
  // Lending Partners Configuration
  lendingPartners: {
    partners: Array<{
      id: string;                    // Unique partner identifier
      name: string;                  // Partner display name
      enabled: boolean;              // Active/inactive status
    }>;
  };
  
  // Vault Configuration
  vaultStructure: {
    namingConvention: {
      prefix: string;                // e.g., "ACME" for company
      distributionSuffix: '_DIST_USDC';
      collectionSuffix: '_COLL_USDC';
    };
    defaultAsset: 'USDC_ETH' | 'USDC_POLYGON';  // Primary asset
  };
  
  // Approval Configuration (Fully Customizable)
  approvalStructure: {
    mode: 'none' | 'single' | 'multi' | 'threshold';
    requirements?: {
      numberOfApprovers: number;     // Required: 0 = fully automated, 1+ = human required
      approverRoles?: Array<{
        role: string;                // e.g., "Risk Officer", "Compliance Manager"
        required: boolean;           // Must this role always approve?
      }>;
      thresholdAmount?: number;      // Amount above which approval is needed
      alwaysRequireApproval?: boolean; // Force approval for ALL transactions
    };
  };
  
  // Transaction Policies
  transactionLimits: {
    automated: {
      singleTransaction: number;     // Max single automated disbursement
      dailyLimit?: number;           // Optional daily aggregate limit
      monthlyLimit?: number;         // Optional monthly aggregate limit
    };
  };
  
  // API Configuration
  apiSettings: {
    webhookEndpoint?: string;        // For transaction updates
    ipWhitelist: string[];           // Required: Service IPs
  };
}
```

### User Access Request Form

Users (loan officers, approvers, compliance officers) request access through this form:

```typescript
interface UserAccessRequest {
  // Personal Information
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  
  // Role Request
  roleRequest: {
    requestedRole: string;           // e.g., "Loan Officer", "Risk Approver"
    justification: string;           // Why they need this access
    department: string;
    managerId?: string;              // Their manager for approval routing
  };
  
  // Access Requirements
  accessNeeds: {
    viewDistributions: boolean;      // Can view distribution vaults
    viewCollections: boolean;        // Can view collection vaults
    initiateDisbursements: boolean;  // Can create loan disbursements
    approveDisbursements: boolean;   // Can approve pending disbursements
  };
  
  // Request Metadata
  metadata: {
    requestId: string;               // Unique request identifier
    timestamp: string;               // ISO timestamp
    status: 'pending' | 'approved' | 'rejected';
    adminNotes?: string;             // Admin comments on approval/rejection
  };
}
```

### Design Decision Points

#### Configurable by Originator:

1. **Transaction Limits**
   - Single transaction automated limit (recommended: $100k - $1M)
   - Daily/monthly aggregate limits
   - High-value approval threshold and quorum size
   - *Reference: `ts-sdk/models/authorization-info.ts`, `ts-sdk/models/policy-rule.ts`*

2. **Compliance Integration**
   - Choice of AML screening provider
   - Auto-rejection of high-risk addresses vs. manual review
   - Travel Rule message requirements
   - *Reference: `ts-sdk/api/compliance-api.ts`, `ts-sdk/models/screening-configurations-request.ts`, `ts-sdk/models/screening-policy-response.ts`*

3. **Reconciliation & Reporting**
   - Report format and delivery method
   - Notification channels and event types
   - Webhook endpoints for real-time updates
   - *Reference: `ts-sdk/api/webhooks-v2-api.ts` (webhook creation), `ts-sdk/api/transactions-api.ts` (transaction monitoring)*

4. **Vault Naming Convention**
   - Custom prefix for vault identification
   - Asset type suffixes
   - *Reference: `ts-sdk/models/create-vault-account-request.ts`*

#### Recommended Best Practices (Guidelines, not SDK enforcement):

1. **Vault Architecture**
   - Segregated vaults recommended (no omnibus option)
   - Distribution vaults hidden from UI (`hiddenOnUI: true` recommended)
   - Collection vaults may be visible for monitoring
   - Programmatic management recommended
   - *Reference: `ts-sdk/api/vaults-api.ts` - `createVaultAccount`*

2. **API User Configuration**
   - 'Signer' role recommended (least privilege principle)
   - IP whitelisting strongly recommended (enforced at application level)
   - Co-signer pairing required for transaction signing
   - *Reference: `ts-sdk/api/api-user-api.ts`, `ts-sdk/models/create-apiuser.ts` (role is string)*

3. **Core Security Policies (Application-level implementation)**
   - Manual console transactions should be blocked via TAP rules
   - External wallet destinations recommended (whitelisting)
   - Idempotency via externalTxId recommended (currently optional, mandatory in 2026)
   - *Reference: `ts-sdk/models/transaction-request.ts` - `externalTxId` (lines 70-76)*

## SDK Components

### 1. Configuration Validator
Validates originator configuration against business rules and Fireblocks constraints.

**Key validations:**
- IP addresses are valid format (private IPs generate warnings, not errors)
- Transaction limits follow logical hierarchy
- Approval quorum meets minimum requirements
- Asset types are supported by Fireblocks

**References:**
- `ts-sdk/utils/validation_utils.ts` (basic string validation only)
- `ts-sdk/models/asset-type-response.ts`

**Note:** The SDK's validation_utils.ts only provides basic string validation. IP range checking and other business logic validations must be implemented at the application level.

### 2. Workspace Provisioner
Orchestrates the complete environment setup based on configuration.

**Responsibilities:**
- Create API users and configure permissions
- Provision vault accounts with proper naming
- Configure Transaction Authorization Policies
- Set up webhook integrations
- Configure compliance screening rules

**Key SDK References:**
- `ts-sdk/api/vaults-api.ts` - Vault creation and management
- `ts-sdk/api/api-user-api.ts` - API user provisioning
- `ts-sdk/api/policy-editor-beta-api.ts` - TAP configuration
- `ts-sdk/api/webhooks-v2-api.ts` - Webhook setup

### 3. Disbursement Client
Pre-configured client library for executing disbursements.

**Features:**
- Automatic vault selection based on partner ID
- Built-in idempotency with loan ID tracking
- Retry logic with exponential backoff
- Real-time status tracking via webhooks

**Key SDK References:**
- `ts-sdk/api/transactions-api.ts` - Transaction creation
- `ts-sdk/models/transaction-request.ts` - Transaction parameters
- `ts-sdk/models/transfer-peer-path-type.ts` - Source/destination types

### 4. Monitoring & Reporting Service
Provides operational visibility and compliance reporting.

**Capabilities:**
- Real-time transaction status monitoring
- Policy violation alerts
- Automated reconciliation reports
- Partner-specific transaction history

**Key SDK References:**
- `ts-sdk/api/transactions-api.ts` - `getTransactions`, `getTransactionByExternalId`
- `ts-sdk/api/audit-logs-api.ts` - Audit trail access
- `ts-sdk/models/transaction-response.ts` - Transaction details

## Sandbox Implementation Plan (MVP)

### Phase 1: Basic Setup & Vault Provisioning

#### 1.1 Vault Architecture
For each lending partner, create two segregated vaults:
```
Distribution Vault: [PREFIX]_LP_[PARTNER_ID]_DIST_USDC
Collection Vault:   [PREFIX]_LP_[PARTNER_ID]_COLL_USDC
```

#### 1.2 Implementation Steps
```typescript
// Vault provisioning for each partner
async function provisionPartnerVaults(
  originatorPrefix: string,
  partnerId: string
): Promise<VaultPair> {
  const distributionVaultResponse = await fireblocks.vaults.createVaultAccount({
    createVaultAccountRequest: {
      name: `${originatorPrefix}_LP_${partnerId}_DIST_USDC`,
      hiddenOnUI: true,  // Recommended for API-only access
      autoFuel: false
    }
  });
  
  const collectionVaultResponse = await fireblocks.vaults.createVaultAccount({
    createVaultAccountRequest: {
      name: `${originatorPrefix}_LP_${partnerId}_COLL_USDC`,
      hiddenOnUI: false, // Visible for monitoring collections
      autoFuel: false
    }
  });
  
  // Extract vault data from FireblocksResponse<VaultAccount>
  const distributionVault = distributionVaultResponse.data;
  const collectionVault = collectionVaultResponse.data;
  
  // Activate USDC asset in both vaults with proper parameters
  await activateAssetInVaults(distributionVault.id, collectionVault.id, 'USDC_ETH');
  
  return { 
    distribution: distributionVault, 
    collection: collectionVault 
  };
}

async function activateAssetInVaults(
  distVaultId: string,
  collVaultId: string,
  assetId: string
): Promise<void> {
  // activateAssetForVaultAccount expects an object with vaultAccountId, assetId, idempotencyKey
  await fireblocks.vaults.activateAssetForVaultAccount({
    vaultAccountId: distVaultId,
    assetId: assetId,
    idempotencyKey: `activate_${distVaultId}_${assetId}`
  });
  
  await fireblocks.vaults.activateAssetForVaultAccount({
    vaultAccountId: collVaultId,
    assetId: assetId,
    idempotencyKey: `activate_${collVaultId}_${assetId}`
  });
}
```

### Phase 2: Approval System Architecture

#### 2.1 Approval API Endpoints
Create API endpoints for the custom approval workflow:

```typescript
// API Routes for Approval System
interface ApprovalAPI {
  // Create a pending disbursement requiring approval
  POST /api/disbursements/pending
  Request: {
    loanId: string;
    partnerId: string;
    amount: string;
    recipientAddress: string;
    metadata: object;
  }
  Response: {
    pendingDisbursementId: string;
    requiredApprovals: number;
    approvalRoles: string[];
  }
  
  // Get pending approvals for a user
  GET /api/approvals/pending?userId={userId}
  Response: {
    pendingApprovals: Array<{
      disbursementId: string;
      loanDetails: object;
      currentApprovals: string[];
      requiredApprovals: number;
    }>;
  }
  
  // Approve a disbursement
  POST /api/approvals/{disbursementId}/approve
  Request: {
    userId: string;
    role: string;
    comments?: string;
  }
  Response: {
    approved: boolean;
    remainingApprovals: number;
    transactionId?: string; // If fully approved and executed
  }
  
  // Reject a disbursement
  POST /api/approvals/{disbursementId}/reject
  Request: {
    userId: string;
    role: string;
    reason: string;
  }
}
```

#### 2.2 Approval Flow Logic
```typescript
class ApprovalManager {
  constructor(private config: OriginatorConfiguration) {}
  
  async processDisbursementRequest(request: DisbursementRequest): Promise<DisbursementResult> {
    // Check if approval is required
    const requiresApproval = this.checkApprovalRequired(request);
    
    if (!requiresApproval) {
      // Execute immediately for fully automated flow
      return await this.executeDisbursement(request);
    }
    
    // Create pending disbursement
    const pendingId = await this.createPendingDisbursement(request);
    
    // Notify required approvers
    await this.notifyApprovers(pendingId, this.config.approvalStructure.requirements?.approverRoles);
    
    return {
      status: 'awaiting_approval',
      pendingId,
      requiredApprovals: this.config.approvalStructure.requirements.numberOfApprovers
    };
  }
  
  private checkApprovalRequired(request: DisbursementRequest): boolean {
    const config = this.config.approvalStructure;
    
    // Always require if configured
    if (config.requirements?.alwaysRequireApproval) return true;
    
    // Check threshold
    if (config.requirements?.thresholdAmount && 
        parseFloat(request.amount) >= config.requirements.thresholdAmount) {
      return true;
    }
    
    // Check if any approvers configured
    return config.requirements?.numberOfApprovers > 0;
  }
}
```

### Phase 3: Transaction Execution Flow

#### 3.1 Disbursement Execution
```typescript
async function executeDisbursement(
  originatorConfig: OriginatorConfiguration,
  disbursementRequest: DisbursementRequest
): Promise<TransactionResponse> {
  const vaultId = await getDistributionVaultId(originatorConfig.workspace.name, disbursementRequest.partnerId);
  
  const transactionResponse = await fireblocks.transactions.createTransaction({
    transactionRequest: {
      assetId: originatorConfig.vaultStructure.defaultAsset,
      amount: disbursementRequest.amount,
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: vaultId
      },
      destination: {
        type: TransferPeerPathType.ExternalWallet,
        id: disbursementRequest.recipientWalletId
      },
      note: `Loan disbursement: ${disbursementRequest.loanId}`,
      externalTxId: disbursementRequest.loanId, // Recommended for idempotency (optional until 2026)
      customerRefId: disbursementRequest.partnerId
    }
  });
  
  // Extract transaction data from FireblocksResponse<CreateTransactionResponse>
  const transaction = transactionResponse.data;
  
  // Register webhook for status updates
  await registerTransactionWebhook(transaction.id);
  
  return transaction;
}
```

### Phase 4: Sandbox Testing Strategy

#### 4.1 Test Scenarios
1. **Fully Automated Flow**
   - Configure with 0 approvers
   - Test direct disbursement execution
   - Verify transaction creation and monitoring

2. **Single Approval Flow**
   - Configure with 1 approver
   - Test pending disbursement creation
   - Test approval API and execution

3. **Multi-Approval Flow**
   - Configure with 2+ approvers
   - Test partial approval states
   - Test rejection scenarios

4. **Threshold-Based Approval**
   - Set threshold at $10,000
   - Test automated below threshold
   - Test approval required above threshold

#### 4.2 Sandbox Limitations Workarounds
Since policies are non-editable in sandbox:
- Implement approval logic in application layer
- Simulate TAP rules through code
- Document expected production policies
- Create "dry-run" mode to show what would happen

### Phase 5: Production Migration Path

#### 5.1 Pre-Production Checklist
- [ ] Upgrade to Fireblocks Starter/Enterprise plan
- [ ] Configure editable TAP policies
- [ ] Set up self-hosted API Co-signer
- [ ] Enable AML screening integration
- [ ] Configure production IP whitelisting

#### 5.2 Configuration Migration
```typescript
// Sandbox to Production Migration Helper
class MigrationHelper {
  async generateProductionConfig(sandboxConfig: OriginatorConfiguration): ProductionConfig {
    return {
      ...sandboxConfig,
      environment: 'mainnet',
      tapPolicies: this.generateTAPRules(sandboxConfig),
      amlConfig: this.generateAMLConfig(sandboxConfig),
      apiCoSigner: {
        type: 'self-hosted',
        endpoint: 'https://cosigner.originator.com'
      }
    };
  }
  
  private generateTAPRules(config: OriginatorConfiguration): TAPRule[] {
    // Generate production TAP rules based on approval config
    const rules = [];
    
    // Rule 1: Block all manual console transactions
    rules.push({
      action: 'BLOCK',
      operators: { userGroups: { ids: ['all-console-users'] } },
      source: { wildcard: `${config.vaultStructure.prefix}_LP_*` }
    });
    
    // Rule 2: Allow automated disbursements
    if (config.approvalStructure.mode === 'none') {
      rules.push({
        action: 'ALLOW',
        operators: { userGroups: { ids: ['api-disbursement-group'] } },
        designatedSigners: { userGroups: { ids: ['api-disbursement-group'] } },
        amount: { lte: config.transactionLimits.automated.singleTransaction }
      });
    }
    
    // Rule 3: Require approval for configured scenarios
    if (config.approvalStructure.mode !== 'none' && config.approvalStructure.requirements?.numberOfApprovers > 0) {
      rules.push({
        action: 'REQUIRE_APPROVAL',
        operators: { userGroups: { ids: ['api-disbursement-group'] } },
        authorizationGroups: {
          of: config.approvalStructure.requirements.numberOfApprovers,
          from: ['approval-group']
        }
      });
    }
    
    return rules;
  }
}

## Security Considerations

### Key Management
- RSA-4096 keys should be generated offline
- Store in dedicated secrets management (HSM, Vault, etc.)
- 90-180 day rotation schedule recommended
- *Reference: `ts-sdk/docs/apis/ApiUserApi.md`*

### Network Security
- IP whitelisting strongly recommended (implement at application level)
- TLS 1.2+ for all API communications
- Webhook signature validation recommended
- *Reference: `ts-sdk/api/whitelist-ip-addresses-api.ts` (read-only API)*

**Note:** The SDK's whitelist API only retrieves existing whitelist entries. IP enforcement must be implemented in your application logic.

### Operational Security (Recommendations)
- Distribution vaults should be hidden from console
- Collection vaults may be visible for monitoring
- Transaction signing can be automated (based on approval configuration)
- Policy violations should trigger alerts (implement monitoring)
- Maintain complete audit trail

## Compliance & Reporting

### Built-in Compliance Features
- Pre-transaction AML/KYT screening
- Sanctions list checking
- Travel Rule message support
- Risk scoring and auto-rejection

### Reporting Capabilities
- Partner-specific transaction statements
- Compliance screening results
- Policy enforcement logs
- Failed transaction analysis

### Audit Trail Components
1. Blockchain transaction hashes
2. Fireblocks transaction records
3. Policy enforcement decisions
4. External ID linkage to loan records

## SDK Usage Example

```typescript
import { Fireblocks, BasePath, TransferPeerPathType } from '@fireblocks/ts-sdk';
import { OriginatorConfiguration } from './src/config/types';
import { VaultProvisioner } from './src/provisioner/vault-provisioner';
import { ConfigurationValidator } from './src/config/validator-strict';

// Example 1: Fully Automated Configuration (No Approvals)
const automatedConfig: OriginatorConfiguration = {
  workspace: {
    name: "FastLend Platform",
    environment: "sandbox"
  },
  lendingPartners: {
    partners: [
      { id: "LP001", name: "Capital Partners Inc", enabled: true },
      { id: "LP002", name: "Growth Fund LLC", enabled: true }
    ]
  },
  vaultStructure: {
    namingConvention: {
      prefix: "FASTLEND",
      distributionSuffix: "_DIST_USDC",
      collectionSuffix: "_COLL_USDC"
    },
    defaultAsset: "USDC_ETH"
  },
  approvalStructure: {
    mode: "none",  // Fully automated, no human approval needed
    requirements: {
      numberOfApprovers: 0  // 0 for fully automated operation
    }
  },
  transactionLimits: {
    automated: {
      singleTransaction: 1000000,  // $1M max per transaction
      dailyLimit: 10000000        // $10M daily limit
    }
  },
  apiSettings: {
    ipWhitelist: ["203.0.113.100"],  // Example public IP - replace with actual service IPs
    webhookEndpoint: "https://api.fastlend.com/fireblocks/webhook"
  }
};

// Example 2: Single Approval Configuration
const singleApprovalConfig: OriginatorConfiguration = {
  workspace: {
    name: "SecureLend Corp",
    environment: "sandbox"
  },
  lendingPartners: {
    partners: [
      { id: "LP001", name: "Institutional Capital", enabled: true }
    ]
  },
  vaultStructure: {
    namingConvention: {
      prefix: "SECURELEND",
      distributionSuffix: "_DIST_USDC",
      collectionSuffix: "_COLL_USDC"
    },
    defaultAsset: "USDC_POLYGON"
  },
  approvalStructure: {
    mode: "single",
    requirements: {
      numberOfApprovers: 1,
      approverRoles: [
        { role: "Risk Officer", required: true }
      ],
      alwaysRequireApproval: true  // Every transaction needs approval
    }
  },
  transactionLimits: {
    automated: {
      singleTransaction: 500000
    }
  },
  apiSettings: {
    ipWhitelist: ["198.51.100.50"],  // Example public IP - replace with actual service IPs
    webhookEndpoint: "https://api.securelend.com/hooks/fireblocks"
  }
};

// Example 3: Threshold-Based Multi-Approval
const thresholdConfig: OriginatorConfiguration = {
  workspace: {
    name: "Enterprise Lending",
    environment: "sandbox"
  },
  lendingPartners: {
    partners: [
      { id: "ENT001", name: "Enterprise Fund I", enabled: true },
      { id: "ENT002", name: "Enterprise Fund II", enabled: true }
    ]
  },
  vaultStructure: {
    namingConvention: {
      prefix: "ENTLEND",
      distributionSuffix: "_DIST_USDC",
      collectionSuffix: "_COLL_USDC"
    },
    defaultAsset: "USDC_ETH"
  },
  approvalStructure: {
    mode: "threshold",
    requirements: {
      numberOfApprovers: 2,
      approverRoles: [
        { role: "Compliance Manager", required: true },
        { role: "Risk Officer", required: false },
        { role: "CFO", required: false }
      ],
      thresholdAmount: 100000,  // Approval required for amounts >= $100k
      alwaysRequireApproval: false
    }
  },
  transactionLimits: {
    automated: {
      singleTransaction: 5000000,
      dailyLimit: 50000000
    }
  },
  apiSettings: {
    ipWhitelist: ["203.0.113.10", "203.0.113.11"],  // Example public IPs - replace with actual service IPs
    webhookEndpoint: "https://api.enterprise-lending.com/fireblocks/events"
  }
};

// Initialize Fireblocks SDK
const fireblocks = new Fireblocks({
  apiKey: process.env.FIREBLOCKS_API_KEY!,
  secretKey: process.env.FIREBLOCKS_SECRET_KEY!,
  basePath: BasePath.Sandbox
});

// Step 1: Validate configuration
const validator = new ConfigurationValidator();
const validationResult = await validator.validate(thresholdConfig);
if (!validationResult.isValid) {
  console.error('Configuration errors:', validationResult.errors);
  throw new Error('Invalid configuration');
}

// Step 2: Provision vaults
const provisioner = new VaultProvisioner();
const vaults = await provisioner.provisionPartnerVaults(thresholdConfig, "ENT001");

// Step 3: Execute a transaction (simplified example)
const transactionResponse = await fireblocks.transactions.createTransaction({
  transactionRequest: {
    assetId: "USDC_ETH",
    amount: "50000.00",
    source: {
      type: TransferPeerPathType.VaultAccount,
      id: vaults.distribution.id
    },
    destination: {
      type: TransferPeerPathType.ExternalWallet,
      id: "wallet_abc123"  // Must be whitelisted
    },
    note: "Loan disbursement",
    externalTxId: "LOAN_SM_001"  // Optional but recommended
  }
});

// Access transaction data from response
const transaction = transactionResponse.data;
console.log(`Transaction created: ${transaction.id}`);

// For large loans requiring approval, implement application-level logic
// The SDK doesn't enforce approval workflows - these must be built
```

## Directory Structure

```
fireblocks-custody-service/
├── src/
│   ├── config/
│   │   ├── validator.ts          # Configuration validation logic
│   │   └── schemas/              # JSON schemas for configuration
│   ├── provisioner/
│   │   ├── workspace.ts          # Workspace setup orchestration
│   │   ├── vaults.ts            # Vault account provisioning
│   │   ├── policies.ts          # TAP configuration
│   │   └── compliance.ts        # Compliance rule setup
│   ├── client/
│   │   ├── disbursement.ts      # Disbursement execution client
│   │   ├── monitoring.ts        # Transaction monitoring
│   │   └── reporting.ts         # Report generation
│   ├── templates/               # Policy and configuration templates
│   └── utils/                   # Shared utilities
├── ts-sdk/                      # Fireblocks TypeScript SDK (reference)
├── docs/                        # Additional documentation
├── examples/                    # Usage examples
└── tests/                       # Test suites
```

## Immediate Next Steps for Sandbox Implementation

### 1. Core Implementation Tasks
- [ ] Set up basic project structure with TypeScript
- [ ] Create configuration interfaces and validators
- [ ] Implement vault provisioning logic
- [ ] Build approval API endpoints
- [ ] Create transaction execution flow
- [ ] Add webhook handlers for transaction monitoring

### 2. Key Questions to Address

**Technical Questions:**
1. **Wallet Whitelisting**: How will recipient wallet addresses be added to Fireblocks?
   - Manual process through console?
   - API-based whitelisting?
   - Integration with KYC/AML provider?

2. **Transaction Monitoring**: What happens when a transaction fails?
   - Automatic retry logic?
   - Alert to administrators?
   - Rollback procedures?

3. **Collection Vault Management**: How are repayments processed?
   - Manual reconciliation?
   - Automated sweep to treasury?
   - Partner-specific collection rules?

**Business Logic Questions:**
1. **Approval Escalation**: If initial approvers don't respond:
   - Timeout period before escalation?
   - Backup approvers?
   - Auto-rejection after X hours?

2. **Multi-Currency Support**: Beyond USDC:
   - USDT support needed?
   - Different chains (Ethereum, Polygon, etc.)?
   - FX conversion requirements?

3. **Reporting Requirements**: What reports are needed?
   - Daily disbursement summaries?
   - Partner balance statements?
   - Approval audit trails?

### 3. Sandbox Testing Plan

**Week 1: Basic Infrastructure**
- Implement vault creation and asset activation
- Test with manual transactions
- Verify webhook connectivity

**Week 2: Approval System**
- Build approval API endpoints
- Test approval workflows
- Implement rejection handling

**Week 3: Integration Testing**
- End-to-end disbursement flow
- Multiple partner scenarios
- Error handling and edge cases

**Week 4: Documentation & Demo**
- Create setup guides
- Record demo videos
- Prepare production migration plan

### 4. Production Readiness Checklist

**Before Upgrading from Sandbox:**
- [ ] Complete security audit of approval system
- [ ] Document all API endpoints
- [ ] Create runbooks for common operations
- [ ] Test disaster recovery procedures
- [ ] Validate compliance requirements
- [ ] Prepare TAP rule configurations
- [ ] Design monitoring dashboards

### 5. Open Design Decisions

1. **Rate Limiting**: How many transactions per minute/hour?
2. **Batch Processing**: Support for bulk disbursements?
3. **Audit Trail Storage**: How long to retain approval history?
4. **Integration Points**: Which loan management systems to support?
5. **Mobile Support**: Native app for approvers?

Would you like me to elaborate on any of these areas or help prioritize which components to build first?

## References

### Fireblocks SDK Documentation
- **Vaults API**: `ts-sdk/api/vaults-api.ts` - Core vault management operations
- **Transactions API**: `ts-sdk/api/transactions-api.ts` - Transaction creation and monitoring
- **Policy API**: `ts-sdk/api/policy-editor-beta-api.ts` - TAP configuration (Beta)
- **Webhooks API**: `ts-sdk/api/webhooks-v2-api.ts` - Webhook creation and management
- **Webhooks API (Legacy)**: `ts-sdk/api/webhooks-api.ts` - Resend failed webhooks only
- **Compliance API**: `ts-sdk/api/compliance-api.ts` - Screening configuration

### Key Models
- **TransactionRequest**: `ts-sdk/models/transaction-request.ts` - Transaction parameters
- **VaultAccount**: `ts-sdk/models/vault-account.ts` - Vault structure
- **PolicyRule**: `ts-sdk/models/policy-rule.ts` - TAP rule definition
- **AuthorizationInfo**: `ts-sdk/models/authorization-info.ts` - TAP authorization structure
- **CreateWebhookRequest**: `ts-sdk/models/create-webhook-request.ts` - Webhook configuration
- **FireblocksResponse**: `ts-sdk/response/fireblocksResponse.ts` - API response wrapper

### Security & Compliance
- **API User Management**: `ts-sdk/docs/apis/ApiUserApi.md`
- **Screening Configuration**: `ts-sdk/models/screening-configurations-request.ts`
- **Screening Policy**: `ts-sdk/models/screening-policy-response.ts`
- **Audit Logs**: `ts-sdk/api/audit-logs-api.ts`

This design document serves as the blueprint for implementing a secure, compliant, and user-friendly loan disbursement platform on Fireblocks, abstracting complexity while maintaining institutional-grade security standards.