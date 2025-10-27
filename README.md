# Turnkey Custody Integration Service

A secure, policy-driven integration service that enables lending platforms to programmatically disburse USDC loans while keeping lender funds under Turnkey's institutional-grade MPC custody. This service bridges the gap between traditional loan origination workflows and blockchain-based disbursements, ensuring lenders never expose private keys while maintaining full control over their disbursement policies.

## The Problem This Solves

Traditional lending platforms face a critical challenge when moving to blockchain-based disbursements: **How do you enable instant, programmatic USDC transfers while maintaining institutional security standards?**

- **Manual processes** create delays and operational overhead
- **Hot wallets** expose private keys to compromise
- **Custodial solutions** reduce lender control and increase counterparty risk
- **Cold storage** prevents programmatic disbursements

This service leverages **Turnkey's MPC infrastructure** to solve these problems by keeping private keys in secure, distributed custody while enabling policy-controlled programmatic signing.

## Why This Exists

- Keep lender funds inside Turnkey-managed MPC wallets while still offering instant programmatic payouts.
- Encode lender-specific guardrails (allowed assets, destinations, thresholds, approvers) directly in Turnkey policies.
- Provide deterministic provisioning, snapshotting, and reconciliation so platform services can confidently trigger disbursement flows.
- Centralize secrets handling, activity polling, and error mapping for all Turnkey API calls.

## End-to-End Disbursement Workflow

This service orchestrates a secure, 5-step process from loan approval to USDC transfer:

### 1. **Disbursement Authorization (Turnkey Trigger)**
**Action**: Your platform backend confirms borrower acceptance and lender approval, then prepares to initiate disbursement.

**Mechanism**: The backend calls this Turnkey Integration Service with:
- Lender ID (mapped to Turnkey sub-organization)
- Target borrower wallet address
- USDC amount 
- Unique loan ID (for idempotency and reconciliation)

```typescript
await custodyService.initiateDisbursement({
  lenderId: 'lender_12345',
  borrowerAddress: '0x742d35...89',
  amount: '10000.00', // $10,000 USDC
  loanId: 'loan_abc123',
  assetType: 'USDC'
});
```

### 2. **Turnkey Transaction Signing & Disbursement**
**Action**: The Turnkey Integration Service initiates the USDC transfer from the lender's designated wallet.

**Mechanism**:
- Service uses Turnkey SDK to craft the USDC transfer transaction
- Specifies source Turnkey-managed signing key/wallet
- Populates destination borrower address, amount, asset type
- Includes relevant blockchain network (Polygon, Ethereum L2)
- Sends `signTransaction` request to Turnkey API

### 3. **Turnkey Policy Enforcement**
**Critical Security Layer**: Turnkey evaluates the request against the lender's pre-configured policies:

**Example Policy Rules**:
- ✅ "Allow USDC transfers only" 
- ✅ "Allow transfers only from API User X"
- ✅ "Require destination address to match data in external ID field"
- ✅ "Amount below $Y threshold"
- ✅ "Only during business hours"
- ✅ "Require 2-of-3 approval for amounts > $50k"

**Policy Outcomes**:
- **✅ Pass**: Turnkey's MPC securely signs the transaction without exposing private keys
- **⏸️ Consensus Required**: Multi-approver policies trigger manual approval workflow
- **❌ Denied**: Policy violation prevents signing and returns structured error

### 4. **Transaction Broadcast & Monitoring**
**Process**:
- Turnkey Integration Service receives the signed transaction
- Service broadcasts signed transaction to relevant blockchain network
- Activity polling and webhooks monitor settlement status
- Retry logic handles transient network failures
- External transaction IDs ensure idempotency

### 5. **Result & Reconciliation**
**Outcome**: USDC transfers directly from lender's Turnkey-managed wallet to borrower's non-custodial wallet.

**Platform Integration**: Your platform records the disbursement against the loan using:
- Runtime snapshot data (wallet IDs, policy contexts)
- Blockchain transaction hash
- Turnkey activity ID
- Loan ID for reconciliation

## Turnkey Integration - Key Aspects

