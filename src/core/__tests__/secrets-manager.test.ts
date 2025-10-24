/**
 * Unit tests for SecretsManager
 */

import { SecretsManager, SecretProvider, SecretConfig } from '../secrets-manager';

describe('SecretsManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset singleton instance
    SecretsManager.resetInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    it('should create singleton instance with config', () => {
      const config: SecretConfig = {
        provider: SecretProvider.ENVIRONMENT,
      };

      const instance1 = SecretsManager.getInstance(config);
      const instance2 = SecretsManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if no config on first call', () => {
      expect(() => SecretsManager.getInstance()).toThrow(
        'SecretsManager must be initialized with configuration on first use'
      );
    });
  });

  describe('loadSecrets - Environment Provider', () => {
    it('should load valid secrets from environment', async () => {
      const validApiKey = '12345678-1234-1234-1234-123456789012';
      const pemKey =
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----';
      const validSecretKey = Buffer.from(pemKey).toString('base64');

      process.env.FIREBLOCKS_API_KEY = validApiKey;
      process.env.FIREBLOCKS_SECRET_KEY = validSecretKey;

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      const secrets = await manager.loadSecrets();

      expect(secrets.apiKey).toBe(validApiKey);
      // The secret key should be decoded from base64 to PEM format
      expect(secrets.secretKey).toBe(pemKey);
    });

    it('should throw error for missing environment variables', async () => {
      delete process.env.FIREBLOCKS_API_KEY;
      delete process.env.FIREBLOCKS_SECRET_KEY;

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'FIREBLOCKS_API_KEY and FIREBLOCKS_SECRET_KEY must be set in environment'
      );
    });

    it('should validate API key format', async () => {
      process.env.FIREBLOCKS_API_KEY = 'invalid-api-key';
      process.env.FIREBLOCKS_SECRET_KEY = Buffer.from(
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      ).toString('base64');

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid API key format: expected UUID format'
      );
    });

    it('should validate secret key is base64 or PEM', async () => {
      process.env.FIREBLOCKS_API_KEY = '12345678-1234-1234-1234-123456789012';
      process.env.FIREBLOCKS_SECRET_KEY = 'not-base64!@#$%^&*()';

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid secret key format: must be PEM format or base64-encoded PEM'
      );
    });

    it('should validate secret key contains private key markers', async () => {
      process.env.FIREBLOCKS_API_KEY = '12345678-1234-1234-1234-123456789012';
      process.env.FIREBLOCKS_SECRET_KEY = Buffer.from('just some random text').toString('base64');

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid secret key format: must be PEM format or base64-encoded PEM'
      );
    });
  });

  describe('getSecrets', () => {
    it('should return loaded secrets', async () => {
      const validApiKey = '12345678-1234-1234-1234-123456789012';
      const validSecretKey = Buffer.from(
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----'
      ).toString('base64');

      process.env.FIREBLOCKS_API_KEY = validApiKey;
      process.env.FIREBLOCKS_SECRET_KEY = validSecretKey;

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await manager.loadSecrets();
      const secrets = manager.getSecrets();

      expect(secrets.apiKey).toBe(validApiKey);
      // The secret key should be decoded from base64 to PEM format
      const decodedKey =
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----';
      expect(secrets.secretKey).toBe(decodedKey);
    });

    it('should throw error if secrets not loaded', () => {
      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');
    });
  });

  describe('clearSecrets', () => {
    it('should clear cached secrets', async () => {
      process.env.FIREBLOCKS_API_KEY = '12345678-1234-1234-1234-123456789012';
      process.env.FIREBLOCKS_SECRET_KEY = Buffer.from(
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      ).toString('base64');

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      await manager.loadSecrets();
      manager.clearSecrets();

      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');
    });
  });

  describe('validation failure handling', () => {
    it('should not cache secrets when validation fails', async () => {
      // First attempt with invalid API key
      process.env.FIREBLOCKS_API_KEY = 'invalid-api-key';
      process.env.FIREBLOCKS_SECRET_KEY = Buffer.from(
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      ).toString('base64');

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      // First load should fail validation
      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid API key format: expected UUID format'
      );

      // Verify secrets were not cached
      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');

      // Fix the API key
      process.env.FIREBLOCKS_API_KEY = '12345678-1234-1234-1234-123456789012';

      // Second load should succeed
      const secrets = await manager.loadSecrets();
      expect(secrets.apiKey).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should not return previously failed secrets on retry', async () => {
      // Start with invalid secrets
      process.env.FIREBLOCKS_API_KEY = 'invalid-api-key';
      process.env.FIREBLOCKS_SECRET_KEY = 'invalid-secret';

      const manager = SecretsManager.getInstance({
        provider: SecretProvider.ENVIRONMENT,
      });

      // First attempt fails
      await expect(manager.loadSecrets()).rejects.toThrow();

      // Second attempt should also fail, not return cached invalid secrets
      await expect(manager.loadSecrets()).rejects.toThrow();

      // Fix secrets
      process.env.FIREBLOCKS_API_KEY = '12345678-1234-1234-1234-123456789012';
      process.env.FIREBLOCKS_SECRET_KEY = Buffer.from(
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      ).toString('base64');

      // Now it should work
      const secrets = await manager.loadSecrets();
      expect(secrets.apiKey).toBe('12345678-1234-1234-1234-123456789012');
    });
  });

  describe('unsupported providers', () => {
    it('should throw error for AWS provider (not implemented)', async () => {
      const manager = SecretsManager.getInstance({
        provider: SecretProvider.AWS_SECRETS_MANAGER,
        awsRegion: 'us-east-1',
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'AWS Secrets Manager integration not yet implemented'
      );
    });

    it('should throw error for HashiCorp Vault provider (not implemented)', async () => {
      const manager = SecretsManager.getInstance({
        provider: SecretProvider.HASHICORP_VAULT,
        vaultUrl: 'https://vault.example.com',
      });

      await expect(manager.loadSecrets()).rejects.toThrow(
        'HashiCorp Vault integration not yet implemented'
      );
    });
  });
});
