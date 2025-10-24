/**
 * Singleton manager for Fireblocks SDK client
 * Handles initialization and provides centralized access to the Fireblocks API
 * Now with enhanced security through SecretsManager integration
 */

import { Fireblocks, BasePath } from '@fireblocks/ts-sdk';
import { SecretsManager, SecretProvider, SecretConfig } from './secrets-manager';
import { IPValidator, IPAllowlistConfig } from './ip-validator';

/**
 * Environment types for Fireblocks API
 */
export enum FireblocksEnvironment {
  SANDBOX = 'sandbox',
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

/**
 * Configuration for Fireblocks client
 */
export interface FireblocksClientConfig {
  environment: FireblocksEnvironment;
  secretConfig?: SecretConfig;
  ipAllowlistConfig?: IPAllowlistConfig;
}

/**
 * Manages singleton instance of Fireblocks client with enhanced security
 */
export class FireblocksClientManager {
  private static instance: Fireblocks | null = null;
  private static config: FireblocksClientConfig | null = null;
  private static secretsManager: SecretsManager | null = null;
  private static ipValidator: IPValidator | null = null;
  private static isInitialized = false;
  private static isLegacyInitialized = false;

  /**
   * Initialize the Fireblocks client with secure configuration
   * Must be called once before using getInstance()
   */
  static async initialize(config?: FireblocksClientConfig): Promise<void> {
    if (FireblocksClientManager.isInitialized && !FireblocksClientManager.isLegacyInitialized) {
      return;
    }

    if (FireblocksClientManager.isLegacyInitialized) {
      FireblocksClientManager.resetInstance();
    }

    const effectiveConfig: FireblocksClientConfig =
      config ??
      ({
        environment: (process.env.FIREBLOCKS_ENV || 'sandbox') as FireblocksEnvironment,
        secretConfig: {
          provider: SecretProvider.ENVIRONMENT,
        },
      } as FireblocksClientConfig);

    FireblocksClientManager.config = effectiveConfig;

    const secretsManager = SecretsManager.getInstance(
      effectiveConfig.secretConfig || { provider: SecretProvider.ENVIRONMENT }
    );
    const secrets = await secretsManager.loadSecrets();
    FireblocksClientManager.secretsManager = secretsManager;

    if (effectiveConfig.ipAllowlistConfig) {
      FireblocksClientManager.ipValidator = new IPValidator(effectiveConfig.ipAllowlistConfig);
    } else {
      FireblocksClientManager.ipValidator = null;
    }

    const basePath = FireblocksClientManager.getBasePath(effectiveConfig.environment);

    FireblocksClientManager.instance = new Fireblocks({
      apiKey: secrets.apiKey,
      secretKey: secrets.secretKey,
      basePath,
    });

    FireblocksClientManager.isInitialized = true;
    FireblocksClientManager.isLegacyInitialized = false;
  }

  /**
   * Get the singleton instance of Fireblocks client
   * For backward compatibility, this will auto-initialize with environment variables
   * @returns Initialized Fireblocks client
   */
  static getInstance(): Fireblocks {
    if (!FireblocksClientManager.isInitialized) {
      const apiKey = process.env.FIREBLOCKS_API_KEY;
      const secretKey = process.env.FIREBLOCKS_SECRET_KEY;

      if (!apiKey || !secretKey) {
        throw new Error(
          'Fireblocks credentials not configured. ' +
            'Please set FIREBLOCKS_API_KEY and FIREBLOCKS_SECRET_KEY environment variables.'
        );
      }

      // Initialize synchronously for backward compatibility
      const environment = (process.env.FIREBLOCKS_ENV || 'sandbox') as FireblocksEnvironment;
      const basePath = FireblocksClientManager.getBasePath(environment);

      FireblocksClientManager.instance = new Fireblocks({
        apiKey,
        secretKey,
        basePath,
      });

      FireblocksClientManager.isInitialized = true;
      FireblocksClientManager.isLegacyInitialized = true;
    }

    if (!FireblocksClientManager.instance) {
      throw new Error('Fireblocks client is not initialized');
    }

    return FireblocksClientManager.instance;
  }

  /**
   * Validate IP address against allowlist
   * @param ipAddress - IP to validate
   * @returns true if allowed or no validator configured
   */
  static validateIP(ipAddress: string): boolean {
    if (!FireblocksClientManager.ipValidator) {
      return true;
    }
    return FireblocksClientManager.ipValidator.isAllowed(ipAddress);
  }

  /**
   * Map environment to Fireblocks base path
   */
  private static getBasePath(environment: FireblocksEnvironment): BasePath {
    switch (environment) {
      case FireblocksEnvironment.SANDBOX:
        return BasePath.Sandbox;
      case FireblocksEnvironment.TESTNET:
        // Testnet uses the same API as mainnet
        return BasePath.US;
      case FireblocksEnvironment.MAINNET:
        return BasePath.US;
      default:
        throw new Error(`Unknown Fireblocks environment: ${environment}`);
    }
  }

  /**
   * Get current environment (for testing/debugging)
   */
  static getEnvironment(): FireblocksEnvironment | undefined {
    return FireblocksClientManager.config?.environment;
  }

  /**
   * Get IP validator instance
   */
  static getIPValidator(): IPValidator | null {
    return FireblocksClientManager.ipValidator;
  }

  /**
   * Reset the client instance (useful for testing)
   */
  static resetInstance(): void {
    FireblocksClientManager.instance = null;
    FireblocksClientManager.config = null;
    FireblocksClientManager.secretsManager?.clearSecrets();
    FireblocksClientManager.ipValidator = null;
    FireblocksClientManager.isInitialized = false;
    FireblocksClientManager.isLegacyInitialized = false;
    SecretsManager.resetInstance();
  }
}
