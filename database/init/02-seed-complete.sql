-- =============================================
-- SEED DATA FOR COMPLETE SCHEMA
-- =============================================

-- Insert test originators
INSERT INTO originators (id, name, display_name, legal_entity_name, environment, turnkey_organization_id, branding, settings, metadata, is_active, onboarded_at) VALUES
(
  'originator_demo',
  'demo_originator',
  'Demo Originator',
  'Demo Financial Services LLC',
  'sandbox',
  'org_demo_turnkey_12345',
  '{
    "logo": "/logos/demo.png",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "font": "Inter"
  }',
  '{
    "features": {
      "bulkUpload": true,
      "approvalWorkflow": true,
      "webhooks": true,
      "multiChain": false
    },
    "limits": {
      "dailyLimit": "1000000",
      "transactionLimit": "100000"
    },
    "compliance": {
      "kycRequired": false,
      "amlProvider": "demo"
    }
  }',
  '{
    "tier": "premium",
    "industry": "fintech",
    "mainContact": "demo@example.com"
  }',
  true,
  '2024-01-01T00:00:00Z'
),
(
  'originator_acme_lending',
  'acme_lending',
  'ACME Lending Corp.',
  'ACME Lending Corporation',
  'production',
  'org_acme_turnkey_67890',
  '{
    "logo": "/logos/acme.png",
    "primaryColor": "#10B981",
    "secondaryColor": "#059669",
    "font": "Roboto"
  }',
  '{
    "features": {
      "bulkUpload": true,
      "approvalWorkflow": true,
      "webhooks": true,
      "multiChain": false
    },
    "limits": {
      "dailyLimit": "5000000",
      "transactionLimit": "500000"
    },
    "compliance": {
      "kycRequired": true,
      "amlProvider": "chainalysis"
    }
  }',
  '{
    "tier": "enterprise",
    "industry": "lending",
    "mainContact": "ops@acmelending.com"
  }',
  true,
  '2024-01-15T00:00:00Z'
);

-- Insert partners for originators
INSERT INTO partners (id, originator_id, display_name, is_enabled, automation_user_template_id, webhook_url, metadata) VALUES
(
  'partner_demo_default',
  'originator_demo',
  'Demo Default Partner',
  true,
  'auto_demo_disbursements',
  'https://demo.webhook.site/custody',
  '{"type": "default", "priority": 1}'
),
(
  'partner_acme_prime',
  'originator_acme_lending',
  'ACME Prime Lending',
  true,
  'auto_acme_disbursements',
  'https://api.acmelending.com/webhooks/custody',
  '{"type": "prime", "tier": "gold", "volume": "high"}'
),
(
  'partner_acme_subprime',
  'originator_acme_lending',
  'ACME Subprime Division',
  true,
  'auto_acme_disbursements_restricted',
  'https://api.acmelending.com/webhooks/custody-subprime',
  '{"type": "subprime", "tier": "silver", "volume": "medium", "riskLevel": "elevated"}'
);

-- Insert root users
INSERT INTO users (originator_id, turnkey_user_id, user_type, username, email, tags, is_active) VALUES
-- Demo originator root users
('originator_demo', 'user_demo_root_1', 'root', 'demo_admin', 'admin@demo.com', ARRAY['root', 'admin'], true),
('originator_demo', 'user_demo_root_2', 'root', 'demo_ops', 'ops@demo.com', ARRAY['root', 'operations'], true),

-- ACME root users
('originator_acme_lending', 'user_acme_root_1', 'root', 'acme_ceo', 'ceo@acmelending.com', ARRAY['root', 'executive'], true),
('originator_acme_lending', 'user_acme_root_2', 'root', 'acme_cfo', 'cfo@acmelending.com', ARRAY['root', 'executive', 'finance'], true),
('originator_acme_lending', 'user_acme_root_3', 'root', 'acme_cto', 'cto@acmelending.com', ARRAY['root', 'executive', 'technology'], true);

-- Insert automation users
INSERT INTO users (originator_id, turnkey_user_id, user_type, template_id, username, tags, is_active) VALUES
-- Demo automation
('originator_demo', 'user_demo_auto_1', 'automation', 'auto_demo_disbursements', 'demo_disbursement_bot', ARRAY['automation', 'disbursements'], true),

