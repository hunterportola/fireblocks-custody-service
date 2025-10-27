import { TurnkeyServiceError, ErrorCodes } from '../../core/error-handler';
import type { PlatformConfig } from '../../config/types';
import type {
  ProvisioningArtifacts,
  ProvisioningRuntimeSnapshot,
} from '../../provisioner/runtime-snapshots';
import type { TurnkeyClientGateway } from '../turnkey-custody-service';
import {
  CustodyServiceError,
  InMemorySnapshotStore,
  TurnkeyCustodyService,
} from '../turnkey-custody-service';

// Mock TurnkeyClientManager
jest.mock('../../core/turnkey-client', () => ({
  TurnkeyClientManager: {
    getInstance: jest.fn().mockReturnValue({
      getApiClient: jest.fn().mockReturnValue({
        getWhoami: jest.fn().mockResolvedValue({ organizationId: 'org-123' }),
        createSubOrganization: jest.fn().mockResolvedValue({ subOrganizationId: 'sub-001' }),
        createWallet: jest.fn().mockResolvedValue({ walletId: 'wallet-001' }),
        createPolicy: jest.fn().mockResolvedValue({ policyId: 'policy-001' }),
      }),
      signTransaction: jest.fn().mockResolvedValue({
        signedTransaction: '0xsigned',
        activityId: 'activity-001',
      }),
    }),
    initialize: jest.fn(),
  },
}));

const sandboxPlatform: PlatformConfig = {
  environment: 'sandbox',
  organizationId: 'org-123',
  originator: {
    originatorId: 'originator-platform',
    displayName: 'Platform Root',
  },
};

const baseSnapshot: ProvisioningRuntimeSnapshot = {
  subOrganizationId: 'sub-001',
  name: 'Test Originator',
  rootQuorumThreshold: 1,
  rootUsers: [],
  automationUsers: [],
  walletFlows: [],
  policies: [],
  partners: [],
  metadata: {
    originatorId: 'ORIG-001',
  },
};

const baseArtifacts: ProvisioningArtifacts = {
  platformConfigHash: 'hash-001',
  provisioningSnapshot: baseSnapshot,
};

