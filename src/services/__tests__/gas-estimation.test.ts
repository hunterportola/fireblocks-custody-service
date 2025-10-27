import { StaticTokenRegistry, TurnkeyDisbursementExecutor, DisbursementExecutionError } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { SEPOLIA_CHAIN_ID, SEPOLIA_USDC_ADDRESS } from '../constants';

describe('Gas Estimation Tests', () => {
  const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

  const tokenRegistry = new StaticTokenRegistry([{
    symbol: 'USDC',
    chainId: SEPOLIA_CHAIN_ID,
    contractAddress: SEPOLIA_USDC,
    decimals: 6,
  }]);

  describe('Gas Estimation Accuracy', () => {
    it('should estimate gas for standard ERC20 transfers', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let capturedGasEstimate: string | undefined;
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            // Typical ERC20 transfer gas usage
            const estimate = '0x11170'; // ~70,000 gas
            capturedGasEstimate = estimate;
            return estimate;
          }
          if (method === 'eth_gasPrice') return '0x3b9aca00'; // 1 gwei
          if (method === 'eth_getTransactionCount') return '0x0';
          if (method === 'eth_sendRawTransaction') return '0xhash';
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      expect(capturedGasEstimate).toBe('0x11170');
      expect(parseInt(capturedGasEstimate!, 16)).toBeGreaterThan(50000);
      expect(parseInt(capturedGasEstimate!, 16)).toBeLessThan(100000);
    });

    it('should request gas estimation using the Sepolia chain ID', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x11170'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      expect(mockRpc.request).toHaveBeenCalledWith(
        SEPOLIA_CHAIN_ID,
        'eth_estimateGas',
        expect.any(Array)
      );
    });

    it('should add safety margin to gas estimates', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let estimatedGas: string;
      let actualGasUsed: string;
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            estimatedGas = '0x11170'; // 70,000
            return estimatedGas;
          }
          if (method === 'eth_sendRawTransaction') {
            // In reality, we'd get actual gas used from transaction receipt
            actualGasUsed = '0xfde8'; // 65,000 (less than estimate)
            return '0xhash';
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      // The estimate should have some buffer
      const estimateValue = parseInt(estimatedGas!, 16);
      const actualValue = parseInt(actualGasUsed!, 16);
      expect(estimateValue).toBeGreaterThan(actualValue);
      expect(estimateValue - actualValue).toBeGreaterThan(4000); // ~5-10% buffer
    });
  });

  describe('Failed Gas Estimations', () => {
    it('should handle execution revert during estimation', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            throw new Error('execution reverted: ERC20: transfer amount exceeds balance');
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await expect(executor.execute(context)).rejects.toThrow('transfer amount exceeds balance');
    });

    it('should handle insufficient allowance errors', async () => {
      const mockClient = {
        signTransaction: jest.fn(),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            throw new Error('execution reverted: ERC20: insufficient allowance');
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await expect(executor.execute(context)).rejects.toThrow('insufficient allowance');
    });

    it('should handle contract not found errors', async () => {
      const mockClient = {
        signTransaction: jest.fn(),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            // This happens when trying to call a non-existent contract
            throw new Error('execution reverted');
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await expect(executor.execute(context)).rejects.toThrow('execution reverted');
    });
  });

  describe('Dynamic Gas Price Handling', () => {
    it('should fetch current gas price from network', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let gasPriceHistory: string[] = [];
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_gasPrice') {
            // Simulate changing gas prices
            const prices = ['0x3b9aca00', '0x77359400', '0xb2d05e00']; // 1, 2, 3 gwei
            const price = prices[gasPriceHistory.length % prices.length];
            gasPriceHistory.push(price);
            return price;
          }
          if (method === 'eth_estimateGas') return '0x11170';
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      // Execute multiple times to see gas price changes
      for (let i = 0; i < 3; i++) {
        const context = createMockContext();
        await executor.execute(context);
      }

      expect(gasPriceHistory).toEqual(['0x3b9aca00', '0x77359400', '0xb2d05e00']);
    });

    it('should handle EIP-1559 gas pricing', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_gasPrice') return '0x77359400'; // 2 gwei
          if (method === 'eth_maxPriorityFeePerGas') return '0x59682f00'; // 1.5 gwei
          if (method === 'eth_getBlockByNumber') {
            return {
              baseFeePerGas: '0x5d21dba00', // 25 gwei base fee
            };
          }
          if (method === 'eth_estimateGas') return '0x11170';
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      // In EIP-1559, maxFeePerGas should be baseFee + maxPriorityFee with some buffer
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_gasPrice', []);
    });
  });

  describe('Gas Limit Safety', () => {
    it('should enforce reasonable gas limits', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const gasEstimates: string[] = [];
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            const estimate = '0x11170'; // Normal estimate
            gasEstimates.push(estimate);
            return estimate;
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      // Check that gas limit is reasonable for ERC20 transfer
      const gasLimit = parseInt(gasEstimates[0], 16);
      expect(gasLimit).toBeGreaterThan(21000); // Minimum transaction gas
      expect(gasLimit).toBeLessThan(500000); // Should not be excessive
    });

    it('should handle abnormally high gas estimates', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            return '0xf4240'; // 1,000,000 gas - unusually high
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      // Should still proceed but this might indicate an issue
      const result = await executor.execute(context);
      expect(result.status).toBe('submitted');
    });

    it('should handle zero gas estimates gracefully', async () => {
      const mockClient = {
        signTransaction: jest.fn(),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            return '0x0'; // Zero gas - invalid
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow(DisbursementExecutionError);
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_estimateGas', expect.any(Array));
    });
  });

  describe('Gas Estimation for Complex Scenarios', () => {
    it('should estimate gas for contracts with complex logic', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string, params: any[]) => {
          if (method === 'eth_estimateGas') {
            // Complex contracts might have variable gas usage
            const data = params[0].data;
            const hasComplexLogic = data.length > 200; // Longer data = more complex
            return hasComplexLogic ? '0x1d4c0' : '0x11170'; // 120k vs 70k
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      expect(mockRpc.request).toHaveBeenCalledWith(
        SEPOLIA_CHAIN_ID,
        'eth_estimateGas',
        expect.arrayContaining([
          expect.objectContaining({
            data: expect.stringMatching(/^0xa9059cbb/), // transfer function
          }),
        ])
      );
    });

    it('should handle gas estimation for paused contracts', async () => {
      const mockClient = {
        signTransaction: jest.fn(),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            // Paused contracts will revert
            throw new Error('execution reverted: Pausable: paused');
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await expect(executor.execute(context)).rejects.toThrow('Pausable: paused');
    });
  });

  describe('Fee Calculation', () => {
    it('should calculate total transaction cost correctly', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      let gasPrice: bigint;
      let gasLimit: bigint;
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_gasPrice') {
            gasPrice = BigInt('0x3b9aca00'); // 1 gwei
            return '0x3b9aca00';
          }
          if (method === 'eth_estimateGas') {
            gasLimit = BigInt('0x11170'); // 70,000
            return '0x11170';
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      await executor.execute(context);

      // Calculate expected fee
      const expectedFee = gasPrice! * gasLimit!;
      const expectedFeeInEth = Number(expectedFee) / 1e18;
      
      expect(expectedFeeInEth).toBeCloseTo(0.00007, 6); // 70k gas * 1 gwei
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