### **Lender Onboarding**
Lenders are provisioned within Turnkey, potentially as sub-organizations, with specific wallet templates and initial policies applied via the Turnkey API/SDK managed by this service.

**Process** (`src/provisioner/turnkey-suborg-provisioner.ts:68`):
- Create Turnkey sub-organization for each lender
- Provision root users with appropriate permissions
- Set up automation users for programmatic operations
- Apply default wallet templates and policy frameworks

### **Wallet Provisioning** 
Disbursement wallets holding USDC are created for lenders within Turnkey, associated with specific signing keys managed by Turnkey's MPC.

**Implementation** (`src/config/types.ts:121-140`):
- **Distribution wallets**: Primary USDC disbursement accounts
- **Collection wallets**: Receive loan repayments 
- **Escrow wallets**: Hold funds pending conditions
- **Operational wallets**: Platform fees and operational costs

### **Policy Engine**
Turnkey Policies are the core control mechanism. They are configured to strictly limit the actions the platform's API key can request signatures for.

**This replicates the security controls of a restricted bank account**:
- Asset restrictions (USDC only)
- Destination whitelisting (enforced via API parameters/external IDs)
- Amount thresholds and velocity limits
- Time-based restrictions (business hours only)
- Multi-approval requirements for high-value transactions

### **Programmatic Signing**
The platform backend never handles private keys. It requests signatures from Turnkey via the SDK, relying on Turnkey to enforce policy before signing. The `signTransaction` API call is central to this architecture.

**Security Model** (`src/core/turnkey-client.ts:1-100`):
- API keys authenticate requests to Turnkey
- Policies control what signatures are allowed
- MPC signing happens within Turnkey's secure enclaves
- Signed transactions are returned to the platform for broadcast

### **Transaction Monitoring**
The service utilizes the Turnkey SDK and potentially webhooks to monitor the status of broadcasted transactions and handle failures/retries. External transaction IDs are used for idempotency and reconciliation.

### **Security**
API keys for interacting with Turnkey are securely managed (AWS Secrets Manager, HashiCorp Vault) and configured with least-privilege roles within Turnkey. IP whitelisting is enforced for API access.

## Repository Structure

```
src/
  config/          # Typed configuration model, schemas, and validators
  core/            # Turnkey client manager, secrets, error handling, activity helpers
  provisioner/     # Sub-org provisioning, wallet flows, policy deployment, runtime snapshots
  approvals/       # Policy templates & validation utilities
  services/        # Service layer scaffolding for future orchestration
  utils/           # Shared guards and helpers
docs/              # Deep dives (build plan, secrets management, etc.)
example-usage.ts   # End-to-end provisioning example
```

Additional Turnkey SDK assets live under the `sdk/` directory for reference.

## Business Value & Use Cases

### **For Lending Platforms**
- **Faster Settlement**: Instant USDC disbursements vs. 2-3 day ACH transfers
- **Global Reach**: Serve borrowers with any Web3 wallet, anywhere
- **Reduced Risk**: Eliminate private key management and hot wallet risks
- **Compliance**: Built-in policy controls and audit trails meet institutional requirements
- **Scalability**: Handle high transaction volumes with programmatic signing

### **For Lenders**
- **Control**: Define precise policies for fund usage (amounts, destinations, timing)
- **Security**: Institutional-grade MPC custody vs. exchange counterparty risk
- **Transparency**: On-chain settlement with full audit trail
- **Efficiency**: Automated disbursements vs. manual wire transfers
- **Flexibility**: Multi-approver workflows for large disbursements

### **Real-World Example: Invoice Factoring**

**Scenario**: A factoring company wants to advance $50,000 against a verified invoice.

**Traditional Process**: 
1. Manual verification (hours-days)
2. Wire transfer initiation (manual)
3. Bank processing (1-3 business days)
4. Borrower receives funds

**With Turnkey Integration**:
1. Platform confirms invoice validity
2. Automated policy check: ✅ Amount < $100k limit, ✅ Borrower KYC complete
3. Turnkey signs USDC transfer (seconds)
4. Borrower receives funds instantly

