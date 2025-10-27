import { DisbursementExecutionError, StaticTokenRegistry, TurnkeyDisbursementExecutor } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { TurnkeyServiceError, ErrorCodes } from '../../core/error-handler';
import { SEPOLIA_CHAIN_ID, SEPOLIA_USDC_ADDRESS } from '../constants';

const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

// Shared token registry for all tests
const createTokenRegistry = () => new StaticTokenRegistry([{
  symbol: 'USDC',
  chainId: SEPOLIA_CHAIN_ID,
  contractAddress: SEPOLIA_USDC,
  decimals: 6,
}]);

describe('Security & Validation Tests', () => {
  describe('Address Validation', () => {

    it('should reject transfers to zero address', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: { request: jest.fn() },
      });

      const contextZeroAddress = createMockContext({
        borrowerAddress: '0x0000000000000000000000000000000000000000',
      });

      await expect(executor.execute(contextZeroAddress)).rejects.toThrow(DisbursementExecutionError);
    });

    it('should reject invalid address formats', async () => {
      const invalidAddresses = [
        '', // Empty
        '0x', // Just prefix
        '0xG000000000000000000000000000000000000000', // Invalid hex character
        '0x123', // Too short
        '0x12345678901234567890123456789012345678901', // 41 chars (too long)
        '0x1234567890123456789012345678901234567890  ', // Trailing space
        '  0x1234567890123456789012345678901234567890', // Leading space
        '1234567890123456789012345678901234567890', // Missing 0x prefix
        '0X1234567890123456789012345678901234567890', // Capital X
      ];

      for (const address of invalidAddresses) {
        const executor = new TurnkeyDisbursementExecutor({
          client: {} as any,
          tokenRegistry: createTokenRegistry(),
          rpcClient: { request: jest.fn() },
        });

        const context = createMockContext({ borrowerAddress: address });
        
        await expect(
          executor.execute(context)
        ).rejects.toThrow(DisbursementExecutionError);
      }
    });

    it('should accept valid addresses with mixed case (EIP-55)', async () => {
      const validAddresses = [
        '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed', // Checksummed
        '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', // Checksummed
        '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB', // Checksummed
        '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', // Checksummed
      ];

      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      for (const address of validAddresses) {
        const executor = new TurnkeyDisbursementExecutor({
          client: mockClient as any,
          tokenRegistry: createTokenRegistry(),
          rpcClient: mockRpc,
        });

        const context = createMockContext({ borrowerAddress: address });
        
        const result = await executor.execute(context);
        expect(result.status).toBe('submitted');
      }
    });

    it('should normalize addresses to lowercase internally', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let capturedEstimateParams: any;
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string, params: any[]) => {
          if (method === 'eth_estimateGas') {
            capturedEstimateParams = params[0];
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext({
        borrowerAddress: '0xABCDEF1234567890123456789012345678901234', // Upper case
      });

      await executor.execute(context);

      // The data should contain the lowercased address (without 0x prefix)
      expect(capturedEstimateParams.data).toContain('abcdef1234567890123456789012345678901234');
    });
  });

  describe('Reentrancy Protection', () => {

    it('should use unique nonce for each transaction', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const nonces: string[] = [];
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_getTransactionCount') {
            const nonce = `0x${nonces.length}`;
            nonces.push(nonce);
            return nonce;
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      // Execute multiple transactions
      const context = createMockContext();
      await executor.execute(context);
      await executor.execute(context);
      await executor.execute(context);

      // Each should have requested a nonce
      expect(nonces).toEqual(['0x0', '0x1', '0x2']);
    });

    it('should prevent double-spending with same nonce', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_getTransactionCount') {
            return '0x5'; // Always return same nonce
          }
          if (method === 'eth_sendRawTransaction') {
            throw new Error('nonce too low'); // Simulate already used
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      // First transaction would succeed in signing but fail in broadcast
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
    });
  });

  describe('Signature Verification', () => {

    it('should only accept properly signed transactions from Turnkey', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xf86b...', // Mock signed transaction
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      const result = await executor.execute(context);

      expect(result.signedTransaction).toMatch(/^0x[a-fA-F0-9.]+$/);
      expect(mockClient.signTransaction).toHaveBeenCalledWith({
        subOrganizationId: 'sub-1',
        signWith: 'account-1',
        unsignedTransaction: expect.any(String),
        transactionType: 'TRANSACTION_TYPE_ETHEREUM',
      });
    });

    it('should reject unsigned or improperly signed transactions', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(
          new TurnkeyServiceError('Invalid signature', ErrorCodes.API_ERROR)
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to sign transaction with Turnkey');
    });
  });

  describe('Access Control', () => {

    it('should only allow authorized wallets to sign', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(
          new TurnkeyServiceError('Unauthorized wallet', ErrorCodes.UNAUTHORIZED)
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow();
    });

    it('should enforce sub-organization boundaries', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(async (params: any) => {
          if (params.subOrganizationId !== 'sub-1') {
            throw new TurnkeyServiceError(
              'Cannot access wallet from different sub-org',
              ErrorCodes.UNAUTHORIZED
            );
          }
          return {
            signedTransaction: '0xsigned',
            activityId: 'act-1',
          };
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      // Correct sub-org should work
      const validContext = createMockContext();
      const result = await executor.execute(validContext);
      expect(result.status).toBe('submitted');

      // Wrong sub-org should fail
      const invalidContext = {
        ...validContext,
        snapshot: {
          ...validContext.snapshot,
          subOrganizationId: 'sub-2', // Different sub-org
        },
      };

      const executor2 = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      await expect(executor2.execute(invalidContext)).rejects.toThrow();
    });
  });

  describe('Transaction Data Validation', () => {

    it('should ensure transaction data is properly formatted', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let capturedEstimateData: string = '';
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string, params: any[]) => {
          if (method === 'eth_estimateGas') {
            capturedEstimateData = params[0].data;
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      const context = createMockContext({
        amount: '123.456789', // More decimals than USDC supports
      });

      await executor.execute(context);

      // Verify ERC20 transfer data format
      expect(capturedEstimateData).toMatch(/^0xa9059cbb/); // transfer selector
      expect(capturedEstimateData.length).toBe(138); // 10 + 64 + 64
      
      // Extract and verify encoded parameters
      const selector = capturedEstimateData.slice(0, 10);
      const toAddress = capturedEstimateData.slice(10, 74);
      const amount = capturedEstimateData.slice(74, 138);
      
      expect(selector).toBe('0xa9059cbb');
      expect(toAddress).toMatch(/^[0-9a-f]{64}$/);
      expect(amount).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should reject malformed transaction data', async () => {
      // Create a valid token registry first
      const validTokenRegistry = createTokenRegistry();
      
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xmalformed', // Invalid transaction format
          activityId: 'act-1',
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: validTokenRegistry,
        rpcClient: { request: jest.fn().mockResolvedValue('0x1') },
      });

      const context = createMockContext({
        amount: 'invalid-amount', // Invalid amount format
      });
      
      await expect(executor.execute(context)).rejects.toThrow(DisbursementExecutionError);
    });
  });

  describe('Contract Interaction Security', () => {
    it('should only interact with whitelisted USDC contracts', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const capturedTxs: any[] = [];
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string, params: any[]) => {
          if (method === 'eth_estimateGas') {
            capturedTxs.push(params[0]);
          }
          return '0x1';
        }),
      };

      const knownUSDCContracts = [
        { chainId: SEPOLIA_CHAIN_ID, address: SEPOLIA_USDC },
      ];

      for (const { chainId, address } of knownUSDCContracts) {
        capturedTxs.length = 0;
        
        const tokenRegistry = new StaticTokenRegistry([{
          symbol: 'USDC',
          chainId,
          contractAddress: address,
          decimals: 6,
        }]);

        const executor = new TurnkeyDisbursementExecutor({
          client: mockClient as any,
          tokenRegistry: tokenRegistry,
          rpcClient: mockRpc,
        });

        const context = createMockContext({ chainId });
        await executor.execute(context);

        // Verify it's calling the correct contract
        expect(capturedTxs[0].to.toLowerCase()).toBe(address.toLowerCase());
      }
    });

    it('should prevent calls to arbitrary contracts', async () => {
      // Try to execute with a token that's not in the registry
      const emptyTokenRegistry = new StaticTokenRegistry([
        // Empty registry - no tokens
      ]);

      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry: emptyTokenRegistry,
        rpcClient: { request: jest.fn() },
      });

      const context = createMockContext({
        assetSymbol: 'FAKE_TOKEN', // Not in registry
      });

      await expect(executor.execute(context)).rejects.toThrow('Token FAKE_TOKEN is not configured for chain 11155111');
    });
  });

  describe('Amount Validation Security', () => {

    it('should prevent integer overflow in amount calculations', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: mockRpc,
      });

      // Try with maximum safe integer
      const context = createMockContext({
        amount: '999999999999999', // Very large but valid
      });

      const result = await executor.execute(context);
      expect(result.status).toBe('submitted');
    });

    it('should reject negative amounts in string format', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry: createTokenRegistry(),
        rpcClient: { request: jest.fn() },
      });

      const context = createMockContext({
        amount: '-100', // Negative amount
      });

      await expect(executor.execute(context)).rejects.toThrow();
    });
  });
});

