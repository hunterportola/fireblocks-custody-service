import { DisbursementExecutionError } from '../turnkey-disbursement-executor';
import type { DisbursementContext } from '../turnkey-custody-service';
import { SEPOLIA_USDC_ADDRESS } from '../constants';

const SEPOLIA_CHAIN_ID = '11155111';

describe('Amount Handling & Precision Tests', () => {
  const SEPOLIA_USDC = SEPOLIA_USDC_ADDRESS;
  // Test helper to parse USDC amounts
  const parseUSDCAmount = (amount: string, decimals: number = 6): bigint => {
    const trimmed = amount.trim();
    if (trimmed.length === 0) {
      throw new DisbursementExecutionError('Amount cannot be empty', 'INVALID_AMOUNT_FORMAT');
    }

    if (trimmed.startsWith('-')) {
      throw new DisbursementExecutionError('Amount must be positive', 'INVALID_AMOUNT_FORMAT');
    }

    // Check for multiple decimal points
    const parts = trimmed.split('.');
    if (parts.length > 2) {
      throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT');
    }
    
    const [wholePart, fractionalPart = ''] = parts;
    
    // Check if wholePart is empty or not numeric
    if (!wholePart || !/^[0-9]+$/.test(wholePart)) {
      throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT');
    }
    if (fractionalPart && !/^[0-9]+$/.test(fractionalPart)) {
      throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT');
    }

    if (fractionalPart.length > decimals) {
      throw new DisbursementExecutionError(
        `Amount precision exceeds ${decimals} decimal places`,
        'AMOUNT_PRECISION_EXCEEDED'
      );
    }

    const wholeUnits = BigInt(wholePart.length ? wholePart : '0') * BigInt(10 ** decimals);
    const fractionalUnits = BigInt(fractionalPart.padEnd(decimals, '0') || '0');
    return wholeUnits + fractionalUnits;
  };

  describe('Decimal Precision Handling', () => {
    it.each([
      ['0', '0'],
      ['1', '1000000'],
      ['1.5', '1500000'],
      ['0.000001', '1'],
      ['0.1', '100000'],
      ['0.01', '10000'],
      ['0.001', '1000'],
      ['0.0001', '100'],
      ['0.00001', '10'],
      ['0.000001', '1'],
      ['1000000.123456', '1000000123456'],
      ['9999999.999999', '9999999999999'],
    ])('should convert %s USDC to %s base units', (input, expected) => {
      const result = parseUSDCAmount(input);
      expect(result.toString()).toBe(expected);
    });

    it('should reject amounts with more than 6 decimal places', () => {
      const amount = '1.1234567890'; // 10 decimal places
      expect(() => parseUSDCAmount(amount)).toThrow(DisbursementExecutionError);
    });

    it('should handle amounts with trailing zeros correctly', () => {
      const testCases = [
        { input: '1.100000', expected: '1100000' },
        { input: '1.000100', expected: '1000100' },
        { input: '100.000000', expected: '100000000' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseUSDCAmount(input);
        expect(result.toString()).toBe(expected);
      });
    });
  });

  describe('Large Amount Handling', () => {
    it('should handle maximum safe USDC amounts', () => {
      // Max supply of USDC is theoretically unlimited, but let's test large values
      const largeAmounts = [
        '1000000000', // 1 billion USDC
        '1000000000000', // 1 trillion USDC
        '999999999999.999999', // Near trillion with max decimals
      ];

      largeAmounts.forEach(amount => {
        const result = parseUSDCAmount(amount);
        expect(result).toBeGreaterThan(0n);
        expect(() => result.toString()).not.toThrow();
      });
    });

    it('should handle uint256 maximum values in base units', () => {
      const maxUint256 = 2n ** 256n - 1n;
      const maxUSDC = maxUint256 / 10n ** 6n; // Convert to USDC units
      
      // This represents the maximum possible USDC amount
      expect(maxUSDC).toBeGreaterThan(0n);
      expect(maxUSDC.toString()).toMatch(/^\d+$/);
    });

    it('should properly encode large amounts in transaction data', async () => {
      const { StaticTokenRegistry, TurnkeyDisbursementExecutor } = await import('../turnkey-disbursement-executor');
      
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockImplementation(async (_chainId: string, method: string) => {
          const responses: Record<string, string> = {
            eth_getTransactionCount: '0x0',
            eth_gasPrice: '0x3b9aca00',
            eth_estimateGas: '0x5208',
            eth_sendRawTransaction: '0xhash',
          };
          return responses[method] || '0x0';
        }),
      };

      const tokenRegistry = new StaticTokenRegistry([{
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

      const context: DisbursementContext = createMockContext({
        amount: '999999999999.999999', // Near trillion USDC
      });

      await executor.execute(context);

      const estimateCall = mockRpc.request.mock.calls.find(
        (call: any) => call[1] === 'eth_estimateGas'
      );
      
      expect(estimateCall).toBeDefined();
      const txData = estimateCall[2][0].data;
      
      // Check that the amount is encoded in the data field
      expect(txData).toMatch(/^0xa9059cbb/); // transfer function selector
      expect(txData.length).toBeGreaterThanOrEqual(138); // selector + address + amount
    });
  });

  describe('Invalid Amount Handling', () => {
    it('should reject negative amounts', () => {
      const negativeAmounts = ['-1', '-0.1', '-100.50'];
      
      negativeAmounts.forEach(amount => {
        expect(() => parseUSDCAmount(amount)).toThrow();
      });
    });

    it('should reject non-numeric strings', () => {
      const invalidAmounts = [
        'abc',
        '1.2.3',
        '1,000.50', // Comma separator
        '1e6', // Scientific notation
        '0x100', // Hex notation
        'Infinity',
        'NaN',
      ];

      invalidAmounts.forEach(amount => {
        try {
          parseUSDCAmount(amount);
          throw new Error(`Expected parseUSDCAmount('${amount}') to throw but it did not`);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Expected parseUSDCAmount')) {
            throw error;
          }
          expect(error).toBeInstanceOf(DisbursementExecutionError);
        }
      });
    });

    it('should handle empty or whitespace strings', () => {
      const emptyValues = ['', ' ', '\t', '\n'];
      
      emptyValues.forEach(value => {
        expect(() => parseUSDCAmount(value)).toThrow();
      });
    });
  });

  describe('Zero Amount Handling', () => {
    it('should properly handle zero amounts', () => {
      const zeroFormats = ['0', '0.0', '0.000000', '00.00'];
      
      zeroFormats.forEach(format => {
        const result = parseUSDCAmount(format);
        expect(result).toBe(0n);
      });
    });

    it('should sign zero-amount disbursements without throwing', async () => {
      const { StaticTokenRegistry, TurnkeyDisbursementExecutor } = 
        await import('../turnkey-disbursement-executor');
      
      const mockClient = {
        signTransaction: jest.fn().mockResolvedValue({
          signedTransaction: '0xsigned',
          activityId: 'act-1',
        }),
      };

      const mockRpc = {
        request: jest.fn().mockResolvedValue('0x0'),
      };

      const tokenRegistry = new StaticTokenRegistry([{
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

      const context = createMockContext({ amount: '0' });

      const result = await executor.execute(context);
      expect(result.status).toBe('submitted');
      expect(mockClient.signTransaction).toHaveBeenCalled();
    });
  });

  describe('Rounding Behavior', () => {
    it('should reject inputs with excess decimal places', () => {
      const excessiveDecimals = ['1.9999999', '1.1234565', '1.1234564'];
      excessiveDecimals.forEach((input) => {
        expect(() => parseUSDCAmount(input)).toThrow(DisbursementExecutionError);
      });
    });

    it('should not lose precision for exact 6 decimal values', () => {
      const preciseValues = [
        '0.123456',
        '999.654321',
        '1234567.890123',
      ];

      preciseValues.forEach(value => {
        const result = parseUSDCAmount(value);
        const [whole, frac] = value.split('.');
        const expectedBaseUnits = BigInt(whole) * 1000000n + BigInt(frac);
        expect(result).toBe(expectedBaseUnits);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle amounts with leading zeros', () => {
      const amounts = [
        { input: '01.5', expected: '1500000' },
        { input: '001.50', expected: '1500000' },
        { input: '0001.500000', expected: '1500000' },
      ];

      amounts.forEach(({ input, expected }) => {
        const result = parseUSDCAmount(input);
        expect(result.toString()).toBe(expected);
      });
    });

    it('should handle very small amounts correctly', () => {
      const smallAmounts = [
        { input: '0.000001', expected: '1' }, // Smallest unit
        { input: '0.000002', expected: '2' },
        { input: '0.000010', expected: '10' },
      ];

      smallAmounts.forEach(({ input, expected }) => {
        const result = parseUSDCAmount(input);
        expect(result.toString()).toBe(expected);
      });
    });

    it('should reject amounts smaller than 1 base unit', () => {
      const tooSmallAmounts = [
        '0.0000001', // 7 decimals
        '0.0000005', // Would be 0.5 base units
        '0.00000099', // Would be 0.99 base units
      ];

      tooSmallAmounts.forEach(amount => {
        expect(() => parseUSDCAmount(amount)).toThrow(DisbursementExecutionError);
      });
    });
  });

  describe('Multi-decimal Token Support', () => {
    it.each([
      { decimals: 6, amount: '1.5', expected: '1500000' },
      { decimals: 18, amount: '1.5', expected: '1500000000000000000' },
      { decimals: 8, amount: '1.5', expected: '150000000' },
      { decimals: 2, amount: '1.5', expected: '150' },
    ])('should handle $decimals decimal places correctly', ({ decimals, amount, expected }) => {
      const result = parseUSDCAmount(amount, decimals);
      expect(result.toString()).toBe(expected);
    });
  });
});

// Helper function to create mock context with custom amount
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
