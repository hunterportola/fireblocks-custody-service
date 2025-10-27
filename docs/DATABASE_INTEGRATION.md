# Database Integration Guide

This guide documents the database integration for the Fireblocks Custody Service, showing how to migrate from in-memory storage to persistent PostgreSQL storage.

## Overview

The database integration provides persistent storage for:
- **Disbursement records** - All transaction history and status
- **Provisioning snapshots** - Turnkey sub-organization configurations
- **Originator data** - Organization settings and branding
- **Wallet information** - Wallet addresses and balances
- **User management** - Root users, automation users, role-based users
- **Policy configurations** - Transaction approval rules
- **Audit logs** - Complete activity tracking

## Database Schema

The complete schema is defined in `/database/init/01-schema-complete.sql` and includes:

### Core Tables
- `originators` - Main organizations using the platform
- `partners` - Partner entities with custom configurations  
- `users` - All user types (root, automation, role-based, lender)
- `lenders` - External API users

### Wallet Management
- `wallet_templates` - Blueprints for wallet creation
- `wallets` - Actual wallet instances
- `wallet_accounts` - Individual addresses within wallets
- `partner_wallet_flows` - Partner-specific wallet mappings

### Policy System
- `policy_templates` - Reusable policy definitions
- `policies` - Deployed policy instances
- `policy_bindings` - What policies apply to
- `partner_policies` - Partner-specific policy assignments

### Transaction Tracking
- `disbursements` - All disbursement records
- `turnkey_activities` - Turnkey API activity tracking
- `approvals` - Multi-signature approval records
- `policy_evaluations` - Policy execution history

### Supporting Tables
- `provisioning_snapshots` - Complete runtime configuration snapshots
- `automation_templates` - Automation user configurations
- `webhook_configs` - Webhook delivery settings
- `webhook_deliveries` - Webhook delivery logs
- `audit_logs` - Comprehensive audit trail

## Quick Start

### 1. Start the Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for database to be ready
docker-compose exec postgres pg_isready -U custody -d custody_service

# View logs
docker-compose logs postgres
```

### 2. Run the Application

```bash
# Start all services
docker-compose up

# Or run just the app (assuming database is already running)
docker-compose up app
```

### 3. Database Connection

The application uses these environment variables:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=custody_service
DB_USER=custody
DB_PASSWORD=custody_secure_password
```

## Database Service API

The `DatabaseService` class provides methods for all database operations:

### Disbursement Operations
```typescript
// Save a disbursement
await databaseService.saveDisbursement(disbursement);

// Get a specific disbursement
const disbursement = await databaseService.getDisbursement(disbursementId);

// List disbursements with filters
const result = await databaseService.listDisbursements({
  originatorId: 'originator_demo',
  status: 'completed',
  limit: 50,
  offset: 0
});
```

### Provisioning Operations
```typescript
// Save provisioning snapshot
await databaseService.saveProvisioningSnapshot(originatorId, {
  platformConfigHash: 'hash123',
  provisioningSnapshot: snapshot
});

// Get provisioning snapshot
const artifacts = await databaseService.getProvisioningSnapshot(originatorId);
```

### Originator Operations
```typescript
// Get originator by ID
const originator = await databaseService.getOriginator('originator_demo');

// Get originator by API key
const originator = await databaseService.getOriginatorByApiKey(apiKey);
```

## Integration Points

### 1. DisbursementService Integration

The `DisbursementService` now automatically persists disbursements:
- Successful disbursements are saved after creation
- Failed disbursements are saved with error details
- Status queries retrieve from database

### 2. API Route Updates

The disbursement API routes now use database:
- `POST /api/v1/disbursements` - Creates and persists disbursements
- `GET /api/v1/disbursements/:id` - Retrieves from database
- `GET /api/v1/disbursements` - Lists with database filtering

### 3. Migration from In-Memory

Use the migration script to move existing data:
```bash
npm run migrate-to-database
```

## Testing with Database

### Manual Testing

1. Create a disbursement:
```bash
curl -X POST http://localhost:3000/api/v1/disbursements \
  -H "X-API-Key: test_api_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan_test_001",
    "borrowerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7095931a94",
    "amount": "1000.00",
    "assetType": "USDC",
    "chain": "ethereum-sepolia"
  }'
```

2. Check database:
```bash
docker-compose exec postgres psql -U custody -d custody_service -c \
  "SELECT id, status, amount FROM disbursements ORDER BY created_at DESC LIMIT 5;"
```

### Database Queries

View recent disbursements:
```sql
SELECT 
  id, 
  loan_id,
  status, 
  amount, 
  chain,
  created_at
FROM disbursements 
ORDER BY created_at DESC 
LIMIT 10;
```

Check originator wallets:
```sql
SELECT 
  o.display_name as originator,
  w.flow_id,
  wa.alias,
  wa.address,
  wa.balance
FROM originators o
JOIN wallets w ON w.originator_id = o.id
JOIN wallet_accounts wa ON wa.wallet_id = w.id
ORDER BY o.id, w.flow_id;
```

## Monitoring

### Database Health
```bash
# Check connection count
docker-compose exec postgres psql -U custody -d custody_service -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = 'custody_service';"

# View active queries
docker-compose exec postgres psql -U custody -d custody_service -c \
  "SELECT query, state FROM pg_stat_activity WHERE state != 'idle';"
```

### pgAdmin Access
Access pgAdmin at http://localhost:5050
- Email: admin@example.com
- Password: admin

## Troubleshooting

### Connection Issues
1. Ensure PostgreSQL is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify credentials in `.env` file

### Migration Issues
1. Check database permissions
2. Ensure schema is created: `docker-compose exec postgres psql -U custody -d custody_service -c '\dt'`
3. Review migration logs

### Performance
1. Add indexes for frequently queried columns
2. Use connection pooling (already configured)
3. Monitor slow queries in pg_stat_statements

## Next Steps

1. **Authentication Integration**: Connect user management tables with authentication system
2. **Real-time Updates**: Implement WebSocket notifications for disbursement status changes
3. **Analytics**: Add materialized views for reporting
4. **Backup Strategy**: Implement automated backups
5. **Multi-tenant Isolation**: Add row-level security for originator data isolation