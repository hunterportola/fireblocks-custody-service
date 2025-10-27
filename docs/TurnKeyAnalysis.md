# Turnkey Analysis for Multi-Tenant Loan Originator Platform

## Executive Summary

Turnkey is a secure wallet infrastructure provider that offers programmable, policy-based wallet management through API. It provides similar capabilities to Fireblocks but with some key architectural differences that make it well-suited for a multi-tenant loan originator platform.

## Core Architecture & Components

### 1. Organizations and Sub-Organizations
- **Parent Organization**: The root entity (your platform)
- **Sub-Organizations**: Isolated tenants for each loan originator
- Each sub-organization has:
  - Its own users and access controls
  - Separate wallets and keys
  - Custom policies and rules
  - Isolated security boundaries

### 2. Wallet and Key Management
- **HD Wallets**: Hierarchical deterministic wallets with BIP32 support
- **Private Keys**: Secure key generation and storage
- **Multi-Chain Support**: Ethereum, Bitcoin, Solana, and many others
- **Address Formats**: Support for various address formats across chains

### 3. Authentication Methods
- **API Keys**: For programmatic access
  - Support for P256, SECP256K1, and ED25519 curves
  - Expiration controls
  - Cryptographic signing (stamps)
- **WebAuthn/Passkeys**: For user authentication
- **OAuth Providers**: Integration with external identity providers
- **Multi-factor options**: Email, SMS, OTP support

### 4. Policy Engine
- **Condition-based rules**: Define when actions are allowed/denied
- **Consensus requirements**: Multi-party approval workflows
- **Effect types**: ALLOW or DENY policies
- **Granular control**: Apply policies to specific activities

### 5. Transaction Capabilities
- **Sign Transaction API**: Sign transactions for various blockchains
- **Smart Contract Support**: ABI/IDL management for contract interactions
- **Activity System**: All actions are tracked as activities
- **Approval Workflows**: Consensus-based transaction approvals

## Key Features for Multi-Tenant Platform

### 1. Tenant Isolation
```javascript
// Create sub-organization for each loan originator
const response = await turnkeyClient.apiClient().createSubOrganization({
  subOrganizationName: "Loan Originator ABC",
  rootUsers: [{
    userName: "ABC Admin",
    userEmail: "admin@abc.com",
    apiKeys: [...],
    authenticators: [...]
  }],
  rootQuorumThreshold: 1,
  wallet: {
    walletName: "ABC Treasury",
    accounts: [{
      curve: "CURVE_SECP256K1",
      pathFormat: "PATH_FORMAT_BIP32",
      path: "m/44'/60'/0'/0/0",
      addressFormat: "ADDRESS_FORMAT_ETHEREUM"
    }]
  }
});
```

### 2. Custom Business Rules via Policies
```javascript
// Create approval policy for large transactions
await turnkeyClient.apiClient().createPolicy({
  policyName: "Large Transaction Approval",
  effect: "EFFECT_ALLOW",
  condition: "transaction.amount < 100000", // Auto-approve small txns
  consensus: "approver.tag == 'MANAGER'", // Large txns need manager
  notes: "Require manager approval for transactions over 100k"
});
```

### 3. User and Access Management
- Create users with specific roles per sub-organization
- Tag-based access control (e.g., "MANAGER", "OPERATOR")
- API key management for programmatic access
- Session management for temporary access

### 4. Wallet Operations
```javascript
// Create wallet for loan originator
await turnkeyClient.apiClient().createWallet({
  walletName: "Originator Operations Wallet",
  accounts: [
    {
      curve: "CURVE_SECP256K1",
      pathFormat: "PATH_FORMAT_BIP32",
      path: "m/44'/60'/0'/0/0",
      addressFormat: "ADDRESS_FORMAT_ETHEREUM"
    }
  ],
  mnemonicLength: 24 // Extra security
});

// Sign transaction
await turnkeyClient.apiClient().signTransaction({
  type: "TRANSACTION_TYPE_ETHEREUM",
  unsignedTransaction: "0x...",
  signWith: walletAccountId
});
```

## Advantages Over Fireblocks for This Use Case

### 1. Sub-Organization Model
- **Turnkey**: Native sub-organization support with full isolation
- **Fireblocks**: Vault-based model requires more manual segregation

### 2. Policy Flexibility
- **Turnkey**: Condition and consensus expressions for complex rules
- **Fireblocks**: TAP (Transaction Authorization Policy) is powerful but more rigid

### 3. Developer Experience
- **Turnkey**: Simple REST API with clear activity model
- **Fireblocks**: More complex API with multiple services

### 4. Cost Structure
- **Turnkey**: More predictable pricing for multi-tenant scenarios
- **Fireblocks**: Enterprise pricing may be overkill for smaller originators

### 5. Integration Simplicity
- **Turnkey**: Lightweight SDK, easy to embed
- **Fireblocks**: Heavier integration with more dependencies

## Implementation Architecture

### Root Platform Level
1. Master organization controls all sub-organizations
2. Platform-wide policies and compliance rules
3. Consolidated reporting and monitoring
4. Master treasury management

### Per Loan Originator (Sub-Organization)
1. Isolated wallet infrastructure
2. Custom approval workflows
3. Originator-specific users and roles
4. Independent transaction policies
5. Separate API keys for automation

### Security Model
1. **Key Security**: Keys never leave Turnkey's secure infrastructure
2. **MPC Options**: While not explicitly mentioned, infrastructure supports it
3. **Activity Tracking**: Complete audit trail of all actions
4. **Policy Enforcement**: Rules evaluated before any action

## Migration Path from Fireblocks

1. **Vault Mapping**: Each Fireblocks vault becomes a Turnkey sub-organization
2. **User Migration**: Map workspace users to sub-org users
3. **Policy Translation**: Convert TAP rules to Turnkey policies
4. **Wallet Creation**: Generate new wallets (key migration not possible)
5. **API Integration**: Update API calls to Turnkey format

## Recommendations

1. **Use Sub-Organizations**: One per loan originator for complete isolation
2. **Implement Tiered Policies**: Platform-level and originator-level rules
3. **Tag-Based Access**: Use user tags for role-based permissions
4. **Automate with API Keys**: Each originator gets programmatic access
5. **Monitor Activities**: Build reporting on the activity stream

## Conclusion

Turnkey provides a more natural fit for a multi-tenant loan originator platform with its sub-organization model, flexible policy engine, and developer-friendly API. While Fireblocks offers more enterprise features, Turnkey's architecture aligns better with the need to provide isolated, customizable wallet infrastructure to multiple loan originators while maintaining central control and oversight.