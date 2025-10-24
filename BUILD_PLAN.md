# Fireblocks Custody Service - Build Plan

## Overview
This document provides a step-by-step implementation plan for building the Fireblocks Custody Service MVP in the sandbox environment. Each step includes specific SDK references and code examples.

## Prerequisites

### 1. Environment Setup
```bash
# Install dependencies
npm install @fireblocks/ts-sdk dotenv typescript @types/node

# Create environment file
touch .env
```

### 2. Required Environment Variables
```env
FIREBLOCKS_API_KEY=your-sandbox-api-key
FIREBLOCKS_SECRET_KEY=your-secret-key-content
FIREBLOCKS_BASE_PATH=https://sandbox-api.fireblocks.io/v1
```

### 3. Fireblocks Sandbox Access
- Ensure you have access to sandbox.fireblocks.io
- API key and secret key generated
- Understanding of sandbox limitations (non-editable policies, 5 API users max)

## Phase 1: Core Infrastructure (Week 1)

### Step 1: Project Structure Setup

Create the following directory structure:
```
fireblocks-custody-service/
├── src/
│   ├── config/
│   │   ├── types.ts              # Configuration interfaces
│   │   ├── validator.ts          # Configuration validation
│   │   └── schemas/
│   │       └── originator.schema.json
│   ├── core/
│   │   ├── fireblocks-client.ts # SDK initialization
│   │   └── error-handler.ts     # Error handling
│   ├── provisioner/
│   │   ├── vault-provisioner.ts # Vault creation logic
│   │   └── asset-manager.ts     # Asset activation
│   ├── services/
│   │   ├── approval.service.ts  # Approval logic
│   │   └── disbursement.service.ts
│   └── index.ts
├── tests/
├── BUILD_PLAN.md
└── README.md
```

### Step 2: Configuration Types Implementation

**File: `src/config/types.ts`**
```typescript
// Based on ts-sdk/models/create-vault-account-request.ts
export interface OriginatorConfiguration {
  workspace: {
    name: string;
    environment: 'sandbox' | 'testnet' | 'mainnet';
  };
  
  lendingPartners: {
    partners: Array<{
      id: string;
      name: string;
      enabled: boolean;
    }>;
  };
  
  vaultStructure: {
    namingConvention: {
      prefix: string;
      distributionSuffix: string;
      collectionSuffix: string;
    };
    defaultAsset: string; // Must match Fireblocks asset IDs
  };
  
  approvalStructure: {
    mode: 'none' | 'single' | 'multi' | 'threshold';
    requirements?: {
      numberOfApprovers?: number;
      approverRoles?: Array<{
        role: string;
        required: boolean;
      }>;
      thresholdAmount?: number;
      alwaysRequireApproval?: boolean;
    };
  };
  
  transactionLimits: {
    automated: {
      singleTransaction: number;
      dailyLimit?: number;
      monthlyLimit?: number;
    };
  };
  
  apiSettings: {
    ipWhitelist: string[];
    webhookEndpoint?: string;
  };
}
```

**SDK References:**
- `ts-sdk/models/create-vault-account-request.ts` - Vault creation parameters
- `ts-sdk/models/asset-type-response.ts` - Valid asset types
- `ts-sdk/models/transaction-request.ts` - Transaction request structure
- `ts-sdk/models/authorization-info.ts` - TAP authorization structure
- `ts-sdk/models/policy-rule.ts` - Policy rule definitions

### Step 3: Fireblocks Client Setup

**File: `src/core/fireblocks-client.ts`**
```typescript
import { Fireblocks, BasePath } from "@fireblocks/ts-sdk";
import { readFileSync } from 'fs';

export class FireblocksClientManager {
  private static instance: Fireblocks;
  
  static getInstance(): Fireblocks {
    if (!this.instance) {
      const apiKey = process.env.FIREBLOCKS_API_KEY;
      const secretKey = process.env.FIREBLOCKS_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        throw new Error("Fireblocks credentials not configured");
      }
      
      this.instance = new Fireblocks({
        apiKey,
        basePath: BasePath.Sandbox,
        secretKey
      });
    }
    
    return this.instance;
  }
}
```

**SDK References:**
- `ts-sdk/client/client.ts` - Fireblocks client initialization
- `ts-sdk/client/clientConfiguration.ts` - Configuration options
- `ts-sdk/configuration.ts` - BasePath enum