-- ACME automation
('originator_acme_lending', 'user_acme_auto_1', 'automation', 'auto_acme_disbursements', 'acme_disbursement_bot', ARRAY['automation', 'disbursements'], true),
('originator_acme_lending', 'user_acme_auto_2', 'automation', 'auto_acme_disbursements_restricted', 'acme_restricted_bot', ARRAY['automation', 'disbursements', 'restricted'], true);

-- Insert role-based users
INSERT INTO users (originator_id, user_type, username, email, role, tags, is_active) VALUES
-- Demo role users
('originator_demo', 'role_based', 'demo_junior_1', 'junior1@demo.com', 'junior_reviewer', ARRAY['role:junior_reviewer'], true),
('originator_demo', 'role_based', 'demo_senior_1', 'senior1@demo.com', 'senior_reviewer', ARRAY['role:senior_reviewer'], true),
('originator_demo', 'role_based', 'demo_compliance', 'compliance@demo.com', 'compliance_officer', ARRAY['role:compliance_officer'], true),

-- ACME role users
('originator_acme_lending', 'role_based', 'acme_junior_1', 'junior1@acmelending.com', 'junior_reviewer', ARRAY['role:junior_reviewer'], true),
('originator_acme_lending', 'role_based', 'acme_junior_2', 'junior2@acmelending.com', 'junior_reviewer', ARRAY['role:junior_reviewer'], true),
('originator_acme_lending', 'role_based', 'acme_senior_1', 'senior1@acmelending.com', 'senior_reviewer', ARRAY['role:senior_reviewer'], true),
('originator_acme_lending', 'role_based', 'acme_senior_2', 'senior2@acmelending.com', 'senior_reviewer', ARRAY['role:senior_reviewer'], true),
('originator_acme_lending', 'role_based', 'acme_compliance_1', 'compliance1@acmelending.com', 'compliance_officer', ARRAY['role:compliance_officer'], true),
('originator_acme_lending', 'role_based', 'acme_auditor', 'auditor@acmelending.com', 'read_only_auditor', ARRAY['role:read_only_auditor'], true);

-- Insert user credentials (simplified for demo)
INSERT INTO user_credentials (user_id, auth_type, api_key_name, permissions) 
SELECT 
  u.id, 
  'api_key',
  u.username || '_api_key',
  CASE 
    WHEN u.role = 'administrator' THEN '["*"]'::jsonb
    WHEN u.role = 'senior_reviewer' THEN '["disbursements:approve", "disbursements:read", "wallets:read"]'::jsonb
    WHEN u.role = 'junior_reviewer' THEN '["disbursements:approve", "disbursements:read"]'::jsonb
    WHEN u.role = 'compliance_officer' THEN '["disbursements:read", "wallets:read", "reports:read"]'::jsonb
    WHEN u.role = 'read_only_auditor' THEN '["disbursements:read", "wallets:read", "reports:read", "audit:read"]'::jsonb
    WHEN u.user_type = 'automation' THEN '["disbursements:create", "disbursements:read", "wallets:read", "transactions:sign"]'::jsonb
    ELSE '["read"]'::jsonb
  END
FROM users u;

-- Insert lenders (external API users)
INSERT INTO lenders (id, originator_id, name, api_key_hash, permissions, webhook_url, settings, is_active) VALUES
-- Demo lenders
('lender_demo_api', 'originator_demo', 'Demo API Lender', 'sha256$8f4e3c2d1b0a9876543210fedcba$demo_key', 
 ARRAY['disbursements:create', 'disbursements:read', 'wallets:read'], 
 'https://demo.webhook.site/lender', '{"rateLimit": 100}', true),

-- ACME lenders
('lender_acme_primary', 'originator_acme_lending', 'ACME Primary Lending API', 'sha256$7d3b2c1a0f9e8765432109876543$acme_key',
 ARRAY['disbursements:create', 'disbursements:read', 'disbursements:retry', 'wallets:read', 'wallets:update'],
 'https://api.acmelending.com/webhooks/disbursements', '{"rateLimit": 1000, "tier": "premium"}', true),
 
