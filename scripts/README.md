# Multi-Tenant Custody Service Scripts

This directory contains scripts for setting up and testing the multi-tenant custody service architecture.

## Scripts Overview

### 1. Control Plane Initialization

**Script:** `init-control-plane.ts`
**Command:** `npm run init-control-plane`

Initializes the control plane database with the required schema for multi-tenant operation.

**What it does:**
- Creates the control plane database schema
- Sets up tenant registry, API key management, and audit tables
- Verifies successful installation
- Generates encryption key if not provided

**Usage:**
```bash
# First time setup
npm run init-control-plane

# Force reinitialize (drops existing data)
npm run init-control-plane -- --force
```

**Environment Variables:**
- `CONTROL_PLANE_DATABASE_URL` or `DATABASE_URL` - Control plane database connection
- `TENANT_DB_ENCRYPTION_KEY` - Encryption key for tenant connection strings (auto-generated if missing)

### 2. Tenant Provisioning Test

**Script:** `test-tenant-provisioning.ts`
**Command:** `npm run test-tenant-provisioning`

Tests the complete tenant provisioning workflow end-to-end.

**What it tests:**
- Tenant database provisioning (dedicated database isolation)
- Control plane registration
- API key generation
- Tenant database connection
- Basic tenant operations
- Originator record management

**Usage:**
```bash
# Run provisioning test
npm run test-tenant-provisioning

# Force recreate existing test tenant
npm run test-tenant-provisioning -- --force

# Clean up after test
npm run test-tenant-provisioning -- --cleanup
```

**Test Tenant:**
- Originator ID: `test-demo-lender`
- Display Name: `Demo Lender Corporation`
- Isolation: Dedicated database
- Environment: Sandbox

## Getting Started

### 1. Prerequisites

Ensure you have:
- PostgreSQL running and accessible
- Node.js and npm installed
- Environment variables configured

### 2. Environment Setup

Create a `.env` file with:
```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/custody_control_plane"
CONTROL_PLANE_DATABASE_URL="postgresql://user:password@localhost:5432/custody_control_plane"

# Tenant encryption key (generated automatically if missing)
TENANT_DB_ENCRYPTION_KEY="your-32-byte-hex-key"

# Optional: Admin database connection for tenant provisioning
ADMIN_DATABASE_URL="postgresql://admin:password@localhost:5432/postgres"
```

### 3. Initialize Control Plane

```bash
npm run init-control-plane
```

This creates the foundational database schema for multi-tenant operation.

### 4. Test Tenant Provisioning

```bash
npm run test-tenant-provisioning
```

This verifies that the entire tenant provisioning workflow works correctly.

### 5. Production Deployment

For production:

1. **Database Security:**
   - Use separate database instances for control plane and tenants
   - Ensure proper network isolation
   - Use encrypted connections (SSL/TLS)

2. **Encryption Keys:**
   - Generate secure random encryption keys
   - Store in secure key management system
   - Rotate keys periodically

3. **Access Control:**
   - Limit database user permissions
   - Use dedicated database users per tenant
   - Implement proper firewall rules

## Architecture Overview

### Control Plane Database

Contains metadata about all tenants:
- `tenant_registry` - Tenant information and database configurations
- `control_plane_api_keys` - API key management
- `tenant_provisioning_logs` - Provisioning audit trail
- `control_plane_health_metrics` - System health monitoring

### Tenant Databases

Each tenant gets an isolated database containing:
- User management (users, credentials, permissions)
- Wallet management (templates, instances, accounts)
- Policy system (templates, instances, bindings)
- Transaction tracking (disbursements, activities, approvals)
- Audit and compliance logs

### Isolation Types

1. **Dedicated Database** (Recommended)
   - Complete database isolation per tenant
   - Maximum security and performance
   - Easy backup and migration

2. **Dedicated Schema**
   - Schema-level isolation within shared database
   - Good performance with lower resource usage
   - Suitable for trusted multi-tenancy

3. **Shared with RLS**
   - Row-level security within shared tables
   - Highest density, lowest resource usage
   - Requires careful security implementation

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Verify PostgreSQL is running
   - Check connection string format
   - Ensure database exists

2. **Permission Denied**
   - Verify database user permissions
   - Check if user can create databases (for tenant provisioning)
   - Ensure user has schema creation rights

3. **Encryption Key Missing**
   - Set `TENANT_DB_ENCRYPTION_KEY` environment variable
   - Use the generated key from init script output

4. **Schema Already Exists**
   - Use `--force` flag to reinitialize
   - Or manually drop existing tables if safe

### Log Analysis

Scripts provide detailed logging:
- ✅ Success indicators
- ⚠️ Warning messages
- ❌ Error conditions
- 📊 Status information

### Testing Connection Issues

```bash
# Test control plane connection
psql $CONTROL_PLANE_DATABASE_URL -c "SELECT 1"

# Test tenant database after provisioning
psql $DATABASE_URL -c "\l" | grep custody_test
```

## Security Considerations

1. **Database Credentials**
   - Never commit database URLs to version control
   - Use environment variables or secure secrets management
   - Rotate credentials regularly

2. **Encryption Keys**
   - Generate cryptographically secure random keys
   - Store in secure key management system
   - Never log or expose in plain text

3. **API Keys**
   - Generated API keys are shown only once
   - Store securely in client systems
   - Implement proper key rotation

4. **Network Security**
   - Use encrypted database connections
   - Implement proper firewall rules
   - Consider VPN or private networking

## Monitoring and Maintenance

- Monitor control plane health metrics
- Track tenant provisioning success rates
- Monitor database connection pool health
- Implement log aggregation for audit trails
- Set up alerts for provisioning failures

## Next Steps

After successful initialization and testing:

1. Integrate with your application's authentication system
2. Implement tenant onboarding APIs
3. Set up monitoring and alerting
4. Configure backup and disaster recovery
5. Implement tenant lifecycle management
6. Build admin dashboards for tenant management