### Step 4: Vault Provisioner Implementation

**File: `src/provisioner/vault-provisioner.ts`**
```typescript
import { FireblocksClientManager } from '../core/fireblocks-client';
import { OriginatorConfiguration } from '../config/types';
import { 
  VaultAccount,
  CreateVaultAccountRequest 
} from '@fireblocks/ts-sdk';

export class VaultProvisioner {
  private fireblocks = FireblocksClientManager.getInstance();
  
  async provisionPartnerVaults(
    config: OriginatorConfiguration,
    partnerId: string
  ): Promise<{ distribution: VaultAccount; collection: VaultAccount }> {
    const { prefix, distributionSuffix, collectionSuffix } = config.vaultStructure.namingConvention;
    
    // Create distribution vault
    const distributionRequest: CreateVaultAccountRequest = {
      name: `${prefix}_LP_${partnerId}${distributionSuffix}`,
      hiddenOnUI: true,  // Critical: Hidden for API-only access
      autoFuel: false,
      customerRefId: `${config.workspace.name}_${partnerId}_DIST`
    };
    
    // Create collection vault  
    const collectionRequest: CreateVaultAccountRequest = {
      name: `${prefix}_LP_${partnerId}${collectionSuffix}`,
      hiddenOnUI: false, // Visible for monitoring
      autoFuel: false,
      customerRefId: `${config.workspace.name}_${partnerId}_COLL`
    };
    
    try {
      // Call ts-sdk/api/vaults-api.ts - createVaultAccount
      // Returns FireblocksResponse<VaultAccount>
      const [distVaultResponse, collVaultResponse] = await Promise.all([
        this.fireblocks.vaults.createVaultAccount({
          createVaultAccountRequest: distributionRequest
        }),
        this.fireblocks.vaults.createVaultAccount({
          createVaultAccountRequest: collectionRequest
        })
      ]);
      
      // Extract vault data from FireblocksResponse
      const distVault = distVaultResponse.data;
      const collVault = collVaultResponse.data;
      
      // Activate assets in both vaults
      await this.activateAssetsInVaults(
        [distVault.id, collVault.id],
        config.vaultStructure.defaultAsset
      );
      
      return {
        distribution: distVault,
        collection: collVault
      };
    } catch (error) {
      console.error('Vault provisioning failed:', error);
      throw error;
    }
  }
  
  private async activateAssetsInVaults(
    vaultIds: string[],
    assetId: string
  ): Promise<void> {
    // Use ts-sdk/api/vaults-api.ts - activateAssetForVaultAccount
    // Method expects an object: { vaultAccountId, assetId, idempotencyKey }
    const activationPromises = vaultIds.map(vaultId =>
      this.fireblocks.vaults.activateAssetForVaultAccount({
        vaultAccountId: vaultId,
        assetId: assetId,
        idempotencyKey: `activate_${vaultId}_${assetId}` // idempotency key
      })
    );
    
    await Promise.all(activationPromises);
  }
}
```

**SDK References:**
- `ts-sdk/api/vaults-api.ts` - `createVaultAccount`, `activateAssetForVaultAccount`
- `ts-sdk/models/create-vault-account-request.ts` - Request structure
- `ts-sdk/models/vault-account.ts` - VaultAccount structure
- `ts-sdk/response/fireblocksResponse.ts` - FireblocksResponse wrapper

## Phase 2: Transaction & Approval System (Week 2)

### Step 5: Approval Service Implementation

