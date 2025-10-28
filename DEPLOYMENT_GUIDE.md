# Multi-Tenant Custody Service Deployment Guide

This guide covers deploying the multi-tenant custody service from scratch for new installations.

## 🎯 Overview

The multi-tenant custody service provides complete isolation for each originator with:
- **Dedicated databases** per tenant (recommended)
- **Schema-based isolation** for cost efficiency 
- **Row-level security** for maximum density
- **Control plane** for tenant management
- **Secure API key management** with tenant resolution

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Control plane database (tenant management)
CONTROL_PLANE_DATABASE_URL="postgresql://user:pass@localhost:5432/custody_control_plane"

# Admin connection for provisioning tenant databases
ADMIN_DATABASE_URL="postgresql://admin:pass@localhost:5432/postgres"

# Encryption key for tenant connection strings (REQUIRED)
TENANT_DB_ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Optional: Turnkey configuration
TURNKEY_API_BASE_URL="https://api.turnkey.com"
TURNKEY_ORGANIZATION_ID="your-org-id"
```

### Generate Encryption Key

```bash
# Generate secure 32-byte encryption key
openssl rand -hex 32

# Example output: a1b2c3d4e5f6...
# Set as environment variable:
export TENANT_DB_ENCRYPTION_KEY="a1b2c3d4e5f6..."
```

## 🗄️ Database Setup

### 1. Create Control Plane Database

```sql
-- Connect as superuser
CREATE DATABASE custody_control_plane;
CREATE USER custody_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE custody_control_plane TO custody_admin;
```

### 2. Initialize Control Plane

```bash
# Initialize control plane schema
npm run init-control-plane
```

This creates:
- `tenant_registry` - Tenant metadata and configurations
- `control_plane_api_keys` - API key management
- `tenant_provisioning_logs` - Audit trail
- `control_plane_health_metrics` - System monitoring

### 3. Test Tenant Provisioning

```bash
# Run end-to-end provisioning test
npm run test-tenant-provisioning

# Optional: Clean up test tenant
npm run test-tenant-provisioning -- --cleanup
```

## 🏗️ Architecture Overview

### Isolation Types

**1. Dedicated Database (Recommended)**
```
┌─────────────────┐
│  Control Plane  │
│  - tenant_reg   │
│  - api_keys     │
└─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Tenant1 │ │ Tenant2 │
│   DB    │ │   DB    │
└─────────┘ └─────────┘
```

**2. Schema-Based Isolation**
```
┌─────────────────┐
│  Shared DB      │
│  ┌──────────┐   │
│  │ Schema1  │   │
│  ├──────────┤   │
│  │ Schema2  │   │
│  └──────────┘   │
└─────────────────┘
```

**3. Row-Level Security**
```
┌─────────────────┐
│  Shared Tables  │
│  WHERE tenant   │
│    = current    │
└─────────────────┘
```

## 🚀 Creating Your First Tenant

### Option 1: Using Test Script

```bash
# This creates a demo tenant automatically
npm run test-tenant-provisioning
```

### Option 2: Programmatic Creation

```typescript
import { ControlPlaneService } from './src/services/control-plane-service';

const controlPlane = ControlPlaneService.getInstance();

const result = await controlPlane.provisionTenant({
  company: {
    legalName: 'Acme Lending Corp',
    displayName: 'Acme Lending',
    originatorId: 'acme-lending',
  },
  primaryContact: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@acmelending.com',
  },
  businessInfo: {
    yearEstablished: 2020,
    averageMonthlyVolume: '$10M',
  },
  configuration: {
    environment: 'sandbox',
    isolationType: 'dedicated_database',
    complianceLevel: 'basic',
  },
});

console.log('Tenant created!');
console.log('API Key:', result.initialApiKey.apiKey);
```

### Option 3: REST API

```bash
# Create tenant via API (when control plane APIs are built)
curl -X POST http://localhost:3000/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-api-key" \
  -d '{
    "company": {
      "legalName": "Acme Lending Corp",
      "displayName": "Acme Lending", 
      "originatorId": "acme-lending"
    },
    "configuration": {
      "environment": "sandbox",
      "isolationType": "dedicated_database"
    }
  }'
```

## 🔑 API Key Management

### Using Generated API Keys

```bash
# Test API access with generated key
curl -H "Authorization: Bearer <api-key>" \
     http://localhost:3000/api/disbursements
```

### API Key Formats

The system supports multiple authentication formats:

```bash
# Bearer token
Authorization: Bearer abc123...

# API Key prefix  
Authorization: ApiKey abc123...

