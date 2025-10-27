# MVP Testing Guide - Fireblocks Custody Service

## Overview

This guide explains how to test the complete originator workflow from signup through loan disbursement using the MVP implementation.

## What's Included in the MVP

1. **Test Originator Provisioning Script** - Generates mock originators with API keys
2. **TurnkeyCustodyService Integration** - Full custody service wired to disbursement endpoint
3. **Multiple Test Originators** - Pre-configured test data for immediate testing
4. **Complete Workflow Test Script** - Automated testing of the entire flow

## Quick Start

### 1. Generate Test Originators

```bash
# Run the provisioning script to create test data
npx tsx scripts/provision-test-originators.ts
```

This creates:
- 2 test originators (ACME Lending, Stellar Loans)
- 4 API keys with different permission levels
- Mock provisioning data in `test-data/`

### 2. Start the API Server

```bash
npm run start:dev
```

The server will:
- Initialize the MVP custody service with mock data
- Load all test originators and their configurations
- Display available API keys in the console

### 3. Run the Test Workflow

```bash
./scripts/test-mvp-workflow.sh
```

This tests:
- Health checks
- Authentication for all test lenders
- Disbursement creation via TurnkeyCustodyService
- Multi-chain support (Ethereum, Polygon, Arbitrum)
- Error handling and validation

## Available Test API Keys

### Legacy Test Lenders (Original)
- `lender_acme_corp_api_key_xyz123` - ACME Corp test lender
- `lender_demo_api_key_abc789` - Demo test lender

### New Test Originators (Generated)
- `originator_acme_lending_api_key_5u55s56j9n8` - ACME Lending (full permissions)
- `originator_acme_lending_api_key_j6sr17au72d` - ACME Lending (read-only)
- `originator_stellar_loans_api_key_ue162vf99l9` - Stellar Loans (full permissions)
- `originator_stellar_loans_api_key_76cxhjcsot9` - Stellar Loans (read-only)

## Testing Individual Endpoints

### Create a Disbursement

```bash
curl -X POST http://localhost:3000/api/v1/disbursements \
  -H "Authorization: Bearer originator_acme_lending_api_key_5u55s56j9n8" \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan_test_001",
    "borrowerAddress": "0x742d35Cc6634C0532925a3b8D37d2965a15e3a2b",
    "amount": "1000.00",
    "assetType": "USDC",
    "chain": "ethereum-sepolia",
    "metadata": {
      "purpose": "MVP testing",
      "borrowerName": "Test Borrower"
    }
  }'
```

### Get Lender Info

```bash
curl -H "Authorization: Bearer originator_acme_lending_api_key_5u55s56j9n8" \
  http://localhost:3000/api/v1/lenders/me
```

### List Disbursements

```bash
curl -H "Authorization: Bearer originator_acme_lending_api_key_5u55s56j9n8" \
  http://localhost:3000/api/v1/disbursements
```

## How the Integration Works

1. **Authentication**: API key is validated against mock lender data
2. **Originator Mapping**: Lender ID is mapped to originator ID
3. **Custody Service**: TurnkeyCustodyService loads provisioning snapshot
4. **Wallet Selection**: Appropriate wallet is selected based on flow (distribution)
5. **Transaction Creation**: USDC transfer is constructed with proper encoding
6. **Mock Signing**: Transaction is "signed" by Turnkey (mocked for MVP)
7. **Mock Broadcast**: Transaction is "broadcast" returning mock tx hash

## What's Mocked vs Real

### Real Components
- Express API server and routing
- Authentication and authorization
- Request validation
- TurnkeyCustodyService orchestration
- Transaction construction (RLP encoding)
- Error handling

### Mocked Components
- Turnkey API calls (uses mock client manager)
- Transaction signing (returns mock signature)
- Blockchain broadcasting (returns mock tx hash)
- Provisioning data (generated statically)
- Wallet balances and nonces

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Ensure all dependencies are installed: `npm install`

### Custody service initialization fails
- This is expected if Turnkey credentials aren't configured
- The system will fall back to the direct disbursement service

### Authentication errors
- Ensure you're using the exact API keys listed above
- Include "Bearer " prefix in Authorization header

### Disbursement fails
- Check that the chain is supported (`ethereum-sepolia`)
- Verify the amount is positive and under 1,000,000 USDC
- Ensure borrower address is a valid Ethereum address

## Next Steps for Production

1. **Database Integration**
   - Replace in-memory stores with PostgreSQL
   - Add migrations for schema management
   - Implement proper repository pattern

2. **Real Turnkey Integration**
   - Configure actual Turnkey API credentials
   - Implement real wallet provisioning
   - Enable actual transaction signing

3. **Blockchain Integration**
   - Connect to real RPC endpoints
   - Implement nonce management
   - Add transaction monitoring

4. **API Enhancements**
   - Add originator management endpoints
   - Implement webhook notifications
   - Add comprehensive audit logging

## Summary

This MVP demonstrates the complete workflow and validates that all components can work together. The architecture is ready for production enhancements without requiring major refactoring.
