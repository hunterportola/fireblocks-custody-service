import { initializeMVPCustodyService, convertDisbursementRequest } from '../mvp-custody-integration';
import { TurnkeyClientManager } from '../../core/turnkey-client';

// Mock TurnkeyClientManager
jest.mock('../../core/turnkey-client');

describe('MVP Custody Integration', () => {
  beforeEach(() => {
    // Mock TurnkeyClientManager.initialize for MVP initialization
    const mockTurnkeyClient = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getInstance: jest.fn().mockReturnThis(),
    };
    
    (TurnkeyClientManager.initialize as jest.Mock).mockResolvedValue(undefined);
    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(mockTurnkeyClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('convertDisbursementRequest', () => {
    it('should correctly map lender_acme_corp to originator_demo with partner_default', () => {
      const apiRequest = {
        loanId: 'LOAN-123',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        amount: '100',
        assetType: 'USDC',
        chain: 'sepolia',
        metadata: { test: true },
      };

      const result = convertDisbursementRequest(apiRequest, 'lender_acme_corp');

      expect(result).toEqual({
        originatorId: 'originator_demo',
        partnerId: 'partner_default',
        loanId: 'LOAN-123',
        amount: '100',
        assetSymbol: 'USDC',
        chainId: '11155111',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        metadata: {
          test: true,
          requestedChain: 'sepolia',
        },
      });
    });

    it('should throw error for unknown lender', () => {
      const apiRequest = {
        loanId: 'LOAN-123',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        amount: '100',
        assetType: 'USDC',
        chain: 'sepolia',
      };

      expect(() => {
        convertDisbursementRequest(apiRequest, 'unknown_lender');
      }).toThrow('No originator mapping found for lender: unknown_lender');
    });

    it('should throw error for unsupported chain', () => {
      const apiRequest = {
        loanId: 'LOAN-123',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        amount: '100',
        assetType: 'USDC',
        chain: 'unsupported-chain',
      };

      expect(() => {
        convertDisbursementRequest(apiRequest, 'lender_acme_corp');
      }).toThrow("Unsupported chain 'unsupported-chain' for custody disbursement");
    });
  });

  describe('Mock Snapshot Integration', () => {
    it('should create custody service with partner_default for originator_demo', async () => {
      const custodyService = await initializeMVPCustodyService();
      expect(custodyService).toBeDefined();

      // Verify the service can process a disbursement request with partner_default
      const apiRequest = {
        loanId: 'LOAN-TEST-001',
        borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
        amount: '50',
        assetType: 'USDC',
        chain: 'sepolia',
      };

      const disbursementRequest = convertDisbursementRequest(apiRequest, 'lender_acme_corp');
      expect(disbursementRequest.partnerId).toBe('partner_default');
      expect(disbursementRequest.originatorId).toBe('originator_demo');
    });
  });
});
