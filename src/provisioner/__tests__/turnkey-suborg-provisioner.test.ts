import { jest } from '@jest/globals';

import type { OriginatorConfiguration } from '../../config/types';
import { TurnkeySuborgProvisioner } from '../turnkey-suborg-provisioner';
import type { ProvisioningArtifacts } from '../runtime-snapshots';
import { PolicyProvisioner } from '../policy-provisioner';
import { TurnkeyClientManager } from '../../core/turnkey-client';

jest.mock('../../core/turnkey-client');
jest.mock('../policy-provisioner');

const mockClient = {
  provisionSubOrganization: jest.fn(),
  bootstrapAutomation: jest.fn(),
  provisionWalletForTemplate: jest.fn(),
} as jest.Mocked<
  Pick<TurnkeyClientManager, 'provisionSubOrganization' | 'bootstrapAutomation' | 'provisionWalletForTemplate'>
>;

const mockPolicyProvisioner = {
  deploy: jest.fn(),
} as jest.Mocked<Pick<PolicyProvisioner, 'deploy'>>;

function buildConfig(): OriginatorConfiguration {
  return {
    platform: {
      environment: 'sandbox',
      organizationId: 'org-123',
      originator: {
        originatorId: 'orig-001',
        displayName: 'Originator One',
      },
    },
    provisioning: {
      nameTemplate: 'SUB-{originatorId}',
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          templateId: 'root-1',
          userNameTemplate: 'Root {rootUserIndex}',
          apiKeys: [
            {
              apiKeyNameTemplate: 'root-key-{rootUserIndex}',
              curveType: 'API_KEY_CURVE_P256',
            },
          ],
        },
      ],
      featureToggles: [],
      defaultAutomationTemplateId: 'auto-default',
    },
    businessModel: {
      partners: {
        catalog: [
          {
            partnerId: 'LP001',
            displayName: 'Partner Default',
            enabled: true,
          },
          {
            partnerId: 'LP002',
            displayName: 'Partner Override',
            enabled: true,
            flowOverrides: {
              distribution: 'wallet-partner-distribution',
            },
          },
        ],
        defaultPolicyIds: [],
      },
      wallets: {
        templates: [
          {
            templateId: 'wallet-distribution-default',
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
            templateId: 'wallet-collection-default',
            usage: 'collection',
            walletNameTemplate: 'COLL-{originatorId}',
            accounts: [
              {
                alias: 'coll_primary',
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/1'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              },
            ],
          },
          {
            templateId: 'wallet-partner-distribution',
            usage: 'distribution',
            walletNameTemplate: 'P-DIST-{partnerId}',
            accounts: [
              {
                alias: 'partner_dist',
                curve: 'CURVE_SECP256K1',
                pathFormat: 'PATH_FORMAT_BIP32',
                path: "m/44'/60'/2'/0/0",
                addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
              },
            ],
          },
        ],
        flows: {
          distribution: { templateId: 'wallet-distribution-default' },
          collection: { templateId: 'wallet-collection-default' },
        },
      },
    },
    accessControl: {
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
        templates: [],
        defaultPolicyIds: [],
      },
    },
    operations: undefined,
    compliance: undefined,
  };
}

describe('TurnkeySuborgProvisioner', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(mockClient as unknown as TurnkeyClientManager);
    (PolicyProvisioner as unknown as jest.Mock).mockImplementation(() => mockPolicyProvisioner);
  });

  it('keeps walletTemplateMap anchored to default wallets while provisioning overrides', async () => {
    const config = buildConfig();

    mockClient.provisionSubOrganization.mockResolvedValue({
      subOrgId: 'sub-org-001',
      subOrgName: 'SUB-orig-001',
      rootUserIds: ['root-user-1'],
      wallets: {
        distribution: {
          walletId: 'wallet-default-dist',
          accountIds: ['account-default-dist'],
          accountAddresses: ['0xdefaultdist'],
        },
        collection: {
          walletId: 'wallet-default-coll',
          accountIds: ['account-default-coll'],
          accountAddresses: ['0xdefaultcoll'],
        },
      },
    });

    mockClient.bootstrapAutomation.mockResolvedValue({
      automationUsers: [
        {
          templateId: 'auto-default',
          userId: 'usr-auto-default',
          apiKeyIds: ['key-auto-default'],
        },
        {
          templateId: 'auto-partner',
          userId: 'usr-auto-partner',
          apiKeyIds: ['key-auto-partner'],
        },
      ],
    });

    mockClient.provisionWalletForTemplate.mockResolvedValue({
      walletId: 'wallet-override-dist',
      accountIds: ['account-override-dist'],
      accountAddresses: ['0xoverride'],
    });

    mockPolicyProvisioner.deploy.mockResolvedValue({
      policies: [],
      partnerPolicies: {
        LP001: [],
        LP002: [],
      },
      warnings: [],
    });

    const provisioner = new TurnkeySuborgProvisioner();
    const result = (await provisioner.provision(config)) as ProvisioningArtifacts;

    // ensure override wallet was created
    expect(mockClient.provisionWalletForTemplate).toHaveBeenCalledTimes(1);

    // policy provisioner should still see default wallet mapping for templates
    const deployPayload = mockPolicyProvisioner.deploy.mock.calls[0][0] as Parameters<
      PolicyProvisioner['deploy']
    >[0];
    expect(deployPayload.bindingContext.walletTemplateMap).toMatchObject({
      'wallet-distribution-default': 'wallet-default-dist',
      'wallet-collection-default': 'wallet-default-coll',
    });
    expect(deployPayload.bindingContext.walletAliasMap).toMatchObject({
      dist_primary: {
        walletId: 'wallet-default-dist',
        accountId: 'account-default-dist',
        address: '0xdefaultdist',
      },
      'distribution:dist_primary': {
        walletId: 'wallet-default-dist',
        accountId: 'account-default-dist',
        address: '0xdefaultdist',
      },
      'wallet-distribution-default:dist_primary': {
        walletId: 'wallet-default-dist',
        accountId: 'account-default-dist',
        address: '0xdefaultdist',
      },
      partner_dist: {
        walletId: 'wallet-override-dist',
        accountId: 'account-override-dist',
        address: '0xoverride',
      },
      'LP002:partner_dist': {
        walletId: 'wallet-override-dist',
        accountId: 'account-override-dist',
        address: '0xoverride',
      },
    });

    // override wallet should not replace default mapping but should be visible in partner snapshot
    const partnerOverride = result.provisioningSnapshot.partners.find((p) => p.partnerId === 'LP002');
    expect(partnerOverride?.walletFlows).toMatchObject({
      distribution: 'wallet-override-dist',
      collection: 'wallet-default-coll',
    });

    const partnerDefault = result.provisioningSnapshot.partners.find((p) => p.partnerId === 'LP001');
    expect(partnerDefault?.walletFlows).toMatchObject({
      distribution: 'wallet-default-dist',
      collection: 'wallet-default-coll',
    });
  });
});
