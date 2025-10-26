/* eslint-disable no-console */

import 'dotenv/config';

import { SessionType } from '@turnkey/sdk-types';

import {
  ConfigurationValidator,
  TurnkeyClientManager,
  TurnkeyCustodyService,
  TurnkeySuborgProvisioner,
  toTurnkeyServiceError,
} from './src/index';
import type { OriginatorConfiguration } from './src/config/types';

const SAMPLE_ORIGINATOR: OriginatorConfiguration = {
  platform: {
    environment: 'sandbox',
    organizationId: 'org_123456789',
    originator: {
      originatorId: 'originator_demo',
      displayName: 'Demo Lending Co.',
    },
  },
  provisioning: {
    nameTemplate: 'DemoLend-{originatorId}',
    rootQuorumThreshold: 1,
    rootUsers: [
      {
        templateId: 'root-operations',
        userNameTemplate: 'Operations Admin',
        apiKeys: [
          {
            apiKeyNameTemplate: 'ops-admin-api-key',
            curveType: 'API_KEY_CURVE_P256',
          },
        ],
        userTags: ['role:operations_admin'],
      },
    ],
    featureToggles: [
      {
        name: 'FEATURE_NAME_EMAIL_AUTH',
        enabled: true,
        value: 'enabled',
      },
    ],
    defaultAutomationTemplateId: 'automation-primary',
  },
  businessModel: {
    partners: {
      catalog: [
        {
          partnerId: 'LP001',
          displayName: 'Capital Finance',
          enabled: true,
          policyIds: ['policy-standard'],
        },
        {
          partnerId: 'LP002',
          displayName: 'Quick Loans Inc',
          enabled: true,
          flowOverrides: {
            collection: 'wallet-collection-eu',
          },
        },
      ],
      defaultPolicyIds: ['policy-standard'],
    },
    wallets: {
      templates: [
        {
          templateId: 'wallet-distribution',
          usage: 'distribution',
          walletNameTemplate: 'DemoLend-DIST',
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
          walletNameTemplate: 'DemoLend-COLL',
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
        {
          templateId: 'wallet-collection-eu',
          usage: 'collection',
          walletNameTemplate: 'DemoLend-COLL-EU',
          accounts: [
            {
              alias: 'collection_eu_primary',
              curve: 'CURVE_SECP256K1',
              pathFormat: 'PATH_FORMAT_BIP32',
              path: "m/44'/60'/2'/0/0",
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
        roleId: 'finance_manager',
        roleName: 'Finance Manager',
        description: 'Reviews standard disbursements',
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false,
        },
        turnkeyUserTagTemplate: 'role:finance_manager',
        requiresPolicyApproval: false,
      },
      {
        roleId: 'compliance_officer',
        roleName: 'Compliance Officer',
        description: 'Reviews high-risk transactions',
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false,
        },
        turnkeyUserTagTemplate: 'role:compliance_officer',
        requiresPolicyApproval: true,
      },
    ],
    automation: {
      templates: [
        {
          templateId: 'automation-primary',
          userNameTemplate: 'Automation Bot',
          apiKeys: [
            {
              apiKeyNameTemplate: 'automation-primary-key',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['role:automation'],
          sessionTypes: [SessionType.READ_ONLY, SessionType.READ_WRITE],
        },
      ],
      defaultTemplateId: 'automation-primary',
    },
    policies: {
      templates: [
        {
          templateId: 'policy-standard',
          policyName: 'Allow distribution transfers',
          effect: 'EFFECT_ALLOW',
          condition: {
            expression: "transaction.amount <= 250000 && transaction.asset == 'USDC'",
          },
          consensus: {
            expression: "user.tag('role:finance_manager') >= 1",
          },
          appliesTo: [
            {
              type: 'wallet_template',
              target: 'wallet-distribution',
            },
          ],
        },
      ],
      defaultPolicyIds: ['policy-standard'],
    },
  },
  operations: {
    monitoring: {
      webhooks: {
        activity: { urlTemplate: 'https://hooks.demolend.com/activity' },
        alerts: { urlTemplate: 'https://hooks.demolend.com/alerts' },
      },
      activityPolling: {
        intervalMs: 1500,
        numRetries: 40,
      },
    },
    reporting: {
      enableLedgerExport: true,
      ledgerExportFrequency: 'monthly',
      storageBucketRef: 'gs://demolend-reporting',
    },
  },
  compliance: {
    amlProvider: 'chainalysis',
    travelRuleRequired: true,
    sanctionListRefs: ['ofac', 'eu'],
    auditRequirements: {
      retentionYears: 7,
      encryptionRequired: true,
    },
  },
};

async function main(): Promise<void> {
  const validator = new ConfigurationValidator();
  const validation = validator.validate(SAMPLE_ORIGINATOR);
  if (validation.isValid === false) {
    console.error('Configuration invalid:', validation.errors);
    process.exit(1);
  }

  console.log('✅ Configuration validated');
  console.log(`👥 Partners configured: ${SAMPLE_ORIGINATOR.businessModel.partners.catalog.length}`);
  console.log(`🏦 Wallet flows: ${Object.keys(SAMPLE_ORIGINATOR.businessModel.wallets.flows).join(', ')}`);

  try {
    await TurnkeyClientManager.initialize({ platform: SAMPLE_ORIGINATOR.platform });
    console.log('🔐 Turnkey client initialized (credentials detected)');

    const provisioner = new TurnkeySuborgProvisioner();
    const artifacts = await provisioner.provision(SAMPLE_ORIGINATOR);

    console.log('🏗️  Sub-organization provisioned:', artifacts.provisioningSnapshot.subOrganizationId);
    artifacts.provisioningSnapshot.walletFlows.forEach((flow) => {
      console.log(`  • Flow ${flow.flowId} -> wallet ${flow.walletId}`);
    });
    console.log('📜 Policies deployed:', artifacts.provisioningSnapshot.policies.map((p) => p.policyId));
  } catch (error) {
    console.warn(
      '⚠️  Provisioning skipped. Provide TURNKEY_* credentials to run this example end-to-end. Reason:',
      toTurnkeyServiceError(error).message
    );
  }

  const service = new TurnkeyCustodyService(SAMPLE_ORIGINATOR);
  console.log('🧰 TurnkeyCustodyService ready:', Boolean(service));
}

main().catch((error) => {
  console.error('❌ Unexpected failure:', error);
});
