# API Testing Guide

## Quick Start

1. **Start the server:**
   ```bash
   npm run start:dev
   ```

2. **Test health check:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## Authentication

Use these test API keys:
- `lender_acme_corp_api_key_xyz123` (ACME Corp)
- `lender_demo_api_key_abc789` (Demo Lender)

## API Endpoints

### 1. Create Disbursement (Core Endpoint)
```bash
curl -X POST http://localhost:3000/api/v1/disbursements \
  -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan_test_123",
    "borrowerAddress": "0x742d35Cc6734C0532925a3b8D6749E58e74DBe3A",
    "amount": "1000.00",
    "assetType": "USDC",
    "chain": "ethereum-sepolia"
  }'
```

### 2. Get Disbursement Status
```bash
curl -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
  http://localhost:3000/api/v1/disbursements/{disbursementId}
```

### 3. List Disbursements
```bash
curl -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
  http://localhost:3000/api/v1/disbursements
```

### 4. Get Lender Info (restart server first)
```bash
curl -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
  http://localhost:3000/api/v1/lenders/me
```

### 5. Get Wallet Balances
```bash
curl -H "Authorization: Bearer lender_acme_corp_api_key_xyz123" \
  http://localhost:3000/api/v1/lenders/wallets/balance
```

## Test Scenarios

### Valid Disbursement
- ✅ Amount: 1-1000000 USDC
- ✅ Chain: ethereum-sepolia
- ✅ Address: Valid Ethereum address (0x...)

### Error Cases
- ❌ Invalid API key → 401 Authentication Failed
- ❌ Invalid amount → 422 Validation Error
- ❌ Invalid address → 422 Validation Error
- ❌ Wrong asset type → 422 Validation Error

## Response Examples

### Successful Disbursement
```json
{
  "disbursementId": "disb_123456789",
  "status": "completed",
  "loanId": "loan_test_123",
  "amount": "1000.00",
  "borrowerAddress": "0x742d35...",
  "chain": "ethereum-sepolia",
  "txHash": "0xabcd1234...",
  "turnkeyActivityId": "activity_123456789",
  "timeline": {
    "initiated": "2025-01-15T10:30:00Z",
    "policiesEvaluated": "2025-01-15T10:30:01Z",
    "signed": "2025-01-15T10:30:05Z",
    "broadcasted": "2025-01-15T10:30:10Z",
    "confirmed": "2025-01-15T10:32:45Z"
  }
}
```

### Authentication Error
```json
{
  "error": "AUTHENTICATION_FAILED",
  "message": "Invalid API key",
  "timestamp": "2025-01-15T10:30:00Z"
}
```
