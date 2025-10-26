# Secrets Management (Turnkey)

The toolkit relies on the parent Turnkey organization to supply credentials for API stamping and automation users.

## Required Secrets

| Key | Description |
|-----|-------------|
| `TURNKEY_API_PRIVATE_KEY` | PEM formatted private key for the parent org |
| `TURNKEY_API_PUBLIC_KEY`  | Matching public key |
| `TURNKEY_API_KEY_ID`      | Parent API key identifier |
| `TURNKEY_ORGANIZATION_ID` | Parent organization ID |

## Optional Maps

- `TURNKEY_AUTOMATION_KEYS` – JSON object keyed by automation template ID containing `apiPrivateKey`, `apiPublicKey`, and optional `apiKeyId`.
- `TURNKEY_PASSKEY_ATTESTATIONS` – JSON map of root/automation templates to base64-encoded attestation objects.
- `TURNKEY_DELEGATED_KEYS` – JSON map for any delegated signing keys (future use).

Example:
```json
{
  "automation-primary": {
    "apiPrivateKey": "-----BEGIN PRIVATE KEY-----...",
    "apiPublicKey": "-----BEGIN PUBLIC KEY-----...",
    "apiKeyId": "automation-key-id"
  }
}
```

## Loading Order

1. `SecretsManager.getInstance({ provider: SecretProvider.ENVIRONMENT })`
2. `await secretsManager.loadSecrets()` – validates PEM/JSON formats.
3. `TurnkeyClientManager.initialize({ platform, secretConfig })`

Secrets are cached in-memory; call `SecretsManager.clearSecrets()` or `TurnkeyClientManager.reset()` to force reloads (e.g., during rotation).
