// @ts-nocheck
/**
 * Mock implementation of TurnkeyClientManager for testing
 */

export class MockTurnkeyClient {
  provisionSubOrganization = jest.fn();
  bootstrapAutomation = jest.fn();
  configurePolicies = jest.fn();
  provisionWalletForTemplate = jest.fn();
  createActivity = jest.fn();
  pollActivity = jest.fn();
  resolveAutomationApiKeys = jest.fn();
  signTransaction = jest.fn();
  
  // Additional helper methods for test setup
  reset(): void {
    this.provisionSubOrganization.mockReset();
    this.bootstrapAutomation.mockReset();
    this.configurePolicies.mockReset();
    this.provisionWalletForTemplate.mockReset();
    this.createActivity.mockReset();
    this.pollActivity.mockReset();
    this.resolveAutomationApiKeys.mockReset();
    this.signTransaction.mockReset();
  }

  // Setup common successful responses
  setupSuccessfulProvisioning(): void {
    this.provisionSubOrganization.mockResolvedValue({
      subOrgId: 'sub-org-default',
      subOrgName: 'Test Organization',
      rootUserIds: ['usr-root-1'],
      wallets: {
        distribution: {
          walletId: 'wallet-dist-default',
          accountIds: ['account-dist-1'],
          accountAddresses: ['0xdist...'],
        },
        collection: {
          walletId: 'wallet-coll-default',
          accountIds: ['account-coll-1'],
          accountAddresses: ['0xcoll...'],
        },
      },
    });

    this.bootstrapAutomation.mockResolvedValue({
      automationUsers: [],
    });

    this.configurePolicies.mockResolvedValue({
      policyIds: {},
      partnerPolicies: {},
    });
  }

  // Setup activity polling responses
  setupActivityPolling(activityId: string, finalStatus: string = 'ACTIVITY_STATUS_COMPLETED'): void {
    this.createActivity.mockResolvedValue({ activityId });
    
    const pendingResponse = {
      activity: {
        id: activityId,
        status: 'ACTIVITY_STATUS_PENDING',
        organizationId: 'org-123',
      },
    };

    const completedResponse = {
      activity: {
        id: activityId,
        status: finalStatus,
        organizationId: 'org-123',
        result: {
          createSubOrganizationResult: {
            subOrganizationId: 'sub-org-123',
          },
        },
      },
    };

    this.pollActivity
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValueOnce(pendingResponse)
      .mockResolvedValue(completedResponse);
  }

  // Setup consensus required responses
  setupConsensusRequired(activityId: string, requiredApprovals: number = 2): void {
    const consensusResponse = {
      activity: {
        id: activityId,
        status: 'ACTIVITY_STATUS_CONSENSUS_NEEDED',
        organizationId: 'org-123',
        consensus: {
          required: requiredApprovals,
          current: 0,
        },
      },
    };

    this.pollActivity.mockResolvedValue(consensusResponse);
  }

  // Setup policy evaluation responses
  setupPolicyDenied(activityId: string, policyIds: string[]): void {
    const failedResponse = {
      activity: {
        id: activityId,
        status: 'ACTIVITY_STATUS_FAILED',
        organizationId: 'org-123',
        failure: {
          failureMessage: 'Policy evaluation failed',
          details: policyIds.map(id => ({ policyId: id })),
        },
      },
    };

    this.pollActivity.mockResolvedValue(failedResponse);
  }
}