('lender_acme_secondary', 'originator_acme_lending', 'ACME Secondary Lending API', 'sha256$6c2a1b0f9d8e7654321098765432$acme_sec_key',
 ARRAY['disbursements:create', 'disbursements:read', 'wallets:read'],
 'https://api.acmelending.com/webhooks/disbursements-secondary', '{"rateLimit": 500, "tier": "standard"}', true);

-- Insert wallet templates
INSERT INTO wallet_templates (id, originator_id, template_id, wallet_usage, name_template, mnemonic_length, accounts_template) VALUES
-- Demo templates
('wt_demo_dist', 'originator_demo', 'demo_distribution', 'distribution', 'Demo Distribution Wallet {timestamp}', 24, 
 '[{"alias": "primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/0''/0/0", "addressFormat": "ethereum"}]'),
 
('wt_demo_coll', 'originator_demo', 'demo_collection', 'collection', 'Demo Collection Wallet {timestamp}', 24,
 '[{"alias": "primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/0''/0/0", "addressFormat": "ethereum"}]'),

-- ACME templates (multi-chain)
('wt_acme_dist', 'originator_acme_lending', 'acme_distribution', 'distribution', 'ACME Distribution Wallet {originatorId} {timestamp}', 24,
 '[
   {"alias": "eth_primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/0''/0/0", "addressFormat": "ethereum"},
   {"alias": "poly_primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/0''/0/1", "addressFormat": "ethereum"},
   {"alias": "arb_primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/0''/0/2", "addressFormat": "ethereum"}
 ]'),
 
('wt_acme_coll', 'originator_acme_lending', 'acme_collection', 'collection', 'ACME Collection Wallet {originatorId} {timestamp}', 24,
 '[
   {"alias": "eth_primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/1''/0/0", "addressFormat": "ethereum"},
   {"alias": "poly_primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/1''/0/1", "addressFormat": "ethereum"}
 ]'),
 
('wt_acme_reserve', 'originator_acme_lending', 'acme_reserve', 'reserve', 'ACME Reserve Wallet {originatorId} {timestamp}', 24,
 '[{"alias": "primary", "curve": "secp256k1", "pathFormat": "bip32", "path": "m/44''/60''/2''/0/0", "addressFormat": "ethereum"}]');

-- Insert actual wallets
INSERT INTO wallets (originator_id, turnkey_wallet_id, turnkey_suborg_id, template_id, name, flow_id) VALUES
-- Demo wallets
('originator_demo', 'wallet_demo_dist_001', 'suborg_demo_12345', 'demo_distribution', 'Demo Distribution Wallet 2024-01-01', 'distribution'),
('originator_demo', 'wallet_demo_coll_001', 'suborg_demo_12345', 'demo_collection', 'Demo Collection Wallet 2024-01-01', 'collection'),

-- ACME wallets
('originator_acme_lending', 'wallet_acme_dist_001', 'suborg_acme_67890', 'acme_distribution', 'ACME Distribution Wallet 2024-01-15', 'distribution'),
('originator_acme_lending', 'wallet_acme_coll_001', 'suborg_acme_67890', 'acme_collection', 'ACME Collection Wallet 2024-01-15', 'collection'),
('originator_acme_lending', 'wallet_acme_reserve_001', 'suborg_acme_67890', 'acme_reserve', 'ACME Reserve Wallet 2024-01-15', 'reserve');

-- Insert wallet accounts
INSERT INTO wallet_accounts (wallet_id, turnkey_account_id, alias, address, curve, path_format, path, address_format, chain, balance) 
SELECT 
  w.id,
  w.turnkey_wallet_id || '_acct_' || a.alias,
  a.alias,
  CASE 
    WHEN w.originator_id = 'originator_demo' THEN '0x' || substr(md5(w.turnkey_wallet_id || a.alias), 1, 40)
    ELSE '0x' || substr(md5(w.turnkey_wallet_id || a.alias || 'prod'), 1, 40)
  END,
  a.account->>'curve',
  a.account->>'pathFormat',
  a.account->>'path',
  a.account->>'addressFormat',
  'sepolia',
  CASE 
    WHEN w.flow_id = 'distribution' THEN 1000000.00
    WHEN w.flow_id = 'collection' THEN 50000.00
    ELSE 100000.00
  END
