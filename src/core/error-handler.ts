import { TurnkeyRequestError } from '@turnkey/sdk-server';
import type { TActivity } from '@turnkey/http';

export const ErrorCodes = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  ORGANIZATION_NOT_SET: 'ORGANIZATION_NOT_SET',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONSENSUS_REQUIRED: 'CONSENSUS_REQUIRED',
  POLICY_DENIED: 'POLICY_DENIED',
  ACTIVITY_FAILED: 'ACTIVITY_FAILED',
  ACTIVITY_TIMEOUT: 'ACTIVITY_TIMEOUT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class TurnkeyServiceError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode?: number,
    public details?: unknown,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TurnkeyServiceError';
  }
}

export class ConsensusRequiredError extends TurnkeyServiceError {
  constructor(
    message: string,
    public readonly activityId?: string,
    public readonly activityStatus?: string,
    public readonly activityType?: string,
    public readonly requiredApprovals?: number,
    public readonly currentApprovals?: number,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCodes.CONSENSUS_REQUIRED, undefined, undefined, context);
  }
}

export class PolicyDeniedError extends TurnkeyServiceError {
  constructor(
    message: string,
    public readonly policyIds: string[],
    statusCode?: number,
    details?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCodes.POLICY_DENIED, statusCode, details, context);
  }
}

export class ActivityFailedError extends TurnkeyServiceError {
  constructor(message: string, public readonly activity: TActivity, context?: Record<string, unknown>) {
    super(message, ErrorCodes.ACTIVITY_FAILED, undefined, activity, context);
  }
}

export function toTurnkeyServiceError(
  error: unknown,
  context?: Record<string, unknown>
): TurnkeyServiceError {
  if (error instanceof TurnkeyServiceError) {
    return error;
  }

  if (isTurnkeyRequestError(error)) {
    return mapTurnkeyRequestError(error, context);
  }

  if (error instanceof Error) {
    return new TurnkeyServiceError(error.message, ErrorCodes.API_ERROR, undefined, undefined, context);
  }

  return new TurnkeyServiceError('Unknown error occurred', ErrorCodes.API_ERROR, undefined, undefined, context);
}

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

      const serviceError = toTurnkeyServiceError(error);
      if (serviceError.code === ErrorCodes.INVALID_CONFIG || serviceError.code === ErrorCodes.MISSING_CREDENTIALS) {
        throw serviceError;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw toTurnkeyServiceError(lastError);
}

export function buildTurnkeyRequestError(
  error: unknown,
  context?: Record<string, unknown>
): TurnkeyServiceError {
  if (isTurnkeyRequestError(error)) {
    return mapTurnkeyRequestError(error, context);
  }
  return toTurnkeyServiceError(error, context);
}

export function buildPolicyDeniedError(
  error: unknown,
  context?: Record<string, unknown>
): PolicyDeniedError | undefined {
  if (!isTurnkeyRequestError(error)) {
    return undefined;
  }

  if (error.code !== 403) {
    return undefined;
  }

  const message = error.message || 'Policy denied';
  const policyIds = extractPolicyIds(error.details as PolicyDetail[] | null);
  return new PolicyDeniedError(message, policyIds, error.code, error.details, context);
}

export function buildActivityFailedError(
  activity: TActivity,
  message: string = 'Turnkey activity failed',
  context?: Record<string, unknown>
): ActivityFailedError {
  return new ActivityFailedError(message, activity, context);
}

function mapTurnkeyRequestError(
  error: TurnkeyRequestError,
  context?: Record<string, unknown>
): TurnkeyServiceError {
  const message = error.message || 'Turnkey request failed';

  switch (error.code) {
    case 401:
      return new TurnkeyServiceError(message, ErrorCodes.MISSING_CREDENTIALS, error.code, error.details, context);
    case 403: {
      const policyError = buildPolicyDeniedError(error, context);
      return policyError ?? new TurnkeyServiceError(message, ErrorCodes.UNAUTHORIZED, error.code, error.details, context);
    }
    case 404:
      return new TurnkeyServiceError(message, ErrorCodes.NOT_FOUND, error.code, error.details, context);
    case 429:
      return new TurnkeyServiceError(message, ErrorCodes.RATE_LIMIT_EXCEEDED, error.code, error.details, context);
    default:
      return new TurnkeyServiceError(message, ErrorCodes.API_ERROR, error.code, error.details, context);
  }
}

function isTurnkeyRequestError(error: unknown): error is TurnkeyRequestError {
  return typeof TurnkeyRequestError === 'function' && error instanceof TurnkeyRequestError;
}

/**
 * Interface for policy evaluation details from Turnkey API responses
 */
interface PolicyEvaluation {
  policyId?: string;
  id?: string;
}

/**
 * Interface for policy-related error details from Turnkey API responses
 */
interface PolicyDetail {
  policyEvaluations?: PolicyEvaluation[];
  policyEvaluation?: PolicyEvaluation[];
  policyId?: string;
  id?: string;
}

function extractPolicyIds(details: PolicyDetail[] | null): string[] {
  if (!Array.isArray(details)) {
    return [];
  }

  const policyIds = new Set<string>();
  details.forEach((detail) => {
    if (detail == null) {
      return;
    }

    const maybeEvaluations = detail.policyEvaluations ?? detail.policyEvaluation;

    if (Array.isArray(maybeEvaluations)) {
      maybeEvaluations.forEach((evaluation) => {
        const policyId = evaluation.policyId ?? evaluation.id;
        if (typeof policyId === 'string') {
          policyIds.add(policyId);
        }
      });
      return;
    }

    const policyId = detail.policyId ?? detail.id;
    if (typeof policyId === 'string') {
      policyIds.add(policyId);
    }
  });

  return Array.from(policyIds);
}
