/**
 * Generic cache for Turnkey scoped clients (sub-organization + automation template).
 * The cache watches credential revisions so that rotated keys immediately invalidate
 * any memoised client instances.
 */
export interface AutomationCredentialRef {
  subOrganizationId: string;
  automationTemplateId: string;
  /**
   * Identifier for the underlying API key. When this value changes we invalidate
   * the cached client.
   */
  apiKeyId?: string;
  /**
   * Optional fingerprint/etag of the credential material (e.g., hash of PEM).
   * Use when apiKeyId is stable but the private key has been rotated.
   */
  credentialFingerprint?: string;
}

export interface ScopedClientFactory<TClient> {
  (credentials: AutomationCredentialRef): Promise<TClient> | TClient;
}

export class TurnkeyScopedClientCache<TClient> {
  private cache = new Map<string, { ref: AutomationCredentialRef; client: TClient }>();

  constructor(private readonly factory: ScopedClientFactory<TClient>) {}

  /**
   * Fetches (or builds) a scoped client for the supplied credential reference.
   * The cache key includes both the sub-org and automation template to prevent leaks.
   */
  async getClient(ref: AutomationCredentialRef): Promise<TClient> {
    const key = this.getCacheKey(ref);
    const cached = this.cache.get(key);

    if (cached && this.isSameCredential(ref, cached.ref)) {
      return cached.client;
    }

    const client = await this.factory(ref);
    this.cache.set(key, { ref, client });
    return client;
  }

  /**
   * Invalidate the cached client after a credential rotation. Call this whenever a new
   * API key is persisted to the SecretsManager so future requests rebuild the client.
   */
  invalidate(ref: AutomationCredentialRef): void {
    const key = this.getCacheKey(ref);
    this.cache.delete(key);
  }

  /**
   * Clears the entire cache – useful during shutdown or when permissions change globally.
   */
  clear(): void {
    this.cache.clear();
  }

  private getCacheKey(ref: AutomationCredentialRef): string {
    return `${ref.subOrganizationId}:${ref.automationTemplateId}`;
  }

  private isSameCredential(a: AutomationCredentialRef, b: AutomationCredentialRef): boolean {
    if (a.apiKeyId != null && b.apiKeyId != null && a.apiKeyId === b.apiKeyId) {
      return true;
    }

    if (a.credentialFingerprint != null && b.credentialFingerprint != null) {
      return a.credentialFingerprint === b.credentialFingerprint;
    }

    return false;
  }
}