FROM wallets w
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements(wt.accounts_template) AS account, 
         jsonb_array_elements(wt.accounts_template)->>'alias' AS alias
  FROM wallet_templates wt
  WHERE wt.template_id = w.template_id
) a;

-- Insert policy templates
INSERT INTO policy_templates (originator_id, template_id, policy_name, effect, condition_expression, consensus_expression, notes) VALUES
-- Demo policies
('originator_demo', 'demo_small_tx', 'Demo Small Transaction Auto-Approve', 'ALLOW', 
 'transaction.amount <= 10000', '0', 'Auto-approve transactions under $10k'),
 
('originator_demo', 'demo_large_tx', 'Demo Large Transaction Review', 'ALLOW',
 'transaction.amount > 10000', '2', 'Require 2 approvals for transactions over $10k'),

-- ACME policies (more complex)
('originator_acme_lending', 'acme_auto_small', 'ACME Auto-Approve Small', 'ALLOW',
 'transaction.amount <= 50000 AND partner.metadata.tier == "gold"', '0', 'Auto-approve small amounts for gold tier'),
 
('originator_acme_lending', 'acme_medium_review', 'ACME Medium Transaction Review', 'ALLOW',
 'transaction.amount > 50000 AND transaction.amount <= 250000', '1 + (partner.metadata.riskLevel == "elevated" ? 1 : 0)',
 'Variable approval based on partner risk'),
 
('originator_acme_lending', 'acme_large_review', 'ACME Large Transaction Review', 'ALLOW',
 'transaction.amount > 250000', '3', 'Require 3 approvals for large transactions'),
 
('originator_acme_lending', 'acme_compliance_hold', 'ACME Compliance Hold', 'DENY',
 'user.tags.includes("compliance_hold") OR partner.metadata.complianceFlag == true', '0',
 'Block transactions for entities under compliance review');

-- Insert deployed policies (would normally happen during provisioning)
INSERT INTO policies (originator_id, turnkey_policy_id, template_id, name, effect, condition_rendered, consensus_rendered, is_active)
SELECT 
  pt.originator_id,
  'policy_' || substr(md5(random()::text), 1, 16),
  pt.id,
  pt.policy_name,
  pt.effect,
  pt.condition_expression,
  pt.consensus_expression,
  true
FROM policy_templates pt;

-- Insert policy bindings
INSERT INTO policy_bindings (policy_id, binding_type, target_id)
SELECT 
  p.id,
  'global',
  p.originator_id
FROM policies p
WHERE p.name LIKE '%Auto-Approve%';

-- Bind large transaction policies to specific wallet flows
INSERT INTO policy_bindings (policy_id, binding_type, target_id)
SELECT 
  p.id,
  'wallet',
  w.id::text
FROM policies p
CROSS JOIN wallets w
WHERE p.name LIKE '%Large Transaction%' 
  AND w.flow_id = 'distribution'
  AND p.originator_id = w.originator_id;

-- Partner-specific policy assignments
INSERT INTO partner_policies (partner_id, originator_id, policy_id)
SELECT 
  pr.id,
  pr.originator_id,
  p.id
FROM partners pr
JOIN policies p ON p.originator_id = pr.originator_id
WHERE pr.id = 'partner_acme_subprime' AND p.name LIKE '%Compliance Hold%';

-- Insert automation templates
INSERT INTO automation_templates (id, originator_id, template_id, description, user_name_template, session_types, user_id) VALUES
('at_demo_1', 'originator_demo', 'auto_demo_disbursements', 'Demo disbursement automation', 
 'demo-disbursement-bot-{timestamp}', ARRAY['read_write'], 
 (SELECT id FROM users WHERE username = 'demo_disbursement_bot' LIMIT 1)),

('at_acme_1', 'originator_acme_lending', 'auto_acme_disbursements', 'ACME standard disbursement automation',
 'acme-disbursement-bot-{timestamp}', ARRAY['read_write'],
 (SELECT id FROM users WHERE username = 'acme_disbursement_bot' LIMIT 1)),

('at_acme_2', 'originator_acme_lending', 'auto_acme_disbursements_restricted', 'ACME restricted disbursement automation',
 'acme-restricted-bot-{timestamp}', ARRAY['read_only', 'read_write'],
 (SELECT id FROM users WHERE username = 'acme_restricted_bot' LIMIT 1));

