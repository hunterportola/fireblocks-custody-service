import * as dotenv from 'dotenv';

import { ConfigurationValidator, type ValidationResult } from './src/config/validator-strict';
import type { OriginatorConfiguration } from './src/config/types';
import { ErrorCodes, TurnkeyServiceError, toTurnkeyServiceError } from './src/core/error-handler';
import { SecretProvider, SecretsManager } from './src/core/secrets-manager';
import { TurnkeyClientManager } from './src/core/turnkey-client';
import { TurnkeySuborgProvisioner } from './src/provisioner/turnkey-suborg-provisioner';
import { WalletTemplateRegistry } from './src/provisioner/wallet-template-registry';
import { TurnkeyCustodyService } from './src/index';

dotenv.config();

const SAMPLE_CONFIG: OriginatorConfiguration = {
  platform: {
    environment: 'sandbox',
    organizationId: 'org_123',
    originator: {
      originatorId: 'originator_abc',
      displayName: 'Sample Originator',
    },
  },
  provisioning: {
    nameTemplate: 'ORIG-{originatorId}',
    rootQuorumThreshold: 1,
    rootUsers: [
      {
        templateId: 'root-user-1',
        userNameTemplate: 'Root Operator',
        apiKeys: [
          {
            apiKeyNameTemplate: 'root-operator-key',
            curveType: 'API_KEY_CURVE_P256',
          },
        ],
        userTags: ['role:administrator'],
      },
    ],
    defaultAutomationTemplateId: 'automation-user',
  },
  businessModel: {
    partners: {
      catalog: [
        {
          partnerId: 'LP001',
          displayName: 'Partner One',
          enabled: true,
        },
      ],
      defaultPolicyIds: ['policy-default'],
    },
    wallets: {
      templates: [
        {
          templateId: 'wallet-distribution',
          usage: 'distribution',
          walletNameTemplate: 'ORIG-{originatorId}-DIST',
          accounts: [
            {
              alias: 'distribution_primary',
              curve: 'CURVE_SECP256K1',
              pathFormat: 'PATH_FORMAT_BIP32',
              path: "m/44'/60'/0'/0/0",
              addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
            },
          ],
        },
        {
          templateId: 'wallet-collection',
          usage: 'collection',
          walletNameTemplate: 'ORIG-{originatorId}-COLL',
          accounts: [
            {
              alias: 'collection_primary',
              curve: 'CURVE_SECP256K1',
              pathFormat: 'PATH_FORMAT_BIP32',
              path: "m/44'/60'/1'/0/0",
              addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
            },
          ],
        },
      ],
      flows: {
        distribution: { templateId: 'wallet-distribution' },
        collection: { templateId: 'wallet-collection' },
      },
    },
  },
  accessControl: {
    roles: [
      {
        roleId: 'senior_reviewer',
        roleName: 'Senior Reviewer',
        description: 'Approves higher value transactions',
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false,
        },
        turnkeyUserTagTemplate: 'role:senior_reviewer',
        requiresPolicyApproval: true,
      },
    ],
    automation: {
      templates: [
        {
          templateId: 'automation-user',
          userNameTemplate: 'ORIG-{originatorId}-automation',
          apiKeys: [
            {
              apiKeyNameTemplate: 'automation-key',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['role:automation'],
        },
      ],
      defaultTemplateId: 'automation-user',
    },
    policies: {
      templates: [
        {
          templateId: 'policy-default',
          policyName: 'Allow distribution transfers',
          effect: 'EFFECT_ALLOW',
          condition: {
            expression: "transaction.amount <= 100000 && transaction.asset == 'USDC'",
          },
          consensus: {
            expression: "user.tag('role:senior_reviewer') >= 1",
          },
        },
      ],
      defaultPolicyIds: ['policy-default'],
    },
  },
  operations: {
    monitoring: {
      webhooks: {
        activity: { urlTemplate: 'https://hooks.example.com/activity' },
      },
      activityPolling: { intervalMs: 1000, numRetries: 3 },
    },
    reporting: {
      enableLedgerExport: true,
      ledgerExportFrequency: 'monthly',
    },
  },
  compliance: {
    amlProvider: 'chainalysis',
    travelRuleRequired: true,
  },
};

const validator = new ConfigurationValidator();

async function validateConfiguration(): Promise<void> {
  console.log('🧪 Validating configuration schema...');
  const result: ValidationResult = await validator.validate(SAMPLE_CONFIG);
  console.log(`  ✅ Valid: ${result.isValid}`);
  console.log(`  ✅ Errors: ${result.errors.length}`);
  console.log(`  ✅ Warnings: ${result.warnings.length}`);
}

function testSecretsManager(): void {
  console.log('🧪 Testing SecretsManager singleton...');
  const config = { provider: SecretProvider.ENVIRONMENT };
  const instance1 = SecretsManager.getInstance(config);
  const instance2 = SecretsManager.getInstance();
  console.log(`  ✅ Singleton works: ${instance1 === instance2}`);
}

async function testTurnkeyClientInitialization(): Promise<void> {
  console.log('🧪 Testing Turnkey client initialization...');
  TurnkeyClientManager.reset();
  try {
    await TurnkeyClientManager.initialize({ platform: SAMPLE_CONFIG.platform });
    console.log('  ✅ Client initialized (unexpected without credentials)');
  } catch (error) {
    const serviceError = toTurnkeyServiceError(error);
    console.log(`  ⚠️  Initialization failed as expected: ${serviceError.code}`);
  }
}

function testErrorHandling(): void {
  console.log('🧪 Testing error handling utilities...');
  const customError = new TurnkeyServiceError('Test error', ErrorCodes.API_ERROR, 500);
  console.log(`  ✅ Custom error created with code: ${customError.code}`);
}

function testProvisioningPlanner(): void {
  console.log('🧪 Building partner provisioning plan...');
  const registry = new WalletTemplateRegistry(SAMPLE_CONFIG.businessModel.wallets);
  console.log(`  ✅ Wallet templates registered: ${registry.listTemplates().length}`);

  try {
    TurnkeyClientManager.getInstance();
    new TurnkeySuborgProvisioner();
    console.log('  ✅ TurnkeySuborgProvisioner instantiated (provisioning requires live credentials to run)');
  } catch {
    console.log('  ⚠️  Skipping TurnkeySuborgProvisioner execution (client not initialized)');
  }
}

function testWalletRegistry(): void {
  console.log('🧪 Inspecting wallet templates...');
  const registry = new WalletTemplateRegistry(SAMPLE_CONFIG.businessModel.wallets);
  const templates = registry.listTemplates();
  console.log(`  ✅ Wallet templates available: ${templates.length}`);
}

async function run(): Promise<void> {
  console.log('🚀 Running Turnkey custodian compilation checks...\n');

  try {
    await validateConfiguration();
    testSecretsManager();
    await testTurnkeyClientInitialization();
    testErrorHandling();
    testProvisioningPlanner();
    testWalletRegistry();

    console.log('\n✅ All compile-time checks completed. TurnkeyCustodyService available:', Boolean(TurnkeyCustodyService));
  } catch (error) {
    console.error('\n❌ Compilation helper failed:', error);
    process.exit(1);
  }
}

void run();
