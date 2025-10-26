import { SessionType } from '@turnkey/sdk-types';

import { ConfigurationValidator } from '../validator-strict';
import type { OriginatorConfiguration, PartnerConfiguration } from '../types';

const validator = new ConfigurationValidator();
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const baseConfig: OriginatorConfiguration = {
  platform: {
    environment: 'sandbox',
    organizationId: 'org_123',
    originator: {
      originatorId: 'originator_abc',
      displayName: 'Test Originator',
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
    featureToggles: [
      {
        name: 'FEATURE_NAME_EMAIL_AUTH',
        enabled: true,
        value: 'enabled',
      },
    ],
    defaultAutomationTemplateId: 'auto-primary',
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
      defaultPolicyIds: ['policy-distribution-default'],
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
          templateId: 'auto-primary',
          userNameTemplate: 'ORIG-{originatorId}-automation',
          apiKeys: [
            {
              apiKeyNameTemplate: 'automation-primary-key',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['role:automation'],
        },
      ],
      defaultTemplateId: 'auto-primary',
      sessionConfig: {
        readOnly: {
          type: SessionType.READ_ONLY,
          defaultExpirationSeconds: 900,
        },
        readWrite: {
          type: SessionType.READ_WRITE,
          defaultExpirationSeconds: 900,
        },
      },
    },
    policies: {
      templates: [
        {
          templateId: 'policy-distribution-default',
          policyName: 'Allow standard distribution',
          effect: 'EFFECT_ALLOW',
          condition: {
            expression: "transaction.amount <= 100000 && transaction.asset == 'USDC'",
          },
          consensus: {
            expression: "user.tag('role:senior_reviewer') >= 1",
          },
          appliesTo: [
            {
              type: 'wallet_template',
              target: 'wallet-distribution',
            },
          ],
        },
      ],
      defaultPolicyIds: ['policy-distribution-default'],
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

describe('ConfigurationValidator', () => {
  it('accepts a valid configuration', async () => {
    const result = await validator.validate(baseConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects policies referencing unknown wallet templates', async () => {
    const config = clone(baseConfig);
    config.accessControl.policies.templates = [
      {
        templateId: 'policy-invalid',
        policyName: 'Invalid policy',
        effect: 'EFFECT_ALLOW',
        condition: { expression: 'true' },
        consensus: { expression: 'true' },
        appliesTo: [
          {
            type: 'wallet_template',
            target: 'missing-template',
          },
        ],
      },
    ];
    config.accessControl.policies.defaultPolicyIds = ['policy-invalid'];

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('wallet template "missing-template" is not defined'),
      ])
    );
  });

  it('rejects partner overrides with unknown automation user templates', async () => {
    const config = clone(baseConfig);
    config.businessModel.partners.catalog = [
      clone(baseConfig.businessModel.partners.catalog[0]),
    ];
    config.businessModel.partners.catalog[0].automationUserTemplateId = 'missing-automation';

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('automation user template "missing-automation" is not defined'),
      ])
    );
  });

  it('rejects policies without a valid effect', async () => {
    const config = clone(baseConfig);
    config.accessControl.policies.templates = [
      {
        templateId: 'policy-missing-effect',
        policyName: 'Missing effect',
        effect: '' as any,
        condition: { expression: 'true' },
        consensus: { expression: 'true' },
      },
    ];
    config.accessControl.policies.defaultPolicyIds = ['policy-missing-effect'];

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('effect is required')]));
  });

  it('rejects duplicate wallet aliases across templates', async () => {
    const config = clone(baseConfig);
    config.businessModel.wallets.templates = [
      ...clone(baseConfig.businessModel.wallets.templates),
      {
        templateId: 'wallet-extra',
        usage: 'custom',
        walletNameTemplate: 'ORIG-{originatorId}-EXTRA',
        accounts: [
          {
            alias: 'distribution_primary',
            curve: 'CURVE_SECP256K1',
            pathFormat: 'PATH_FORMAT_BIP32',
            path: "m/44'/60'/2'/0/0",
            addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
          },
        ],
      },
    ];

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('alias "distribution_primary" is already used by another wallet template'),
      ])
    );
  });

  it('rejects partners with non-boolean enabled values', async () => {
    const config = clone(baseConfig);
    config.businessModel.partners.catalog = [
      clone(baseConfig.businessModel.partners.catalog[0]),
      {
        partnerId: 'LP002',
        displayName: 'Partner Two',
        enabled: 'true' as unknown as boolean,
      } as PartnerConfiguration,
    ];

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('enabled must be a boolean'),
      ])
    );
  });

  it('rejects roles with non-boolean permission flags', async () => {
    const config = clone(baseConfig);
    const role = clone(baseConfig.accessControl.roles[0]);
    role.permissions.initiateDisbursements = 'no' as unknown as boolean;
    config.accessControl.roles = [role];

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('permissions.initiateDisbursements must be a boolean'),
      ])
    );
  });
});
