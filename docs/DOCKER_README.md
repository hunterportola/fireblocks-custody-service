# Docker Setup Guide

This guide explains how to run the Fireblocks Custody Service using Docker, including database integration.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available memory
- Ports 3000 (app), 5432 (PostgreSQL), and optionally 5050 (pgAdmin) available

## Quick Start

1. **Start the services:**
   ```bash
   ./docker-start.sh
   ```

   This will:
   - Create necessary directories
   - Start PostgreSQL database
   - Initialize database schema and seed data
   - Start the application server
   - Verify services are healthy

2. **Access the services:**
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/api/v1/health
   - pgAdmin (optional): http://localhost:5050

## Docker Start Options

```bash
# Basic start
./docker-start.sh

# Rebuild images (useful after code changes)
./docker-start.sh --rebuild

# Include pgAdmin for database management
./docker-start.sh --with-pgadmin

# Help
./docker-start.sh --help
```

## Test API Keys

The following test API keys are pre-configured:

- **Demo Originator**: `originator_demo_api_key_abc789`
- **ACME Lending**: `originator_acme_lending_api_key_5u55s56j9n8`
- **Stellar Loans**: `originator_stellar_loans_api_key_ue162vf99l9`

## Example API Requests

### Get Lender Information
```bash
curl -H "Authorization: Bearer originator_demo_api_key_abc789" \
     http://localhost:3000/api/v1/lenders/me
```

### Create a Disbursement
```bash
curl -X POST http://localhost:3000/api/v1/disbursements \
     -H "Authorization: Bearer originator_demo_api_key_abc789" \
     -H "Content-Type: application/json" \
     -d '{
       "loanId": "loan_12345",
       "borrowerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f82b8d",
       "amount": "1000.00",
       "assetType": "USDC",
      "chain": "ethereum-sepolia"
     }'
```

### List Disbursements
```bash
curl -H "Authorization: Bearer originator_demo_api_key_abc789" \
     http://localhost:3000/api/v1/disbursements?status=completed
```

## Database Access

### Via pgAdmin (if started with --with-pgadmin):
1. Navigate to http://localhost:5050
2. Login: `admin@custody.local` / `admin`
3. Add server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `custody_service`
   - Username: `custody`
   - Password: `custody_secret_2024`

### Via Command Line:
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U custody custody_service

# View disbursements
docker-compose exec postgres psql -U custody custody_service -c "SELECT * FROM disbursements LIMIT 10;"
```

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Key variables to configure:
- `TURNKEY_API_PRIVATE_KEY`: Your Turnkey API private key
- `TURNKEY_API_PUBLIC_KEY`: Your Turnkey API public key
- `TURNKEY_API_KEY_ID`: Your Turnkey API key ID
- `TURNKEY_ORGANIZATION_ID`: Your Turnkey organization ID

## Managing Services

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

### Restart Services
```bash
# Restart a specific service
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build app
```

## Database Schema

The database includes the following tables:
- `originators`: Originator organizations
- `api_keys`: API key management
- `disbursements`: Transaction records
- `wallets`: Wallet information
- `provisioning_snapshots`: Turnkey provisioning data
- `webhook_configs`: Webhook configurations
- `webhook_deliveries`: Webhook delivery logs

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Reset everything
docker-compose down -v
./docker-start.sh --rebuild
```

### Database connection issues
```bash
# Test database connection
docker-compose exec postgres pg_isready -U custody -d custody_service

# Check database logs
docker-compose logs postgres
```

### Application errors
```bash
# Check application logs
docker-compose logs -f app

# Restart application
docker-compose restart app
```

### Port conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change external port
```

## Development Workflow

1. Make code changes
2. If dependencies changed: `./docker-start.sh --rebuild`
3. Otherwise, services auto-reload (via volume mounts)
4. Check logs: `docker-compose logs -f app`

## Production Considerations

For production deployment:

1. Use proper secrets management
2. Configure SSL/TLS
3. Set up proper backup strategies
4. Use managed PostgreSQL
5. Configure monitoring and alerting
6. Implement proper API key rotation
7. Set up load balancing
8. Configure rate limiting

## Data Persistence

- Database data is stored in Docker volumes
- Volumes persist between container restarts
- To reset: `docker-compose down -v`
- To backup: Use `pg_dump` via Docker exec
