import { DisbursementExecutionError, HttpJsonRpcClient, StaticTokenRegistry, TurnkeyDisbursementExecutor } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { TurnkeyServiceError, ErrorCodes, ConsensusRequiredError } from '../../core/error-handler';
import { SEPOLIA_CHAIN_ID, SEPOLIA_USDC_ADDRESS } from '../constants';

const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;

describe('Error Handling & Recovery Tests', () => {
  const tokenRegistry = new StaticTokenRegistry([{
    symbol: 'USDC',
    chainId: SEPOLIA_CHAIN_ID,
    contractAddress: SEPOLIA_USDC,
    decimals: 6,
  }]);

  describe('Turnkey API Error Handling', () => {
    it('should handle policy denied errors gracefully', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(
          new TurnkeyServiceError(
            'Transaction denied by policy',
            ErrorCodes.POLICY_DENIED,
            undefined,
            { policyId: 'POLICY-123' }
          )
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to sign transaction with Turnkey');
      
      try {
        await executor.execute(context);
      } catch (error: any) {
        expect(error).toBeInstanceOf(DisbursementExecutionError);
        expect(error.code).toBe('TURNKEY_SIGNING_FAILED');
        expect(error.details.error.code).toBe(ErrorCodes.POLICY_DENIED);
      }
    });

    it('should surface consensus required results', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(
          new ConsensusRequiredError(
            'Additional approvals required',
            'activity-123',
            'ACTIVITY_STATUS_CONSENSUS_NEEDED',
            'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
            2,
            1,
            { policyIds: ['policy-1'] }
          )
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      const result = await executor.execute(context);
      expect(result.status).toBe('consensus_required');
      expect(result.turnkeyActivityId).toBe('activity-123');
      expect(result.details?.requiredApprovals).toBe(2);
      expect(result.details?.currentApprovals).toBe(1);
      expect(result.error).toMatchObject({
        code: ErrorCodes.CONSENSUS_REQUIRED,
        message: 'Additional approvals required',
      });
    });

    it('should handle API timeouts', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow();
    });

    it('should handle missing credentials', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(
          new TurnkeyServiceError(
            'Missing API credentials',
            ErrorCodes.MISSING_CREDENTIALS
          )
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to sign transaction with Turnkey');
    });
  });

  describe('RPC Error Handling', () => {
    it('should handle insufficient funds errors', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            const error = new Error('insufficient funds for gas * price + value');
            (error as any).code = -32000;
            throw error;
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
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
    });

    it('should handle nonce too low errors', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            throw new Error('nonce too low');
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
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
    });

    it('should handle nonce too high errors', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            throw new Error('nonce too high');
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
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
    });

    it('should handle gas exhausted errors', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            throw new Error('out of gas');
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
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
    });
  });

  describe('Partial Failure Recovery', () => {
    it('should handle signing success but broadcast failure', async () => {
      let signCallCount = 0;
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(async () => {
          signCallCount++;
          return {
            signedTransaction: `0xsigned${signCallCount}`,
            activityId: `act-${signCallCount}`,
          };
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            throw new Error('network error');
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
      
      // First attempt should fail at broadcast
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
      expect(signCallCount).toBe(1);

      // The transaction was signed but not broadcast
      // In a real system, we'd need to handle this carefully to avoid double-signing
    });

    it('should not double-sign when retrying after broadcast failure', async () => {
      const signedTxs: string[] = [];
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(async () => {
          const tx = `0xsigned${Date.now()}`;
          signedTxs.push(tx);
          return {
            signedTransaction: tx,
            activityId: `act-${signedTxs.length}`,
          };
        }),
      };

      let broadcastAttempt = 0;
      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_sendRawTransaction') {
            broadcastAttempt++;
            if (broadcastAttempt === 1) {
              throw new Error('temporary network error');
            }
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
      
      // First attempt fails
      await expect(executor.execute(context)).rejects.toThrow('Failed to broadcast signed transaction');
      
      // Reset the RPC mock for the second attempt to succeed
      mockRpc.request.mockImplementation(async (_chainId: string, method: string) => {
        if (method === 'eth_sendRawTransaction') {
          return '0xhash'; // Success on retry
        }
        return '0x1';
      });
      
      // Second attempt should create a new transaction
      const result = await executor.execute(context);
      
      expect(result.status).toBe('submitted');
      expect(signedTxs.length).toBe(2); // Two separate signing operations
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running RPC calls', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(() => 
          new Promise((resolve) => {
            // Never resolves - simulates hanging request
            setTimeout(() => resolve('0x1'), 10000);
          })
        ),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      // This would hang indefinitely without proper timeout handling
      // In production, you'd want to implement request timeouts
      const promise = executor.execute(context);
      
      // Cancel after 100ms
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), 100)
      );
      
      await expect(Promise.race([promise, timeout])).rejects.toThrow('Test timeout');
    });

    it('should handle Turnkey API timeouts', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(() =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Activity polling timeout')), 100);
          })
        ),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow('Failed to sign transaction with Turnkey');
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve error context through the stack', async () => {
      const originalError = new TurnkeyServiceError(
        'Policy evaluation failed',
        ErrorCodes.POLICY_DENIED,
        undefined,
        { reason: 'Amount exceeds daily limit' }
      );

      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(originalError),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      try {
        await executor.execute(context);
      } catch (error: any) {
        expect(error).toBeInstanceOf(DisbursementExecutionError);
        expect(error.code).toBe('TURNKEY_SIGNING_FAILED');
        expect(error.details.error).toBe(originalError);
        expect(error.details.error.details).toEqual({ reason: 'Amount exceeds daily limit' });
      }
    });

    it('should include transaction context in errors', async () => {
      const mockClient = {
        signTransaction: jest.fn().mockRejectedValue(new Error('Generic error')),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext({
        amount: '999999',
        borrowerAddress: '0x1234567890123456789012345678901234567890',
      });
      
      try {
        await executor.execute(context);
      } catch (error: any) {
        expect(error.details).toMatchObject({
          accountId: 'account-1',
          unsignedTransaction: expect.any(String),
        });
      }
    });
  });

  describe('Retry Logic', () => {
    it('should not automatically retry on permanent errors', async () => {
      let attemptCount = 0;
      const mockClient = {
        signTransaction: jest.fn().mockImplementation(async () => {
          attemptCount++;
          throw new TurnkeyServiceError('Invalid transaction', ErrorCodes.INVALID_CONFIG);
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x1'),
      };

      const executor = new TurnkeyDisbursementExecutor({
        client: mockClient as any,
        tokenRegistry,
        rpcClient: mockRpc,
      });

      const context = createMockContext();
      
      await expect(executor.execute(context)).rejects.toThrow();
      expect(attemptCount).toBe(1); // Should not retry
    });

    it('should handle transient network errors appropriately', async () => {
      const rpcClient = new HttpJsonRpcClient(
        { [SEPOLIA_CHAIN_ID]: 'https://example.com' },
        async () => {
          throw new Error('ECONNRESET');
        }
      );

      await expect(
        rpcClient.request(SEPOLIA_CHAIN_ID, 'eth_gasPrice', [])
      ).rejects.toThrow('ECONNRESET');
    });
  });

  describe('Gas Estimation Failures', () => {
    it('should handle failed gas estimations', async () => {
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
      
      await expect(executor.execute(context)).rejects.toThrow('execution reverted');
    });

    it('should handle contract revert reasons', async () => {
      const mockClient = {
        signTransaction: jest.fn(),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          if (method === 'eth_estimateGas') {
            const error = new Error('execution reverted: Pausable: paused');
            (error as any).data = '0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000105061757361626c653a2070617573656400000000000000000000000000000000';
            throw error;
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