**File: `src/services/approval.service.ts`**
```typescript
import { OriginatorConfiguration } from '../config/types';

interface PendingDisbursement {
  id: string;
  loanId: string;
  partnerId: string;
  amount: string;
  recipientAddress: string;
  requiredApprovals: number;
  currentApprovals: ApprovalRecord[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  metadata: any;
}

interface ApprovalRecord {
  userId: string;
  role: string;
  approvedAt: Date;
  comments?: string;
}

export class ApprovalService {
  // In production, this would be a database
  private pendingDisbursements = new Map<string, PendingDisbursement>();
  
  constructor(private config: OriginatorConfiguration) {}
  
  async createPendingDisbursement(request: {
    loanId: string;
    partnerId: string;
    amount: string;
    recipientAddress: string;
    metadata?: any;
  }): Promise<PendingDisbursement> {
    const requiresApproval = this.checkApprovalRequired(request.amount);
    
    if (!requiresApproval) {
      throw new Error('This disbursement does not require approval');
    }
    
    const pending: PendingDisbursement = {
      id: `PEND_${Date.now()}_${request.loanId}`,
      ...request,
      requiredApprovals: this.config.approvalStructure.requirements?.numberOfApprovers || 0,
      currentApprovals: [],
      status: 'pending',
      createdAt: new Date()
    };
    
    this.pendingDisbursements.set(pending.id, pending);
    
    // In production, send notifications to approvers
    await this.notifyApprovers(pending);
    
    return pending;
  }
  
  async approveDisbursement(
    disbursementId: string,
    userId: string,
    role: string,
    comments?: string
  ): Promise<{ approved: boolean; fullyApproved: boolean }> {
    const pending = this.pendingDisbursements.get(disbursementId);
    if (!pending) throw new Error('Disbursement not found');
    
    // Check if user already approved
    if (pending.currentApprovals.some(a => a.userId === userId)) {
      throw new Error('User has already approved this disbursement');
    }
    
    // Validate user role
    const validRole = this.config.approvalStructure.requirements?.approverRoles
      ?.some(r => r.role === role);
    
    if (!validRole) {
      throw new Error('User role not authorized for approval');
    }
    
    // Add approval
    pending.currentApprovals.push({
      userId,
      role,
      approvedAt: new Date(),
      comments
    });
    
    // Check if fully approved
    const fullyApproved = pending.currentApprovals.length >= pending.requiredApprovals;
    
    if (fullyApproved) {
      pending.status = 'approved';
    }
    
    return { approved: true, fullyApproved };
  }
  
  private checkApprovalRequired(amount: string): boolean {
    const config = this.config.approvalStructure;
    
    if (config.mode === 'none') return false;
    
    if (config.requirements?.alwaysRequireApproval) return true;
    
    if (config.requirements?.thresholdAmount) {
      return parseFloat(amount) >= config.requirements.thresholdAmount;
    }
    
    return (config.requirements?.numberOfApprovers || 0) > 0;
  }
  
  private async notifyApprovers(pending: PendingDisbursement): Promise<void> {
    // Webhook notification implementation
    if (this.config.apiSettings.webhookEndpoint) {
      // Send webhook notification
      console.log(`Notifying approvers for disbursement ${pending.id}`);
    }
  }
}
```

### Step 6: Disbursement Service Implementation

