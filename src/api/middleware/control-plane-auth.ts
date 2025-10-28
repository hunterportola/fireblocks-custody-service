import { Request, Response, NextFunction } from 'express';

const HEADER_NAME = 'x-internal-token';

export function requireControlPlaneAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const expectedToken = process.env.CONTROL_PLANE_API_TOKEN;
    if (!expectedToken) {
      // Allow requests when token is not configured (development / tests)
      next();
      return;
    }

    const provided = req.headers[HEADER_NAME] ?? req.headers[HEADER_NAME.toLowerCase()];
    const token = Array.isArray(provided) ? provided[0] : provided;

    if (typeof token !== 'string' || token.length === 0 || token !== expectedToken) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Control plane authentication failed',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
