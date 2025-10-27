import { Router, Request, Response } from 'express';
import { TurnkeyClientManager } from '../../core/turnkey-client';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    turnkey: 'connected' | 'disconnected' | 'error';
    database: 'connected' | 'disconnected' | 'error';
  };
  uptime: number;
}

router.get('/', (_req: Request, res: Response) => {
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      services: {
        turnkey: 'disconnected',
        database: 'disconnected', // Will implement when we add database
      },
      uptime: process.uptime(),
    };

    // Check Turnkey connection
    try {
      TurnkeyClientManager.getInstance();
      healthStatus.services.turnkey = 'connected';
    } catch (error) {
      console.warn('Turnkey health check failed:', error);
      healthStatus.services.turnkey = 'error';
      healthStatus.status = 'degraded';
    }

    // TODO: Add database health check when implemented
    healthStatus.services.database = 'connected'; // Mock for now

    // Determine overall status
    const serviceStates = Object.values(healthStatus.services);
    if (serviceStates.includes('error')) {
      healthStatus.status = 'degraded';
    }
    if (serviceStates.every(state => state === 'error' || state === 'disconnected')) {
      healthStatus.status = 'unhealthy';
    }

    // Return appropriate HTTP status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      services: {
        turnkey: 'error',
        database: 'error',
      },
      uptime: process.uptime(),
    };

    res.status(503).json(errorResponse);
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', (_req: Request, res: Response) => {
  try {
    // Check if all required services are available
    TurnkeyClientManager.getInstance();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Service not ready';

    res.status(503).json({
      status: 'not_ready',
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