**File: `src/services/disbursement.service.ts`**
```typescript
import { FireblocksClientManager } from '../core/fireblocks-client';
import { ApprovalService } from './approval.service';
import { OriginatorConfiguration } from '../config/types';
import {
  TransactionRequest,
  TransactionResponse,
  TransferPeerPathType,
  TransactionOperation
} from '@fireblocks/ts-sdk';

export class DisbursementService {
  private fireblocks = FireblocksClientManager.getInstance();
  private approvalService: ApprovalService;
  
  constructor(private config: OriginatorConfiguration) {
    this.approvalService = new ApprovalService(config);
  }
  
  async processDisbursement(request: {
    loanId: string;
    partnerId: string;
    amount: string;
    recipientWalletId: string;  // Must be whitelisted in Fireblocks
    metadata?: any;
  }): Promise<{ 
    status: 'completed' | 'pending_approval';
    transactionId?: string;
    pendingId?: string;
  }> {
    // Check if approval required
    const requiresApproval = this.checkApprovalRequired(request.amount);
    
    if (requiresApproval) {
      const pending = await this.approvalService.createPendingDisbursement({
        ...request,
        recipientAddress: request.recipientWalletId
      });
      
      return {
        status: 'pending_approval',
        pendingId: pending.id
      };
    }
    
    // Execute immediately
    const transaction = await this.executeDisbursement(request);
    
    return {
      status: 'completed',
      transactionId: transaction.id
    };
  }
  
  async executeDisbursement(request: {
    loanId: string;
    partnerId: string;
    amount: string;
    recipientWalletId: string;
  }): Promise<TransactionResponse> {
    // Get distribution vault ID
    const vaultName = `${this.config.vaultStructure.namingConvention.prefix}_LP_${request.partnerId}${this.config.vaultStructure.namingConvention.distributionSuffix}`;
    
    // In production, look up vault ID by name
    // For now, assume we have a mapping
    const vaultId = await this.getVaultIdByName(vaultName);
    
    const transactionRequest: TransactionRequest = {
      operation: TransactionOperation.Transfer,
      assetId: this.config.vaultStructure.defaultAsset,
      amount: request.amount,
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: vaultId
      },
      destination: {
        type: TransferPeerPathType.ExternalWallet,
        id: request.recipientWalletId
      },
      note: `Loan disbursement: ${request.loanId}`,
      externalTxId: request.loanId,  // Critical for idempotency
      customerRefId: request.partnerId
    };
    
    try {
      // Use ts-sdk/api/transactions-api.ts - createTransaction
      // Returns FireblocksResponse<CreateTransactionResponse>
      const result = await this.fireblocks.transactions.createTransaction({
        transactionRequest,
        idempotencyKey: `tx_${request.loanId}`
      });
      
      // Extract transaction data from response
      const transaction = result.data;
      
      // Register for webhook updates
      await this.registerWebhook(transaction.id);
      
      return transaction;
    } catch (error) {
      console.error('Transaction creation failed:', error);
      throw error;
    }
  }
  
  private async getVaultIdByName(vaultName: string): Promise<string> {
    // Use ts-sdk/api/vaults-api.ts - getPagedVaultAccounts
    const vaults = await this.fireblocks.vaults.getPagedVaultAccounts({
      namePrefix: vaultName,
      limit: 1
    });
    
    if (vaults.data.accounts.length === 0) {
      throw new Error(`Vault not found: ${vaultName}`);
    }
    
    return vaults.data.accounts[0].id;
  }
  
  private checkApprovalRequired(amount: string): boolean {
    // Delegate to approval service
    return this.approvalService['checkApprovalRequired'](amount);
  }
  
  private async registerWebhook(transactionId: string): Promise<void> {
    // Implementation depends on your webhook strategy
    console.log(`Registered webhook for transaction: ${transactionId}`);
  }
}
```

**SDK References:**
- `ts-sdk/api/transactions-api.ts` - `createTransaction`, `getTransactionById`
- `ts-sdk/models/transaction-request.ts` - Transaction request structure (externalTxId optional until 2026)
- `ts-sdk/models/transfer-peer-path-type.ts` - Source/destination types
- `ts-sdk/models/transaction-operation.ts` - Operation types
- `ts-sdk/response/fireblocksResponse.ts` - Response wrapper

## Phase 3: Integration & API Layer (Week 3)

### Step 7: API Endpoints Implementation

**File: `src/api/routes.ts` (pseudo-code for API structure)**
```typescript
// POST /api/originator/setup
// Creates vaults and configures the originator environment
async function setupOriginator(config: OriginatorConfiguration) {
  // 1. Validate configuration
  // 2. Create vaults for each partner
  // 3. Store configuration
  // 4. Return setup summary
}

// POST /api/users/access-request
// User requests access to the system
async function requestUserAccess(request: UserAccessRequest) {
  // 1. Validate request
  // 2. Store pending request
  // 3. Notify administrators
  // 4. Return request ID
}

// POST /api/disbursements
// Initiate a loan disbursement
async function createDisbursement(request: DisbursementRequest) {
  // 1. Validate request
  // 2. Check approval requirements
  // 3. Either execute or create pending
  // 4. Return status
}

// GET /api/approvals/pending
// Get pending approvals for a user
async function getPendingApprovals(userId: string) {
  // 1. Get user role
  // 2. Filter relevant pending disbursements
  // 3. Return list
}

// POST /api/approvals/:id/approve
// Approve a pending disbursement
async function approveDisbursement(id: string, approval: ApprovalRequest) {
  // 1. Validate user authorization
  // 2. Record approval
  // 3. Check if fully approved
  // 4. Execute if complete
  // 5. Return status
}
```

### Step 8: Webhook Handler Implementation

