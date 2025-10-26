// @ts-nocheck
/**
 * Comprehensive test suite for error handling utilities
 */

import type { TActivity } from '@turnkey/http';

import {
  ErrorCodes,
  TurnkeyServiceError,
  ConsensusRequiredError,
  PolicyDeniedError,
  ActivityFailedError,
  toTurnkeyServiceError,
  retryWithBackoff,
  buildTurnkeyRequestError,
  buildPolicyDeniedError,
  buildActivityFailedError,
} from '../error-handler';

// Mock TurnkeyRequestError from the SDK
jest.mock('@turnkey/sdk-server', () => ({
  TurnkeyRequestError: class TurnkeyRequestError extends Error {
    name = 'TurnkeyRequestError';
    constructor(
      input: { message: string; code: number; details?: any[] | null }
    ) {
      super(input.message);
      this.code = input.code;
      this.details = input.details || null;
    }
    code: number;
    details: any[] | null;
  }
}));

import { TurnkeyRequestError } from '@turnkey/sdk-server';

describe('Error Handler', () => {
  describe('TurnkeyServiceError', () => {
    it('creates error with all properties', () => {
      const error = new TurnkeyServiceError(
        'Test error',
        ErrorCodes.API_ERROR,
        500,
        { detail: 'extra' },
        { requestId: '123' }
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.API_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'extra' });
      expect(error.context).toEqual({ requestId: '123' });
      expect(error.name).toBe('TurnkeyServiceError');
    });

    it('creates error with minimal properties', () => {
      const error = new TurnkeyServiceError('Minimal error', ErrorCodes.NOT_FOUND);
      
      expect(error.message).toBe('Minimal error');
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.statusCode).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
  });

  describe('ConsensusRequiredError', () => {
    it('creates consensus error with approval counts', () => {
      const error = new ConsensusRequiredError(
        'Approval needed',
        'activity-123',
        'ACTIVITY_STATUS_CONSENSUS_NEEDED',
        'ACTIVITY_TYPE_SIGN_TRANSACTION',
        2,
        1,
        { walletId: 'wallet-123' }
      );

      expect(error.message).toBe('Approval needed');
      expect(error.code).toBe(ErrorCodes.CONSENSUS_REQUIRED);
      expect(error.activityId).toBe('activity-123');
      expect(error.activityStatus).toBe('ACTIVITY_STATUS_CONSENSUS_NEEDED');
      expect(error.activityType).toBe('ACTIVITY_TYPE_SIGN_TRANSACTION');
      expect(error.requiredApprovals).toBe(2);
      expect(error.currentApprovals).toBe(1);
      expect(error.context).toEqual({ walletId: 'wallet-123' });
    });
  });

  describe('PolicyDeniedError', () => {
    it('creates policy error with policy IDs', () => {
      const error = new PolicyDeniedError(
        'Transaction denied by policy',
        ['policy-123', 'policy-456'],
        403,
        { reason: 'Amount too high' },
        { transactionId: 'tx-789' }
      );

      expect(error.message).toBe('Transaction denied by policy');
      expect(error.code).toBe(ErrorCodes.POLICY_DENIED);
      expect(error.policyIds).toEqual(['policy-123', 'policy-456']);
      expect(error.statusCode).toBe(403);
      expect(error.details).toEqual({ reason: 'Amount too high' });
    });
  });

  describe('ActivityFailedError', () => {
    it('creates activity error with activity details', () => {
      const mockActivity: TActivity = {
        id: 'activity-123',
        status: 'ACTIVITY_STATUS_FAILED',
        organizationId: 'org-123',
        type: 'ACTIVITY_TYPE_CREATE_WALLET',
        failure: {
          failureMessage: 'Wallet creation failed',
        },
      } as TActivity;

      const error = new ActivityFailedError(
        'Activity failed',
        mockActivity,
        { retryCount: 3 }
      );

      expect(error.message).toBe('Activity failed');
      expect(error.code).toBe(ErrorCodes.ACTIVITY_FAILED);
      expect(error.activity).toBe(mockActivity);
      expect(error.context).toEqual({ retryCount: 3 });
    });
  });

  describe('toTurnkeyServiceError', () => {
    it('returns existing TurnkeyServiceError unchanged', () => {
      const original = new TurnkeyServiceError('Original', ErrorCodes.INVALID_CONFIG);
      const converted = toTurnkeyServiceError(original);
      expect(converted).toBe(original);
    });

    it('converts TurnkeyRequestError to appropriate service error', () => {
      const requestError = new TurnkeyRequestError({
        message: 'Unauthorized',
        code: 401
      });
      const converted = toTurnkeyServiceError(requestError, { userId: 'user-123' });

      expect(converted).toBeInstanceOf(TurnkeyServiceError);
      expect(converted.code).toBe(ErrorCodes.MISSING_CREDENTIALS);
      expect(converted.statusCode).toBe(401);
      expect(converted.context).toEqual({ userId: 'user-123' });
    });

    it('converts generic Error to TurnkeyServiceError', () => {
      const error = new Error('Generic error');
      const converted = toTurnkeyServiceError(error);

      expect(converted).toBeInstanceOf(TurnkeyServiceError);
      expect(converted.message).toBe('Generic error');
      expect(converted.code).toBe(ErrorCodes.API_ERROR);
    });

    it('converts unknown error types to TurnkeyServiceError', () => {
      const converted = toTurnkeyServiceError('string error');
      expect(converted).toBeInstanceOf(TurnkeyServiceError);
      expect(converted.message).toBe('Unknown error occurred');
      expect(converted.code).toBe(ErrorCodes.API_ERROR);
    });

    it('maps 403 errors to policy denied when appropriate', () => {
      const requestError = new TurnkeyRequestError({
        message: 'Policy evaluation failed',
        code: 403,
        details: [
          {
            policyEvaluations: [
              { policyId: 'policy-123' },
              { policyId: 'policy-456' },
            ],
          },
        ]
      });

      const converted = toTurnkeyServiceError(requestError);
      expect(converted).toBeInstanceOf(PolicyDeniedError);
      expect((converted as PolicyDeniedError).policyIds).toEqual(['policy-123', 'policy-456']);
    });

    it('maps 404 errors correctly', () => {
      const requestError = new TurnkeyRequestError({ message: 'Not found', code: 404 });
      const converted = toTurnkeyServiceError(requestError);

      expect(converted.code).toBe(ErrorCodes.NOT_FOUND);
      expect(converted.statusCode).toBe(404);
    });

    it('maps 429 errors to rate limit', () => {
      const requestError = new TurnkeyRequestError({ message: 'Too many requests', code: 429 });
      const converted = toTurnkeyServiceError(requestError);

      expect(converted.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
      expect(converted.statusCode).toBe(429);
    });
  });

  describe('retryWithBackoff', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on transient failures', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Another transient'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(operation, 3, 100);

      // First attempt fails immediately
      await jest.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Wait for first retry (100ms)
      await jest.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);

      // Wait for second retry (200ms exponential backoff)
      await jest.advanceTimersByTimeAsync(200);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('fails after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const promise = retryWithBackoff(operation, 2, 50);

      // Advance through all retries
      await jest.advanceTimersByTimeAsync(0);   // First attempt
      await jest.advanceTimersByTimeAsync(50);  // First retry
      await jest.advanceTimersByTimeAsync(100); // Second retry would exceed max

      try {
        await promise;
        fail('Expected promise to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(TurnkeyServiceError);
        expect(error.message).toBe('Persistent error');
      }
      
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-retryable errors', async () => {
      const configError = new TurnkeyServiceError(
        'Invalid config',
        ErrorCodes.INVALID_CONFIG
      );
      const operation = jest.fn().mockRejectedValue(configError);

      await expect(retryWithBackoff(operation)).rejects.toThrow(configError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('does not retry on missing credentials', async () => {
      const credError = new TurnkeyServiceError(
        'Missing API key',
        ErrorCodes.MISSING_CREDENTIALS
      );
      const operation = jest.fn().mockRejectedValue(credError);

      await expect(retryWithBackoff(operation)).rejects.toThrow(credError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('applies exponential backoff correctly', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(operation, 4, 100);

      // Track timing
      await jest.advanceTimersByTimeAsync(0);    // First attempt
      expect(operation).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(100);  // 100ms * 2^0
      expect(operation).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(200);  // 100ms * 2^1
      expect(operation).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(400);  // 100ms * 2^2
      expect(operation).toHaveBeenCalledTimes(4);

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('buildPolicyDeniedError', () => {
    it('extracts policy IDs from various detail formats', () => {
      const testCases = [
        // Format 1: policyEvaluations array
        {
          details: [
            {
              policyEvaluations: [
                { policyId: 'policy-1' },
                { policyId: 'policy-2' },
              ],
            },
          ],
          expected: ['policy-1', 'policy-2'],
        },
        // Format 2: Direct policyId
        {
          details: [
            { policyId: 'policy-3' },
            { policyId: 'policy-4' },
          ],
          expected: ['policy-3', 'policy-4'],
        },
        // Format 3: Using id field
        {
          details: [
            { id: 'policy-5' },
            { id: 'policy-6' },
          ],
          expected: ['policy-5', 'policy-6'],
        },
        // Format 4: Mixed formats
        {
          details: [
            { policyEvaluations: [{ policyId: 'policy-7' }] },
            { policyId: 'policy-8' },
            { id: 'policy-9' },
          ],
          expected: ['policy-7', 'policy-8', 'policy-9'],
        },
      ];

      testCases.forEach(({ details, expected }) => {
        const error = new TurnkeyRequestError({ message: 'Denied', code: 403, details });
        const policyError = buildPolicyDeniedError(error);

        expect(policyError).toBeInstanceOf(PolicyDeniedError);
        expect(policyError?.policyIds).toEqual(expected);
      });
    });

    it('returns undefined for non-403 errors', () => {
      const error404 = new TurnkeyRequestError({ message: 'Not found', code: 404 });
      expect(buildPolicyDeniedError(error404)).toBeUndefined();

      const error500 = new TurnkeyRequestError({ message: 'Server error', code: 500 });
      expect(buildPolicyDeniedError(error500)).toBeUndefined();
    });

    it('returns undefined for non-TurnkeyRequestError', () => {
      const genericError = new Error('Generic');
      expect(buildPolicyDeniedError(genericError)).toBeUndefined();
    });

    it('handles null/undefined details gracefully', () => {
      const errorNoDetails = new TurnkeyRequestError({ message: 'Denied', code: 403, details: null });
      const result = buildPolicyDeniedError(errorNoDetails);
      
      expect(result).toBeInstanceOf(PolicyDeniedError);
      expect(result?.policyIds).toEqual([]);
    });

    it('deduplicates policy IDs', () => {
      const error = new TurnkeyRequestError({
        message: 'Denied',
        code: 403,
        details: [
          { policyId: 'policy-1' },
          { policyId: 'policy-1' }, // Duplicate
          { id: 'policy-1' },        // Another duplicate
        ]
      });

      const policyError = buildPolicyDeniedError(error);
      expect(policyError?.policyIds).toEqual(['policy-1']);
    });
  });

  describe('buildActivityFailedError', () => {
    it('creates error with custom message and activity', () => {
      const activity: TActivity = {
        id: 'act-123',
        status: 'ACTIVITY_STATUS_FAILED',
        organizationId: 'org-123',
        type: 'ACTIVITY_TYPE_CREATE_WALLET',
      } as TActivity;

      const error = buildActivityFailedError(
        activity,
        'Custom failure message',
        { walletName: 'test-wallet' }
      );

      expect(error).toBeInstanceOf(ActivityFailedError);
      expect(error.message).toBe('Custom failure message');
      expect(error.activity).toBe(activity);
      expect(error.context).toEqual({ walletName: 'test-wallet' });
    });

    it('uses default message when not provided', () => {
      const activity: TActivity = {
        id: 'act-456',
        status: 'ACTIVITY_STATUS_FAILED',
      } as TActivity;

      const error = buildActivityFailedError(activity);

      expect(error.message).toBe('Turnkey activity failed');
      expect(error.activity).toBe(activity);
    });
  });

  describe('buildTurnkeyRequestError', () => {
    it('delegates to toTurnkeyServiceError for TurnkeyRequestError', () => {
      const requestError = new TurnkeyRequestError({ message: 'Request failed', code: 400 });
      const result = buildTurnkeyRequestError(requestError, { test: true });

      expect(result).toBeInstanceOf(TurnkeyServiceError);
      expect(result.statusCode).toBe(400);
      expect(result.context).toEqual({ test: true });
    });

    it('handles non-TurnkeyRequestError', () => {
      const genericError = new Error('Generic');
      const result = buildTurnkeyRequestError(genericError, { test: true });

      expect(result).toBeInstanceOf(TurnkeyServiceError);
      expect(result.message).toBe('Generic');
      expect(result.code).toBe(ErrorCodes.API_ERROR);
      expect(result.context).toEqual({ test: true });
    });
  });

  describe('Error codes', () => {
    it('has all expected error codes', () => {
      const expectedCodes = [
        'INVALID_CONFIG',
        'MISSING_CREDENTIALS',
        'ORGANIZATION_NOT_SET',
        'API_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'NETWORK_ERROR',
        'UNAUTHORIZED',
        'NOT_FOUND',
        'CONSENSUS_REQUIRED',
        'POLICY_DENIED',
        'ACTIVITY_FAILED',
        'ACTIVITY_TIMEOUT',
      ];

      expectedCodes.forEach(code => {
        expect(ErrorCodes).toHaveProperty(code);
      });
    });
  });
});