# Direct header (no prefix)
Authorization: abc123...
```

## 🔒 Security Configuration

### Database Permissions

```sql
-- For dedicated database isolation
CREATE USER tenant_user_acme WITH PASSWORD 'secure_password';
GRANT ALL ON DATABASE custody_acme TO tenant_user_acme;

-- For schema-based isolation
CREATE SCHEMA acme_schema;
GRANT ALL ON SCHEMA acme_schema TO tenant_user_acme;
```

### Connection Encryption

All tenant connection strings are encrypted using AES-256-GCM:
- Random IV per encryption
- Authentication tags for integrity
- Secure key derivation

### API Key Security

- SHA-256 hashing for storage
- Configurable expiration
- Permission-based access control
- Usage tracking and audit logs

## 📊 Monitoring & Health Checks

### Control Plane Health

```bash
# Check control plane connectivity
psql $CONTROL_PLANE_DATABASE_URL -c "SELECT COUNT(*) FROM tenant_registry"
```

### Tenant Health

```bash
# Test specific tenant
curl -H "Authorization: Bearer tenant-api-key" \
     http://localhost:3000/health
```

### Metrics Endpoints

```bash
# Control plane metrics
GET /admin/metrics/control-plane

# Tenant metrics  
GET /admin/metrics/tenants

# Database pool status
GET /admin/metrics/connections
```

## 🔧 Configuration Options

### Isolation Type Selection

**Choose dedicated database when:**
- Maximum security required
- Tenants have different compliance needs
- Independent backup/restore needed
- Performance isolation critical

**Choose schema-based when:**
- Cost optimization important
- Tenants trust each other
- Shared infrastructure acceptable
- Medium-scale deployment

**Choose RLS when:**
- Maximum density required
- Trusted multi-tenancy
- Single application instance
- Small-scale deployment

### Performance Tuning

```typescript
// Connection pool configuration per tenant
{
  "max_connections": 10,
  "idle_timeout_ms": 30000, 
  "connection_timeout_ms": 5000
}
```

## 🚨 Troubleshooting

### Common Issues

**1. "CONTROL_PLANE_DATABASE_URL is required"**
```bash
export CONTROL_PLANE_DATABASE_URL="postgresql://..."
```

**2. "TENANT_DB_ENCRYPTION_KEY is required"**
```bash
export TENANT_DB_ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

**3. Permission denied for database creation**
```bash
# Ensure admin user has CREATEDB privilege
psql -c "ALTER USER admin CREATEDB;"
```

**4. Tenant provisioning fails**
```bash
# Check admin database connection
psql $ADMIN_DATABASE_URL -c "SELECT 1"

# Verify encryption key is set
echo $TENANT_DB_ENCRYPTION_KEY | wc -c  # Should be 65 (64 chars + newline)
```

### Debug Mode

```bash
# Enable detailed logging
DEBUG=custody:* npm start

# Test individual components
npm run test-tenant-provisioning -- --verbose
```

## 📈 Scaling Considerations

### Horizontal Scaling

- Multiple application instances can share control plane
- Each tenant database can be on different hosts
- Connection pools automatically balanced

### Database Scaling

```typescript
// Scale dedicated databases across hosts
const tenantConfig = {
  originatorId: 'large-tenant',
  isolationType: 'dedicated_database',
  databaseHost: 'tenant-db-2.internal',
  databasePort: 5432
};
```

### Performance Optimization

- Monitor connection pool utilization
- Adjust pool sizes per tenant workload
- Consider read replicas for high-traffic tenants
- Implement connection caching strategies

## 🛠️ Development Workflow

### Local Development

```bash
# Start with test database
export CONTROL_PLANE_DATABASE_URL="postgresql://localhost/custody_test"
export TENANT_DB_ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Initialize and test
npm run init-control-plane
npm run test-tenant-provisioning
npm run dev
```

### Testing

```bash
# Run full test suite
npm test

# Test tenant functionality specifically
npm run test:tenant

# End-to-end API tests
npm run test:e2e
```

## 🎉 Next Steps

Once deployed:

1. **Create your first production tenant**
2. **Set up monitoring and alerting**
3. **Configure backup strategies per tenant**
4. **Implement tenant onboarding workflows** 
5. **Build admin dashboards for tenant management**
6. **Set up automated provisioning pipelines**

## 📞 Support

For deployment issues:
- Check logs for specific error messages
- Verify all environment variables are set
- Test database connectivity separately
- Use debug mode for detailed troubleshooting

The multi-tenant system is designed to be robust and self-healing, but proper configuration is essential for reliable operation.