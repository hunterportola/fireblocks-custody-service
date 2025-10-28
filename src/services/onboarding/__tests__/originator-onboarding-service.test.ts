import { jest } from '@jest/globals';
import type { OriginatorRegistrationData, TenantProvisioningResult } from '../../control-plane-service';
import { OriginatorOnboardingService } from '../originator-onboarding-service';
import { TenantDatabaseService } from '../../tenant-database-service';
import type { OriginatorConfiguration } from '../../../config/types';
import type { ProvisioningArtifacts } from '../../../provisioner/runtime-snapshots';

const createRegistration = (): OriginatorRegistrationData => ({
  company: {
    legalName: 'Example Lending LLC',
    displayName: 'Example Lending',
    originatorId: 'example_lending',
  },
  primaryContact: {
    firstName: 'Ava',
    lastName: 'Nguyen',
    email: 'ava@example.com',
  },
  businessInfo: {},
  configuration: {
    environment: 'sandbox',
    isolationType: 'dedicated_database',
  },
});

describe('OriginatorOnboardingService', () => {
  const mockControlPlane = {
    upsertOnboardingSession: jest.fn(),
  appendOnboardingStep: jest.fn(),
  provisionTenant: jest.fn(),
  getTenantInfo: jest.fn(),
  getOnboardingSession: jest.fn(),
  storeTurnkeyProvisioningArtifacts: jest.fn(),
  storeAutomationCredential: jest.fn(),
  updateTenantTurnkeyAssignment: jest.fn(),
};

  const mockTenantService: any = {
    bootstrapOriginator: jest.fn(async () => {}),
    saveProvisioningSnapshot: jest.fn(async () => {}),
    persistProvisionedWallets: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
  };

  const noopProvisioner: any = {
    provision: jest.fn(),
  };

  const fakeEncryption: any = {
    encryptPayload: jest.fn((value: string) => `enc:${value}`),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(TenantDatabaseService, 'forOriginator')
      .mockResolvedValue(mockTenantService as TenantDatabaseService);
    noopProvisioner.provision.mockReset();
    fakeEncryption.encryptPayload.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provisions tenant and bootstraps database during registration', async () => {
    const registration = createRegistration();
    const provisioningResult: TenantProvisioningResult = {
      originatorId: registration.company.originatorId,
      databaseConfig: {
        originatorId: registration.company.originatorId,
        databaseName: 'custody_example',
        databaseUser: 'example_user',
        connectionString: 'postgres://example',
        encryptedConnectionString: 'encrypted',
        isolationType: 'dedicated_database',
      },
      initialApiKey: {
        keyId: 'key',
        apiKey: 'secret',
        keyHash: 'hash',
        permissions: [],
        expiresAt: new Date(),
      },
      controlPlaneRegistration: {
        registeredAt: new Date(),
        status: 'active',
      },
    };

    mockControlPlane.provisionTenant.mockImplementation(async () => provisioningResult);

    const service = new OriginatorOnboardingService(mockControlPlane as any, noopProvisioner, fakeEncryption);

    const result = await service.registerOriginator(registration);

    expect(result).toBe(provisioningResult);
    expect(mockControlPlane.upsertOnboardingSession).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorId: 'example_lending',
        phase: 'control_plane_provisioning',
        status: 'in_progress',
      })
    );
    expect(mockControlPlane.appendOnboardingStep).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorId: 'example_lending',
        stepName: 'register-originator',
        status: 'completed',
      })
    );
    expect(mockTenantService.bootstrapOriginator).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorId: 'example_lending',
        displayName: 'Example Lending',
      })
    );
    expect(mockTenantService.close).toHaveBeenCalled();
  });

  it('provisions Turnkey artifacts and stores encrypted automation credentials', async () => {
    const config: OriginatorConfiguration = {
      platform: {
        environment: 'sandbox',
        organizationId: 'org-1',
        originator: {
          originatorId: 'example_lending',
          displayName: 'Example Lending',
        },
      },
      provisioning: {
        nameTemplate: 'SUB-{originatorId}',
        rootQuorumThreshold: 1,
        rootUsers: [],
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
        },
        wallets: {
          templates: [
            {
              templateId: 'wallet-dist',
              usage: 'distribution',
              walletNameTemplate: 'DIST-{originatorId}',
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
            distribution: { templateId: 'wallet-dist' },
          },
        },
      },
      accessControl: {
        roles: [],
        automation: {
          templates: [],
        },
        policies: {
          templates: [],
          defaultPolicyIds: [],
        },
      },
    };

    const artifacts: ProvisioningArtifacts = {
      platformConfigHash: 'hash',
      provisioningSnapshot: {
        subOrganizationId: 'sub-org-123',
        name: 'Sub Org',
        rootQuorumThreshold: 1,
        rootUsers: [],
        automationUsers: [
          {
            templateId: 'auto-default',
            userId: 'usr-auto',
            credentialKey: 'auto-default',
          },
        ],
        walletFlows: [
          {
            flowId: 'distribution',
            walletTemplateId: 'wallet-dist',
            walletId: 'wallet-1',
            walletName: 'DIST-example',
            accountIdByAlias: { primary: 'acct-1' },
            accountAddressByAlias: { primary: '0x123' },
          },
        ],
        policies: [],
        partners: [
          {
            partnerId: 'LP001',
            walletFlows: { distribution: 'wallet-1' },
            policyIds: [],
            automationUserIds: [],
          },
        ],
      },
      resolvedTemplates: {},
      automationCredentials: {
        'auto-default': {
          apiPrivateKey: 'private-key',
          apiPublicKey: 'public-key',
          apiKeyId: 'key-default',
        },
        'LP001::auto-partner': {
          apiPrivateKey: 'partner-private',
          apiPublicKey: 'partner-public',
          apiKeyId: 'key-partner',
        },
      },
    };

    noopProvisioner.provision.mockResolvedValue(artifacts);

    const service = new OriginatorOnboardingService(mockControlPlane as any, noopProvisioner, fakeEncryption);

    jest
      .spyOn(TenantDatabaseService, 'forOriginator')
      .mockResolvedValue(mockTenantService as TenantDatabaseService);

    const result = await service.provisionTurnkey('example_lending', config);

    expect(result).toBe(artifacts);
    expect(noopProvisioner.provision).toHaveBeenCalledWith(config);
    expect(mockControlPlane.storeTurnkeyProvisioningArtifacts).toHaveBeenCalledWith('example_lending', artifacts);
    expect(fakeEncryption.encryptPayload).toHaveBeenCalledWith(
      JSON.stringify(artifacts.automationCredentials!['auto-default'])
    );
    expect(fakeEncryption.encryptPayload).toHaveBeenCalledWith(
      JSON.stringify(artifacts.automationCredentials!['LP001::auto-partner'])
    );
    expect(mockControlPlane.storeAutomationCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorId: 'example_lending',
        templateId: 'auto-default',
        partnerId: undefined,
        metadata: { scope: 'global' },
      })
    );
    expect(mockControlPlane.storeAutomationCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        originatorId: 'example_lending',
        templateId: 'auto-partner',
        partnerId: 'LP001',
        metadata: { scope: 'partner', partnerId: 'LP001' },
      })
    );
    expect(mockTenantService.saveProvisioningSnapshot).toHaveBeenCalledWith('example_lending', artifacts);
    expect(mockTenantService.persistProvisionedWallets).toHaveBeenCalledWith(
      artifacts.provisioningSnapshot,
      expect.objectContaining({ 'wallet-dist': expect.any(Object) })
    );
    expect(mockControlPlane.updateTenantTurnkeyAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ subOrganizationId: 'sub-org-123' })
    );
  });
});
