#!/bin/bash

# Multi-Tenant Custody Service API Tests

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
API_PATH_PREFIX="${API_PATH_PREFIX:-/api/v1}"
API_KEY="${API_KEY:-test-api-key-12345}"

echo "🧪 Testing Multi-Tenant API Endpoints"
echo "===================================="
echo "API URL: $API_BASE_URL"
echo "API Path Prefix: ${API_PATH_PREFIX:-/}"
echo "API Key: $API_KEY"
echo ""

build_url() {
  local path="$1"
  local base="${API_BASE_URL%/}"
  local prefix="${API_PATH_PREFIX%/}"
  local trimmed_path="${path#/}"

  if [[ -n "$prefix" ]]; then
    echo "$base$prefix/$trimmed_path"
  else
    echo "$base/$trimmed_path"
  fi
}

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
curl -s "$(build_url "/health")" | jq '.' || echo "Health check failed"
echo ""

# Test 2: List Disbursements (should return empty list or auth error)
echo "2️⃣ Testing list disbursements..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$(build_url "/disbursements")" | jq '.' || echo "List disbursements failed"
echo ""

# Test 3: Create Disbursement (should fail with validation or auth error)
echo "3️⃣ Testing create disbursement..."
curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan-test-001",
    "borrowerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f1234",
    "amount": "100.50",
    "assetType": "USDC",
    "chain": "sepolia"
  }' \
  "$(build_url "/disbursements")" | jq '.' || echo "Create disbursement failed"
echo ""

# Test 4: Get specific disbursement (should return 404)
echo "4️⃣ Testing get disbursement..."
curl -s -H "Authorization: Bearer $API_KEY" \
  "$(build_url "/disbursements/disb_test_123")" | jq '.' || echo "Get disbursement failed"
echo ""

echo "✅ Basic API tests completed"
echo ""
echo "To test with a real tenant:"
echo "1. Run: npm run test-tenant-provisioning"
echo "2. Copy the generated API key"  
echo "3. Run: API_KEY=<generated-key> ./test-api.sh"
