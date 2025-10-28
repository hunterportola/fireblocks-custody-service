-- Insert test originators
INSERT INTO originators (id, name, display_name, branding, settings, metadata) VALUES
(
  'originator_demo',
  'demo_originator',
  'Demo Originator',
  '{
    "logo": "/logos/demo.png",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF"
  }',
  '{
    "features": {
      "bulkUpload": true,
      "approvalWorkflow": true,
      "webhooks": true
    },
    "limits": {
      "dailyLimit": "1000000",
      "transactionLimit": "100000"
    }
  }',
  '{
    "tier": "premium",
    "onboardedAt": "2024-01-01T00:00:00Z"
  }'
),
(
  'originator_acme_lending',
  'acme_lending',
  'ACME Lending Corp.',
  '{
    "logo": "/logos/acme.png",
    "primaryColor": "#10B981",
    "secondaryColor": "#059669"
  }',
  '{
    "features": {
      "bulkUpload": true,
      "approvalWorkflow": true,
      "webhooks": true
    },
    "limits": {
      "dailyLimit": "5000000",
      "transactionLimit": "500000"
    }
  }',
  '{
    "tier": "enterprise",
    "onboardedAt": "2024-01-15T00:00:00Z"
  }'
),
(
  'originator_stellar_loans',
  'stellar_loans',
  'Stellar Loans Inc.',
  '{
    "logo": "/logos/stellar.png",
    "primaryColor": "#8B5CF6",
    "secondaryColor": "#6D28D9"
  }',
  '{
    "features": {
      "bulkUpload": false,
      "approvalWorkflow": true,
      "webhooks": true
    },
    "limits": {
      "dailyLimit": "2000000",
      "transactionLimit": "200000"
    }
  }',
  '{
    "tier": "standard",
    "onboardedAt": "2024-02-01T00:00:00Z"
  }'
);

-- Insert test API keys
-- Note: These are hashed versions of the test keys. In production, use proper bcrypt/argon2
-- Test keys:
-- originator_demo_api_key_abc789 -> SHA256: 374bfca5816aaa32ea329f870da80b52d9095090912699cb2fb19bc93b43abcb
-- originator_acme_lending_api_key_5u55s56j9n8 -> SHA256: 95b3e59637912a7c8e622373d9e6f4fa491847a178148177d121e79728930739
-- originator_stellar_loans_api_key_ue162vf99l9 -> SHA256: 10a385fab96d860c9e5f2a438907316b8c0d92cab3a61e1a9476d825164b16bb
INSERT INTO api_keys (api_key_hash, originator_id, name, permissions) VALUES
(
  '374bfca5816aaa32ea329f870da80b52d9095090912699cb2fb19bc93b43abcb',
  'originator_demo',
  'Demo Test Key',
  '["disbursements:create", "disbursements:read", "wallets:read"]'
),
(
  '95b3e59637912a7c8e622373d9e6f4fa491847a178148177d121e79728930739',
  'originator_acme_lending',
  'ACME Primary Key',
  '["disbursements:create", "disbursements:read", "disbursements:retry", "wallets:read", "wallets:update"]'
),
(
  '10a385fab96d860c9e5f2a438907316b8c0d92cab3a61e1a9476d825164b16bb',
  'originator_stellar_loans',
  'Stellar Primary Key',
  '["disbursements:create", "disbursements:read", "wallets:read"]'
);

-- Insert some test wallets
INSERT INTO wallets (originator_id, turnkey_wallet_id, turnkey_suborg_id, template_id, name, flow_id) VALUES
(
  'originator_demo',
  'turnkey_wallet_demo_123',
  'sub_org_demo_67890',
  'wallet-distribution-default',
  'Demo Distribution Wallet',
  'distribution'
),
(
  'originator_acme_lending',
  'turnkey_wallet_acme_eth_456',
  'sub_org_originator_acme_lending_1761521069201',
  'wallet-distribution-default',
  'ACME Distribution Wallet',
  'distribution'
),
(
  'originator_stellar_loans',
  'turnkey_wallet_stellar_eth_789',
  'sub_org_originator_stellar_loans_1761521069202',
  'wallet-distribution-default',
  'Stellar Distribution Wallet',
  'distribution'
);

-- Insert demo transaction history (last 30 days)
WITH RECURSIVE dates AS (
  SELECT CURRENT_DATE - INTERVAL '30 days' AS date
  UNION ALL
  SELECT date + INTERVAL '1 day'
  FROM dates
  WHERE date < CURRENT_DATE
),
transaction_data AS (
  SELECT 
    d.date,
    o.id as originator_id,
    -- Generate 5-15 transactions per day per originator
    generate_series(1, floor(random() * 10 + 5)::int) as tx_num
  FROM dates d
  CROSS JOIN originators o
)
INSERT INTO disbursements (
  id,
  originator_id,
  loan_id,
  borrower_address,
  amount,
  chain,
  status,
  tx_hash,
  initiated_at,
  signed_at,
  broadcasted_at,
  confirmed_at
)
SELECT
  'disb_' || td.originator_id || '_' || to_char(td.date, 'YYYYMMDD') || '_' || td.tx_num,
  td.originator_id,
  'loan_' || substr(md5(random()::text), 1, 8),
  '0x' || substr(md5(random()::text), 1, 40),
  -- Random amount between 100 and 10000 USDC
  (random() * 9900 + 100)::decimal(36, 18),
  'sepolia',
  -- 85% completed, 10% failed, 5% pending
  CASE 
    WHEN random() < 0.85 THEN 'completed'::disbursement_status
    WHEN random() < 0.95 THEN 'failed'::disbursement_status
    ELSE 'pending'::disbursement_status
  END,
  CASE 
    WHEN random() < 0.85 THEN '0x' || substr(md5(random()::text), 1, 64)
    ELSE NULL
  END,
  td.date + (interval '1 hour' * floor(random() * 24)),
  td.date + (interval '1 hour' * floor(random() * 24)) + interval '1 minute',
  td.date + (interval '1 hour' * floor(random() * 24)) + interval '2 minutes',
  CASE 
    WHEN random() < 0.85 THEN td.date + (interval '1 hour' * floor(random() * 24)) + interval '15 minutes'
    ELSE NULL
  END
FROM transaction_data td;

-- Insert webhook configuration for demo originator
INSERT INTO webhook_configs (originator_id, url, events, is_active) VALUES
(
  'originator_demo',
  'https://demo.webhook.site/custody-events',
  '["disbursement.created", "disbursement.completed", "disbursement.failed"]',
  true
),
(
  'originator_acme_lending',
  'https://api.acmelending.com/webhooks/custody',
  '["disbursement.created", "disbursement.completed", "disbursement.failed", "disbursement.pending_approval"]',
  true
);
