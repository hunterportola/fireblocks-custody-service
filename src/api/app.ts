import 'dotenv/config';
import { CustodyAPIServer, ServerConfig } from './server';
import { TurnkeyClientManager } from '../core/turnkey-client';
import { SecretProvider } from '../core/secrets-manager';

async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Turnkey Custody API Server...');

    // Initialize Turnkey client
    try {
      await TurnkeyClientManager.initialize({
        platform: {
          environment: (process.env.TURNKEY_ENVIRONMENT as 'sandbox' | 'staging' | 'production') ?? 'sandbox',
          organizationId: process.env.TURNKEY_ORGANIZATION_ID ?? '',
          apiBaseUrl: process.env.TURNKEY_API_BASE_URL,
          originator: {
            originatorId: 'custody_api_server',
            displayName: 'Custody API Server',
          },
        },
        secretConfig: {
          provider: SecretProvider.ENVIRONMENT,
        },
      });
      console.log('✅ Turnkey client initialized successfully');
    } catch (error) {
      console.warn('⚠️ Turnkey client initialization failed:', error);
      console.log('🔄 Server will start but Turnkey features may not work');
    }

    // Server configuration
    const serverConfig: ServerConfig = {
      port: parseInt(process.env.PORT ?? '3000'),
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') ?? 'development',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 minutes
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100'),
    };

    // Create and start server
    const server = new CustodyAPIServer(serverConfig);
    await server.start();

    console.log('');
    console.log('🎉 Custody API Server is ready!');
    console.log('📖 API Documentation:');
    console.log(`   Health Check: http://localhost:${serverConfig.port}/api/v1/health`);
    console.log(`   Lender Info:  http://localhost:${serverConfig.port}/api/v1/lenders/me`);
    console.log(`   Disbursements: http://localhost:${serverConfig.port}/api/v1/disbursements`);
    console.log('');
    console.log('🔑 Example API call:');
    console.log('   curl -H "Authorization: Bearer originator_acme_lending_api_key_5u55s56j9n8" \\');
    console.log(`        http://localhost:${serverConfig.port}/api/v1/lenders/me`);
    console.log('');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
void startServer();