**Policy Configuration**:
```typescript
{
  policyName: "Factoring Disbursement Policy",
  effect: "EFFECT_ALLOW",
  condition: {
    expression: "txn.amount <= 100000 && borrower.kycStatus == 'verified' && invoice.status == 'validated'"
  },
  consensus: {
    expression: "txn.amount <= 50000 ? 1 : 2" // 2-of-3 for amounts > $50k
  }
}
```

## Configuration Architecture

The `OriginatorConfiguration` type (`src/config/types.ts:278-285`) captures every input needed to stand up a lender environment. This configuration-driven approach ensures consistent deployments and makes the system easily auditable.

### **Design Philosophy**
- **Template-first**: Use placeholders (e.g., `{{originatorId}}`) for reusable configurations
- **Type-safe**: Full TypeScript coverage prevents configuration errors
- **Validation**: Strict validation before provisioning (`src/config/validator.ts`)
- **Modular**: Five logical steps that can be configured independently

### **Configuration Steps**

1. **Platform & identity** (`PlatformConfig`) – Target Turnkey environment, parent organization, API base URL, and the originator profile (ID, display name, legal entity, metadata).
2. **Provisioning** (`ProvisioningConfig`) – Sub-organization name template, root quorum threshold, root users, feature toggles, and provisioning webhook definitions.
3. **Business model** (`BusinessModelConfig`) – Wallet architecture (`WalletTemplate` + `WalletFlow` mappings), partner catalog, partner-specific overrides, and default policies/webhooks.
4. **Access control** (`AccessControlConfig`) – Human roles, automation user templates, session defaults, and policy templates (with binding metadata).
5. **Operations & compliance** (`OperationsConfig`, `ComplianceConfig`) – Monitoring hooks, reporting cadence, AML/Travel Rule requirements, and audit expectations.

Config values are template-first; placeholders (e.g., `{{originatorId}}`) are resolved using runtime context so a single configuration can power many lenders.

Use `ConfigurationValidator` (`src/config/validator.ts`) or the strict variant to ensure inputs are complete before provisioning.

## Provisioning Lifecycle

The `TurnkeySuborgProvisioner` orchestrates provisioning end-to-end:

- Validates wallet architecture and partner overrides.
- Calls `TurnkeyClientManager.provisionSubOrganization` to create the sub-org, root users, automation keys, and default wallets. Activity submissions emit events for observability.
- Applies partner overrides by instantiating additional wallets where required.
- Derives wallet alias maps so policy bindings can reference accounts by alias, template ID, or `partnerId:alias`.
- Delegates policy deployment to `PolicyProvisioner`, which uses `createPolicyBindingResolver` to substitute IDs before hitting the Turnkey API.
- Returns a `ProvisioningArtifacts` object containing a deterministic hash of the platform config, a `ProvisioningRuntimeSnapshot`, and any automation credentials that need to be persisted securely.

This snapshot feeds the runtime services that execute disbursements: it lists wallet IDs, account aliases, partner assignments, policy IDs, and automation user metadata so later API calls remain idempotent.

## Policies & Authorization

- Policy templates live under `src/approvals`. Each template defines a human-readable name, Turnkey effect, condition expression, consensus requirements, and binding descriptors.  
- Binding descriptors use `PolicyBindingDefinition` types (`wallet_template`, `wallet_alias`, `partner`, `user_tag`, `automation_user`, or `custom`).  
- During provisioning, the binding resolver materializes every descriptor into the real Turnkey target (wallet ID, account ID, partner ID, etc.), capturing warnings for missing optional resources.
- Deployed policy artifacts are recorded in the runtime snapshot so downstream systems can enforce or reconcile them.

## Runtime Snapshot & Idempotency

`ProvisioningRuntimeSnapshot` (`src/provisioner/runtime-snapshots.ts`) describes the entire environment immediately after provisioning:

- Sub-organization identifiers and quorum information.
- Root users + automation users (with key/session metadata).
- Wallet flows with account alias -> account ID/address mappings.
- Partner runtime configs (wallet assignments, policy IDs, webhooks).
- Policies applied and custom metadata for audit trails.

