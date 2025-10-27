import { DisbursementExecutionError, HttpJsonRpcClient, StaticTokenRegistry, TurnkeyDisbursementExecutor } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { SEPOLIA_USDC_ADDRESS } from '../constants';

const SEPOLIA_CHAIN_ID = '11155111';
const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

describe('Chain & Network Tests (Sepolia Only)', () => {
  describe('Sepolia support', () => {
    it('signs and broadcasts a Sepolia USDC transfer', async () => {
      const mockClient = {
        signAndSendTransaction: jest.fn().mockImplementation(async (params) => {
          const txHash = await params.broadcast('0xsigned');
          return {
            signedTransaction: '0xsigned',
            activityId: 'activity-1',
            transactionHash: txHash,
          };
        }),
      } as const;

      const mockRpc = {
        request: jest.fn().mockImplementation(async (chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            return '0xsepoliahash';
          }
          if (method === 'eth_estimateGas') {
            return '0x5208';
          }
          if (method === 'eth_getTransactionCount') {
            return '0x1';
          }
          if (method === 'eth_gasPrice') {
            return '0x3b9aca00';
          }
          throw new Error(`Unexpected RPC method ${method} for chain ${chainId}`);
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry: new StaticTokenRegistry([
          {
            symbol: 'USDC',
            chainId: SEPOLIA_CHAIN_ID,
            contractAddress: SEPOLIA_USDC,
            decimals: 6,
          },
        ]),
        rpcClient: mockRpc,
      });

      const result = await executor.execute(createMockContext());

      expect(result.status).toBe('submitted');
      expect(result.transactionHash).toBe('0xsepoliahash');
      expect(mockClient.signAndSendTransaction).toHaveBeenCalledTimes(1);
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_sendRawTransaction', expect.any(Array));
    });

    it('throws when USDC token metadata is missing', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: {
          signTransaction: jest.fn(),
        } as any,
        tokenRegistry: new StaticTokenRegistry([]),
        rpcClient: {
          request: jest.fn(),
        },
      });

      await expect(executor.execute(createMockContext())).rejects.toMatchObject({
        code: 'TOKEN_NOT_CONFIGURED',
      });
    });
  });

  describe('Network failures', () => {
    it('bubbles up RPC timeouts', async () => {
      const timeoutRpc = {
        request: jest.fn().mockImplementation(async () => {
          throw new Error('Request timeout');
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: {
          signTransaction: jest.fn(),
        } as any,
        tokenRegistry: new StaticTokenRegistry([
          {
            symbol: 'USDC',
            chainId: SEPOLIA_CHAIN_ID,
            contractAddress: SEPOLIA_USDC,
            decimals: 6,
          },
        ]),
        rpcClient: timeoutRpc,
      });

      await expect(executor.execute(createMockContext())).rejects.toThrow('Request timeout');
    });

    it('handles rate limit responses gracefully', async () => {
      const rpcClient = new HttpJsonRpcClient(
        { [SEPOLIA_CHAIN_ID]: 'https://example.com' },
        async () => ({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: { message: 'Rate limit exceeded' } }),
        })
      );

      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_gasPrice', [])
      ).rejects.toBeInstanceOf(DisbursementExecutionError);
    });

    it('throws descriptive error when endpoint missing', async () => {
      const rpcClient = new HttpJsonRpcClient({});

      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_gasPrice', [])
      ).rejects.toMatchObject({ code: 'RPC_ENDPOINT_NOT_CONFIGURED' });
    });
  });

  describe('Gas price edge cases', () => {
    it('passes through extreme gas price spikes', async () => {
      const mockClient = {
        signAndSendTransaction: jest.fn().mockImplementation(async (params) => {
          const transactionHash = await params.broadcast('0xsigned');
          return {
            signedTransaction: '0xsigned',
            activityId: 'activity-1',
            transactionHash,
          };
        }),
      } as any;

      const highGasRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_gasPrice') {
            return '0x3b9aca0000';
          }
          if (method === 'eth_sendRawTransaction') {
            return '0xhighgas';
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient,
        tokenRegistry: new StaticTokenRegistry([
          {
            symbol: 'USDC',
            chainId: SEPOLIA_CHAIN_ID,
            contractAddress: SEPOLIA_USDC,
            decimals: 6,
          },
        ]),
        rpcClient: highGasRpc,
      });

      const result = await executor.execute(createMockContext());
      expect(result.transactionHash).toBe('0xhighgas');
      expect(highGasRpc.request).toHaveBeenCalledWith(SEPOLIA_CHAIN_ID, 'eth_gasPrice', []);
    });

    it('handles zero gas price responses', async () => {
      const mockClient = {
        signAndSendTransaction: jest.fn().mockImplementation(async (params) => {
          const transactionHash = await params.broadcast('0xsigned');
          return {
            signedTransaction: '0xsigned',
            activityId: 'activity-1',
            transactionHash,
          };
        }),
      } as any;

      const zeroGasRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_gasPrice') {
            return '0x0';
          }
          if (method === 'eth_sendRawTransaction') {
            return '0xzerogas';
          }
          return '0x1';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient,
        tokenRegistry: new StaticTokenRegistry([
          {
            symbol: 'USDC',
            chainId: SEPOLIA_CHAIN_ID,
            contractAddress: SEPOLIA_USDC,
            decimals: 6,
          },
        ]),
        rpcClient: zeroGasRpc,
      });

      const result = await executor.execute(createMockContext());
      expect(result.transactionHash).toBe('0xzerogas');
    });
  });

  describe('RPC endpoint configuration', () => {
    it('accepts user-provided endpoints', () => {
      const rpcClient = new HttpJsonRpcClient({
        [SEPOLIA_CHAIN_ID]: 'https://custom-sepolia.example.com',
      });

      expect(rpcClient).toBeDefined();
    });
  });
});

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
      walletFlows: [
        {
          flowId: 'distribution',
          walletTemplateId: 'template-1',
          walletId: 'wallet-1',
          accountIdByAlias: { primary: 'account-1' },
          accountAddressByAlias: { primary: '0x1234567890123456789012345678901234567890' },
        },
      ],
      policies: [],
      partners: [
        {
          partnerId: 'LP-1',
          walletFlows: { distribution: 'wallet-1' },
          policyIds: [],
        },
      ],
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
