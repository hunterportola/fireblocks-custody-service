#!/bin/bash

echo "Testing Custody API Endpoints..."
echo "================================"

# Test health endpoint
echo "1. Health Check:"
curl -s http://localhost:3000/api/v1/health | jq '.' || echo "Health endpoint failed"
echo ""

# Test authentication
echo "2. Lender Authentication:"
curl -s -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
     http://localhost:3000/api/v1/lenders/me | jq '.' || echo "Auth test failed"
echo ""

# Test disbursement creation (this will fail gracefully without Turnkey credentials)
echo "3. Create Disbursement (Expected to fail without Turnkey credentials):"
curl -s -X POST \
     -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
     -H "Content-Type: application/json" \
     -d '{
       "loanId": "loan_test_123",
       "borrowerAddress": "0x742d35Cc6634C0532925a3b8D37d2965a15e3a2b",
       "amount": "1000.50",
       "assetType": "USDC",
       "chain": "ethereum-sepolia",
       "metadata": {
         "loanType": "business",
         "borrowerKycStatus": "verified"
       }
     }' \
     http://localhost:3000/api/v1/disbursements | jq '.' || echo "Disbursement test failed"
echo ""

echo "Test completed!"
