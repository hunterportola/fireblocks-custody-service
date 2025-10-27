#!/usr/bin/env tsx

/**
 * Script to provision test originators for MVP testing
 * 
 * This creates test originators with mock Turnkey provisioning
 * and outputs API keys and configuration for testing.
 */

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SessionType } from '@turnkey/sdk-types';
import type { OriginatorConfiguration } from '../src/config/types';

// Test originator configurations
const TEST_ORIGINATORS: OriginatorConfiguration[] = [
  {
    platform: {
      environment: 'sandbox',
      organizationId: process.env.TURNKEY_ORGANIZATION_ID ?? 'org_test_123',
      originator: {
        originatorId: 'originator_acme_lending',
        displayName: 'ACME Lending Corp.',
      },
    },
    provisioning: {
      nameTemplate: 'ACME-{originatorId}',
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          templateId: 'root-admin',
          userNameTemplate: 'ACME Admin',
          apiKeys: [
            {
              apiKeyNameTemplate: 'acme-admin-key',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['role:admin'],
        },
      ],
      featureToggles: [
        {
          name: 'FEATURE_NAME_EMAIL_AUTH',
          enabled: true,
        },
      ],
      defaultAutomationTemplateId: 'automation-acme',
    },
    businessModel: {
      partners: {
        catalog: [
          {
            partnerId: 'partner_quickcash',
            displayName: 'QuickCash Finance',
            enabled: true,
            policyIds: ['policy-standard-acme'],
          },
          {
            partnerId: 'partner_flexfunds',
            displayName: 'FlexFunds Capital',
            enabled: true,
            policyIds: ['policy-standard-acme'],
          },
        ],
        defaultPolicyIds: ['policy-standard-acme'],
      },
      wallets: {
        templates: [
          {
            templateId: 'wallet-dist-acme',
            usage: 'distribution',
            walletNameTemplate: 'ACME-Distribution',
            accounts: [
              {
                alias: 'primary',
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              },
            ],
          },
          {
            templateId: 'wallet-coll-acme',
            usage: 'collection',
            walletNameTemplate: 'ACME-Collection',
            accounts: [
              {
                alias: 'primary',
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/1'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              },
            ],
          },
        ],
        flows: {
          distribution: { templateId: 'wallet-dist-acme' },
          collection: { templateId: 'wallet-coll-acme' },
        },
      },
    },
    accessControl: {
      roles: [
        {
          roleId: 'loan_officer',
          roleName: 'Loan Officer',
          description: 'Initiates disbursements',
          permissions: {
            viewDistributions: true,
            initiateDisbursements: true,
            approveDisbursements: false,
          },
          turnkeyUserTagTemplate: 'role:loan_officer',
        },
      ],
      automation: {
        templates: [
          {
            templateId: 'automation-acme',
            userNameTemplate: 'ACME Bot',
            apiKeys: [
              {
                apiKeyNameTemplate: 'acme-bot-key',
                curveType: 'API_KEY_CURVE_P256',
              },
            ],
            userTags: ['role:automation'],
            sessionTypes: [SessionType.READ_WRITE],
          },
        ],
      },
      policies: {
        templates: [
          {
            templateId: 'policy-standard-acme',
            policyName: 'ACME Standard Disbursement Policy',
            effect: 'EFFECT_ALLOW',
            condition: {
              expression: "transaction.amount <= 500000 && transaction.asset == 'USDC'",
            },
            consensus: {
              expression: "user.tag('role:loan_officer') >= 1",
            },
          },
        ],
      },
    },
  },
  {
    platform: {
      environment: 'sandbox',
      organizationId: process.env.TURNKEY_ORGANIZATION_ID ?? 'org_test_456',
      originator: {
        originatorId: 'originator_stellar_loans',
        displayName: 'Stellar Loans Inc.',
      },
    },
    provisioning: {
      nameTemplate: 'Stellar-{originatorId}',
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          templateId: 'root-admin',
          userNameTemplate: 'Stellar Admin',
          apiKeys: [
            {
              apiKeyNameTemplate: 'stellar-admin-key',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['role:admin'],
        },
      ],
      defaultAutomationTemplateId: 'automation-stellar',
    },
    businessModel: {
      partners: {
        catalog: [
          {
            partnerId: 'partner_bridgefund',
            displayName: 'BridgeFund Partners',
            enabled: true,
            policyIds: ['policy-standard-stellar'],
          },
        ],
        defaultPolicyIds: ['policy-standard-stellar'],
      },
      wallets: {
        templates: [
          {
            templateId: 'wallet-dist-stellar',
            usage: 'distribution',
            walletNameTemplate: 'Stellar-Distribution',
            accounts: [
              {
                alias: 'primary',
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/0'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              },
            ],
          },
        ],
        flows: {
          distribution: { templateId: 'wallet-dist-stellar' },
        },
      },
    },
    accessControl: {
      automation: {
        templates: [
          {
            templateId: 'automation-stellar',
            userNameTemplate: 'Stellar Bot',
            apiKeys: [
              {
                apiKeyNameTemplate: 'stellar-bot-key',
                curveType: 'API_KEY_CURVE_P256',
              },
            ],
            userTags: ['role:automation'],
            sessionTypes: [SessionType.READ_WRITE],
          },
        ],
      },
      policies: {
        templates: [
          {
            templateId: 'policy-standard-stellar',
            policyName: 'Stellar Standard Policy',
            effect: 'EFFECT_ALLOW',
            condition: {
              expression: "transaction.amount <= 250000",
            },
            consensus: {
              expression: "1",
            },
          },
        ],
      },
    },
  },
];

// Mock provisioning results
function generateMockProvisioningResult(config: OriginatorConfiguration): {
  subOrganizationId: string;
  apiKeys: Array<{
    lenderId: string;
    apiKey: string;
    permissions: string[];
  }>;
  wallets: {
    distribution: {
      walletId: string;
      accountId: string;
      address: string;
    };
    collection?: {
      walletId: string;
      accountId: string;
      address: string;
    };
  };
  provisionedAt: string;
} {
  const timestamp = new Date().toISOString();
  const subOrgId = `sub_org_${config.platform.originator.originatorId}_${Date.now()}`;
  
  return {
    subOrganizationId: subOrgId,
    apiKeys: [
      {
        lenderId: `lender_${config.platform.originator.originatorId}_primary`,
        apiKey: `${config.platform.originator.originatorId}_api_key_${Math.random().toString(36).substring(2, 15)}`,
        permissions: [
          'disbursements:create',
          'disbursements:read',
          'wallets:read',
          'lenders:read',
          'lenders:update'
        ],
      },
      {
        lenderId: `lender_${config.platform.originator.originatorId}_secondary`,
        apiKey: `${config.platform.originator.originatorId}_api_key_${Math.random().toString(36).substring(2, 15)}`,
        permissions: [
          'disbursements:read',
          'wallets:read',
          'lenders:read'
        ],
      },
    ],
    wallets: {
      distribution: {
        walletId: `wallet_dist_${Math.random().toString(36).substring(2, 15)}`,
        accountId: `account_${Math.random().toString(36).substring(2, 15)}`,
        address: `0x${Math.random().toString(16).substring(2).padEnd(40, '0').substring(0, 40)}`,
      },
      collection: config.businessModel.wallets.flows.collection !== undefined ? {
        walletId: `wallet_coll_${Math.random().toString(36).substring(2, 15)}`,
        accountId: `account_${Math.random().toString(36).substring(2, 15)}`,
        address: `0x${Math.random().toString(16).substring(2).padEnd(40, '0').substring(0, 40)}`,
      } : undefined,
    },
    provisionedAt: timestamp,
  };
}

async function main(): Promise<void> {
  console.warn('🚀 Provisioning test originators for MVP testing...\n');

  interface ProvisioningResultRecord {
    originatorId: string;
    displayName: string;
    provisioning: ReturnType<typeof generateMockProvisioningResult>;
  }
  const results: ProvisioningResultRecord[] = [];

  for (const config of TEST_ORIGINATORS) {
    console.warn(`📋 Processing ${config.platform.originator.displayName}...`);
    
    // Generate mock provisioning results
    const provisioningResult = generateMockProvisioningResult(config);
    
    results.push({
      originatorId: config.platform.originator.originatorId,
      displayName: config.platform.originator.displayName,
      provisioning: provisioningResult,
    });

    console.warn(`✅ Generated provisioning data for ${config.platform.originator.originatorId}`);
    console.warn(`   Sub-org ID: ${provisioningResult.subOrganizationId}`);
    console.warn(`   API Keys: ${provisioningResult.apiKeys.length}`);
    const walletKeys = Object.keys(provisioningResult.wallets).filter(
      (k): k is keyof typeof provisioningResult.wallets => 
        k in provisioningResult.wallets && 
        provisioningResult.wallets[k as keyof typeof provisioningResult.wallets] !== undefined
    );
    console.warn(`   Wallets: ${walletKeys.length}`);
    console.warn('');
  }

  // Generate lender auth configuration
  interface LenderAuthConfigItem {
    apiKey: string;
    lenderInfo: {
      lenderId: string;
      apiKeyId: string;
      permissions: string[];
      turnkeySubOrgId: string;
    };
  }
  const lenderAuthConfig = results.flatMap(result => 
    result.provisioning.apiKeys.map((apiKeyInfo): LenderAuthConfigItem => ({
      apiKey: apiKeyInfo.apiKey,
      lenderInfo: {
        lenderId: apiKeyInfo.lenderId,
        apiKeyId: apiKeyInfo.apiKey,
        permissions: apiKeyInfo.permissions,
        turnkeySubOrgId: result.provisioning.subOrganizationId,
      },
    }))
  );

  // Save results to files
  const outputDir = path.join(process.cwd(), 'test-data');
  await fs.mkdir(outputDir, { recursive: true });

  // Save provisioning results
  await fs.writeFile(
    path.join(outputDir, 'provisioning-results.json'),
    JSON.stringify(results, null, 2)
  );

  // Save lender auth configuration
  await fs.writeFile(
    path.join(outputDir, 'lender-auth-config.json'),
    JSON.stringify(lenderAuthConfig, null, 2)
  );

  // Generate TypeScript code for updating lender-auth.ts
  const lenderAuthCode = `
// Add these to MOCK_LENDERS in src/api/middleware/lender-auth.ts
const ADDITIONAL_TEST_LENDERS: Record<string, LenderInfo> = {
${lenderAuthConfig.map((config) => `  '${config.apiKey}': {
    lenderId: '${config.lenderInfo.lenderId}',
    apiKeyId: '${config.lenderInfo.apiKeyId}',
    permissions: ${JSON.stringify(config.lenderInfo.permissions)},
    turnkeySubOrgId: '${config.lenderInfo.turnkeySubOrgId}',
  }`).join(',\n')}
};
`;

  await fs.writeFile(
    path.join(outputDir, 'lender-auth-update.ts'),
    lenderAuthCode
  );

  console.warn('\n✨ Test originator provisioning complete!');
  console.warn('\n📁 Output files created:');
  console.warn(`   - ${path.join(outputDir, 'provisioning-results.json')}`);
  console.warn(`   - ${path.join(outputDir, 'lender-auth-config.json')}`);
  console.warn(`   - ${path.join(outputDir, 'lender-auth-update.ts')}`);

  console.warn('\n🔐 Generated API Keys:');
  lenderAuthConfig.forEach((config) => {
    console.warn(`   ${config.lenderInfo.lenderId}: ${config.apiKey}`);
  });

  console.warn('\n📝 Next steps:');
  console.warn('1. Copy the content from test-data/lender-auth-update.ts to src/api/middleware/lender-auth.ts');
  console.warn('2. Start the API server: npm run start:dev');
  console.warn('3. Test with the generated API keys');
}

main().catch((error: unknown) => {
  console.error('❌ Error:', error);
  process.exit(1);
});