import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  startTime: number;
  originatorId?: string;
  tenantDisplayName?: string;
  userId?: string;
  userType?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    context: RequestContext;
  }
}

type HeaderValue = number | string | string[] | undefined;

const normalizeContentLength = (value: HeaderValue): number => {
  if (Array.isArray(value)) {
    return value.reduce((total, current) => total + normalizeContentLength(current), 0);
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const logRequestEvent = (message: string, metadata: Record<string, unknown>): void => {
  console.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: Record<string, unknown>): void => {
  console.log(message, metadata || {});
};

export const logWarn = (message: string, metadata?: Record<string, unknown>): void => {
  console.warn(message, metadata || {});
};

export const logError = (message: string, metadata?: Record<string, unknown>): void => {
  console.error(message, metadata || {});
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const suppliedRequestId =
    typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'].trim() : undefined;

  let requestId: string = randomUUID();
  if (typeof suppliedRequestId === 'string' && suppliedRequestId.length > 0) {
    requestId = suppliedRequestId;
  }

  const startTime = Date.now();

  req.context = {
    requestId,
    startTime,
  };

  res.setHeader('x-request-id', requestId);

  logRequestEvent(`📥 [${requestId}] ${req.method} ${req.originalUrl}`, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    contentLength: req.headers['content-length'] ?? 0,
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseContentLength = normalizeContentLength(res.getHeader('content-length'));

    logRequestEvent(`📤 [${requestId}] ${res.statusCode} - ${duration}ms`, {
      statusCode: res.statusCode,
      durationMs: duration,
      contentLength: responseContentLength,
    });
  });

  next();
}
