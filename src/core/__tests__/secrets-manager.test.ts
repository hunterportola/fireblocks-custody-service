/**
 * Unit tests for Turnkey SecretsManager
 */

import { SecretsManager, SecretProvider, type SecretConfig } from '../secrets-manager';

const SAMPLE_PRIVATE_KEY =
  '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----';
const SAMPLE_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----';

describe('SecretsManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    SecretsManager.resetInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const envConfig: SecretConfig = {
    provider: SecretProvider.ENVIRONMENT,
  };

  describe('getInstance', () => {
    it('creates a singleton instance when config is provided', () => {
      const instance1 = SecretsManager.getInstance(envConfig);
      const instance2 = SecretsManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('throws if accessed before initialization config', () => {
      expect(() => SecretsManager.getInstance()).toThrow(
        'SecretsManager must be initialized with configuration on first use'
      );
    });
  });

  describe('loadSecrets (environment provider)', () => {
    it('loads and normalizes PEM keys from base64 encoded environment variables', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = Buffer.from(SAMPLE_PRIVATE_KEY).toString('base64');
      process.env.TURNKEY_API_PUBLIC_KEY = Buffer.from(SAMPLE_PUBLIC_KEY).toString('base64');
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';
      process.env.TURNKEY_ORGANIZATION_ID = 'org-123';

      const manager = SecretsManager.getInstance(envConfig);
      const secrets = await manager.loadSecrets();

      expect(secrets.apiPrivateKey).toBe(SAMPLE_PRIVATE_KEY);
      expect(secrets.apiPublicKey).toBe(SAMPLE_PUBLIC_KEY);
      expect(secrets.apiKeyId).toBe('api-key-id');
      expect(secrets.defaultOrganizationId).toBe('org-123');
    });

    it('accepts PEM strings directly', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = SAMPLE_PRIVATE_KEY;
      process.env.TURNKEY_API_PUBLIC_KEY = SAMPLE_PUBLIC_KEY;
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);
      const secrets = await manager.loadSecrets();

      expect(secrets.apiPrivateKey).toBe(SAMPLE_PRIVATE_KEY);
      expect(secrets.apiPublicKey).toBe(SAMPLE_PUBLIC_KEY);
    });

    it('throws when required environment variables are missing', async () => {
      delete process.env.TURNKEY_API_PRIVATE_KEY;
      delete process.env.TURNKEY_API_PUBLIC_KEY;
      delete process.env.TURNKEY_API_KEY_ID;

      const manager = SecretsManager.getInstance(envConfig);

      await expect(manager.loadSecrets()).rejects.toThrow(
        'TURNKEY_API_PRIVATE_KEY, TURNKEY_API_PUBLIC_KEY, and TURNKEY_API_KEY_ID must be set in environment'
      );
    });

    it('validates private key formatting', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = 'not-a-valid-key';
      process.env.TURNKEY_API_PUBLIC_KEY = Buffer.from(SAMPLE_PUBLIC_KEY).toString('base64');
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid private key format: must be PEM, base64-encoded PEM, or Turnkey hex'
      );
    });

    it('validates public key formatting', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = Buffer.from(SAMPLE_PRIVATE_KEY).toString('base64');
      process.env.TURNKEY_API_PUBLIC_KEY = 'not-a-valid-key';
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid public key format: must be PEM, base64-encoded PEM, or Turnkey hex'
      );
    });
  });

  describe('getSecrets', () => {
    it('returns cached secrets after loading', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = Buffer.from(SAMPLE_PRIVATE_KEY).toString('base64');
      process.env.TURNKEY_API_PUBLIC_KEY = Buffer.from(SAMPLE_PUBLIC_KEY).toString('base64');
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);
      await manager.loadSecrets();

      const secrets = manager.getSecrets();
      expect(secrets.apiPrivateKey).toBe(SAMPLE_PRIVATE_KEY);
      expect(secrets.apiPublicKey).toBe(SAMPLE_PUBLIC_KEY);
    });

    it('throws if secrets are requested before loading', () => {
      const manager = SecretsManager.getInstance(envConfig);
      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');
    });
  });

  describe('clearSecrets', () => {
    it('clears cached secrets so they must be reloaded', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = Buffer.from(SAMPLE_PRIVATE_KEY).toString('base64');
      process.env.TURNKEY_API_PUBLIC_KEY = Buffer.from(SAMPLE_PUBLIC_KEY).toString('base64');
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);
      await manager.loadSecrets();
      manager.clearSecrets();

      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');
    });
  });

  describe('validation failure handling', () => {
    it('does not cache secrets when validation fails', async () => {
      process.env.TURNKEY_API_PRIVATE_KEY = 'invalid';
      process.env.TURNKEY_API_PUBLIC_KEY = Buffer.from(SAMPLE_PUBLIC_KEY).toString('base64');
      process.env.TURNKEY_API_KEY_ID = 'api-key-id';

      const manager = SecretsManager.getInstance(envConfig);

      await expect(manager.loadSecrets()).rejects.toThrow(
        'Invalid private key format: must be PEM, base64-encoded PEM, or Turnkey hex'
      );

      expect(() => manager.getSecrets()).toThrow('Secrets not loaded. Call loadSecrets() first');

      process.env.TURNKEY_API_PRIVATE_KEY = Buffer.from(SAMPLE_PRIVATE_KEY).toString('base64');
      const secrets = await manager.loadSecrets();
      expect(secrets.apiPrivateKey).toBe(SAMPLE_PRIVATE_KEY);
    });
  });
});