Persist this snapshot in your platform database. Subsequent loan disbursements can look up the lender's distribution wallet, automation user, and policy context without re-querying Turnkey.

## Secrets & Credential Management

`SecretsManager` (`src/core/secrets-manager.ts`) abstracts secret loading. Environment variables are supported today; HashiCorp Vault, AWS Secrets Manager, and Azure Key Vault hooks are scaffolded for future use.

Required keys:

| Variable | Purpose |
|----------|---------|
| `TURNKEY_API_PRIVATE_KEY` | PEM private key for the parent organization API user |
| `TURNKEY_API_PUBLIC_KEY`  | Matching PEM public key |
| `TURNKEY_API_KEY_ID`      | Parent Turnkey API key ID |
| `TURNKEY_ORGANIZATION_ID` | Parent organization (used as fallback during provisioning) |

Optional maps (JSON strings):

- `TURNKEY_AUTOMATION_KEYS` – Template ID -> `{ apiPrivateKey, apiPublicKey, apiKeyId }`
- `TURNKEY_PASSKEY_ATTESTATIONS` – Template ID -> attestation payload (base64-encoded)
- `TURNKEY_DELEGATED_KEYS` – Template ID -> delegated signing key (future use)

Initialize secrets before touching the Turnkey client:

```ts
const secrets = SecretsManager.getInstance({ provider: SecretProvider.ENVIRONMENT });
await secrets.loadSecrets();
await TurnkeyClientManager.initialize({ platform: config.platform, secretConfig: { provider: SecretProvider.ENVIRONMENT } });
```

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Type checking**
   ```bash
   npm run typecheck
   ```
3. **Unit tests**
   ```bash
   npm test
   ```
4. **Build artefacts**
   ```bash
   npm run build
   ```
5. **End-to-end dry run** (requires valid Turnkey sandbox credentials)
   ```bash
   node -r ts-node/register example-usage.ts
   ```

The example script assembles a sample `OriginatorConfiguration`, validates it, initializes Turnkey clients, and executes provisioning end-to-end. It is a good reference when wiring the service into your platform backend.

## Operational Observability

- `ActivityEventEmitter` hooks (in `TurnkeyClientManager`) let you surface Turnkey activity submissions, completions, failures, and consensus-required events to your logging/alerting stack.
- `retryWithBackoff` in `src/core/error-handler.ts` wraps transient Turnkey failures with exponential backoff while preserving deterministic error codes for callers.
- Webhook definitions (`WebhookConfig`) can be attached at the platform, provisioning, or partner level for push-based notifications.
- `MonitoringConfig` supports activity polling cadence, log retention hints, and purpose-specific webhooks (activity/policy/alerts).

## Security Posture

- Private keys stay inside Turnkey; this service only ever handles API credentials and signed payloads.  
- Automation users are scoped with least-privilege session policies (`sessionTypes` + policy bindings).  
- API users and passkeys can be rotated by updating `TURNKEY_AUTOMATION_KEYS` / `TURNKEY_PASSKEY_ATTESTATIONS` and calling `TurnkeyClientManager.reset()`.  
- Enforce IP allowlists and network segmentation around the runtime hosting this service; the SDK supports passing `TURNKEY_API_BASE_URL` for sandbox vs. production.
- Always persist automation credentials in a hardened secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) per the guidance in `docs/SECRETS_MANAGEMENT.md`.

## Extensibility & Next Steps

- Implement vault-backed secret providers (`SecretsManager.loadFromAWS`, `loadFromHashicorp`, `loadFromAzure`).
- Flesh out `src/services/` with orchestration layers for disbursement initiation, transaction broadcasting, and webhook reconciliation.
- Expand policy templates to cover additional controls (multi-asset support, scheduled payouts, dynamic consensus rules).
- Add richer transaction monitoring via Turnkey webhooks and on-chain explorers.
- Follow the roadmaps in `docs/BUILD_PLAN.md` and `docs/DEVELOPMENT_PLAN.md` for upcoming milestones.

Contributions and feedback are welcome—open issues or PRs to discuss enhancements to policy tooling, transaction flows, or monitoring.
