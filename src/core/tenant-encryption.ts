import * as crypto from 'crypto';
import { TurnkeyServiceError, ErrorCodes } from './error-handler';

/**
 * Standalone tenant connection string encryption/decryption utility
 * Does not require admin database access - only encryption key
 */
export class TenantEncryption {
  private readonly encryptionKey?: string;
  private readonly enabled: boolean;

  constructor(encryptionKey?: string) {
    const key = encryptionKey ?? process.env.TENANT_DB_ENCRYPTION_KEY;

    if (typeof key === 'string' && key.trim().length > 0) {
      this.encryptionKey = key.trim();
      this.enabled = true;
    } else {
      this.encryptionKey = undefined;
      this.enabled = false;
    }
  }

  private encrypt(value: string): string {
    if (!this.enabled || this.encryptionKey == null) {
      return value;
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedPayload: string): string {
    if (!this.enabled || this.encryptionKey == null) {
      throw new TurnkeyServiceError(
        'TENANT_DB_ENCRYPTION_KEY is required to decrypt stored secrets',
        ErrorCodes.INVALID_CONFIG
      );
    }
    try {
      const parts = encryptedPayload.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new TurnkeyServiceError(
        `Failed to decrypt payload: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCodes.INVALID_CONFIG
      );
    }
  }

  /**
   * Encrypt a connection string using AES-256-GCM
   */
  encryptConnectionString(connectionString: string): string {
    return this.encrypt(connectionString);
  }

  /**
   * Decrypt a connection string encrypted with AES-256-GCM
   */
  decryptConnectionString(encryptedConnectionString: string): string {
    // Development fallback: allow plain connection strings for testing
    if (encryptedConnectionString.startsWith('postgresql://')) {
      return encryptedConnectionString;
    }
    if (!this.enabled || this.encryptionKey == null) {
      throw new TurnkeyServiceError(
        'TENANT_DB_ENCRYPTION_KEY is required to decrypt stored connection strings',
        ErrorCodes.INVALID_CONFIG
      );
    }
    return this.decrypt(encryptedConnectionString);
  }

  /**
   * Encrypt an arbitrary secret payload.
   */
  encryptPayload(plainText: string): string {
    return this.encrypt(plainText);
  }

  /**
   * Decrypt an arbitrary secret payload.
   */
  decryptPayload(encryptedPayload: string): string {
    return this.decrypt(encryptedPayload);
  }

  /**
   * Get a singleton instance with the default encryption key
   */
  static getInstance(): TenantEncryption {
    if (!TenantEncryption._instance) {
      TenantEncryption._instance = new TenantEncryption();
    }
    return TenantEncryption._instance;
  }

  private static _instance: TenantEncryption | null = null;
}
