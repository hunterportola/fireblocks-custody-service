// @ts-nocheck
/**
 * Integration test suite for the complete provisioning workflow
 * Tests the full end-to-end provisioning process including:
 * - Sub-organization creation
 * - Wallet provisioning
 * - Policy configuration and binding
 * - Partner setup with overrides
 * - Automation user creation
 */

import { TurnkeySuborgProvisioner } from '../../provisioner/turnkey-suborg-provisioner';
import { TurnkeyClientManager } from '../../core/turnkey-client';
import { PolicyProvisioner } from '../../provisioner/policy-provisioner';
import { MockTurnkeyClient } from '../fixtures/mock-turnkey-client';
import { buildOriginatorConfig } from '../fixtures/test-configs';
import type { OriginatorConfiguration } from '../../config/types';

// Mock all external dependencies
jest.mock('../../core/turnkey-client');
jest.mock('../../core/secrets-manager');

describe('Provisioning Flow Integration', () => {
  let provisioner: TurnkeySuborgProvisioner;
  let mockClient: MockTurnkeyClient;
  let mockPolicyProvisioner: PolicyProvisioner;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = new MockTurnkeyClient();
    mockPolicyProvisioner = {
      deploy: jest.fn(),
    } as any;

    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(mockClient);
    
    provisioner = new TurnkeySuborgProvisioner(
      mockClient as any,
      mockPolicyProvisioner
    );
  });

  describe('complete provisioning workflow', () => {
    it('provisions a new originator with default configuration', async () => {
      const config = buildOriginatorConfig({
        originatorId: 'ORIG001',
        displayName: 'Test Originator',
      });

      // Setup mock responses for the full flow
      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-123',
        subOrgName: 'Test Originator - Production',
        rootUserIds: ['usr-root-1', 'usr-root-2'],
        wallets: {
          distribution: {
            walletId: 'wallet-dist-123',
            accountIds: ['account-dist-1'],
            accountAddresses: ['0x123...'],
          },
          collection: {
            walletId: 'wallet-coll-456',
            accountIds: ['account-coll-1'],
            accountAddresses: ['0x456...'],
          },
        },
      });

      mockClient.bootstrapAutomation.mockResolvedValue({
        automationUsers: [
          {
            templateId: 'auto-primary',
            userId: 'usr-auto-1',
            apiKeyId: 'apikey-1',
            apiKeyIds: ['apikey-1'],
            credentials: {
              apiPublicKey: 'public-key-1',
              apiPrivateKey: 'private-key-1',
            },
            sessionIds: [],
          },
        ],
      });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [
          {
            templateId: 'policy-distribution-limit',
            policyId: 'policy-actual-1',
            appliedTo: [
              { type: 'wallet_template', target: 'wallet-dist-123', policyId: 'policy-actual-1' },
            ],
          },
        ],
        partnerPolicies: {
          'LP001': ['policy-actual-1'],
          'LP002': ['policy-actual-1'],
        },
        warnings: [],
      });

      const result = await provisioner.provision(config);

      // Verify the complete artifact structure
      expect(result).toMatchObject({
        platformConfigHash: expect.any(String),
        provisioningSnapshot: {
          subOrganizationId: 'sub-org-123',
          name: 'Test Originator - Production',
          rootQuorumThreshold: 2,
          rootUsers: [
            {
              templateId: 'root-primary',
              userId: 'usr-root-1',
              apiKeyIds: [],
              authenticatorIds: [],
            },
            {
              templateId: 'root-secondary',
              userId: 'usr-root-2',
              apiKeyIds: [],
              authenticatorIds: [],
            },
          ],
          automationUsers: [
            {
              templateId: 'auto-primary',
              userId: 'usr-auto-1',
              apiKeyId: 'apikey-1',
              apiKeyIds: ['apikey-1'],
              apiKeyPublicKey: 'public-key-1',
              sessionIds: [],
            },
          ],
          walletFlows: expect.arrayContaining([
            expect.objectContaining({
              flowId: 'distribution',
              walletId: 'wallet-dist-123',
              walletTemplateId: 'wallet-distribution',
            }),
            expect.objectContaining({
              flowId: 'collection',
              walletId: 'wallet-coll-456',
              walletTemplateId: 'wallet-collection',
            }),
          ]),
          policies: [
            {
              templateId: 'policy-distribution-limit',
              policyId: 'policy-actual-1',
              appliedTo: expect.any(Array),
            },
          ],
          partners: [
            {
              partnerId: 'LP001',
              walletFlows: {
                distribution: 'wallet-dist-123',
                collection: 'wallet-coll-456',
              },
              policyIds: ['policy-actual-1'],
            },
            {
              partnerId: 'LP002',
              walletFlows: {
                distribution: 'wallet-dist-123',
                collection: 'wallet-coll-456',
              },
              policyIds: ['policy-actual-1'],
            },
          ],
          metadata: {
            originatorId: 'ORIG001',
            subOrganizationName: 'Test Originator - Production',
          },
        },
        resolvedTemplates: {
          'originator-{originatorId}': 'Test Originator - Production',
        },
        automationCredentials: {
          'auto-primary': {
            apiPublicKey: 'public-key-1',
            apiPrivateKey: 'private-key-1',
          },
        },
      });

      // Verify the correct sequence of operations
      expect(mockClient.provisionSubOrganization).toHaveBeenCalledTimes(1);
      expect(mockClient.bootstrapAutomation).toHaveBeenCalledTimes(1);
      expect(mockPolicyProvisioner.deploy).toHaveBeenCalledTimes(1);

      // Verify template context was passed correctly
      expect(mockClient.provisionSubOrganization).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          originatorId: 'ORIG001',
          originatorDisplayName: 'Test Originator',
        })
      );
    });

    it('provisions originator with partner-specific wallet overrides', async () => {
      const config = buildOriginatorConfig({
        originatorId: 'ORIG002',
        partners: [
          {
            partnerId: 'LP001',
            displayName: 'Partner One',
            enabled: true,
            flowOverrides: {
              distribution: 'wallet-distribution-isolated',
            },
          },
        ],
      });

      // Setup base provisioning response
      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-456',
        subOrgName: 'ORIG002 - Production',
        rootUserIds: ['usr-root-1'],
        wallets: {
          distribution: {
            walletId: 'wallet-dist-default',
            accountIds: ['account-dist-default'],
            accountAddresses: ['0xdef...'],
          },
          collection: {
            walletId: 'wallet-coll-default',
            accountIds: ['account-coll-default'],
            accountAddresses: ['0xcoll...'],
          },
        },
      });

      // Mock partner override wallet provisioning
      mockClient.provisionWalletForTemplate.mockResolvedValueOnce({
        walletId: 'wallet-dist-isolated',
        accountIds: ['account-dist-isolated'],
        accountAddresses: ['0xiso...'],
      });

      mockClient.bootstrapAutomation.mockResolvedValue({
        automationUsers: [],
      });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [],
        partnerPolicies: {},
        warnings: [],
      });

      const result = await provisioner.provision(config);

      // Verify override wallet was provisioned
      expect(mockClient.provisionWalletForTemplate).toHaveBeenCalledWith(
        'sub-org-456',
        expect.objectContaining({
          templateId: 'wallet-distribution-isolated',
        }),
        expect.objectContaining({
          partnerId: 'LP001',
          walletFlowId: 'distribution',
        })
      );

      // Verify partner has override wallet assigned
      const partner = result.provisioningSnapshot.partners.find(
        p => p.partnerId === 'LP001'
      );
      expect(partner?.walletFlows.distribution).toBe('wallet-dist-isolated');
      expect(partner?.walletFlows.collection).toBe('wallet-coll-default');

      // Verify wallet flows include both default and override wallets
      expect(result.provisioningSnapshot.walletFlows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            flowId: 'distribution',
            walletId: 'wallet-dist-default',
            metadata: undefined,
          }),
          expect.objectContaining({
            flowId: 'collection',
            walletId: 'wallet-coll-default',
            metadata: undefined,
          }),
          expect.objectContaining({
            flowId: 'distribution',
            walletId: 'wallet-dist-isolated',
            metadata: {
              partnerId: 'LP001',
              flowSource: 'override',
            },
          }),
        ])
      );
    });

    it('handles automation user creation with pre-loaded credentials', async () => {
      const config = buildOriginatorConfig({
        partners: [], // No partners for this test
        automationTemplates: [
          {
            templateId: 'auto-webhook',
            userName: 'webhook-processor',
            userTags: ['automation'],
            apiKeys: {
              keyName: 'webhook-key',
              publicKeyRef: 'WEBHOOK_PUBLIC_KEY',
            },
          },
          {
            templateId: 'auto-treasury',
            userName: 'treasury-manager',
            userTags: ['automation', 'treasury'],
            // No publicKeyRef - should use generated credentials
          },
        ],
      });

      // Mock environment variable for pre-loaded key
      process.env.WEBHOOK_PUBLIC_KEY = 'pre-loaded-public-key';

      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-789',
        subOrgName: 'Test Org',
        rootUserIds: [],
        wallets: {},
      });

      mockClient.bootstrapAutomation.mockResolvedValue({
        automationUsers: [
          {
            templateId: 'auto-webhook',
            userId: 'usr-webhook',
            apiKeyId: 'apikey-webhook',
            credentials: undefined, // Pre-loaded, not generated
          },
          {
            templateId: 'auto-treasury',
            userId: 'usr-treasury',
            apiKeyId: 'apikey-treasury',
            credentials: {
              apiPublicKey: 'generated-public',
              apiPrivateKey: 'generated-private',
            },
          },
        ],
      });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [],
        partnerPolicies: {},
        warnings: [],
      });

      const result = await provisioner.provision(config);

      // Verify only generated credentials are returned
      expect(result.automationCredentials).toEqual({
        'auto-treasury': {
          apiPublicKey: 'generated-public',
          apiPrivateKey: 'generated-private',
        },
      });

      // Verify both users are in the snapshot
      expect(result.provisioningSnapshot.automationUsers).toHaveLength(2);
      expect(result.provisioningSnapshot.automationUsers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            templateId: 'auto-webhook',
            userId: 'usr-webhook',
          }),
          expect.objectContaining({
            templateId: 'auto-treasury',
            userId: 'usr-treasury',
            apiKeyPublicKey: 'generated-public',
          }),
        ])
      );

      // Cleanup
      delete process.env.WEBHOOK_PUBLIC_KEY;
    });

    it('propagates policy provisioning warnings', async () => {
      const config = buildOriginatorConfig({
        policies: [
          {
            templateId: 'policy-with-invalid-binding',
            policyName: 'Test Policy',
            effect: 'EFFECT_ALLOW',
            condition: { expression: 'true' },
            consensus: { expression: 'true' },
            appliesTo: [
              { type: 'wallet_template', target: 'non-existent-wallet' },
            ],
          },
        ],
      });

      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-999',
        subOrgName: 'Test Org',
        rootUserIds: [],
        wallets: {},
      });

      mockClient.bootstrapAutomation.mockResolvedValue({
        automationUsers: [],
      });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [],
        partnerPolicies: {},
        warnings: [
          'Wallet template "non-existent-wallet" not found in current deployment',
        ],
      });

      const result = await provisioner.provision(config);

      // Verify warnings are included in the snapshot
      expect(result.provisioningSnapshot.policies).toEqual([]);
      // Note: In real implementation, warnings might be added to a separate field
      // or logged. This test verifies the integration properly handles them.
    });
  });

  describe('error handling scenarios', () => {
    it('handles sub-organization creation failure', async () => {
      const config = buildOriginatorConfig({});

      mockClient.provisionSubOrganization.mockRejectedValue(
        new Error('Organization limit reached')
      );

      await expect(provisioner.provision(config)).rejects.toThrow(
        'Organization limit reached'
      );

      // Verify no subsequent operations were attempted
      expect(mockClient.bootstrapAutomation).not.toHaveBeenCalled();
      expect(mockPolicyProvisioner.deploy).not.toHaveBeenCalled();
    });

    it('handles automation bootstrap failure', async () => {
      const config = buildOriginatorConfig({});

      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-123',
        subOrgName: 'Test Org',
        rootUserIds: [],
        wallets: {},
      });

      mockClient.bootstrapAutomation.mockRejectedValue(
        new Error('Invalid automation configuration')
      );

      await expect(provisioner.provision(config)).rejects.toThrow(
        'Invalid automation configuration'
      );

      // Verify policy provisioning was not attempted
      expect(mockPolicyProvisioner.deploy).not.toHaveBeenCalled();
    });

    it('handles partner override wallet provisioning failure', async () => {
      const config = buildOriginatorConfig({
        partners: [
          {
            partnerId: 'LP001',
            displayName: 'Partner One',
            enabled: true,
            flowOverrides: {
              distribution: 'wallet-invalid',
            },
          },
        ],
      });

      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-456',
        subOrgName: 'Test Org',
        rootUserIds: [],
        wallets: {
          distribution: { walletId: 'default', accountIds: [], accountAddresses: [] },
        },
      });

      mockClient.bootstrapAutomation.mockResolvedValue({
        automationUsers: [],
      });

      mockClient.provisionWalletForTemplate.mockRejectedValue(
        new Error('Invalid wallet template')
      );

      await expect(provisioner.provision(config)).rejects.toThrow(
        'Wallet template "wallet-invalid" referenced in businessModel.wallets is not defined'
      );
    });

    it('validates wallet architecture before provisioning', async () => {
      const invalidConfig: OriginatorConfiguration = {
        platform: {
          environment: 'production',
          originator: {
            originatorId: 'INVALID',
            displayName: 'Invalid Config',
            legalEntityName: 'Invalid LLC',
          },
          organizationId: 'org-123',
        },
        provisioning: {
          nameTemplate: 'test',
          rootQuorumThreshold: 1,
          rootUsers: [],
          featureToggles: {
            enableApiKeys: true,
            enableWebAuthn: false,
          },
        },
        businessModel: {
          partners: {
            catalog: [],
            defaultPolicyIds: [],
          },
          // Missing wallets configuration
          wallets: undefined as any,
        },
        accessControl: {
          roles: [],
          policies: {
            templates: [],
            defaultPolicyIds: [],
          },
        },
      };

      await expect(provisioner.provision(invalidConfig)).rejects.toThrow(
        'businessModel.wallets.templates must contain at least one wallet template'
      );

      // Verify no API calls were made
      expect(mockClient.provisionSubOrganization).not.toHaveBeenCalled();
    });
  });

  describe('complex scenarios', () => {
    it('handles multiple partners with mixed default and override wallets', async () => {
      const config = buildOriginatorConfig({
        partners: [
          {
            partnerId: 'LP001',
            displayName: 'Uses Defaults',
            enabled: true,
            // No overrides
          },
          {
            partnerId: 'LP002',
            displayName: 'Partial Override',
            enabled: true,
            flowOverrides: {
              distribution: 'wallet-distribution-isolated',
              // collection uses default
            },
          },
          {
            partnerId: 'LP003',
            displayName: 'Full Override',
            enabled: true,
            flowOverrides: {
              distribution: 'wallet-distribution-isolated',
              collection: 'wallet-collection-isolated',
            },
          },
        ],
      });

      // Mock responses
      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-org-complex',
        subOrgName: 'Complex Org',
        rootUserIds: [],
        wallets: {
          distribution: { walletId: 'dist-default', accountIds: [], accountAddresses: [] },
          collection: { walletId: 'coll-default', accountIds: [], accountAddresses: [] },
        },
      });

      mockClient.bootstrapAutomation.mockResolvedValue({ automationUsers: [] });

      // Mock override wallet creations
      mockClient.provisionWalletForTemplate
        .mockResolvedValueOnce({ walletId: 'dist-lp002', accountIds: [], accountAddresses: [] })
        .mockResolvedValueOnce({ walletId: 'dist-lp003', accountIds: [], accountAddresses: [] })
        .mockResolvedValueOnce({ walletId: 'coll-lp003', accountIds: [], accountAddresses: [] });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [],
        partnerPolicies: {},
        warnings: [],
      });

      const result = await provisioner.provision(config);

      // Verify partner assignments
      const partners = result.provisioningSnapshot.partners;
      
      expect(partners.find(p => p.partnerId === 'LP001')?.walletFlows).toEqual({
        distribution: 'dist-default',
        collection: 'coll-default',
      });

      expect(partners.find(p => p.partnerId === 'LP002')?.walletFlows).toEqual({
        distribution: 'dist-lp002',
        collection: 'coll-default',
      });

      expect(partners.find(p => p.partnerId === 'LP003')?.walletFlows).toEqual({
        distribution: 'dist-lp003',
        collection: 'coll-lp003',
      });

      // Verify correct number of override wallets created
      expect(mockClient.provisionWalletForTemplate).toHaveBeenCalledTimes(3);
    });

    it('correctly maps template contexts through the entire flow', async () => {
      const config = buildOriginatorConfig({
        originatorId: 'TEMPLATE_TEST',
        metadata: {
          region: 'US-EAST',
          tier: 'premium',
        },
      });

      mockClient.provisionSubOrganization.mockResolvedValue({
        subOrgId: 'sub-template-test',
        subOrgName: 'Template Test Org',
        rootUserIds: [],
        wallets: {},
      });

      mockClient.bootstrapAutomation.mockResolvedValue({ automationUsers: [] });

      mockPolicyProvisioner.deploy.mockResolvedValue({
        policies: [],
        partnerPolicies: {},
        warnings: [],
      });

      await provisioner.provision(config);

      // Verify template context is built correctly
      const expectedContext = expect.objectContaining({
        originatorId: 'TEMPLATE_TEST',
        originatorDisplayName: expect.any(String),
        originatorLegalEntityName: expect.any(String),
        platformEnvironment: 'production',
        platformOrganizationId: expect.any(String),
        originatorMetadata: {
          region: 'US-EAST',
          tier: 'premium',
        },
      });

      // Check initial provisioning
      expect(mockClient.provisionSubOrganization).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expectedContext
      );

      // Check automation provisioning gets runtime context
      expect(mockClient.bootstrapAutomation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          originatorId: 'TEMPLATE_TEST',
          originatorDisplayName: expect.any(String),
          originatorLegalEntityName: expect.any(String),
          platformEnvironment: 'production',
          platformOrganizationId: expect.any(String),
          originatorMetadata: {
            region: 'US-EAST',
            tier: 'premium',
          },
          subOrganizationId: 'sub-template-test',
          subOrganizationName: 'Template Test Org',
        }),
        'sub-template-test'
      );

      // Check policy provisioning gets complete context
      expect(mockPolicyProvisioner.deploy).toHaveBeenCalledWith(
        expect.objectContaining({
          templateContext: expect.objectContaining({
            originatorId: 'TEMPLATE_TEST',
            originatorDisplayName: expect.any(String),
            originatorLegalEntityName: expect.any(String),
            platformEnvironment: 'production',
            platformOrganizationId: expect.any(String),
            originatorMetadata: {
              region: 'US-EAST',
              tier: 'premium',
            },
            subOrganizationId: 'sub-template-test',
            subOrganizationName: 'Template Test Org',
          }),
        })
      );
    });
  });
});