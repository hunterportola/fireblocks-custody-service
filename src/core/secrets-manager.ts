/**
 * Secrets Manager for secure handling of Fireblocks API credentials
 * Supports multiple secret storage backends with validation
 */

export enum SecretProvider {
  ENVIRONMENT = 'environment',
  AWS_SECRETS_MANAGER = 'aws_secrets_manager',
  HASHICORP_VAULT = 'hashicorp_vault',
  AZURE_KEY_VAULT = 'azure_key_vault',
}

export interface SecretConfig {
  provider: SecretProvider;
  encryptionKey?: string;
  vaultUrl?: string;
  awsRegion?: string;
}

export interface FireblocksSecrets {
  apiKey: string;
  secretKey: string;
  webhookPublicKey?: string;
}

export class SecretsManager {
  private static instance: SecretsManager | null = null;
  private secrets: FireblocksSecrets | null = null;
  private readonly config: SecretConfig;

  private constructor(config: SecretConfig) {
    this.config = config;
    this.validateConfig();
  }

  static getInstance(config?: SecretConfig): SecretsManager {
    if (!SecretsManager.instance) {
      if (!config) {
        throw new Error('SecretsManager must be initialized with configuration on first use');
      }
      SecretsManager.instance = new SecretsManager(config);
    }
    return SecretsManager.instance;
  }

  private validateConfig(): void {
    if (!this.config.provider) {
      throw new Error('Secret provider must be specified');
    }

    // Validate provider-specific requirements
    switch (this.config.provider) {
      case SecretProvider.HASHICORP_VAULT:
        if (!this.config.vaultUrl) {
          throw new Error('Vault URL required for HashiCorp Vault provider');
        }
        break;
      case SecretProvider.AWS_SECRETS_MANAGER:
        if (!this.config.awsRegion) {
          throw new Error('AWS region required for AWS Secrets Manager');
        }
        break;
    }
  }

  /**
   * Load secrets from configured provider
   */
  async loadSecrets(): Promise<FireblocksSecrets> {
    if (this.secrets) {
      return this.secrets;
    }

    let loadedSecrets: FireblocksSecrets;

    switch (this.config.provider) {
      case SecretProvider.ENVIRONMENT:
        loadedSecrets = await this.loadFromEnvironment();
        break;
      case SecretProvider.AWS_SECRETS_MANAGER:
        loadedSecrets = await this.loadFromAWS();
        break;
      case SecretProvider.HASHICORP_VAULT:
        loadedSecrets = await this.loadFromHashicorp();
        break;
      case SecretProvider.AZURE_KEY_VAULT:
        loadedSecrets = await this.loadFromAzure();
        break;
      default:
        throw new Error(`Unsupported secret provider: ${this.config.provider}`);
    }

    // Validate before caching
    this.validateSecrets(loadedSecrets);

    // Only cache after successful validation
    this.secrets = loadedSecrets;
    return this.secrets;
  }

  /**
   * Load secrets from environment variables with validation
   */
  private async loadFromEnvironment(): Promise<FireblocksSecrets> {
    const apiKey = process.env.FIREBLOCKS_API_KEY;
    let secretKey = process.env.FIREBLOCKS_SECRET_KEY;
    const webhookPublicKey = process.env.FIREBLOCKS_WEBHOOK_PUBLIC_KEY;

    if (!apiKey || !secretKey) {
      throw new Error('FIREBLOCKS_API_KEY and FIREBLOCKS_SECRET_KEY must be set in environment');
    }

    // Validate and potentially decode secret key
    secretKey = this.validateSecretKeyFormat(secretKey);

    return {
      apiKey,
      secretKey,
      webhookPublicKey,
    };
  }

  /**
   * Placeholder for AWS Secrets Manager integration
   */
  private async loadFromAWS(): Promise<FireblocksSecrets> {
    // In production, this would use AWS SDK
    throw new Error('AWS Secrets Manager integration not yet implemented');
  }

  /**
   * Placeholder for HashiCorp Vault integration
   */
  private async loadFromHashicorp(): Promise<FireblocksSecrets> {
    // In production, this would use Vault API
    throw new Error('HashiCorp Vault integration not yet implemented');
  }

  /**
   * Placeholder for Azure Key Vault integration
   */
  private async loadFromAzure(): Promise<FireblocksSecrets> {
    // In production, this would use Azure SDK
    throw new Error('Azure Key Vault integration not yet implemented');
  }

  /**
   * Validate secret key format and decode if base64
   */
  private validateSecretKeyFormat(secretKey: string): string {
    // Check if it's already a raw PEM string
    if (secretKey.includes('-----BEGIN') && secretKey.includes('PRIVATE KEY-----')) {
      return secretKey;
    }

    // Try to decode from base64
    try {
      const decoded = Buffer.from(secretKey, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN') && decoded.includes('PRIVATE KEY-----')) {
        return decoded;
      }
      throw new Error('Decoded content does not appear to be a PEM private key');
    } catch (error) {
      throw new Error('Invalid secret key format: must be PEM format or base64-encoded PEM');
    }
  }

  /**
   * Validate all required secrets are present and properly formatted
   */
  private validateSecrets(secrets: FireblocksSecrets): void {
    if (!secrets.apiKey || secrets.apiKey.trim() === '') {
      throw new Error('API key is required and cannot be empty');
    }

    if (!secrets.secretKey || secrets.secretKey.trim() === '') {
      throw new Error('Secret key is required and cannot be empty');
    }

    // API key should be a UUID-like string
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(secrets.apiKey)) {
      throw new Error('Invalid API key format: expected UUID format');
    }
  }

  /**
   * Get decrypted secrets
   */
  getSecrets(): FireblocksSecrets {
    if (!this.secrets) {
      throw new Error('Secrets not loaded. Call loadSecrets() first');
    }
    return this.secrets;
  }

  /**
   * Clear cached secrets from memory
   */
  clearSecrets(): void {
    this.secrets = null;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    if (SecretsManager.instance) {
      SecretsManager.instance.clearSecrets();
    }
    SecretsManager.instance = null;
  }

  /**
   * Rotate secrets (placeholder for future implementation)
   */
  async rotateSecrets(): Promise<void> {
    throw new Error('Secret rotation not yet implemented');
  }
}
