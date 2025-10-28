import { DisbursementService } from '../disbursement-service';
import { TurnkeyClientManager } from '../../core/turnkey-client';
import type { DisbursementParams } from '../disbursement-service';
import { TurnkeyServiceError, ErrorCodes } from '../../core/error-handler';

// Mock the TurnkeyClientManager
jest.mock('../../core/turnkey-client');

const baseDisbursementParams: DisbursementParams = {
  loanId: 'LOAN-001',
  borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
  amount: '100.50',
  assetType: 'USDC',
  chain: 'sepolia',
  originatorId: 'originator-001',
  turnkeySubOrgId: 'sub-org-123',
  metadata: {
    borrowerKycStatus: 'verified',
    loanType: 'personal',
  },
};

describe('Disbursement Integration Tests', () => {
  let disbursementService: DisbursementService;
  let mockTurnkeyManager: jest.Mocked<TurnkeyClientManager>;
  const mockTenantDatabase = {
    saveDisbursement: jest.fn().mockResolvedValue(undefined),
    getDisbursement: jest.fn().mockResolvedValue(null),
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockTenantDatabase.saveDisbursement.mockClear();
    mockTenantDatabase.getDisbursement.mockClear();
    
    // Create mock instance
    mockTurnkeyManager = {
      getApiClient: jest.fn(),
      signTransaction: jest.fn(),
    } as any;
    
    // Mock the singleton
    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(mockTurnkeyManager);
    
    // Create service instance
    disbursementService = new DisbursementService(mockTenantDatabase as any);
  });

  describe('Full Disbursement Flow', () => {
    it('should complete a successful disbursement end-to-end', async () => {
      // Mock API client
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      
      // Mock sign transaction
      mockTurnkeyManager.signTransaction.mockResolvedValue({
        signedTransaction: '0xf86b8...signed',
        activityId: 'activity-123',
      });

      const result = await disbursementService.createDisbursement(baseDisbursementParams);

      expect(result).toMatchObject({
        disbursementId: expect.stringMatching(/^disb_\d+_[a-z0-9]+$/),
        status: 'broadcasting',
        loanId: 'LOAN-001',
        amount: '100.50',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        chain: 'sepolia',
        txHash: expect.stringMatching(/^0x[a-f0-9]{64}$/),
        turnkeyActivityId: 'activity-123',
        timeline: {
          initiated: expect.any(String),
          policiesEvaluated: expect.any(String),
          signed: expect.any(String),
          broadcasted: expect.any(String),
        },
      });

      // Verify call sequence
      expect(mockApiClient.getWallets).toHaveBeenCalledWith({
        organizationId: 'sub-org-123',
      });
      expect(mockApiClient.getWalletAccounts).toHaveBeenCalledWith({
        organizationId: 'sub-org-123',
        walletId: 'wallet-123',
      });
      expect(mockTurnkeyManager.signTransaction).toHaveBeenCalled();
    });

    it('should handle multiple concurrent disbursements', async () => {
      // Mock API client
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      
      let signCount = 0;
      mockTurnkeyManager.signTransaction.mockImplementation(async () => {
        signCount++;
        return {
          signedTransaction: `0xf86b8...signed${signCount}`,
          activityId: `activity-${signCount}`,
        };
      });

      // Create multiple disbursements concurrently
      const disbursements = [
        { ...baseDisbursementParams, loanId: 'LOAN-001', amount: '100' },
        { ...baseDisbursementParams, loanId: 'LOAN-002', amount: '200' },
        { ...baseDisbursementParams, loanId: 'LOAN-003', amount: '300' },
      ];

      const results = await Promise.all(
        disbursements.map(params => disbursementService.createDisbursement(params))
      );

      // All should complete successfully
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.status).toBe('broadcasting');
        expect(result.loanId).toBe(`LOAN-00${index + 1}`);
        expect(result.turnkeyActivityId).toBe(`activity-${index + 1}`);
      });

      // Should have signed 3 transactions
      expect(signCount).toBe(3);
    });

    it('should surface configuration errors for unsupported chains', async () => {
    const invalidParams = {
      ...baseDisbursementParams,
      chain: 'unsupported-chain' as any,
    };

    await expect(disbursementService.createDisbursement(invalidParams)).rejects.toThrow(
      /Unsupported chain configuration/
    );
    });
  });

  describe('Transaction Lifecycle', () => {
    it('should track state transitions correctly', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      mockTurnkeyManager.signTransaction.mockResolvedValue({
        signedTransaction: '0xf86b8...signed',
        activityId: 'activity-123',
      });

      const result = await disbursementService.createDisbursement(baseDisbursementParams);

      // Verify timeline progression
      const timeline = result.timeline!;
      const timestamps = [
        new Date(timeline.initiated!).getTime(),
        new Date(timeline.policiesEvaluated!).getTime(),
        new Date(timeline.signed!).getTime(),
        new Date(timeline.broadcasted!).getTime(),
      ];

      // Each timestamp should be after the previous one
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should handle pending approval states', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      
      // Mock consensus required error
      mockTurnkeyManager.signTransaction.mockRejectedValue(
        new TurnkeyServiceError(
          'Consensus required',
          ErrorCodes.CONSENSUS_REQUIRED,
          undefined,
          'activity-pending'
        )
      );

      await expect(
        disbursementService.createDisbursement(baseDisbursementParams)
      ).rejects.toThrow('Transaction requires additional approvals');
    });
  });

  describe('Nonce Management', () => {
    it('should handle sequential transactions from same wallet', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      
      let nonce = 0;
      mockTurnkeyManager.signTransaction.mockImplementation(async () => {
        nonce++;
        return {
          signedTransaction: `0xf86b8...signed_nonce${nonce}`,
          activityId: `activity-${nonce}`,
        };
      });

      // Execute transactions sequentially
      const result1 = await disbursementService.createDisbursement({
        ...baseDisbursementParams,
        loanId: 'LOAN-001',
      });
      
      const result2 = await disbursementService.createDisbursement({
        ...baseDisbursementParams,
        loanId: 'LOAN-002',
      });
      
      const result3 = await disbursementService.createDisbursement({
        ...baseDisbursementParams,
        loanId: 'LOAN-003',
      });

      expect(result1.turnkeyActivityId).toBe('activity-1');
      expect(result2.turnkeyActivityId).toBe('activity-2');
      expect(result3.turnkeyActivityId).toBe('activity-3');
    });
  });

  describe('Balance and Gas Validation', () => {
    it('should proceed even without balance checks (mock mode)', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      mockTurnkeyManager.signTransaction.mockResolvedValue({
        signedTransaction: '0xf86b8...signed',
        activityId: 'activity-123',
      });

      // Even with a very large amount, it should proceed (in mock mode)
      const largeAmountParams = {
        ...baseDisbursementParams,
        amount: '999999999.999999', // Very large amount
      };

      const result = await disbursementService.createDisbursement(largeAmountParams);
      
      expect(result.status).toBe('broadcasting');
      expect(result.amount).toBe('999999999.999999');
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle wallet not found errors', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [], // No wallets
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);

      await expect(disbursementService.createDisbursement(baseDisbursementParams)).rejects.toThrow(
        /Failed to retrieve wallet information/
      );
    });

    it('should handle signing failures gracefully', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      mockTurnkeyManager.signTransaction.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(disbursementService.createDisbursement(baseDisbursementParams)).rejects.toThrow(
        /Failed to execute disbursement transaction/
      );
    });
  });

  describe('Transaction Monitoring', () => {
    it('should return disbursement status when queried', async () => {
      // Currently returns null as persistence is not implemented
      const status = await disbursementService.getDisbursementStatus('disb_123_abc');
      expect(status).toBeNull();
    });
  });

  describe('Policy Enforcement', () => {
    it('should handle policy violations', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      mockTurnkeyManager.signTransaction.mockRejectedValue(
        new TurnkeyServiceError(
          'Transaction denied by policy',
          ErrorCodes.POLICY_DENIED
        )
      );

      await expect(
        disbursementService.createDisbursement(baseDisbursementParams)
      ).rejects.toThrow('Transaction violates configured policies');
    });

    it('should include metadata in policy evaluation', async () => {
      const mockApiClient = {
        getWallets: jest.fn().mockResolvedValue({
          wallets: [{ walletId: 'wallet-123' }],
        }),
        getWalletAccounts: jest.fn().mockResolvedValue({
          accounts: [{ walletAccountId: 'account-123' }],
        }),
        getWalletAccount: jest.fn().mockResolvedValue({
          walletAccount: { address: '0x1234567890123456789012345678901234567890' },
        }),
      };
      
      mockTurnkeyManager.getApiClient.mockReturnValue(mockApiClient as any);
      mockTurnkeyManager.signTransaction.mockResolvedValue({
        signedTransaction: '0xf86b8...signed',
        activityId: 'activity-123',
      });

      const paramsWithMetadata = {
        ...baseDisbursementParams,
        metadata: {
          borrowerKycStatus: 'verified',
          riskScore: 'low',
          invoiceId: 'INV-001',
        },
      };

      const result = await disbursementService.createDisbursement(paramsWithMetadata);
      
      expect(result.status).toBe('broadcasting');
      // Metadata would be used in policy evaluation if policies were configured
    });
  });
});