-- Insert sample disbursements with various statuses
INSERT INTO disbursements (
  id, originator_id, lender_id, partner_id, loan_id, borrower_address, amount, chain, 
  wallet_id, account_id, status, tx_hash, initiated_at, signed_at, broadcasted_at, confirmed_at
)
SELECT
  'disb_' || o.id || '_' || to_char(d.date, 'YYYYMMDD') || '_' || d.num,
  o.id,
  l.id,
  p.id,
  'loan_' || substr(md5(random()::text), 1, 8),
  '0x' || substr(md5(random()::text), 1, 40),
  (random() * 100000 + 1000)::decimal(36, 18),
  'sepolia'::blockchain,
  w.id,
  wa.id,
  CASE 
    WHEN d.date < CURRENT_DATE - INTERVAL '2 days' THEN 
      CASE (random() * 10)::int
        WHEN 0 THEN 'failed'
        WHEN 1 THEN 'failed'
        ELSE 'completed'
      END
    WHEN d.date = CURRENT_DATE THEN
      CASE (random() * 3)::int
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'signing'
        ELSE 'broadcasting'
      END
    ELSE 'completed'
  END::disbursement_status,
  CASE 
    WHEN random() < 0.8 THEN '0x' || substr(md5(random()::text), 1, 64)
    ELSE NULL
  END,
  d.date + (interval '1 hour' * (random() * 23)::int),
  d.date + (interval '1 hour' * (random() * 23)::int) + interval '1 minute',
  d.date + (interval '1 hour' * (random() * 23)::int) + interval '2 minutes',
  CASE 
    WHEN random() < 0.8 THEN d.date + (interval '1 hour' * (random() * 23)::int) + interval '15 minutes'
    ELSE NULL
  END
FROM originators o
CROSS JOIN lenders l
CROSS JOIN partners p
CROSS JOIN wallets w
CROSS JOIN LATERAL (SELECT id FROM wallet_accounts WHERE wallet_id = w.id AND chain = 'sepolia' LIMIT 1) wa
CROSS JOIN LATERAL (
  SELECT generate_series(1, 5 + (random() * 10)::int) as num,
         CURRENT_DATE - (generate_series(0, 30) || ' days')::interval as date
) d
WHERE o.id = l.originator_id
  AND o.id = p.originator_id
  AND o.id = w.originator_id
  AND w.flow_id = 'distribution'
  AND random() < 0.3; -- Only create 30% of possible combinations

-- Insert some pending approval disbursements
INSERT INTO disbursements (
  id, originator_id, lender_id, loan_id, borrower_address, amount, chain,
  wallet_id, account_id, status, requires_approval, required_approvals, current_approvals
)
SELECT
  'disb_pending_' || substr(md5(random()::text), 1, 8),
  o.id,
  l.id,
  'loan_pending_' || substr(md5(random()::text), 1, 6),
  '0x' || substr(md5(random()::text), 1, 40),
  (random() * 500000 + 100000)::decimal(36, 18), -- Large amounts
  'sepolia',
  w.id,
  wa.id,
  'pending_approval',
  true,
  3,
  (random() * 2)::int
FROM originators o
CROSS JOIN lenders l
CROSS JOIN wallets w
CROSS JOIN LATERAL (SELECT id FROM wallet_accounts WHERE wallet_id = w.id AND chain = 'sepolia' LIMIT 1) wa
WHERE o.id = l.originator_id
  AND o.id = w.originator_id
  AND w.flow_id = 'distribution'
  AND o.id = 'originator_acme_lending'
LIMIT 5;

-- Insert webhook configurations
INSERT INTO webhook_configs (originator_id, url, events, retry_attempts, retry_delay_ms, is_active) VALUES
('originator_demo', 'https://demo.webhook.site/custody-events', 
 ARRAY['disbursement.created', 'disbursement.completed', 'disbursement.failed'],
 3, 5000, true),

('originator_acme_lending', 'https://api.acmelending.com/webhooks/custody',
 ARRAY['disbursement.created', 'disbursement.completed', 'disbursement.failed', 'disbursement.pending_approval', 'approval.received'],
 5, 10000, true);

