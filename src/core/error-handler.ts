/**
 * Error handling utilities for Fireblocks SDK operations
 */

import { AxiosError } from 'axios';

/**
 * Custom error class for Fireblocks operations
 */
export class FireblocksServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'FireblocksServiceError';
  }
}

/**
 * Error codes for various failure scenarios
 */
export const ErrorCodes = {
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',

  // Vault errors
  VAULT_CREATION_FAILED: 'VAULT_CREATION_FAILED',
  VAULT_NOT_FOUND: 'VAULT_NOT_FOUND',
  ASSET_ACTIVATION_FAILED: 'ASSET_ACTIVATION_FAILED',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_DESTINATION: 'INVALID_DESTINATION',
  DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',

  // Approval errors
  APPROVAL_NOT_FOUND: 'APPROVAL_NOT_FOUND',
  UNAUTHORIZED_APPROVER: 'UNAUTHORIZED_APPROVER',
  ALREADY_APPROVED: 'ALREADY_APPROVED',

  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * Handle Fireblocks API errors and convert to service errors
 */
export function handleFireblocksError(error: unknown): never {
  if (error instanceof AxiosError) {
    const response = error.response;

    if (response) {
      // API returned an error response
      const status = response.status;
      const data = response.data;

      // Common Fireblocks error patterns
      if (status === 400) {
        if (data?.message?.includes('already exists')) {
          throw new FireblocksServiceError(
            'Resource already exists',
            ErrorCodes.DUPLICATE_TRANSACTION,
            status,
            data
          );
        }
        throw new FireblocksServiceError(
          data?.message || 'Bad request',
          ErrorCodes.API_ERROR,
          status,
          data
        );
      }

      if (status === 401) {
        throw new FireblocksServiceError(
          'Authentication failed - check API credentials',
          ErrorCodes.MISSING_CREDENTIALS,
          status
        );
      }

      if (status === 403) {
        throw new FireblocksServiceError(
          'Access forbidden - check permissions',
          ErrorCodes.API_ERROR,
          status,
          data
        );
      }

      if (status === 404) {
        throw new FireblocksServiceError(
          data?.message || 'Resource not found',
          ErrorCodes.VAULT_NOT_FOUND,
          status,
          data
        );
      }

      if (status === 429) {
        throw new FireblocksServiceError(
          'Rate limit exceeded - please retry later',
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          status
        );
      }

      // Generic API error
      throw new FireblocksServiceError(
        data?.message || `API error: ${status}`,
        ErrorCodes.API_ERROR,
        status,
        data
      );
    }

    // Network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new FireblocksServiceError(
        'Network error - unable to reach Fireblocks API',
        ErrorCodes.NETWORK_ERROR
      );
    }
  }

  // Unknown error
  throw new FireblocksServiceError(
    error instanceof Error ? error.message : 'Unknown error occurred',
    ErrorCodes.API_ERROR
  );
}

/**
 * Retry logic for transient failures
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry certain errors
      if (error instanceof FireblocksServiceError) {
        const nonRetryableCodes = [
          ErrorCodes.INVALID_CONFIG,
          ErrorCodes.MISSING_CREDENTIALS,
          ErrorCodes.DUPLICATE_TRANSACTION,
          ErrorCodes.UNAUTHORIZED_APPROVER,
        ];

        if (nonRetryableCodes.includes(error.code as any)) {
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
}
