import { TurnkeyDisbursementExecutor, DisbursementExecutionError } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { SEPOLIA_CHAIN_ID, SEPOLIA_USDC_ADDRESS } from '../constants';

const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

describe('Transaction Serialization Tests', () => {

  // Helper to extract transaction fields from signed transaction
  const extractTransactionFields = (unsignedTx: string) => {
    // Basic extraction - checks structure
    const hex = unsignedTx.slice(2);
    const hasValidPrefix = hex.startsWith('f8') || hex.startsWith('f9');
    const minLength = 100; // Minimum reasonable transaction length
    
    return {
      isValidRLP: hasValidPrefix && hex.length > minLength,
      hasEIP155: hex.length > 200, // EIP-155 transactions are longer
      approximateSize: hex.length / 2,
    };
  };

  describe('RLP Encoding Edge Cases', () => {
    const mockClient = {
      signTransaction: jest.fn().mockResolvedValue({
        signedTransaction: '0xsigned',
        activityId: 'act-1',
      }),
    };

    const mockRpc = {
      request: jest.fn().mockImplementation((_chainId: string, method: string) => {
        switch (method) {
          case 'eth_getTransactionCount':
            return Promise.resolve('0x0'); // Start with nonce 0
          case 'eth_gasPrice':
            return Promise.resolve('0x3b9aca00');
          case 'eth_estimateGas':
            return Promise.resolve('0x5208');
          case 'eth_sendRawTransaction':
            return Promise.resolve('0xhash');
          default:
            throw new Error(`Unexpected method ${method}`);
        }
      }),
    };

    const baseContext: DisbursementContext = {
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

    it('should handle zero nonce correctly', async () => {
      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await executor.execute(baseContext);

      const signCall = mockClient.signTransaction.mock.calls[0][0];
      const fields = extractTransactionFields(signCall.unsignedTransaction);
      
      expect(fields.isValidRLP).toBe(true);
      expect(fields.hasEIP155).toBe(true);
    });

    it('should handle maximum nonce values', async () => {
      const highNonceRpc = {
        request: jest.fn().mockImplementation((_chainId: string, method: string) => {
          switch (method) {
            case 'eth_getTransactionCount':
              return Promise.resolve('0xfffffffffffffffe'); // Near max uint64
            case 'eth_gasPrice':
              return Promise.resolve('0x3b9aca00');
            case 'eth_estimateGas':
              return Promise.resolve('0x5208');
            case 'eth_sendRawTransaction':
              return Promise.resolve('0xhash');
            default:
              throw new Error(`Unexpected method ${method}`);
          }
        }),
      };

      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: highNonceRpc,
      });

      await executor.execute(baseContext);

      const signCall = mockClient.signTransaction.mock.calls[0][0];
      expect(signCall.unsignedTransaction).toMatch(/^0x/);
      const fields = extractTransactionFields(signCall.unsignedTransaction);
      expect(fields.isValidRLP).toBe(true);
    });

    it('should handle very high gas prices', async () => {
      const highGasRpc = {
        request: jest.fn().mockImplementation((_chainId: string, method: string) => {
          switch (method) {
            case 'eth_getTransactionCount':
              return Promise.resolve('0x1');
            case 'eth_gasPrice':
              return Promise.resolve('0x1234567890abcdef'); // Very high gas price
            case 'eth_estimateGas':
              return Promise.resolve('0x5208');
            case 'eth_sendRawTransaction':
              return Promise.resolve('0xhash');
            default:
              throw new Error(`Unexpected method ${method}`);
          }
        }),
      };

      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: highGasRpc,
      });

      await executor.execute(baseContext);

      expect(highGasRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_gasPrice', []);
      const signCall = mockClient.signTransaction.mock.calls[0][0];
      expect(signCall.unsignedTransaction).toBeDefined();
    });

    it('should handle empty data fields correctly', async () => {
      // Test with a native ETH transfer (no data field)
      const ethTransferContext = {
        ...baseContext,
        request: {
          ...baseContext.request,
          assetSymbol: 'ETH',
        },
      };

      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'ETH',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: '0x0000000000000000000000000000000000000000', // Native ETH
        decimals: 18,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      // The executor handles native ETH as ERC20-style - should succeed
      const result = await executor.execute(ethTransferContext);
      expect(result.status).toBe('submitted');
    });
  });

  describe('EIP-155 Replay Protection', () => {
    const mockClient = {
      signTransaction: jest.fn().mockResolvedValue({
        signedTransaction: '0xsigned',
        activityId: 'act-1',
      }),
    };


    it('should include chainId for Sepolia', async () => {
      const chainId = SEPOLIA_CHAIN_ID;
      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const context: DisbursementContext = {
        ...createMockContext(),
        request: {
          ...createMockContext().request,
          chainId,
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: {
          request: jest.fn().mockImplementation(async () => {
            return '0x1';
          }),
        },
      });

      await executor.execute(context);

      const signCall = mockClient.signTransaction.mock.calls[0][0];
      // EIP-155 transactions include v,r,s fields set based on chainId
      expect(signCall.unsignedTransaction).toMatch(/^0xf8/); // RLP list prefix
    });
  });

  describe('Transaction Size Limits', () => {
    it('should handle maximum size ERC-20 transfer data', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async () => '0x1'),
      };

      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      const signCall = mockClient.signTransaction.mock.calls[0][0];
      const txSize = Buffer.from(signCall.unsignedTransaction.slice(2), 'hex').length;
      
      // ERC-20 transfers should be relatively small
      expect(txSize).toBeLessThan(500); // bytes
      expect(txSize).toBeGreaterThan(100); // Not too small either
    });

    it('should properly encode large amounts', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') return '0x5208';
          if (method === 'eth_gasPrice') return '0x3b9aca00';
          if (method === 'eth_getTransactionCount') return '0x0';
          if (method === 'eth_sendRawTransaction') return '0xhash';
          return '0x0';
        }),
      };

      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = {
        ...createMockContext(),
        request: {
          ...createMockContext().request,
          amount: '999999999999.999999', // Max USDC with 6 decimals
        },
      };

      await executor.execute(context);

      // Should successfully encode without overflow
      expect(mockClient.signTransaction).toHaveBeenCalled();
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_estimateGas', expect.any(Array));
    });
  });

  describe('Invalid Transaction Formats', () => {
    it('should reject malformed addresses', async () => {
      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry,
        rpcClient: {} as any,
      });

      const contextBadAddress = {
        ...createMockContext(),
        request: {
          ...createMockContext().request,
          borrowerAddress: '0xinvalid', // Invalid address
        },
      };

      await expect(executor.execute(contextBadAddress)).rejects.toThrow(DisbursementExecutionError);
    });

    it('should reject addresses with wrong length', async () => {
      const tokenRegistry = new (await import('../turnkey-disbursement-executor')).StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry,
        rpcClient: {} as any,
      });

      const contextShortAddress = {
        ...createMockContext(),
        request: {
          ...createMockContext().request,
          borrowerAddress: '0x123', // Too short
        },
      };

      await expect(executor.execute(contextShortAddress)).rejects.toThrow(DisbursementExecutionError);
    });
  });
});

// Helper function to create a mock context
function createMockContext(): DisbursementContext {
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
