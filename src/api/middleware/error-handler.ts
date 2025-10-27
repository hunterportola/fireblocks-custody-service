import { Request, Response, NextFunction } from 'express';
import { TurnkeyServiceError, ErrorCodes } from '../../core/error-handler';

export interface APIError {
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export class DisbursementError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'DisbursementError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

export class PolicyViolationError extends DisbursementError {
  constructor(message: string, details?: unknown) {
    super('POLICY_VIOLATION', message, 400, details);
  }
}

export class ConsensusRequiredError extends DisbursementError {
  constructor(message: string, details?: unknown) {
    super('CONSENSUS_REQUIRED', message, 409, details);
  }
}

export class AuthenticationError extends DisbursementError {
  constructor(message: string) {
    super('AUTHENTICATION_FAILED', message, 401);
  }
}

export class AuthorizationError extends DisbursementError {
  constructor(message: string) {
    super('AUTHORIZATION_FAILED', message, 403);
  }
}

export class ResourceNotFoundError extends DisbursementError {
  constructor(resource: string, id: string) {
    super('RESOURCE_NOT_FOUND', `${resource} with ID ${id} not found`, 404);
  }
}

export function errorHandler(
  error: Error,
  req: Request<Record<string, string>, unknown, unknown>,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log error details
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    requestId,
    method: req.method,
    url: req.url,
    body: req.body,
  });

  // Handle known error types
  if (error instanceof DisbursementError) {
    const apiError: APIError = {
      error: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(error.statusCode).json(apiError);
    return;
  }

  // Handle Turnkey service errors
  if (error instanceof TurnkeyServiceError) {
    let statusCode = 500;
    let errorCode = 'TURNKEY_ERROR';

    switch (error.code) {
      case ErrorCodes.MISSING_CREDENTIALS:
        statusCode = 401;
        errorCode = 'AUTHENTICATION_FAILED';
        break;
      case ErrorCodes.POLICY_DENIED:
        statusCode = 400;
        errorCode = 'POLICY_VIOLATION';
        break;
      case ErrorCodes.CONSENSUS_REQUIRED:
        statusCode = 409;
        errorCode = 'CONSENSUS_REQUIRED';
        break;
      case ErrorCodes.INVALID_CONFIG:
        statusCode = 422;
        errorCode = 'INVALID_INPUT';
        break;
    }

    const apiError: APIError = {
      error: errorCode,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(statusCode).json(apiError);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    const validationError = error as { errors?: unknown; array?: () => unknown };
    const apiError: APIError = {
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: validationError.errors ?? (validationError.array ? validationError.array() : undefined),
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(422).json(apiError);
    return;
  }

  // Handle unknown errors
  const apiError: APIError = {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(500).json(apiError);
}
