// @ts-nocheck
/**
 * Common test utilities and helpers
 */

import type { TActivity } from '@turnkey/http';

/**
 * Creates a mock activity object for testing
 */
export function createMockActivity(overrides: Partial<TActivity> = {}): TActivity {
  return {
    id: 'activity-test-123',
    organizationId: 'org-test-123',
    status: 'ACTIVITY_STATUS_COMPLETED',
    type: 'ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION',
    intent: {},
    result: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as TActivity;
}

/**
 * Creates a mock TurnkeyRequestError for testing
 */
export class MockTurnkeyRequestError extends Error implements TurnkeyRequestError {
  name = 'TurnkeyRequestError';
  
  constructor(
    message: string,
    public code: number,
    public details: any[] | null = null
  ) {
    super(message);
  }
}

/**
 * Creates a mock consensus activity
 */
export function createConsensusActivity(
  activityId: string,
  requiredApprovals: number = 2,
  currentApprovals: number = 0
): TActivity {
  return createMockActivity({
    id: activityId,
    status: 'ACTIVITY_STATUS_CONSENSUS_NEEDED',
    type: 'ACTIVITY_TYPE_SIGN_TRANSACTION',
    consensus: {
      required: requiredApprovals,
      current: currentApprovals,
      approvers: [],
    } as any,
  });
}

/**
 * Creates a mock failed activity
 */
export function createFailedActivity(
  activityId: string,
  failureMessage: string,
  details?: any[]
): TActivity {
  return createMockActivity({
    id: activityId,
    status: 'ACTIVITY_STATUS_FAILED',
    failure: {
      failureMessage,
      details,
    } as any,
  });
}

/**
 * Creates a mock activity result for sub-organization creation
 */
export function createSubOrgActivityResult(subOrgId: string): TActivity {
  return createMockActivity({
    type: 'ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION',
    result: {
      createSubOrganizationResult: {
        subOrganizationId: subOrgId,
      },
    } as any,
  });
}

/**
 * Creates a mock activity result for wallet creation
 */
export function createWalletActivityResult(
  walletId: string,
  accountIds: string[] = ['account-1'],
  addresses: string[] = ['0x123...']
): TActivity {
  return createMockActivity({
    type: 'ACTIVITY_TYPE_CREATE_WALLET',
    result: {
      createWalletResult: {
        walletId,
        accounts: accountIds.map((id, i) => ({
          accountId: id,
          address: addresses[i] || `0x${i}...`,
        })),
      },
    } as any,
  });
}

/**
 * Creates a mock activity result for user creation
 */
export function createUserActivityResult(userId: string, apiKeyId?: string): TActivity {
  return createMockActivity({
    type: 'ACTIVITY_TYPE_CREATE_USER',
    result: {
      createUserResult: {
        userId,
        ...(apiKeyId && {
          apiKeys: [{
            apiKeyId,
            apiKeyName: 'test-key',
          }],
        }),
      },
    } as any,
  });
}

/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve));
}

/**
 * Creates a mock environment with test variables
 */
export function setupTestEnvironment(vars: Record<string, string> = {}): void {
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

/**
 * Cleans up test environment variables
 */
export function cleanupTestEnvironment(keys: string[]): void {
  keys.forEach(key => {
    delete process.env[key];
  });
}

/**
 * Asserts that a promise rejects with a specific error
 */
export async function expectRejection<T extends Error>(
  promise: Promise<any>,
  errorType: new (...args: any[]) => T,
  messageMatcher?: string | RegExp
): Promise<T> {
  try {
    await promise;
    throw new Error('Expected promise to reject');
  } catch (error) {
    expect(error).toBeInstanceOf(errorType);
    if (messageMatcher) {
      if (typeof messageMatcher === 'string') {
        expect(error.message).toContain(messageMatcher);
      } else {
        expect(error.message).toMatch(messageMatcher);
      }
    }
    return error as T;
  }
}

/**
 * Creates a deferred promise for testing async flows
 */
export interface DeferredPromise<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

export function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Mock logger for testing
 */
export class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();

  reset() {
    this.info.mockReset();
    this.warn.mockReset();
    this.error.mockReset();
    this.debug.mockReset();
  }

  expectInfo(message: string | RegExp) {
    const calls = this.info.mock.calls;
    const found = calls.some(call => {
      const msg = call[0];
      return typeof message === 'string' 
        ? msg.includes(message)
        : message.test(msg);
    });
    expect(found).toBeTruthy();
  }

  expectError(message: string | RegExp) {
    const calls = this.error.mock.calls;
    const found = calls.some(call => {
      const msg = call[0];
      return typeof message === 'string' 
        ? msg.includes(message)
        : message.test(msg);
    });
    expect(found).toBeTruthy();
  }
}

/**
 * Creates a spy that tracks async operations
 */
export function createAsyncSpy<T = any>(
  implementation?: (...args: any[]) => Promise<T>
): jest.Mock<Promise<T>> & { waitForCall: (callIndex?: number) => Promise<void> } {
  const callPromises: Promise<void>[] = [];
  
  const spy = jest.fn(async (...args) => {
    const promise = implementation ? implementation(...args) : Promise.resolve();
    callPromises.push(promise.then(() => {}));
    return promise;
  }) as any;

  spy.waitForCall = async (callIndex: number = 0) => {
    if (callPromises[callIndex]) {
      await callPromises[callIndex];
    }
  };

  return spy;
}