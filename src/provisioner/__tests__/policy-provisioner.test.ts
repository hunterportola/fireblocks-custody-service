import { jest } from '@jest/globals';

import type { AccessControlConfig, BusinessModelConfig } from '../../config/types';
import { PolicyProvisioner, type PolicyProvisionRequest } from '../policy-provisioner';
import { TurnkeyClientManager } from '../../core/turnkey-client';

jest.mock('../../core/turnkey-client');

type ConfigurePoliciesSignature = TurnkeyClientManager['configurePolicies'];

const configurePoliciesMock = jest.fn<ConfigurePoliciesSignature>();

const mockClient: Pick<TurnkeyClientManager, 'configurePolicies'> = {
  configurePolicies: configurePoliciesMock,
};

type ConfigureOptions = Parameters<ConfigurePoliciesSignature>[2];

function buildAccessControl(): AccessControlConfig {
  return {
    roles: [],
    automation: {
      templates: [
        {
          templateId: 'auto-default',
          userNameTemplate: 'AUTO-{originatorId}',
          apiKeys: [
            {
              apiKeyNameTemplate: 'auto-key-{automationUserIndex}',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
          userTags: ['tag:auto-default'],
        },
        {
          templateId: 'auto-partner',
          userNameTemplate: 'AUTO-PARTNER-{partnerId}',
          apiKeys: [
            {
              apiKeyNameTemplate: 'auto-partner-key-{automationUserIndex}',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
        },
      ],
    },
    policies: {
      templates: [
        {
          templateId: 'policy-1',
          policyName: 'Distribution Guardrail',
          effect: 'EFFECT_ALLOW',
          condition: { expression: "amount <= 100000 && asset == 'USDC'" },
          consensus: { expression: "approvers >= 2" },
          appliesTo: [
            { type: 'wallet_template', target: 'wallet-distribution' },
            { type: 'partner', target: 'LP001' },
            { type: 'automation_user', target: 'auto-default' },
          ],
        },
        {
          templateId: 'policy-2',
          policyName: 'Collection Oversight',
          effect: 'EFFECT_DENY',
          condition: { expression: "amount > 500000" },
          consensus: { expression: "approvers >= 3" },
          appliesTo: [
            { type: 'wallet_alias', target: 'collection_primary' },
            { type: 'user_tag', target: 'tag:reviewer' },
          ],
        },
      ],
      defaultPolicyIds: ['policy-1'],
    },
  };
}

function buildBusinessModel(): BusinessModelConfig {
  return {
    partners: {
      catalog: [
        { partnerId: 'LP001', displayName: 'Partner Default', enabled: true },
        { partnerId: 'LP002', displayName: 'Partner Two', enabled: true },
      ],
      defaultPolicyIds: ['policy-1'],
    },
    wallets: {
      templates: [
        {
          templateId: 'wallet-distribution',
          usage: 'distribution',
          walletNameTemplate: 'DIST-{originatorId}',
          accounts: [
            {
              alias: 'dist_primary',
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
          walletNameTemplate: 'COLL-{originatorId}',
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
  };
}

describe('PolicyProvisioner', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(mockClient as unknown as TurnkeyClientManager);
  });

  it('creates policies with resolved bindings in sub-organization context', async () => {
    const provisioner = new PolicyProvisioner();
    const accessControl = buildAccessControl();
    const businessModel = buildBusinessModel();

    configurePoliciesMock.mockResolvedValue({
      policyIds: {
        'policy-1': 'pol-allow',
        'policy-2': 'pol-deny',
      },
      partnerPolicies: {
        LP001: ['pol-allow'],
        LP002: ['pol-allow'],
      },
    });

    const request: PolicyProvisionRequest = {
      accessControl,
      businessModel,
      subOrganizationId: 'sub-org-001',
      templateContext: { originatorId: 'orig-001', subOrganizationName: 'SUB-orig-001' },
      bindingContext: {
        walletTemplateMap: {
          'wallet-distribution': 'wallet-default-dist',
          'wallet-collection': 'wallet-default-coll',
        },
        walletAliasMap: {
          collection_primary: { walletId: 'wallet-default-coll', accountId: 'account-coll', address: '0xCOLL' },
        },
        walletFlowMap: {
          distribution: 'wallet-default-dist',
          collection: 'wallet-default-coll',
        },
        partnerIds: ['LP001', 'LP002'],
        userTagTemplates: ['tag:reviewer'],
        automationTemplateIds: ['auto-default', 'auto-partner'],
        automationUserIds: {
          'auto-default': 'usr-auto-default',
        },
      },
    };

    const result = await provisioner.deploy(request);

    expect(configurePoliciesMock).toHaveBeenCalledTimes(1);
    const configureArgs = configurePoliciesMock.mock.calls[0];
    const options = (configureArgs[2] ?? {}) as NonNullable<ConfigureOptions>;

    expect(options.subOrganizationId).toBe('sub-org-001');
    expect(options.bindingContexts?.['policy-1']).toEqual({
      'wallet-distribution': 'wallet-default-dist',
      LP001: 'LP001',
      'auto-default': 'usr-auto-default',
    });
    expect(options.bindingContexts?.['policy-2']).toEqual({
      'collection_primary': 'account-coll',
      'tag:reviewer': 'tag:reviewer',
    });

    // binding assignments are used for snapshotting only and should not be forwarded to Turnkey payloads
    expect(options).not.toHaveProperty('bindingAssignments');

    expect(result).toEqual({
      policies: [
        {
          templateId: 'policy-1',
          policyId: 'pol-allow',
          appliedTo: [
            { type: 'wallet_template', target: 'wallet-default-dist', policyId: 'pol-allow' },
            { type: 'partner', target: 'LP001', policyId: 'pol-allow' },
            { type: 'automation_user', target: 'usr-auto-default', policyId: 'pol-allow' },
          ],
        },
        {
          templateId: 'policy-2',
          policyId: 'pol-deny',
          appliedTo: [
            { type: 'wallet_alias', target: 'account-coll', policyId: 'pol-deny' },
            { type: 'user_tag', target: 'tag:reviewer', policyId: 'pol-deny' },
          ],
        },
      ],
      partnerPolicies: {
        LP001: ['pol-allow'],
        LP002: ['pol-allow'],
      },
      warnings: [],
    });
  });

  it('returns empty bindings when a policy has no appliesTo entries', async () => {
    const provisioner = new PolicyProvisioner();
    const accessControl: AccessControlConfig = {
      roles: [],
      automation: {
        templates: [],
      },
      policies: {
        templates: [
          {
            templateId: 'policy-global',
            policyName: 'Global Guardrail',
            effect: 'EFFECT_DENY',
            condition: { expression: 'true' },
            consensus: { expression: 'false' },
          },
        ],
        defaultPolicyIds: ['policy-global'],
      },
    };

    const businessModel = buildBusinessModel();

    configurePoliciesMock.mockResolvedValue({
      policyIds: { 'policy-global': 'pol-global' },
      partnerPolicies: {},
    });

    const request: PolicyProvisionRequest = {
      accessControl,
      businessModel,
      subOrganizationId: 'sub-org-001',
      templateContext: {},
      bindingContext: {
        walletTemplateMap: {},
        walletAliasMap: {},
        partnerIds: [],
      },
    };

    const result = await provisioner.deploy(request);

    expect(configurePoliciesMock).toHaveBeenCalledTimes(1);
    const options = (configurePoliciesMock.mock.calls[0][2] ?? {}) as NonNullable<ConfigureOptions>;
    expect(options.bindingContexts?.['policy-global']).toEqual({});
    expect(options).not.toHaveProperty('bindingAssignments');

    expect(result.policies).toEqual([
      {
        templateId: 'policy-global',
        policyId: 'pol-global',
        appliedTo: [],
      },
    ]);
  });
});
