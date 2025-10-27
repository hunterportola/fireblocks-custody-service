import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { lenderAuth } from './middleware/lender-auth';

import { disbursementRoutes } from './routes/disbursements';
import { lenderRoutes } from './routes/lenders';
import { healthRoutes } from './routes/health';

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

    // Lender management (auth required)
    this.app.use('/api/v1/lenders', lenderAuth, lenderRoutes);

    // Disbursement operations (auth required)
    this.app.use('/api/v1/disbursements', lenderAuth, disbursementRoutes);

    // 404 handler
    this.app.use((req, res) => {
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
    // Initialize MVP custody service
    try {
      const { initializeMVPCustodyService } = await import('../services/mvp-custody-integration');
      await initializeMVPCustodyService();
      console.log('🔐 MVP Custody Service initialized');
    } catch (error) {
      console.warn('⚠️  Custody service initialization failed, using fallback:', error);
    }
    
    await new Promise<void>((resolve) => {
      const server = this.app.listen(this.config.port, () => {
        console.log(`🚀 Custody API Server running on port ${this.config.port}`);
        console.log(`📊 Environment: ${this.config.environment}`);
        console.log(`🔒 CORS origins: ${this.config.corsOrigins?.join(', ') ?? 'disabled'}`);
        console.log('');
        console.log('🔑 Test API Keys:');
        console.log('  - lender_acme_corp_api_key_xyz123');
        console.log('  - lender_demo_api_key_abc789');
        console.log('  - originator_acme_lending_api_key_5u55s56j9n8');
        console.log('  - originator_stellar_loans_api_key_ue162vf99l9');
        resolve();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('✅ Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT received, shutting down gracefully');
        server.close(() => {
          console.log('✅ Server closed');
          process.exit(0);
        });
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
