# Fireblocks API Reference Documentation

This directory contains organized API reference documentation for the Fireblocks platform, extracted and organized from the official Fireblocks TypeScript SDK.

## API Categories

### Core Operations
- **[Vaults API](./vaults-api.md)** - Manage vault accounts, assets, and addresses
- **[Transactions API](./transactions-api.md)** - Create, manage, and track transactions
- **[Assets API](./assets-api.md)** - Manage supported assets and pricing information

### Wallet Management
- **[External Wallets API](./external-wallets-api.md)** - Manage external wallet connections
- **[Exchange Accounts API](./exchange-accounts-api.md)** - Integrate with cryptocurrency exchanges

### Smart Contracts & DeFi
- **[Smart Contracts API](./smart-contracts-api.md)** - Deploy and interact with smart contracts
- **[Staking and DeFi API](./staking-and-defi-api.md)** - Manage staking and DeFi operations
- **[NFTs and Tokenization API](./nfts-and-tokenization-api.md)** - Handle NFTs and custom tokens

### Security & Compliance
- **[Users and Permissions API](./users-and-permissions-api.md)** - Manage users, API keys, and permissions
- **[Compliance and Travel Rule API](./compliance-and-travel-rule-api.md)** - Handle AML/KYT and travel rule compliance

### Infrastructure
- **[Network and Gas Management API](./network-and-gas-management-api.md)** - Manage networks and optimize gas fees
- **[Webhooks API](./webhooks-api.md)** - Configure real-time event notifications

## Complete API List

Based on the Fireblocks TypeScript SDK, the following APIs are available:

### Core APIs
- **ApiUserApi** - API user management
- **AssetsApi** - Asset information and management
- **AuditLogsApi** - Audit trail and logging
- **TransactionsApi** - Transaction operations
- **VaultsApi** - Vault account management

### Wallet & Account Management
- **ExchangeAccountsApi** - Exchange account integration
- **ExternalWalletsApi** - External wallet management
- **FiatAccountsApi** - Fiat account operations
- **InternalWalletsApi** - Internal wallet management

### Smart Contracts & Blockchain
- **BlockchainsAssetsApi** - Blockchain-specific asset management
- **ContractInteractionsApi** - Smart contract interactions
- **ContractTemplatesApi** - Contract template management
- **ContractsApi** - Contract deployment and management
- **DeployedContractsApi** - Deployed contract management

### DeFi & Advanced Features
- **StakingApi** - Staking operations
- **SmartTransferApi** - Advanced transfer operations
- **NFTsApi** - NFT management
- **TokenizationApi** - Token creation and management

### Compliance & Security
- **ComplianceApi** - Compliance screening
- **ComplianceScreeningConfigurationApi** - Compliance configuration
- **TravelRuleApi** - Travel rule compliance
- **PolicyEditorBetaApi** - Policy management (Beta)
- **PolicyEditorV2BetaApi** - Advanced policy management (Beta)

### Infrastructure & Management
- **ConsoleUserApi** - Console user management
- **GasStationsApi** - Gas fee optimization
- **JobManagementApi** - Async job management
- **NetworkConnectionsApi** - Network connectivity
- **TagsApi** - Resource tagging
- **WebhooksApi** - Webhook configuration
- **WebhooksV2Api** - Advanced webhook features

### Beta & Specialized APIs
- **ConnectedAccountsBetaApi** - Connected accounts (Beta)
- **CosignersBetaApi** - Co-signer management (Beta)
- **EmbeddedWalletsApi** - Embedded wallet solutions
- **KeyLinkBetaApi** - Key linking (Beta)
- **KeysBetaApi** - Key management (Beta)
- **OTABetaApi** - One-time addresses (Beta)
- **PaymentsPayoutApi** - Payment and payout operations
- **ResetDeviceApi** - Device reset operations
- **TradingBetaApi** - Trading operations (Beta)
- **UserGroupsBetaApi** - User group management (Beta)
- **UsersApi** - User management
- **Web3ConnectionsApi** - Web3 connectivity
- **WhitelistIpAddressesApi** - IP whitelist management
- **WorkspaceStatusBetaApi** - Workspace status (Beta)

## Authentication

All Fireblocks APIs require authentication using:
- **API Key**: Your workspace-specific API key
- **Private Key**: RSA private key for request signing
- **Base Path**: 
  - Production: `https://api.fireblocks.io/v1`
  - Sandbox: `https://sandbox-api.fireblocks.io/v1`

## Getting Started

1. **Install the Fireblocks TypeScript SDK**:
   ```bash
   npm install @fireblocks/ts-sdk
   ```

2. **Configure Authentication**:
   ```typescript
   import { Fireblocks, BasePath } from '@fireblocks/ts-sdk';
   import { readFileSync } from 'fs';

   process.env.FIREBLOCKS_BASE_PATH = BasePath.Sandbox; // or BasePath.Production
   process.env.FIREBLOCKS_API_KEY = "your-api-key";
   process.env.FIREBLOCKS_SECRET_KEY = readFileSync("./fireblocks_secret.key", "utf8");

   const fireblocks = new Fireblocks();
   ```

3. **Make API Calls**:
   ```typescript
   // Example: Get vault accounts
   const vaultAccounts = await fireblocks.vaults.getPagedVaultAccounts({});
   console.log(vaultAccounts.data);
   ```

## Documentation Sources

This documentation is organized and extracted from:
- **Primary Source**: [Fireblocks TypeScript SDK](https://github.com/fireblocks/ts-sdk)
- **Official Docs**: [Fireblocks Developer Portal](https://developers.fireblocks.com/)
- **SDK Version**: 5.0.0+

## Support

For detailed implementation examples, parameter specifications, and comprehensive documentation, please refer to:
- [Official Fireblocks Developer Documentation](https://developers.fireblocks.com/)
- [TypeScript SDK Repository](https://github.com/fireblocks/ts-sdk)
- [API Reference](https://developers.fireblocks.com/reference/)

---

*This documentation was generated from the Fireblocks TypeScript SDK and organized for easier navigation and understanding.*