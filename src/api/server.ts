import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/error-handler';
import { requestLogger, logInfo } from './middleware/request-logger';

import { disbursementRoutes } from './routes/disbursements';
import { lenderRoutes } from './routes/lenders';
import { healthRoutes } from './routes/health';
import { requireTenantAuth } from './middleware/tenant-auth';
import { createOriginatorRoutes } from './routes/originators';

export interface ServerConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  corsOrigins?: string[];
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
}

export class CustodyAPIServer {
  private app: express.Application;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins || false,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Signature', 'X-Timestamp'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs ?? 15 * 60 * 1000, // 15 minutes
      max: this.config.rateLimitMaxRequests ?? 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api', limiter);

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging  
    this.app.use(morgan(this.config.environment === 'production' ? 'combined' : 'dev'));
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.use('/api/v1/health', healthRoutes);

    // Control plane onboarding routes (internal auth)
    this.app.use('/api/v1/originators', createOriginatorRoutes());

    // Lender management (ensure tenant context before router-level permissions)
    this.app.use('/api/v1/lenders', requireTenantAuth(), lenderRoutes);

    // Disbursement operations (tenant auth handled at route level)
    this.app.use('/api/v1/disbursements', disbursementRoutes);

    // 404 handler
    this.app.use((req, res): void => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    
    await new Promise<void>((resolve) => {
      const server = this.app.listen(this.config.port, () => {
        logInfo(`🚀 Custody API Server running on port ${this.config.port}`);
        logInfo(`📊 Environment: ${this.config.environment}`);
        logInfo(`🔒 CORS origins: ${this.config.corsOrigins?.join(', ') ?? 'disabled'}`);
        resolve();
      });

      // Graceful shutdown
      process.on('SIGTERM', (): void => {
        logInfo('🛑 SIGTERM received, shutting down gracefully');
        server.close((): void => {
          logInfo('✅ Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', (): void => {
        logInfo('🛑 SIGINT received, shutting down gracefully');
        server.close((): void => {
          logInfo('✅ Server closed');
          process.exit(0);
        });
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
