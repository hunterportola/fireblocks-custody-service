// @ts-nocheck
/**
 * Comprehensive test suite for TurnkeyClientManager
 * Tests all critical paths, P0 bugs, and edge cases
 */

import { Turnkey as TurnkeyServerSDK } from '@turnkey/sdk-server';
import type { TActivity } from '@turnkey/http';

import { TurnkeyClientManager } from '../turnkey-client';
import type { 
  TurnkeyRuntimeConfig, 
  ActivityEventEmitter,
  TemplateContext 
} from '../turnkey-client';
import { 
  ErrorCodes, 
  TurnkeyServiceError, 
  ConsensusRequiredError 
} from '../error-handler';
import { SecretProvider, SecretsManager } from '../secrets-manager';
import type { 
  PlatformConfig, 
  ProvisioningConfig,
  WalletArchitecture,
  BusinessModelConfig,
  AccessControlConfig
} from '../../config/types';

// Mock the dependencies
jest.mock('@turnkey/sdk-server');
jest.mock('../secrets-manager');

describe('TurnkeyClientManager', () => {
  const mockApiClient = {
    request: jest.fn(),
    getActivity: jest.fn(),
    getWalletAccounts: jest.fn(),
  };

  const mockServerSDK = {
    apiClient: jest.fn(() => mockApiClient),
  };

  const mockSecrets = {
    apiPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----',
    apiPublicKey: '-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY\n-----END PUBLIC KEY-----',
    apiKeyId: 'mock-api-key-id',
    defaultOrganizationId: 'org-123',
  };

  const mockEvents: ActivityEventEmitter = {
    submitted: jest.fn(),
    completed: jest.fn(),
    failed: jest.fn(),
    consensusRequired: jest.fn(),
  };

  const platformConfig: PlatformConfig = {
    environment: 'sandbox',
    organizationId: 'org-123',
    apiBaseUrl: 'https://api.turnkey.com',
    originator: {
      originatorId: 'ORIG001',
      displayName: 'Test Originator',
    },
    activityPoller: {
      intervalMs: 100,
      numRetries: 3,
    },
  };

  const runtimeConfig: TurnkeyRuntimeConfig = {
    platform: platformConfig,
    secretConfig: { provider: SecretProvider.ENVIRONMENT },
    events: mockEvents,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TurnkeyClientManager.reset();
    
    (TurnkeyServerSDK as jest.MockedClass<typeof TurnkeyServerSDK>).mockImplementation(
      () => mockServerSDK as any
    );

    const mockSecretsManager = {
      loadSecrets: jest.fn().mockResolvedValue(mockSecrets),
      getSecrets: jest.fn().mockReturnValue(mockSecrets),
      getSecretByRef: jest.fn(),
      getAutomationCredentials: jest.fn(),
      setAutomationCredentials: jest.fn(),
      removeAutomationCredentials: jest.fn(),
      getPasskeyAttestation: jest.fn(),
    };

    (SecretsManager.getInstance as jest.Mock).mockReturnValue(mockSecretsManager);
  });

  describe('initialization', () => {
    it('creates singleton instance on first initialization', async () => {
      const manager = await TurnkeyClientManager.initialize(runtimeConfig);
      expect(manager).toBeDefined();
      expect(TurnkeyServerSDK).toHaveBeenCalledWith({
        apiBaseUrl: 'https://api.turnkey.com',
        apiPrivateKey: mockSecrets.apiPrivateKey,
        apiPublicKey: mockSecrets.apiPublicKey,
        defaultOrganizationId: 'org-123',
        activityPoller: platformConfig.activityPoller,
      });
    });

    it('returns same instance on subsequent calls', async () => {
      const manager1 = await TurnkeyClientManager.initialize(runtimeConfig);
      const manager2 = await TurnkeyClientManager.initialize(runtimeConfig);
      expect(manager1).toBe(manager2);
    });

    it('throws when getInstance called before initialization', () => {
      expect(() => TurnkeyClientManager.getInstance()).toThrow(
        new TurnkeyServiceError(
          'Turnkey client manager not initialized',
          ErrorCodes.MISSING_CREDENTIALS
        )
      );
    });

    it('handles missing credentials gracefully', async () => {
      const mockSecretsManager = SecretsManager.getInstance() as jest.Mocked<any>;
      mockSecretsManager.loadSecrets.mockRejectedValue(
        new Error('Missing API keys')
      );

      await expect(TurnkeyClientManager.initialize(runtimeConfig)).rejects.toThrow(
        'Missing API keys'
      );
    });
  });

  describe('pollActivity - P0 Bug: Organization Context', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('passes organizationId when polling activities in sub-organizations', async () => {
      const activityId = 'activity-123';
      const subOrgId = 'sub-org-456';
      
      const mockActivity: Partial<TActivity> = {
        id: activityId,
        status: 'ACTIVITY_STATUS_COMPLETED',
        organizationId: subOrgId,
        result: { someData: 'value' },
      };

      mockApiClient.request.mockResolvedValue({
        activity: { 
          id: activityId, 
          status: 'ACTIVITY_STATUS_PENDING' 
        },
      });
      
      mockApiClient.getActivity
        .mockResolvedValueOnce({ activity: { ...mockActivity, status: 'ACTIVITY_STATUS_PENDING' } })
        .mockResolvedValueOnce({ activity: mockActivity });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' },
        { subOrganizationId: subOrgId }
      );

      const result = await handle.wait();

      // Verify organizationId was passed in both initial and polling calls
      expect(mockApiClient.getActivity).toHaveBeenCalledWith({
        activityId,
        organizationId: subOrgId,
      });
      expect(result.result).toEqual({ someData: 'value' });
    });

    it('defaults to platform organizationId when not specified', async () => {
      const activityId = 'activity-789';
      
      mockApiClient.request.mockResolvedValue({
        activity: { 
          id: activityId, 
          status: 'ACTIVITY_STATUS_COMPLETED',
          result: { success: true },
        },
      });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      await handle.wait();

      expect(mockApiClient.request).toHaveBeenCalledWith(
        '/public/v1/submit/test',
        expect.objectContaining({
          organizationId: 'org-123',
        })
      );
    });
  });

  describe('consensus activity handling - P1 Bug Fix', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('treats CONSENSUS_NEEDED as terminal status and throws ConsensusRequiredError', async () => {
      const activityId = 'consensus-activity-123';
      
      const consensusActivity: Partial<TActivity> = {
        id: activityId,
        status: 'ACTIVITY_STATUS_CONSENSUS_NEEDED',
        organizationId: 'org-123',
        consensusMetadata: {
          requiredApprovals: 2,
          currentApprovals: 1,
        } as any,
      };

      mockApiClient.request.mockResolvedValue({
        activity: consensusActivity,
      });

      mockApiClient.getActivity.mockResolvedValue({
        activity: consensusActivity,
      });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      await expect(handle.wait()).rejects.toThrow(ConsensusRequiredError);
      
      expect(mockEvents.consensusRequired).toHaveBeenCalledWith(
        expect.objectContaining({
          activityId,
          requiredApprovals: 2,
          currentApprovals: 1,
        })
      );
      
      // Should not timeout despite consensus state
      expect(mockApiClient.getActivity).toHaveBeenCalledTimes(1);
    });

    it('does not timeout on long-running consensus activities', async () => {
      const activityId = 'consensus-long-123';
      
      mockApiClient.request.mockResolvedValue({
        activity: {
          id: activityId,
          status: 'ACTIVITY_STATUS_PENDING',
        },
      });

      // Simulate activity staying in PENDING for multiple polls
      mockApiClient.getActivity
        .mockResolvedValueOnce({
          activity: { id: activityId, status: 'ACTIVITY_STATUS_PENDING' },
        })
        .mockResolvedValueOnce({
          activity: { id: activityId, status: 'ACTIVITY_STATUS_PENDING' },
        })
        .mockResolvedValueOnce({
          activity: { 
            id: activityId, 
            status: 'ACTIVITY_STATUS_CONSENSUS_NEEDED',
            consensusMetadata: { requiredApprovals: 2, currentApprovals: 0 },
          },
        });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      await expect(handle.wait()).rejects.toThrow(ConsensusRequiredError);
      expect(mockApiClient.getActivity).toHaveBeenCalledTimes(3);
    });
  });

  describe('automation credentials - P0 Bug Fix', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('uses automation credentials when templateId provided', async () => {
      const automationCreds = {
        apiPrivateKey: '-----BEGIN PRIVATE KEY-----\nAUTO_PRIVATE\n-----END PRIVATE KEY-----',
        apiPublicKey: '-----BEGIN PUBLIC KEY-----\nAUTO_PUBLIC\n-----END PUBLIC KEY-----',
        apiKeyId: 'auto-key-id',
      };

      const mockSecretsManager = SecretsManager.getInstance() as jest.Mocked<any>;
      mockSecretsManager.getAutomationCredentials.mockReturnValue(automationCreds);

      const mockAutomationClient = {
        request: jest.fn().mockResolvedValue({
          activity: { id: 'auto-123', status: 'ACTIVITY_STATUS_COMPLETED' },
        }),
      };

      mockServerSDK.apiClient.mockImplementation((config?: any) => {
        if (config?.apiPrivateKey === automationCreds.apiPrivateKey) {
          return mockAutomationClient as any;
        }
        return mockApiClient as any;
      });

      await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' },
        { automationTemplateId: 'automation-template-1' }
      );

      expect(mockSecretsManager.getAutomationCredentials).toHaveBeenCalledWith('automation-template-1');
      expect(mockServerSDK.apiClient).toHaveBeenCalledWith({
        apiPrivateKey: automationCreds.apiPrivateKey,
        apiPublicKey: automationCreds.apiPublicKey,
      });
    });

    it('throws clear error when automation credentials missing', async () => {
      const mockSecretsManager = SecretsManager.getInstance() as jest.Mocked<any>;
      mockSecretsManager.getAutomationCredentials.mockReturnValue(undefined);

      await expect(
        manager.submitActivity(
          '/public/v1/submit/test',
          { type: 'TEST_ACTIVITY' },
          { automationTemplateId: 'missing-template' }
        )
      ).rejects.toThrow(
        new TurnkeyServiceError(
          'Automation credentials for template "missing-template" not found',
          ErrorCodes.MISSING_CREDENTIALS
        )
      );
    });

    it('caches automation clients by subOrg and templateId', async () => {
      const automationCreds = {
        apiPrivateKey: '-----BEGIN PRIVATE KEY-----\nAUTO_PRIVATE\n-----END PRIVATE KEY-----',
        apiPublicKey: '-----BEGIN PUBLIC KEY-----\nAUTO_PUBLIC\n-----END PUBLIC KEY-----',
        apiKeyId: 'auto-key-id',
      };

      const mockSecretsManager = SecretsManager.getInstance() as jest.Mocked<any>;
      mockSecretsManager.getAutomationCredentials.mockReturnValue(automationCreds);

      mockApiClient.request.mockResolvedValue({
        activity: { id: 'test-123', status: 'ACTIVITY_STATUS_COMPLETED' },
      });

      // First call - should create client
      await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' },
        { 
          automationTemplateId: 'template-1',
          subOrganizationId: 'sub-org-1',
        }
      );

      // Second call with same params - should use cached client
      await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' },
        { 
          automationTemplateId: 'template-1',
          subOrganizationId: 'sub-org-1',
        }
      );

      // apiClient should only be called once for creation
      expect(mockServerSDK.apiClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('configurePolicies - Template Context Bug', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('merges template context with binding contexts when rendering policies', async () => {
      const accessControl: AccessControlConfig = {
        policies: {
          templates: [{
            templateId: 'policy-1',
            policyName: 'Test Policy',
            effect: 'EFFECT_ALLOW',
            condition: { expression: 'transaction.originator == "{originatorId}"' },
            consensus: { expression: 'user.tag("{originatorRole}") >= 1' },
          }],
          defaultPolicyIds: ['policy-1'],
        },
        roles: [],
      };

      const businessModel: BusinessModelConfig = {
        partners: {
          catalog: [],
          defaultPolicyIds: ['policy-1'],
        },
        wallets: {
          templates: [],
          flows: {},
        },
      };

      mockApiClient.request.mockResolvedValue({
        activity: {
          id: 'policy-123',
          status: 'ACTIVITY_STATUS_COMPLETED',
          result: {
            createPoliciesResult: {
              policyIds: ['actual-policy-id-1'],
            },
          },
        },
      });

      await manager.configurePolicies(accessControl, businessModel, {
        subOrganizationId: 'sub-org-123',
        templateContext: {
          originatorId: 'ORIG001',
          originatorRole: 'senior_reviewer',
        },
        bindingContexts: {
          'policy-1': {
            walletId: 'wallet-456',
          },
        },
      });

      expect(mockApiClient.request).toHaveBeenCalledWith(
        '/public/v1/submit/create_policies',
        expect.objectContaining({
          parameters: {
            policies: [{
              policyName: 'Test Policy',
              effect: 'EFFECT_ALLOW',
              condition: 'transaction.originator == "ORIG001"',
              consensus: 'user.tag("senior_reviewer") >= 1',
            }],
          },
        })
      );
    });
  });

  describe('activity lifecycle and error handling', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('emits correct events during successful activity lifecycle', async () => {
      const activityId = 'success-123';
      
      mockApiClient.request.mockResolvedValue({
        activity: {
          id: activityId,
          status: 'ACTIVITY_STATUS_PENDING',
        },
      });

      mockApiClient.getActivity
        .mockResolvedValueOnce({
          activity: { id: activityId, status: 'ACTIVITY_STATUS_PENDING' },
        })
        .mockResolvedValueOnce({
          activity: {
            id: activityId,
            status: 'ACTIVITY_STATUS_COMPLETED',
            result: { data: 'success' },
          },
        });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      expect(mockEvents.submitted).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'TEST_ACTIVITY',
          organizationId: 'org-123',
        })
      );

      const result = await handle.wait();

      expect(mockEvents.completed).toHaveBeenCalledWith(
        expect.objectContaining({
          activityId,
          activityType: 'TEST_ACTIVITY',
          result: { data: 'success' },
        })
      );
      
      expect(result.result).toEqual({ data: 'success' });
    });

    it('emits failed event and throws on activity failure', async () => {
      mockApiClient.request.mockResolvedValue({
        activity: {
          id: 'fail-123',
          status: 'ACTIVITY_STATUS_FAILED',
          failure: {
            failureMessage: 'Activity processing failed',
          },
        },
      });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      await expect(handle.wait()).rejects.toThrow('Activity processing failed');

      expect(mockEvents.failed).toHaveBeenCalledWith(
        expect.objectContaining({
          activityId: 'fail-123',
          activityType: 'TEST_ACTIVITY',
        })
      );
    });

    it('handles network errors during submission', async () => {
      mockApiClient.request.mockRejectedValue(new Error('Network error'));

      await expect(
        manager.submitActivity('/public/v1/submit/test', { type: 'TEST_ACTIVITY' })
      ).rejects.toThrow();

      expect(mockEvents.failed).toHaveBeenCalledWith(
        expect.objectContaining({
          activityId: 'unknown',
          activityType: 'TEST_ACTIVITY',
        })
      );
    });

    it('times out after max polling attempts', async () => {
      mockApiClient.request.mockResolvedValue({
        activity: { id: 'timeout-123', status: 'ACTIVITY_STATUS_PENDING' },
      });

      mockApiClient.getActivity.mockResolvedValue({
        activity: { id: 'timeout-123', status: 'ACTIVITY_STATUS_PENDING' },
      });

      const handle = await manager.submitActivity(
        '/public/v1/submit/test',
        { type: 'TEST_ACTIVITY' }
      );

      await expect(handle.wait()).rejects.toThrow(
        'Activity timeout-123 did not reach a terminal state after 3 polling attempts'
      );
    });
  });

  describe('wallet provisioning', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('provisions wallets with correct template context', async () => {
      const provisioning: ProvisioningConfig = {
        nameTemplate: 'ORIG-{originatorId}',
        rootQuorumThreshold: 1,
        rootUsers: [{
          templateId: 'root-1',
          userNameTemplate: 'Root User {rootUserIndex}',
          apiKeys: [{
            apiKeyNameTemplate: 'root-key',
            curveType: 'API_KEY_CURVE_P256',
            publicKeyRef: 'root-public-key',
          }],
        }],
      };

      const wallets: WalletArchitecture = {
        templates: [{
          templateId: 'wallet-dist',
          usage: 'distribution',
          walletNameTemplate: 'DIST-{originatorId}-{walletFlowId}',
          accounts: [{
            alias: 'primary',
            curve: 'CURVE_SECP256K1',
            pathFormat: 'PATH_FORMAT_BIP32',
            path: "m/44'/60'/0'/0/0",
            addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
          }],
        }],
        flows: {
          distribution: { templateId: 'wallet-dist' },
        },
      };

      const context: TemplateContext = {
        originatorId: 'ORIG001',
      };

      // Mock sub-org creation
      mockApiClient.request.mockImplementation(async (url: string) => {
        if (url.includes('create_sub_organization')) {
          return {
            activity: {
              id: 'sub-org-activity',
              status: 'ACTIVITY_STATUS_COMPLETED',
              result: {
                createSubOrganizationResultV7: {
                  subOrganizationId: 'sub-org-789',
                  rootUserIds: ['root-user-id-1'],
                },
              },
            },
          };
        }
        if (url.includes('create_wallet')) {
          return {
            activity: {
              id: 'wallet-activity',
              status: 'ACTIVITY_STATUS_COMPLETED',
              result: {
                createWalletResult: {
                  walletId: 'wallet-abc',
                },
              },
            },
          };
        }
      });

      mockApiClient.getWalletAccounts.mockResolvedValue({
        accounts: [{
          walletAccountId: 'account-123',
          address: '0x1234567890',
        }],
      });

      const result = await manager.provisionSubOrganization(
        provisioning,
        wallets,
        context
      );

      expect(result.subOrgId).toBe('sub-org-789');
      expect(result.subOrgName).toBe('ORIG-ORIG001');
      expect(result.wallets.distribution).toEqual({
        walletId: 'wallet-abc',
        accountIds: ['account-123'],
        accountAddresses: ['0x1234567890'],
      });

      // Verify wallet was created with correct name
      expect(mockApiClient.request).toHaveBeenCalledWith(
        '/public/v1/submit/create_wallet',
        expect.objectContaining({
          parameters: {
            walletName: 'DIST-ORIG001-distribution',
            accounts: expect.any(Array),
          },
        })
      );
    });
  });

  describe('template rendering', () => {
    let manager: TurnkeyClientManager;

    beforeEach(async () => {
      manager = await TurnkeyClientManager.initialize(runtimeConfig);
    });

    it('renders templates with all context variables', async () => {
      const provisioning: ProvisioningConfig = {
        nameTemplate: '{originatorId}-{environment}-{timestamp}',
        rootQuorumThreshold: 1,
        rootUsers: [],
      };

      const wallets: WalletArchitecture = {
        templates: [],
        flows: {},
      };

      const context: TemplateContext = {
        originatorId: 'ORIG001',
        environment: 'prod',
        timestamp: '2024-01-01',
      };

      mockApiClient.request.mockResolvedValue({
        activity: {
          id: 'test-123',
          status: 'ACTIVITY_STATUS_COMPLETED',
          result: {
            createSubOrganizationResultV7: {
              subOrganizationId: 'sub-123',
            },
          },
        },
      });

      await manager.provisionSubOrganization(provisioning, wallets, context);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        '/public/v1/submit/create_sub_organization',
        expect.objectContaining({
          parameters: expect.objectContaining({
            subOrganizationName: 'ORIG001-prod-2024-01-01',
          }),
        })
      );
    });

    it('handles missing template variables gracefully', async () => {
      const provisioning: ProvisioningConfig = {
        nameTemplate: '{originatorId}-{missingVar}',
        rootQuorumThreshold: 1,
        rootUsers: [],
      };

      const context: TemplateContext = {
        originatorId: 'ORIG001',
      };

      mockApiClient.request.mockResolvedValue({
        activity: {
          id: 'test-123',
          status: 'ACTIVITY_STATUS_COMPLETED',
          result: {
            createSubOrganizationResultV7: {
              subOrganizationId: 'sub-123',
            },
          },
        },
      });

      await manager.provisionSubOrganization(provisioning, { templates: [], flows: {} }, context);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          parameters: expect.objectContaining({
            subOrganizationName: 'ORIG001-', // missingVar renders as empty
          }),
        })
      );
    });
  });

  describe('isInitialized', () => {
    beforeEach(() => {
      TurnkeyClientManager.reset();
    });

    it('should return false when manager is not initialized', () => {
      expect(TurnkeyClientManager.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await TurnkeyClientManager.initialize(runtimeConfig);
      expect(TurnkeyClientManager.isInitialized()).toBe(true);
    });

    it('should return false after reset', async () => {
      await TurnkeyClientManager.initialize(runtimeConfig);
      expect(TurnkeyClientManager.isInitialized()).toBe(true);
      
      TurnkeyClientManager.reset();
      expect(TurnkeyClientManager.isInitialized()).toBe(false);
    });
  });
});
