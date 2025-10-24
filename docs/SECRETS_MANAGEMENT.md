# Secrets Management Procedure

This document outlines the secure handling of Fireblocks API credentials and other sensitive information for the Fireblocks Custody Service.

## Overview

The Fireblocks Custody Service requires proper management of sensitive credentials:
- **API Key**: UUID format identifier for your Fireblocks workspace
- **Secret Key**: Base64-encoded RSA private key for request signing
- **Webhook Public Key** (optional): For verifying webhook signatures

## Security Requirements

### 1. Storage Requirements
- Never commit secrets to version control
- Store secrets in encrypted format
- Use environment-specific secrets (dev, staging, production)
- Implement secret rotation procedures

### 2. Access Control
- Limit access to production secrets to authorized personnel only
- Use principle of least privilege
- Audit secret access regularly
- Implement IP allowlisting for API access

### 3. Secret Providers

The service supports multiple secret storage backends:

#### Environment Variables (Development Only)
```bash
export FIREBLOCKS_API_KEY="your-api-key-uuid"
export FIREBLOCKS_SECRET_KEY="base64-encoded-private-key"
export FIREBLOCKS_ENV="sandbox"  # sandbox, testnet, or mainnet
```

#### AWS Secrets Manager (Recommended for Production)
```json
{
  "fireblocks_api_key": "your-api-key-uuid",
  "fireblocks_secret_key": "base64-encoded-private-key",
  "fireblocks_webhook_public_key": "optional-webhook-key"
}
```

#### HashiCorp Vault
```bash
vault kv put secret/fireblocks/production \
  api_key="your-api-key-uuid" \
  secret_key="base64-encoded-private-key"
```

#### Azure Key Vault
Store each secret as a separate key:
- `fireblocks-api-key`
- `fireblocks-secret-key`
- `fireblocks-webhook-public-key`

## Implementation Guide

### 1. Development Environment

For local development, use a `.env` file:

```bash
# .env.example (commit this)
FIREBLOCKS_API_KEY=your-sandbox-api-key
FIREBLOCKS_SECRET_KEY=your-sandbox-secret-key
FIREBLOCKS_ENV=sandbox

# .env (DO NOT commit this)
# Copy .env.example and fill with actual values
```

### 2. Production Environment

Configure the service to use a secure secret provider:

```typescript
import { FireblocksClientManager, SecretProvider } from './core/fireblocks-client';

// Production configuration
await FireblocksClientManager.initialize({
  environment: FireblocksEnvironment.MAINNET,
  secretConfig: {
    provider: SecretProvider.AWS_SECRETS_MANAGER,
    awsRegion: 'us-east-1'
  },
  ipAllowlistConfig: {
    allowedIPs: ['203.0.113.1', '203.0.113.2'],
    allowPrivateIPs: false,
    enforceAllowlist: true
  }
});
```

### 3. Secret Rotation

Implement regular secret rotation:

1. Generate new API credentials in Fireblocks Console
2. Update secret storage with new credentials
3. Deploy service with capability to read both old and new secrets
4. Verify new credentials are working
5. Remove old credentials from Fireblocks Console
6. Remove old credentials from secret storage

### 4. IP Allowlisting

Configure IP allowlisting for additional security:

```typescript
const ipConfig: IPAllowlistConfig = {
  allowedIPs: [
    '203.0.113.1',      // Production server 1
    '203.0.113.2',      // Production server 2
    '203.0.113.0/28'    // Production subnet
  ],
  allowPrivateIPs: false,  // Disable private IPs in production
  enforceAllowlist: true
};
```

## Validation and Testing

### 1. Secret Format Validation

The service automatically validates:
- API Key must be UUID format
- Secret Key must be base64-encoded private key
- Secret Key must contain BEGIN/END PRIVATE KEY markers

### 2. Testing Secrets

Use the validation utilities:

```typescript
import { SecretsManager } from './core/secrets-manager';

// Validate secrets on startup
const manager = SecretsManager.getInstance({
  provider: SecretProvider.ENVIRONMENT
});

try {
  const secrets = await manager.loadSecrets();
  console.log('✅ Secrets loaded and validated successfully');
} catch (error) {
  console.error('❌ Invalid secrets:', error.message);
  process.exit(1);
}
```

### 3. CI/CD Secrets

For CI/CD pipelines, use mock secrets:

```yaml
env:
  # Mock but valid-format secrets for CI
  FIREBLOCKS_API_KEY: '12345678-1234-1234-1234-123456789012'
  FIREBLOCKS_SECRET_KEY: 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCnRlc3QKLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ=='
```

## Security Checklist

Before deploying to production:

- [ ] Secrets are stored in approved secret management system
- [ ] Access to production secrets is restricted and audited
- [ ] IP allowlisting is configured for production environment
- [ ] Secret rotation procedure is documented and tested
- [ ] No secrets in source code or configuration files
- [ ] Environment variables are not logged or exposed
- [ ] CI/CD uses separate non-production secrets
- [ ] Monitoring alerts configured for unauthorized access attempts

## Incident Response

If secrets are compromised:

1. **Immediately** rotate the compromised credentials in Fireblocks Console
2. Update all secret storage locations with new credentials
3. Review audit logs for unauthorized access
4. Notify security team and affected stakeholders
5. Conduct post-mortem to prevent future incidents

## Best Practices

1. **Never** share secrets via email, Slack, or other communication tools
2. **Always** use encrypted channels for secret transfer if necessary
3. **Regularly** audit who has access to production secrets
4. **Implement** secret scanning in CI/CD to prevent accidental commits
5. **Monitor** for secrets in logs and error messages
6. **Use** short-lived credentials where possible
7. **Enable** MFA for Fireblocks Console access

## Support

For questions about secrets management:
- Review Fireblocks documentation: https://docs.fireblocks.com
- Contact security team for organization-specific procedures
- File issues for technical problems with secret management code