-- Insert sample webhook deliveries (some successful, some failed)
INSERT INTO webhook_deliveries (webhook_config_id, event_type, disbursement_id, payload, response_status, attempt_number)
SELECT 
  wc.id,
  'disbursement.completed',
  d.id,
  jsonb_build_object(
    'event', 'disbursement.completed',
    'disbursementId', d.id,
    'amount', d.amount,
    'status', d.status,
    'txHash', d.tx_hash
  ),
  CASE (random() * 10)::int
    WHEN 0 THEN 500
    WHEN 1 THEN 504
    ELSE 200
  END,
  1
FROM webhook_configs wc
CROSS JOIN disbursements d
WHERE wc.originator_id = d.originator_id
  AND d.status = 'completed'
  AND random() < 0.2 -- Only 20% of completed disbursements
LIMIT 50;

-- Insert a comprehensive provisioning snapshot for ACME
INSERT INTO provisioning_snapshots (
  originator_id, 
  platform_config_hash, 
  snapshot_data,
  root_user_ids,
  automation_user_ids,
  wallet_ids,
  policy_ids,
  provisioned_at
) VALUES (
  'originator_acme_lending',
  SHA256('acme_platform_config_v1')::text,
  jsonb_build_object(
    'subOrganizationId', 'suborg_acme_67890',
    'name', 'ACME Lending Corp.',
    'rootQuorumThreshold', 2,
    'rootUsers', (
      SELECT jsonb_agg(jsonb_build_object(
        'userId', turnkey_user_id,
        'userName', username,
        'userEmail', email
      ))
      FROM users 
      WHERE originator_id = 'originator_acme_lending' 
        AND user_type = 'root'
    ),
    'automationUsers', (
      SELECT jsonb_agg(jsonb_build_object(
        'templateId', template_id,
        'userId', turnkey_user_id,
        'userName', username
      ))
      FROM users 
      WHERE originator_id = 'originator_acme_lending' 
        AND user_type = 'automation'
    ),
    'walletFlows', (
      SELECT jsonb_agg(jsonb_build_object(
        'flowId', flow_id,
        'walletId', turnkey_wallet_id,
        'walletName', name
      ))
      FROM wallets
      WHERE originator_id = 'originator_acme_lending'
    ),
    'metadata', jsonb_build_object(
      'originatorId', 'originator_acme_lending',
      'environment', 'production',
      'provisionedBy', 'system'
    )
  ),
  ARRAY['user_acme_root_1', 'user_acme_root_2', 'user_acme_root_3'],
  ARRAY['user_acme_auto_1', 'user_acme_auto_2'],
  jsonb_build_object(
    'distribution', 'wallet_acme_dist_001',
    'collection', 'wallet_acme_coll_001',
    'reserve', 'wallet_acme_reserve_001'
  ),
  (SELECT array_agg(turnkey_policy_id) FROM policies WHERE originator_id = 'originator_acme_lending'),
  '2024-01-15T10:00:00Z'
);

-- Update wallet balances based on completed transactions
UPDATE wallet_accounts wa
SET balance = balance - COALESCE((
  SELECT SUM(d.amount)
  FROM disbursements d
  WHERE d.account_id = wa.id
    AND d.status = 'completed'
), 0),
balance_updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM disbursements d WHERE d.account_id = wa.id
);

-- Insert some audit logs
INSERT INTO audit_logs (user_id, lender_id, action, resource_type, resource_id, changes, metadata) 
SELECT 
  u.id,
  NULL,
  'user.login',
  'session',
  substr(md5(random()::text), 1, 16),
  NULL,
  jsonb_build_object('ip', '192.168.1.' || (random() * 254)::int)
FROM users u
WHERE u.is_active = true
  AND random() < 0.3;

-- Insert disbursement creation audit logs
INSERT INTO audit_logs (lender_id, action, resource_type, resource_id, changes)
SELECT 
  d.lender_id,
  'disbursement.create',
  'disbursement',
  d.id,
  jsonb_build_object(
    'amount', d.amount,
    'borrowerAddress', d.borrower_address,
    'chain', d.chain
  )
FROM disbursements d
WHERE d.created_at > CURRENT_DATE - INTERVAL '7 days';
