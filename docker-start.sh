#!/bin/bash
set -e

echo "🚀 Starting Fireblocks Custody Service with Docker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file. Please update with your Turnkey credentials.${NC}"
    else
        echo -e "${YELLOW}Creating basic .env file...${NC}"
        cat > .env << EOF
# Turnkey Configuration
TURNKEY_API_PRIVATE_KEY=
TURNKEY_API_PUBLIC_KEY=
TURNKEY_API_KEY_ID=
TURNKEY_ORGANIZATION_ID=

# RPC Endpoints (using public testnet endpoints)
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/FMX-Ig07NkgHO7V5RHuJ9
ARBITRUM_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/demo
EOF
        echo -e "${GREEN}✅ Created .env file with defaults${NC}"
    fi
fi

# Parse command line arguments
REBUILD=false
WITH_PGADMIN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        --with-pgadmin)
            WITH_PGADMIN=true
            shift
            ;;
        --help)
            echo "Usage: ./docker-start.sh [options]"
            echo ""
            echo "Options:"
            echo "  --rebuild      Rebuild Docker images"
            echo "  --with-pgadmin Start pgAdmin for database management"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p database/init

# Build or rebuild images if needed
if [ "$REBUILD" = true ]; then
    echo -e "${YELLOW}🔨 Rebuilding Docker images...${NC}"
    docker-compose build --no-cache
fi

# Start services
echo "🐳 Starting Docker services..."
if [ "$WITH_PGADMIN" = true ]; then
    docker-compose --profile debug up -d
else
    docker-compose up -d
fi

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U custody -d custody_service >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ PostgreSQL failed to start after $max_attempts attempts${NC}"
        docker-compose logs postgres
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

# Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
sleep 5

if docker-compose ps | grep -q "custody-app.*Up"; then
    echo -e "${GREEN}✅ Application is running!${NC}"
else
    echo -e "${RED}❌ Application failed to start${NC}"
    docker-compose logs app
    exit 1
fi

# Display service information
echo ""
echo "🎉 Fireblocks Custody Service is ready!"
echo ""
echo "📡 Service URLs:"
echo "  - API Server: http://localhost:3000"
echo "  - Health Check: http://localhost:3000/api/v1/health"
if [ "$WITH_PGADMIN" = true ]; then
    echo "  - pgAdmin: http://localhost:5050 (admin@custody.local / admin)"
fi
echo ""
echo "🔑 Test API Keys:"
echo "  - Demo Originator: originator_demo_api_key_abc789"
echo "  - ACME Lending: originator_acme_lending_api_key_5u55s56j9n8"
echo "  - Stellar Loans: originator_stellar_loans_api_key_ue162vf99l9"
echo ""
echo "📊 Database Connection:"
echo "  - Host: localhost:5432"
echo "  - Database: custody_service"
echo "  - Username: custody"
echo "  - Password: custody_secret_2024"
echo ""
echo "🛠️  Useful Commands:"
echo "  - View logs: docker-compose logs -f [service_name]"
echo "  - Stop all: docker-compose down"
echo "  - Reset database: docker-compose down -v && ./docker-start.sh"
echo "  - Connect to database: docker-compose exec postgres psql -U custody custody_service"
echo ""

# Test the API
echo "🧪 Testing API endpoint..."
if curl -s -f http://localhost:3000/api/v1/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API is responding!${NC}"
    echo ""
    echo "Try a test request:"
    echo 'curl -H "Authorization: Bearer originator_demo_api_key_abc789" http://localhost:3000/api/v1/lenders/me'
else
    echo -e "${YELLOW}⚠️  API is not responding yet. It may still be starting up.${NC}"
    echo "Check logs with: docker-compose logs -f app"
fi