describe('TurnkeyCustodyService', () => {
  const SEPOLIA_CHAIN_ID = '11155111';
  const noopValidator = {
    validate: jest.fn(),
  };

  const noopProvisioner = {
    provision: jest.fn(),
  };

  const makeClientGateway = (): TurnkeyClientGateway => ({
    initialize: jest.fn(async () => ({} as any)),
    getInstance: jest.fn(() => ({} as any)),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provisionOriginator', () => {
    it('validates configuration, ensures client, provisions, and stores artifacts', async () => {
      const validatorResult = {
        isValid: true,
        valid: true,
        errors: [],
        warnings: ['root user missing metadata'],
      };
      noopValidator.validate.mockResolvedValueOnce(validatorResult);

      const artifacts: ProvisioningArtifacts = {
        ...baseArtifacts,
        provisioningSnapshot: {
          ...baseSnapshot,
          metadata: {
            originatorId: 'ORIG-123',
          },
        },
      };
      noopProvisioner.provision.mockResolvedValueOnce(artifacts);

      const snapshotStore = new InMemorySnapshotStore();
      const clientGateway = makeClientGateway();

      const service = new TurnkeyCustodyService({
        validator: noopValidator as any,
        provisioner: noopProvisioner as any,
        snapshotStore,
        clientGateway,
      });

      const config = {
        platform: sandboxPlatform,
        provisioning: { nameTemplate: 'name', rootQuorumThreshold: 1, rootUsers: [] },
        businessModel: {
          partners: { catalog: [], defaultPolicyIds: [] },
          wallets: { templates: [], flows: {} },
        },
        accessControl: {
          roles: [],
          automation: { templates: [] },
          policies: { templates: [], defaultPolicyIds: [] },
        },
      } as any;

      const result = await service.provisionOriginator(config);

      expect(noopValidator.validate).toHaveBeenCalledWith(config);
      expect(clientGateway.getInstance).toHaveBeenCalledTimes(1);
      expect(noopProvisioner.provision).toHaveBeenCalledWith(config);

      const storedSnapshot = await snapshotStore.get('ORIG-123');
      expect(storedSnapshot).toEqual(artifacts.provisioningSnapshot);

      expect(result).toEqual({
        artifacts,
        validationWarnings: validatorResult.warnings,
      });
    });

    it('throws CustodyServiceError when validation fails', async () => {
      const validationResult = {
        isValid: false,
        valid: false,
        errors: ['missing root users'],
        warnings: [],
      };
      noopValidator.validate.mockResolvedValueOnce(validationResult);

      const clientGateway = makeClientGateway();
      const service = new TurnkeyCustodyService({
        validator: noopValidator as any,
        provisioner: noopProvisioner as any,
        snapshotStore: new InMemorySnapshotStore(),
        clientGateway,
      });

      await expect(
        service.provisionOriginator({ platform: sandboxPlatform } as any)
      ).rejects.toMatchObject({
        reason: 'VALIDATION_FAILED',
        details: validationResult,
      });

      expect(noopProvisioner.provision).not.toHaveBeenCalled();
    });

    it('initializes client when not already available', async () => {
      const validationResult = {
        isValid: true,
        valid: true,
        errors: [],
        warnings: [],
      };
      noopValidator.validate.mockResolvedValueOnce(validationResult);

      noopProvisioner.provision.mockResolvedValueOnce(baseArtifacts);

      const missingClientError = new TurnkeyServiceError(
        'missing',
        ErrorCodes.MISSING_CREDENTIALS
      );
      const clientGateway = {
        initialize: jest.fn(async () => ({} as any)),
        getInstance: jest
          .fn()
          .mockImplementationOnce(() => {
            throw missingClientError;
          })
          .mockImplementation(() => ({} as any)),
      };

      const service = new TurnkeyCustodyService({
        validator: noopValidator as any,
        provisioner: noopProvisioner as any,
        snapshotStore: new InMemorySnapshotStore(),
        clientGateway,
      });

      await service.provisionOriginator({
        platform: sandboxPlatform,
        provisioning: { nameTemplate: 'name', rootQuorumThreshold: 1, rootUsers: [] },
        businessModel: { partners: { catalog: [], defaultPolicyIds: [] }, wallets: { templates: [], flows: {} } },
        accessControl: { roles: [], automation: { templates: [] }, policies: { templates: [], defaultPolicyIds: [] } },
      } as any);

      expect(clientGateway.initialize).toHaveBeenCalledWith(
        sandboxPlatform,
        expect.any(Object)
      );
      expect(clientGateway.getInstance).toHaveBeenCalledTimes(2);
    });
  });

  describe('initiateDisbursement', () => {
    const snapshotWithPartner: ProvisioningRuntimeSnapshot = {
      ...baseSnapshot,
      partners: [
        {
          partnerId: 'LP-001',
          walletFlows: { distribution: 'wallet-123' },
          policyIds: ['policy-1'],
          automationUserTemplateId: 'auto-1',
        },
      ],
      automationUsers: [
        {
          templateId: 'auto-1',
          userId: 'user-1',
          apiKeyId: 'api-1',
          apiKeyIds: ['api-1'],
          sessionIds: [],
        },
      ],
      walletFlows: [
        {
          flowId: 'distribution',
          walletTemplateId: 'wallet-template-1',
          walletId: 'wallet-123',
          accountIdByAlias: { primary: 'account-abc' },
          accountAddressByAlias: { primary: '0xabc' },
        },
      ],
    };

    const disbursementRequest = {
      originatorId: 'ORIG-001',
      partnerId: 'LP-001',
      loanId: 'LOAN-123',
      amount: '1000000',
      assetSymbol: 'USDC',
      chainId: SEPOLIA_CHAIN_ID,
      borrowerAddress: '0xborrower',
      walletAccountAlias: 'primary',
    };

    it('builds disbursement context and delegates to executor', async () => {
      const executor = { execute: jest.fn().mockResolvedValue({ loanId: 'LOAN-123', status: 'submitted' }) };
      const snapshotStore = new InMemorySnapshotStore();
      await snapshotStore.save({
        ...baseArtifacts,
        provisioningSnapshot: snapshotWithPartner,
      });

      const clientGateway = makeClientGateway();
      const service = new TurnkeyCustodyService({
        validator: noopValidator as any,
        provisioner: noopProvisioner as any,
        snapshotStore,
        disbursementExecutor: executor,
        clientGateway,
      });

      const result = await service.initiateDisbursement(disbursementRequest);

      expect(result).toEqual({ loanId: 'LOAN-123', status: 'submitted' });
      expect(executor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          request: disbursementRequest,
          wallet: expect.objectContaining({
            walletId: 'wallet-123',
            accountAlias: 'primary',
            accountId: 'account-abc',
          }),
          automation: expect.objectContaining({
            templateId: 'auto-1',
            userId: 'user-1',
          }),
        })
      );
    });

    it('throws when snapshot store missing and no snapshot provided', async () => {
      const executor = { execute: jest.fn() };
      const clientGateway = makeClientGateway();
      const service = new TurnkeyCustodyService({
        disbursementExecutor: executor,
        clientGateway,
      });

      await expect(
        service.initiateDisbursement(disbursementRequest)
      ).rejects.toMatchObject({ reason: 'SNAPSHOT_STORE_NOT_CONFIGURED' });
    });

    it('throws when partner not present', async () => {
      const executor = { execute: jest.fn() };
      const snapshotStore = new InMemorySnapshotStore();
      await snapshotStore.save(baseArtifacts);

      const clientGateway = makeClientGateway();
      const service = new TurnkeyCustodyService({
        disbursementExecutor: executor,
        snapshotStore,
        clientGateway,
      });

      await expect(
        service.initiateDisbursement(disbursementRequest)
      ).rejects.toMatchObject({ reason: 'PARTNER_NOT_FOUND' });
    });

    it('throws when automation user is missing', async () => {
      const executor = { execute: jest.fn() };
      const snapshotStore = new InMemorySnapshotStore();
      await snapshotStore.save({
        ...baseArtifacts,
        provisioningSnapshot: {
          ...snapshotWithPartner,
          automationUsers: [],
        },
      });

      const clientGateway = makeClientGateway();
      const service = new TurnkeyCustodyService({
        disbursementExecutor: executor,
        snapshotStore,
        clientGateway,
      });

      await expect(
        service.initiateDisbursement(disbursementRequest)
      ).rejects.toMatchObject({ reason: 'AUTOMATION_USER_NOT_FOUND' });
    });

    it('throws when client not initialized', async () => {
      const executor = { execute: jest.fn() };
      const snapshotStore = new InMemorySnapshotStore();
      await snapshotStore.save({
        ...baseArtifacts,
        provisioningSnapshot: snapshotWithPartner,
      });

      const clientGateway = {
        initialize: jest.fn(),
        getInstance: jest.fn(() => {
          throw new Error('not ready');
        }),
      };

      const service = new TurnkeyCustodyService({
        disbursementExecutor: executor,
        snapshotStore,
        clientGateway,
      });

      await service
        .initiateDisbursement(disbursementRequest)
        .catch((error) => {
          expect(error).toBeInstanceOf(CustodyServiceError);
          expect(error).toMatchObject({ reason: 'CLIENT_NOT_INITIALIZED' });
        });
    });
  });
});