**File: `src/webhooks/transaction-webhook.ts`**
```typescript
import { FireblocksClientManager } from '../core/fireblocks-client';

export class TransactionWebhookHandler {
  private fireblocks = FireblocksClientManager.getInstance();
  
  async handleWebhook(payload: any): Promise<void> {
    // Fireblocks webhook payload structure
    const { type, data } = payload;
    
    if (type === 'TRANSACTION_STATUS_UPDATED') {
      await this.handleTransactionUpdate(data);
    }
  }
  
  private async handleTransactionUpdate(data: {
    id: string;
    status: string;
    subStatus?: string;
    txHash?: string;
  }): Promise<void> {
    // Get full transaction details
    const transaction = await this.fireblocks.transactions.getTransaction({
      txId: data.id
    });
    
    switch (transaction.data.status) {
      case 'COMPLETED':
        await this.handleCompletedTransaction(transaction.data);
        break;
      
      case 'FAILED':
      case 'REJECTED':
        await this.handleFailedTransaction(transaction.data);
        break;
      
      case 'BLOCKED_BY_POLICY':
        await this.handlePolicyViolation(transaction.data);
        break;
    }
  }
  
  private async handleCompletedTransaction(tx: TransactionResponse): Promise<void> {
    // Update loan system via externalTxId
    console.log(`Disbursement completed: Loan ${tx.externalTxId}, TxHash: ${tx.txHash}`);
    
    // Notify relevant parties
    if (this.config.apiSettings.webhookEndpoint) {
      // Send success notification
    }
  }
  
  private async handleFailedTransaction(tx: TransactionResponse): Promise<void> {
    // Alert operations team
    console.error(`Disbursement failed: Loan ${tx.externalTxId}, Reason: ${tx.subStatus}`);
    
    // Trigger retry logic or manual intervention
  }
  
  private async handlePolicyViolation(tx: TransactionResponse): Promise<void> {
    // Security alert - this shouldn't happen in production
    console.error(`SECURITY: Policy violation for loan ${tx.externalTxId}`);
    
    // Immediate notification to security team
  }
}
```

**SDK References:**
- `ts-sdk/api/webhooks-v2-api.ts` - Webhook creation and management
- `ts-sdk/api/webhooks-api.ts` - Legacy API (resend failed webhooks only)
- `ts-sdk/models/webhook-event.ts` - Event types
- `ts-sdk/models/transaction-response.ts` - Transaction status values
- `ts-sdk/models/create-webhook-request.ts` - Webhook configuration

## Phase 4: Testing & Validation (Week 4)

### Step 9: Integration Tests

**File: `tests/integration/end-to-end.test.ts`**
```typescript
describe('End-to-End Disbursement Flow', () => {
  let custodyService: FireblocksCustodyService;
  
  beforeAll(async () => {
    // Initialize with test configuration
    const config = loadTestConfig();
    custodyService = new FireblocksCustodyService(config);
    await custodyService.provision();
  });
  
  test('Automated disbursement (no approval)', async () => {
    // 1. Create disbursement request
    // 2. Verify immediate execution
    // 3. Check transaction status
    // 4. Verify webhook received
  });
  
  test('Single approval flow', async () => {
    // 1. Create disbursement requiring approval
    // 2. Verify pending status
    // 3. Submit approval
    // 4. Verify execution
  });
  
  test('Threshold-based approval', async () => {
    // 1. Test below threshold (automatic)
    // 2. Test above threshold (requires approval)
    // 3. Verify correct behavior
  });
  
  test('Idempotency check', async () => {
    // 1. Submit disbursement
    // 2. Submit duplicate with same loanId
    // 3. Verify rejection
  });
});
```

### Step 10: Sandbox Validation Checklist

- [ ] **Vault Creation**
  - Create test originator configuration
  - Provision vaults for 2-3 test partners
  - Verify naming conventions
  - Confirm hiddenOnUI settings

- [ ] **Asset Activation**
  - Activate USDC_ETH in all vaults
  - Verify balance checking works
  - Test insufficient balance scenarios

- [ ] **Transaction Flow**
  - Create test disbursement
  - Monitor via getTransaction API
  - Verify webhook notifications
  - Check transaction in console

- [ ] **Approval System**
  - Test each approval mode
  - Verify role-based restrictions
  - Test rejection scenarios
  - Validate timeout behavior

- [ ] **Error Handling**
  - Test invalid configurations
  - Handle API errors gracefully
  - Verify idempotency protection
  - Test network failures

## Migration to Production

### Key Differences from Sandbox

1. **Editable Policies**
   - Convert approval logic to TAP rules
   - Implement policy templates
   - Test policy enforcement

