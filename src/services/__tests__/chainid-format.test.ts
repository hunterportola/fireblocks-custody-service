import { StaticTokenRegistry, TurnkeyDisbursementExecutor, HttpJsonRpcClient } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { SEPOLIA_USDC_ADDRESS } from '../constants';

describe('ChainId Format Handling', () => {
  const SEPOLIA_HEX = '0xaa36a7';
  const SEPOLIA_DECIMAL = '11155111';
  const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

  describe('Token Registry with Hex ChainId', () => {
    it('should resolve tokens when registry uses hex and request uses hex', async () => {
      const tokenRegistry = new StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_HEX,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (chainId: string, method: string) => {
          expect(chainId).toBe(SEPOLIA_HEX); // Should preserve hex format
          const responses: Record<string, string> = {
            eth_getTransactionCount: '0x0',
            eth_gasPrice: '0x3b9aca00',
            eth_estimateGas: '0x11170',
            eth_sendRawTransaction: '0xhash',
          };
          return responses[method] || '0x0';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext({ chainId: SEPOLIA_HEX });
      const result = await executor.execute(context);
      
      expect(result.status).toBe('submitted');
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_HEX, expect.any(String), expect.any(Array));
    });

    it('should fail when registry uses hex but request uses decimal', async () => {
      const tokenRegistry = new StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_HEX,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry,
        rpcClient: {} as any,
      });

      const context = createMockContext({ chainId: SEPOLIA_DECIMAL });
      
      await expect(executor.execute(context)).rejects.toThrow('Token USDC is not configured for chain ' + SEPOLIA_DECIMAL);
    });
  });

  describe('Token Registry with Decimal ChainId', () => {
    it('should resolve tokens when registry uses decimal and request uses decimal', async () => {
      const tokenRegistry = new StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_DECIMAL,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (chainId: string, method: string) => {
          expect(chainId).toBe(SEPOLIA_DECIMAL); // Should preserve decimal format
          const responses: Record<string, string> = {
            eth_getTransactionCount: '0x0',
            eth_gasPrice: '0x3b9aca00',
            eth_estimateGas: '0x11170',
            eth_sendRawTransaction: '0xhash',
          };
          return responses[method] || '0x0';
        }),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext({ chainId: SEPOLIA_DECIMAL });
      const result = await executor.execute(context);
      
      expect(result.status).toBe('submitted');
      expect(mockRpc.request).toHaveBeenCalledWith(SEPOLIA_DECIMAL, expect.any(String), expect.any(Array));
    });
  });

  describe('RPC Client with Mixed ChainId Formats', () => {
    it('should handle RPC endpoints keyed by hex when request uses hex', async () => {

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: '0x1',
        }),
      });

      const rpcClient = new HttpJsonRpcClient(
        { [SEPOLIA_HEX]: 'https://sepolia.example.com' },
        mockFetch as any
      );

      const result = await rpcClient.request(SEPOLIA_HEX, 'eth_blockNumber', []);
      expect(result).toBe('0x1');
      expect(mockFetch).toHaveBeenCalledWith('https://sepolia.example.com', expect.any(Object));
    });

    it('should throw when RPC endpoint not found due to format mismatch', async () => {
      const rpcClient = new HttpJsonRpcClient(
        { [SEPOLIA_HEX]: 'https://sepolia.example.com' }, // Keyed by hex
      );

      // Request with decimal should fail
      await expect(
        rpcClient.request(SEPOLIA_DECIMAL, 'eth_blockNumber', [])
      ).rejects.toThrow('RPC endpoint not configured for chain ' + SEPOLIA_DECIMAL);
    });
  });

  describe('Invalid ChainId Handling', () => {
    it('should reject invalid chainId formats', async () => {
      const tokenRegistry = new StaticTokenRegistry([{
        symbol: 'USDC',
        chainId: SEPOLIA_HEX,
        contractAddress: SEPOLIA_USDC,
        decimals: 6,
      }]);

      const executor = new TurnkeyDisbursementExecutor({
        client: {} as any,
        tokenRegistry,
        rpcClient: {} as any,
      });

      const invalidChainIds = ['', '0x', 'invalid', '0xgg', '-1'];

      for (const chainId of invalidChainIds) {
        const context = createMockContext({ chainId });
        await expect(executor.execute(context)).rejects.toThrow('Invalid chain ID');
      }
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
      chainId: '11155111',
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