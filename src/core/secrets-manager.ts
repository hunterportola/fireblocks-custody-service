/**
 * Secrets Manager for secure handling of Turnkey API credentials.
 * Supports multiple secret storage backends with validation.
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

export interface AutomationKeyCredentials {
  apiPrivateKey: string;
  apiPublicKey: string;
  apiKeyId?: string;
}

export interface TurnkeySecrets {
  apiPrivateKey: string;
  apiPublicKey: string;
  apiKeyId: string;
  defaultOrganizationId?: string;
  automationKeys?: Record<string, AutomationKeyCredentials>;
  delegatedKeys?: Record<string, string>;
  passkeyAttestations?: Record<string, string>;
}

export interface PasskeyAttestationSecret {
  challenge: string;
  attestation: {
    credentialId: string;
    clientDataJson: string;
    attestationObject: string;
    transports?: string[];
  };
}

import { isNonEmptyString, isRecord } from '../utils/type-guards';

export class SecretsManager {
  private static instance: SecretsManager | null = null;
  private secrets: TurnkeySecrets | null = null;
  private automationCache: Record<string, AutomationKeyCredentials> = {};
  private passkeyAttestationCache: Record<string, PasskeyAttestationSecret> = {};
  private readonly config: SecretConfig;

  private constructor(config: SecretConfig) {
    this.config = config;
    this.validateConfig();
  }

  static getInstance(config?: SecretConfig): SecretsManager {
    if (SecretsManager.instance === null) {
      if (config === undefined) {
        throw new Error('SecretsManager must be initialized with configuration on first use');
      }
      SecretsManager.instance = new SecretsManager(config);
    }
    return SecretsManager.instance;
  }

  private validateConfig(): void {
    if (this.config.provider === undefined) {
      throw new Error('Secret provider must be specified');
    }

    switch (this.config.provider) {
      case SecretProvider.HASHICORP_VAULT:
        if (!isNonEmptyString(this.config.vaultUrl)) {
          throw new Error('Vault URL required for HashiCorp Vault provider');
        }
        break;
      case SecretProvider.AWS_SECRETS_MANAGER:
        if (!isNonEmptyString(this.config.awsRegion)) {
          throw new Error('AWS region required for AWS Secrets Manager');
        }
        break;
      default:
        break;
    }
  }

  async loadSecrets(): Promise<TurnkeySecrets> {
    if (this.secrets !== null) {
      return this.secrets;
    }

    let loadedSecrets: TurnkeySecrets;

    switch (this.config.provider) {
      case SecretProvider.ENVIRONMENT:
        loadedSecrets = this.loadFromEnvironment();
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
        throw new Error(`Unsupported secret provider: ${String(this.config.provider)}`);
    }

    this.validateSecrets(loadedSecrets);
    this.secrets = loadedSecrets;
    this.automationCache = { ...(loadedSecrets.automationKeys ?? {}) };
    this.passkeyAttestationCache = {};
    return this.secrets;
  }

  private loadFromEnvironment(): TurnkeySecrets {
    const rawPrivateKey = process.env.TURNKEY_API_PRIVATE_KEY;
    const rawPublicKey = process.env.TURNKEY_API_PUBLIC_KEY;
    const apiKeyId = process.env.TURNKEY_API_KEY_ID;
    const defaultOrganizationId = process.env.TURNKEY_ORGANIZATION_ID;

    if (!isNonEmptyString(rawPrivateKey) || !isNonEmptyString(rawPublicKey) || !isNonEmptyString(apiKeyId)) {
      throw new Error(
        'TURNKEY_API_PRIVATE_KEY, TURNKEY_API_PUBLIC_KEY, and TURNKEY_API_KEY_ID must be set in environment'
      );
    }

    const apiPrivateKey = this.normalizePemKey(rawPrivateKey, 'private');
    const apiPublicKey = this.normalizePemKey(rawPublicKey, 'public');

    const automationKeys = this.parseAutomationMap(process.env.TURNKEY_AUTOMATION_KEYS);
    const delegatedKeys = this.parseStringMap(process.env.TURNKEY_DELEGATED_KEYS);
    const passkeyAttestations = this.parseStringMap(process.env.TURNKEY_PASSKEY_ATTESTATIONS);

    const trimmedOrganizationId =
      defaultOrganizationId !== undefined ? defaultOrganizationId.trim() : undefined;
    let defaultOrganizationIdValue: string | undefined;
    if (typeof trimmedOrganizationId === 'string' && trimmedOrganizationId.length > 0) {
      defaultOrganizationIdValue = trimmedOrganizationId;
    }

    return {
      apiPrivateKey,
      apiPublicKey,
      apiKeyId,
      defaultOrganizationId: defaultOrganizationIdValue,
      automationKeys,
      delegatedKeys,
      passkeyAttestations,
    };
  }

  private loadFromAWS(): Promise<TurnkeySecrets> {
    return Promise.reject(new Error('AWS Secrets Manager integration not yet implemented'));
  }

  private loadFromHashicorp(): Promise<TurnkeySecrets> {
    return Promise.reject(new Error('HashiCorp Vault integration not yet implemented'));
  }

  private loadFromAzure(): Promise<TurnkeySecrets> {
    return Promise.reject(new Error('Azure Key Vault integration not yet implemented'));
  }

  private parseAutomationMap(
    rawValue: string | undefined
  ): Record<string, AutomationKeyCredentials> | undefined {
    if (!isNonEmptyString(rawValue)) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (!isRecord(parsed)) {
        throw new Error();
      }

      const result: Record<string, AutomationKeyCredentials> = {};
      Object.entries(parsed).forEach(([templateId, credsRaw]) => {
        if (!isRecord(credsRaw)) {
          throw new Error(`Invalid automation credentials for template "${templateId}"`);
        }

        const privateKeyValue = credsRaw.apiPrivateKey;
        const publicKeyValue = credsRaw.apiPublicKey;
        if (!isNonEmptyString(privateKeyValue) || !isNonEmptyString(publicKeyValue)) {
          throw new Error(`Automation credentials for template "${templateId}" must include apiPrivateKey and apiPublicKey strings`);
        }

        const apiKeyIdValue =
          typeof credsRaw.apiKeyId === 'string' && credsRaw.apiKeyId.trim().length > 0
            ? credsRaw.apiKeyId.trim()
            : undefined;

        const normalizedCredentials = {
          apiPrivateKey: this.normalizePemKey(privateKeyValue, 'private'),
          apiPublicKey: this.normalizePemKey(publicKeyValue, 'public'),
          apiKeyId: apiKeyIdValue,
        };
        Object.defineProperty(result, templateId, {
          value: normalizedCredentials,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      });

      return result;
    } catch {
      throw new Error(
        'TURNKEY_AUTOMATION_KEYS must be valid JSON of the form {"templateId": {"apiPrivateKey": "...", "apiPublicKey": "...", "apiKeyId": "..."}}'
      );
    }
  }

  private parseStringMap(rawValue: string | undefined): Record<string, string> | undefined {
    if (!isNonEmptyString(rawValue)) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (!isRecord(parsed)) {
        throw new Error();
      }

      const result: Record<string, string> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          throw new Error(`Value for key "${key}" must be a string`);
        }
        Object.defineProperty(result, key, {
          value: value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      });

      return result;
    } catch {
      throw new Error('Maps supplied via environment must be valid JSON objects of string values');
    }
  }

  private normalizePemKey(value: string, keyType: 'private' | 'public'): string {
    const trimmed = value.trim();

    if (trimmed.includes('-----BEGIN')) {
      return trimmed;
    }

    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8').trim();
      if (decoded.includes('-----BEGIN')) {
        return decoded;
      }
      throw new Error();
    } catch {
      throw new Error(
        `Invalid ${keyType} key format: must be PEM format or base64-encoded PEM`
      );
    }
  }

  private validateSecrets(secrets: TurnkeySecrets): void {
    if (!isNonEmptyString(secrets.apiPrivateKey) || !secrets.apiPrivateKey.includes('-----BEGIN')) {
      throw new Error('API private key is required and must be PEM formatted');
    }

    if (!isNonEmptyString(secrets.apiPublicKey) || !secrets.apiPublicKey.includes('-----BEGIN')) {
      throw new Error('API public key is required and must be PEM formatted');
    }

    if (!isNonEmptyString(secrets.apiKeyId)) {
      throw new Error('API key ID is required and cannot be empty');
    }
  }

  getSecrets(): TurnkeySecrets {
    if (this.secrets === null) {
      throw new Error('Secrets not loaded. Call loadSecrets() first');
    }
    return this.secrets;
  }

  setAutomationCredentials(templateId: string, credentials: AutomationKeyCredentials): void {
    const trimmedApiKeyId = credentials.apiKeyId?.trim();
    let apiKeyIdValue: string | undefined;
    if (typeof trimmedApiKeyId === 'string' && trimmedApiKeyId.length > 0) {
      apiKeyIdValue = trimmedApiKeyId;
    }

    const normalized: AutomationKeyCredentials = {
      apiPrivateKey: this.normalizePemKey(credentials.apiPrivateKey, 'private'),
      apiPublicKey: this.normalizePemKey(credentials.apiPublicKey, 'public'),
      apiKeyId: apiKeyIdValue,
    };

    Object.defineProperty(this.automationCache, templateId, {
      value: normalized,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    if (this.secrets !== null) {
      this.secrets.automationKeys = {
        ...(this.secrets.automationKeys ?? {}),
        [templateId]: normalized,
      };
    }
  }

  removeAutomationCredentials(templateId: string): void {
    if (Object.prototype.hasOwnProperty.call(this.automationCache, templateId)) {
      delete this.automationCache[templateId];
    }
    if (this.secrets !== null && this.secrets.automationKeys !== undefined) {
      if (Object.prototype.hasOwnProperty.call(this.secrets.automationKeys, templateId)) {
        delete this.secrets.automationKeys[templateId];
      }
    }
  }

  listAutomationCredentials(): Record<string, AutomationKeyCredentials> {
    return { ...this.automationCache };
  }

  getAutomationCredentials(templateId: string): AutomationKeyCredentials | undefined {
    return Object.prototype.hasOwnProperty.call(this.automationCache, templateId)
      ? this.automationCache[templateId]
      : undefined;
  }

  getSecretByRef(ref: string): string | undefined {
    const trimmedRef = ref.trim();
    if (trimmedRef.length === 0) {
      return undefined;
    }

    const secrets = this.getSecrets();
    const delegated = secrets.delegatedKeys && Object.prototype.hasOwnProperty.call(secrets.delegatedKeys, trimmedRef)
      ? secrets.delegatedKeys[trimmedRef]
      : undefined;
    if (typeof delegated === 'string') {
      const trimmedDelegated = delegated.trim();
      if (trimmedDelegated.length > 0) {
        return trimmedDelegated;
      }
    }

    const envValue = Object.prototype.hasOwnProperty.call(process.env, trimmedRef)
      ? process.env[trimmedRef]
      : undefined;
    if (typeof envValue === 'string') {
      const trimmed = envValue.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    return undefined;
  }

  getPasskeyAttestation(ref: string): PasskeyAttestationSecret | undefined {
    const key = ref.trim();
    if (key.length === 0) {
      return undefined;
    }

    const cached = Object.prototype.hasOwnProperty.call(this.passkeyAttestationCache, key)
      ? this.passkeyAttestationCache[key]
      : undefined;
    if (cached !== undefined) {
      return cached;
    }

    const secrets = this.getSecrets();
    const rawAttestation = secrets.passkeyAttestations && Object.prototype.hasOwnProperty.call(secrets.passkeyAttestations, key)
      ? secrets.passkeyAttestations[key]
      : undefined;
    if (rawAttestation === undefined) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(rawAttestation) as unknown;
      if (!isRecord(parsed)) {
        throw new Error();
      }

      const challenge = parsed.challenge;
      const attestation = parsed.attestation;
      if (!isNonEmptyString(challenge) || !isRecord(attestation)) {
        throw new Error();
      }

      const credentialId = attestation.credentialId;
      const clientDataJson = attestation.clientDataJson;
      const attestationObject = attestation.attestationObject;
      if (
        !isNonEmptyString(credentialId) ||
        !isNonEmptyString(clientDataJson) ||
        !isNonEmptyString(attestationObject)
      ) {
        throw new Error();
      }

      const transportsRaw = attestation.transports;
      const transportsAreStrings =
        Array.isArray(transportsRaw) && transportsRaw.every((item): item is string => typeof item === 'string');
      const attestationTransports = transportsAreStrings ? [...transportsRaw] : undefined;

      const normalized: PasskeyAttestationSecret = {
        challenge,
        attestation: {
          credentialId,
          clientDataJson,
          attestationObject,
          transports: attestationTransports,
        },
      };

      Object.defineProperty(this.passkeyAttestationCache, key, {
        value: normalized,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return normalized;
    } catch {
      throw new Error(`Passkey attestation "${ref}" is not valid JSON or is missing required fields`);
    }
  }

  clearSecrets(): void {
    this.secrets = null;
    this.automationCache = {};
    this.passkeyAttestationCache = {};
  }

  static resetInstance(): void {
    if (SecretsManager.instance) {
      SecretsManager.instance.clearSecrets();
    }
    SecretsManager.instance = null;
  }

  rotateSecrets(): Promise<void> {
    return Promise.reject(new Error('Secret rotation not yet implemented'));
  }
}
