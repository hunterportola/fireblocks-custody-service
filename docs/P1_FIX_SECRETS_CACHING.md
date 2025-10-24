# P1 Fix: Secrets Caching Before Validation

## Issue Summary
The `SecretsManager.loadSecrets()` method was caching secrets in `this.secrets` before validating them. This created a security vulnerability where:
1. First call with invalid secrets would fail validation and throw an error
2. The invalid secrets would still be cached in `this.secrets`
3. Subsequent calls would return the cached invalid secrets via the early return on line 71
4. `FireblocksClientManager.initialize()` would then use these invalid credentials

This defeats the purpose of validation and could allow invalid credentials to be used in production.

## Root Cause
The issue was in the order of operations:
```typescript
// Before: Assignment happens before validation
switch (this.config.provider) {
  case SecretProvider.ENVIRONMENT:
    this.secrets = await this.loadFromEnvironment(); // Cached immediately
    break;
  // ...
}
this.validateSecrets(this.secrets); // Validation happens after caching
```

## Fix Applied
Changed the implementation to use a temporary variable and only cache after successful validation:

```typescript
// After: Load into temporary variable, validate, then cache
let loadedSecrets: FireblocksSecrets;

switch (this.config.provider) {
  case SecretProvider.ENVIRONMENT:
    loadedSecrets = await this.loadFromEnvironment(); // Not cached yet
    break;
  // ...
}

// Validate before caching
this.validateSecrets(loadedSecrets);

// Only cache after successful validation
this.secrets = loadedSecrets;
return this.secrets;
```

## Test Coverage
Added two new test cases to verify the fix:
1. **"should not cache secrets when validation fails"** - Verifies that invalid secrets are not cached and can be corrected on retry
2. **"should not return previously failed secrets on retry"** - Ensures multiple failed attempts don't return cached invalid data

Both tests pass, confirming that:
- Invalid secrets are never cached
- Retries with corrected secrets work properly
- The validation serves its intended purpose as a security gate

## Impact
This fix ensures that the secrets validation is effective and prevents invalid credentials from being used. This is critical for security as it prevents:
- Accidental use of malformed API keys
- Use of incorrectly formatted secret keys
- Bypassing of security validation through retry logic

The fix maintains backward compatibility while closing the security hole.