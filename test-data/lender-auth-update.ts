
// Add these to MOCK_LENDERS in src/api/middleware/lender-auth.ts
const _ADDITIONAL_TEST_LENDERS: Record<string, LenderInfo> = {
  'originator_acme_lending_api_key_5u55s56j9n8': {
    lenderId: 'lender_originator_acme_lending_primary',
    apiKeyId: 'originator_acme_lending_api_key_5u55s56j9n8',
    permissions: ["disbursements:create","disbursements:read","wallets:read","lenders:read","lenders:update"],
    turnkeySubOrgId: 'sub_org_originator_acme_lending_1761521069201',
  },
  'originator_acme_lending_api_key_j6sr17au72d': {
    lenderId: 'lender_originator_acme_lending_secondary',
    apiKeyId: 'originator_acme_lending_api_key_j6sr17au72d',
    permissions: ["disbursements:read","wallets:read","lenders:read"],
    turnkeySubOrgId: 'sub_org_originator_acme_lending_1761521069201',
  },
  'originator_stellar_loans_api_key_ue162vf99l9': {
    lenderId: 'lender_originator_stellar_loans_primary',
    apiKeyId: 'originator_stellar_loans_api_key_ue162vf99l9',
    permissions: ["disbursements:create","disbursements:read","wallets:read","lenders:read","lenders:update"],
    turnkeySubOrgId: 'sub_org_originator_stellar_loans_1761521069201',
  },
  'originator_stellar_loans_api_key_76cxhjcsot9': {
    lenderId: 'lender_originator_stellar_loans_secondary',
    apiKeyId: 'originator_stellar_loans_api_key_76cxhjcsot9',
    permissions: ["disbursements:read","wallets:read","lenders:read"],
    turnkeySubOrgId: 'sub_org_originator_stellar_loans_1761521069201',
  }
};