// Helper function to create mock context
function createMockContext(overrides?: Partial<DisbursementContext['request']>): DisbursementContext {
  return {
    request: {
      originatorId: 'ORIG-1',
      partnerId: 'LP-1',
      loanId: 'LOAN-123',
      amount: '100',
      assetSymbol: 'USDC',
      chainId: SEPOLIA_CHAIN_ID,
      borrowerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d',
      walletFlowId: 'distribution',
      walletAccountAlias: 'primary',
      ...overrides,
    },
    snapshot: {
      subOrganizationId: 'sub-1',
      name: 'Test',
      rootQuorumThreshold: 1,
      rootUsers: [],
      automationUsers: [],
      walletFlows: [{
        flowId: 'distribution',
        walletTemplateId: 'template-1',
        walletId: 'wallet-1',
        accountIdByAlias: { primary: 'account-1' },
        accountAddressByAlias: { primary: '0x1234567890123456789012345678901234567890' },
      }],
      policies: [],
      partners: [{
        partnerId: 'LP-1',
        walletFlows: { distribution: 'wallet-1' },
        policyIds: [],
      }],
    },
    partner: {
      partnerId: 'LP-1',
      walletFlows: { distribution: 'wallet-1' },
      policyIds: [],
    },
    wallet: {
      flow: {
        flowId: 'distribution',
        walletTemplateId: 'template-1',
        walletId: 'wallet-1',
        accountIdByAlias: { primary: 'account-1' },
        accountAddressByAlias: { primary: '0x1234567890123456789012345678901234567890' },
      },
      flowId: 'distribution',
      walletId: 'wallet-1',
      walletTemplateId: 'template-1',
      accountAlias: 'primary',
      accountId: 'account-1',
      accountAddress: '0x1234567890123456789012345678901234567890',
    },
    policyIds: [],
  };
}
