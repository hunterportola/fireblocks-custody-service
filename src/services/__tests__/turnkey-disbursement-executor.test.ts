import type { DisbursementContext } from '../turnkey-custody-service';
import {
  DisbursementExecutionError,
  HttpJsonRpcClient,
  StaticTokenRegistry,
  TurnkeyDisbursementExecutor,
  type TokenMetadata,
} from '../turnkey-disbursement-executor';
import { SEPOLIA_USDC_ADDRESS } from '../constants';

describe('TurnkeyDisbursementExecutor - Comprehensive Tests', () => {
  const SEPOLIA_CHAIN_ID = '11155111';
  const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;
  const snapshot = {
    subOrganizationId: 'sub-org-123',
    name: 'Test Suborg',
    rootQuorumThreshold: 2,
    rootUsers: [],
    automationUsers: [
      {
        templateId: 'auto-1',
        userId: 'user-1',
        apiKeyId: 'api-1',
        apiKeyIds: ['api-1'],
      },
    ],
    walletFlows: [
      {
        flowId: 'distribution',
        walletTemplateId: 'wallet-template-1',
        walletId: 'wallet-1',
        accountIdByAlias: { primary: 'acct-1' },
        accountAddressByAlias: { primary: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa' },
      },
    ],
    policies: [],
    partners: [
      {
        partnerId: 'LP-1',
        walletFlows: { distribution: 'wallet-1' },
        policyIds: ['policy-1'],
        automationUserTemplateId: 'auto-1',
      },
    ],
    metadata: {
      originatorId: 'ORIG-1',
    },
  };

  const baseRequest = {
    originatorId: 'ORIG-1',
    partnerId: 'LP-1',
    loanId: 'LOAN-123',
    amount: '100.5',
    assetSymbol: 'USDC',
    chainId: SEPOLIA_CHAIN_ID,
    borrowerAddress: '0xbBbbbbBBBBbbbbBBbBbbbbBBbbBbbbbBbBbbBBbB',
  };

  const partner = snapshot.partners[0]!;
  const walletFlow = snapshot.walletFlows[0]!;

  const baseContext: DisbursementContext = {
    request: baseRequest,
    snapshot,
    partner,
    policyIds: ['policy-1'],
    wallet: {
      flow: walletFlow,
      flowId: walletFlow.flowId,
      walletId: walletFlow.walletId,
      walletTemplateId: walletFlow.walletTemplateId,
      accountAlias: 'primary',
      accountId: walletFlow.accountIdByAlias.primary,
      accountAddress: walletFlow.accountAddressByAlias?.primary,
    },
    automation: {
      templateId: 'auto-1',
      userId: 'user-1',
      apiKeyId: 'api-1',
    },
  };

  const tokenRegistry = new StaticTokenRegistry([
    {
      symbol: 'USDC',
      chainId: SEPOLIA_CHAIN_ID,
      contractAddress: SEPOLIA_USDC,
      decimals: 6,
    },
  ]);

  const mockRpc = {
    request: jest.fn().mockImplementation((_chainId: string, method: string) => {
      switch (method) {
        case 'eth_getTransactionCount':
          return Promise.resolve('0x1');
        case 'eth_gasPrice':
          return Promise.resolve('0x3b9aca00'); // 1 gwei
        case 'eth_estimateGas':
          return Promise.resolve('0x5208'); // 21000
        case 'eth_sendRawTransaction':
          return Promise.resolve('0xdeadbeef');
        default:
          throw new Error(`Unexpected method ${method}`);
      }
    }),
  };

  const mockTurnkeyClient = {
    signAndSendTransaction: jest.fn().mockImplementation(async (params) => {
      const transactionHash = await params.broadcast('0xsignedpayload');
      return {
        signedTransaction: '0xsignedpayload',
        activityId: 'activity-1',
        transactionHash,
      };
    }),
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('builds, signs, and broadcasts a USDC transfer', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const result = await executor.execute(baseContext);

      expect(result).toEqual(
        expect.objectContaining({
          loanId: 'LOAN-123',
          status: 'submitted',
          transactionHash: '0xdeadbeef',
          signedTransaction: '0xsignedpayload',
          turnkeyActivityId: 'activity-1',
        })
      );

      const estimateCall = mockRpc.request.mock.calls.find((call) => call[1] === 'eth_estimateGas');
      expect(estimateCall).toBeDefined();
      const estimateParams = estimateCall![2][0];
      expect(estimateParams).toEqual(
        expect.objectContaining({
          from: expect.stringMatching(/^0x[a-f0-9]{40}$/),
          to: expect.stringMatching(/^0x[a-f0-9]{40}$/),
          value: '0x0',
        })
      );
      expect(typeof estimateParams.data).toBe('string');
      expect(estimateParams.data.startsWith('0xa9059cbb')).toBe(true);

      expect(mockTurnkeyClient.signAndSendTransaction).toHaveBeenCalledTimes(1);
      const signArgs = mockTurnkeyClient.signAndSendTransaction.mock.calls[0][0];
      expect(signArgs).toEqual(
        expect.objectContaining({
          subOrganizationId: 'sub-org-123',
          signWith: 'acct-1',
          transactionType: 'TRANSACTION_TYPE_ETHEREUM',
        })
      );
      expect(typeof signArgs.unsignedTransaction).toBe('string');
      expect(signArgs.unsignedTransaction.startsWith('0xf8')).toBe(true);
    });

    it('includes policy IDs in execution details', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const result = await executor.execute(baseContext);
      
      expect(result.details).toBeDefined();
      expect(result.details?.policyIds).toEqual(['policy-1']);
    });

    it('handles missing automation context', async () => {
      const contextWithoutAutomation = {
        ...baseContext,
        automation: undefined,
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const result = await executor.execute(contextWithoutAutomation);
      expect(result.status).toBe('submitted');
      
      // Should not include automation template in sign request
      const signCall = mockTurnkeyClient.signAndSendTransaction.mock.calls[0][0];
      expect(signCall.automationTemplateId).toBeUndefined();
    });
  });

  describe('Token Registry', () => {
    it('throws when token metadata missing', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry: new StaticTokenRegistry([]),
        rpcClient: mockRpc,
      });

      await expect(executor.execute(baseContext)).rejects.toBeInstanceOf(DisbursementExecutionError);
      await expect(executor.execute(baseContext)).rejects.toMatchObject({
        code: 'TOKEN_NOT_CONFIGURED',
      });
    });

    it('handles multiple tokens in registry', async () => {
      const multiTokenRegistry = new StaticTokenRegistry([
        {
          symbol: 'USDC',
          chainId: SEPOLIA_CHAIN_ID,
          contractAddress: SEPOLIA_USDC,
          decimals: 6,
        },
        {
          symbol: 'USDT',
          chainId: SEPOLIA_CHAIN_ID,
          contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          decimals: 6,
        },
      ]);

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry: multiTokenRegistry,
        rpcClient: mockRpc,
      });

      const result = await executor.execute(baseContext);
      expect(result.status).toBe('submitted');
    });

    it('resolves correct token by chain and symbol', async () => {
      const tokens: TokenMetadata[] = [
        {
          symbol: 'USDC',
          chainId: SEPOLIA_CHAIN_ID,
          contractAddress: '0x1111111111111111111111111111111111111111',
          decimals: 6,
        },
        {
          symbol: 'USDT',
          chainId: SEPOLIA_CHAIN_ID,
          contractAddress: '0x2222222222222222222222222222222222222222',
          decimals: 6,
        },
      ];

      const registry = new StaticTokenRegistry(tokens);
      
      const usdc = registry.resolveToken('USDC', SEPOLIA_CHAIN_ID);
      expect(usdc?.contractAddress.toLowerCase()).toBe('0x1111111111111111111111111111111111111111');
      
      const usdt = registry.resolveToken('USDT', SEPOLIA_CHAIN_ID);
      expect(usdt?.contractAddress.toLowerCase()).toBe('0x2222222222222222222222222222222222222222');
      
      const tokenNotFound = registry.resolveToken('DAI', SEPOLIA_CHAIN_ID);
      expect(tokenNotFound).toBeUndefined();
    });
  });

  describe('RPC Client', () => {
    it('validates HTTP RPC endpoints', async () => {
      const rpcClient = new HttpJsonRpcClient({ [SEPOLIA_CHAIN_ID]: 'https://example.invalid' }, async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }));

      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_chainId', [])
      ).rejects.toBeInstanceOf(DisbursementExecutionError);
    });

    it('handles RPC error responses correctly', async () => {
      const rpcClient = new HttpJsonRpcClient({ [SEPOLIA_CHAIN_ID]: 'https://example.com' }, async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          error: {
            code: -32602,
            message: 'Invalid params',
            data: 'Some additional context',
          },
        }),
      }));

      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_sendTransaction', [{}])
      ).rejects.toMatchObject({
        code: 'RPC_ERROR',
        details: {
          error: {
            code: -32602,
            message: 'Invalid params',
          },
        },
      });
    });

    it('handles missing RPC endpoint configuration', async () => {
      const rpcClient = new HttpJsonRpcClient({});
      
      await expect(
        rpcClient.request('999', 'eth_chainId', [])
      ).rejects.toMatchObject({
        code: 'RPC_ENDPOINT_NOT_CONFIGURED',
        details: { chainId: '999' },
      });
    });
  });

  describe('Transaction Building', () => {
    it('correctly encodes ERC20 transfer data', async () => {
      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await executor.execute(baseContext);

      const estimateCall = mockRpc.request.mock.calls.find((call) => call[1] === 'eth_estimateGas');
      const data = estimateCall![2][0].data;
      
      // Verify transfer function selector
      expect(data.slice(0, 10)).toBe('0xa9059cbb');
      
      // Verify recipient address (padded to 32 bytes)
      const recipientPart = data.slice(10, 74);
      const normalizedRecipient = baseContext.request.borrowerAddress.replace(/^0x/i, '').toLowerCase();
      expect(recipientPart).toBe(normalizedRecipient.padStart(64, '0'));
      
      // Verify amount (100.5 USDC = 100500000 in base units)
      const amountPart = data.slice(74, 138);
      const amountBigInt = BigInt('0x' + amountPart);
      expect(amountBigInt).toBe(100500000n);
    });

    it('handles different decimal configurations', async () => {
      const tokenWith18Decimals = new StaticTokenRegistry([{
        symbol: 'WETH',
        chainId: SEPOLIA_CHAIN_ID,
        contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
      }]);

      const contextWithWETH = {
        ...baseContext,
        request: {
          ...baseContext.request,
          assetSymbol: 'WETH',
          chainId: SEPOLIA_CHAIN_ID,
          amount: '1.5', // 1.5 WETH
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry: tokenWith18Decimals,
        rpcClient: mockRpc,
        defaultDecimals: 18,
      });

      await executor.execute(contextWithWETH);
      
      const estimateCall = mockRpc.request.mock.calls.find((call) => call[1] === 'eth_estimateGas');
      const data = estimateCall![2][0].data;
      
      // Extract amount from data
      const amountPart = data.slice(74, 138);
      const amountBigInt = BigInt('0x' + amountPart);
      
      // 1.5 WETH = 1500000000000000000 wei
      expect(amountBigInt).toBe(1500000000000000000n);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid chain IDs gracefully', async () => {
      const invalidContext = {
        ...baseContext,
        request: {
          ...baseContext.request,
          chainId: 'invalid',
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await expect(executor.execute(invalidContext)).rejects.toMatchObject({
        code: 'INVALID_CHAIN_ID',
      });
    });

    it('handles missing wallet account address', async () => {
      const contextWithoutAddress = {
        ...baseContext,
        wallet: {
          ...baseContext.wallet,
          accountAddress: undefined,
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await expect(executor.execute(contextWithoutAddress)).rejects.toMatchObject({
        code: 'ACCOUNT_ADDRESS_UNAVAILABLE',
      });
    });

    it('handles invalid wallet account IDs', async () => {
      const contextWithInvalidAccount = {
        ...baseContext,
        wallet: {
          ...baseContext.wallet,
          accountId: '   ', // Whitespace only
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await expect(executor.execute(contextWithInvalidAccount)).rejects.toMatchObject({
        code: 'ACCOUNT_IDENTIFIER_UNAVAILABLE',
      });
    });

    it('handles "pending" account IDs', async () => {
      const contextWithPendingAccount = {
        ...baseContext,
        wallet: {
          ...baseContext.wallet,
          accountId: 'pending',
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await expect(executor.execute(contextWithPendingAccount)).rejects.toMatchObject({
        code: 'ACCOUNT_IDENTIFIER_UNAVAILABLE',
      });
    });
  });

  describe('Amount Conversion', () => {
    it('correctly handles amounts with metadata flag', async () => {
      const contextWithBaseUnits = {
        ...baseContext,
        request: {
          ...baseContext.request,
          amount: '100500000', // Already in base units
          metadata: {
            amountInBaseUnits: true,
          },
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await executor.execute(contextWithBaseUnits);
      
      const estimateCall = mockRpc.request.mock.calls.find((call) => call[1] === 'eth_estimateGas');
      const data = estimateCall![2][0].data;
      
      // Extract amount from data
      const amountPart = data.slice(74, 138);
      const amountBigInt = BigInt('0x' + amountPart);
      
      // Should use the amount as-is
      expect(amountBigInt).toBe(100500000n);
    });

    it('handles zero amounts', async () => {
      const contextWithZero = {
        ...baseContext,
        request: {
          ...baseContext.request,
          amount: '0',
        },
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockTurnkeyClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      await executor.execute(contextWithZero);
      
      const estimateCall = mockRpc.request.mock.calls.find((call) => call[1] === 'eth_estimateGas');
      const data = estimateCall![2][0].data;
      
      // Extract amount from data
      const amountPart = data.slice(74, 138);
      const amountBigInt = BigInt('0x' + amountPart);
      
      expect(amountBigInt).toBe(0n);
    });
  });

  describe('Global Fetch Fallback', () => {
    it('handles missing global fetch gracefully', async () => {
      const originalFetch = (globalThis as any).fetch;
      delete (globalThis as any).fetch;

      const rpcClient = new HttpJsonRpcClient({ [SEPOLIA_CHAIN_ID]: 'https://example.com' });
      
      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_chainId', [])
      ).rejects.toThrow('Global fetch is not available');

      // Restore
      (globalThis as any).fetch = originalFetch;
    });
  });
});