2. **Self-Hosted Co-Signer**
   - Set up co-signer infrastructure
   - Configure key management
   - Test signing flow

3. **AML Integration**
   - Enable Chainalysis/Elliptic
   - Configure screening rules
   - Test auto-rejection

4. **Production API Keys**
   - Generate production credentials
   - Update IP whitelisting
   - Increase rate limits

### Production TAP Rule Examples

**Note:** TAP rules are only editable in testnet/mainnet workspaces. In sandbox, these rules must be simulated in application logic.

```json
{
  "rules": [
    {
      "name": "Block Manual Console Transactions",
      "action": "BLOCK",
      "operators": {
        "userGroups": { "ids": ["all-console-users"] }
      },
      "source": {
        "wildcard": "ORIGINATOR_LP_*"
      }
    },
    {
      "name": "Automated Disbursements",
      "action": "ALLOW",
      "operators": {
        "userGroups": { "ids": ["api-disbursement-group"] }
      },
      "designatedSigners": {
        "userGroups": { "ids": ["api-disbursement-group"] }
      },
      "amount": {
        "lte": "100000",
        "currency": "USD"
      }
    },
    {
      "name": "High Value Approval Required",
      "action": "REQUIRE_APPROVAL",
      "operators": {
        "userGroups": { "ids": ["api-disbursement-group"] }
      },
      "amount": {
        "gt": "100000",
        "currency": "USD"
      },
      "authorizationGroups": {
        "of": 2,
        "from": ["risk-committee"]
      }
    }
  ]
}
```

## Monitoring & Operations

### Key Metrics to Track

1. **Transaction Metrics**
   - Success rate
   - Average confirmation time
   - Failed transaction reasons
   - Gas costs

2. **Approval Metrics**
   - Average approval time
   - Approval vs rejection rate
   - Pending queue depth

3. **System Health**
   - API response times
   - Webhook delivery success
   - Error rates by type

### Operational Runbooks

1. **Failed Transaction Recovery**
   - Check transaction status
   - Identify failure reason
   - Retry or manual intervention
   - Update loan system

2. **Stuck Approval Resolution**
   - Identify blocking approver
   - Escalation procedure
   - Timeout and cancellation

3. **Vault Funding**
   - Monitor vault balances
   - Alert on low balance
   - Funding procedure
   - Reconciliation process

## Security Considerations

### API Security
- Implement rate limiting
- Use API key rotation
- Monitor for suspicious activity
- Implement request signing

### Data Security
- Encrypt sensitive data at rest
- Use secure communication channels
- Implement audit logging
- Regular security reviews

### Access Control
- Principle of least privilege
- Regular access reviews
- Multi-factor authentication
- Session management

## Next Implementation Steps

1. **Week 1 Focus**: Complete Phase 1 (Core Infrastructure)
   - Set up project structure
   - Implement Fireblocks client
   - Build vault provisioner
   - Test vault creation

2. **Week 2 Focus**: Complete Phase 2 (Transaction & Approval)
   - Implement approval service
   - Build disbursement service
   - Test approval flows
   - Handle edge cases

3. **Week 3 Focus**: Complete Phase 3 (Integration)
   - Build API endpoints
   - Implement webhooks
   - Create test suite
   - Documentation

4. **Week 4 Focus**: Complete Phase 4 (Testing & Polish)
   - End-to-end testing
   - Performance testing
   - Security review
   - Demo preparation

## Resources & References

### Fireblocks SDK Documentation
- [TypeScript SDK README](ts-sdk/README.md)
- [API Reference](ts-sdk/docs/apis/)
- [Model Definitions](ts-sdk/models/)

### Key SDK Files
- Client initialization: `ts-sdk/client/client.ts`
- Vault operations: `ts-sdk/api/vaults-api.ts`
- Transaction operations: `ts-sdk/api/transactions-api.ts`
- Webhook management: `ts-sdk/api/webhooks-v2-api.ts`

### External Resources
- [Fireblocks Developer Portal](https://developers.fireblocks.com)
- [API Documentation](https://docs.fireblocks.com/api)
- [Best Practices Guide](https://support.fireblocks.com)

This build plan provides a concrete roadmap for implementing the Fireblocks Custody Service MVP in the sandbox environment, with clear paths to production deployment.