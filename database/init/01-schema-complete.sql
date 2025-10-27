-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUM TYPES
-- =============================================

-- User types in the system
CREATE TYPE user_type AS ENUM (
  'root',           -- Root organization users
  'automation',     -- Automation/service accounts
  'role_based',     -- Role-based users (junior_reviewer, etc.)
  'lender'          -- External API users
);

-- Predefined roles
CREATE TYPE user_role AS ENUM (
  'junior_reviewer',
  'senior_reviewer', 
  'compliance_officer',
  'administrator',
  'read_only_auditor'
);

-- Authentication types
CREATE TYPE auth_type AS ENUM (
  'api_key',
  'passkey',
  'oauth',
  'otp_email',
  'otp_sms'
);

-- Transaction statuses
CREATE TYPE disbursement_status AS ENUM (
  'pending',
  'signing',
  'broadcasting',
  'completed',
  'failed',
  'pending_approval'
);

-- Supported blockchains
CREATE TYPE blockchain AS ENUM (
  'sepolia'
);

-- Wallet usage types
CREATE TYPE wallet_usage AS ENUM (
  'distribution',
  'collection',
  'escrow',
  'operational',
  'reserve'
);

-- Policy effects
CREATE TYPE policy_effect AS ENUM (
  'ALLOW',
  'DENY'
);

-- Policy binding types
CREATE TYPE policy_binding_type AS ENUM (
  'wallet',
  'wallet_account',
  'partner',
  'user_tag',
  'activity_type',
  'global'
);

-- Turnkey activity status
CREATE TYPE activity_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'consensus_needed'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Originators (main organizations)
CREATE TABLE originators (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  legal_entity_name VARCHAR(255),
  
  -- Platform configuration
  environment VARCHAR(50) NOT NULL DEFAULT 'sandbox',
  turnkey_organization_id VARCHAR(255) NOT NULL,
  
  -- Branding and settings
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Partners (entities that can have custom configs)
CREATE TABLE partners (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  display_name VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  
  -- Automation user assignment
  automation_user_template_id VARCHAR(255),
  
  -- Webhook override
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(originator_id, id)
);

-- Users table (all user types)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  -- User identification
  turnkey_user_id VARCHAR(255),
  user_type user_type NOT NULL,
  template_id VARCHAR(255), -- Reference to the template used to create this user
  
  -- Basic info
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  
  -- Role-based users only
  role user_role,
  
  -- User tags (for policy bindings)
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(originator_id, username)
);

-- Create index for tag searches
CREATE INDEX idx_users_tags ON users USING GIN (tags);

-- User credentials (API keys, authenticators, etc.)
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  auth_type auth_type NOT NULL,
  
  -- API Key fields
  api_key_hash VARCHAR(255),
  api_key_name VARCHAR(255),
  api_public_key TEXT,
  curve_type VARCHAR(50),
  
  -- Authenticator fields
  authenticator_name VARCHAR(255),
  credential_id VARCHAR(255),
  
  -- OAuth fields
  provider_name VARCHAR(100),
  provider_user_id VARCHAR(255),
  
  -- Common fields
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique API keys
  CONSTRAINT unique_api_key UNIQUE(api_key_hash)
);

-- Create indexes for credential lookups
CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_api_key_hash ON user_credentials(api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Lenders (external API users) - simplified view
CREATE TABLE lenders (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  
  -- Permissions as array
  permissions TEXT[] DEFAULT '{}',
  
  -- Configuration
  webhook_url TEXT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- WALLET TABLES
-- =============================================

-- Wallet templates (blueprints for wallets)
CREATE TABLE wallet_templates (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  template_id VARCHAR(255) NOT NULL,
  wallet_usage wallet_usage NOT NULL,
  
  -- Wallet configuration
  name_template VARCHAR(500) NOT NULL,
  mnemonic_length INTEGER DEFAULT 24,
  
  -- Template definition (JSON)
  accounts_template JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(originator_id, template_id)
);

-- Actual wallet instances
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  -- Turnkey references
  turnkey_wallet_id VARCHAR(255) NOT NULL,
  turnkey_suborg_id VARCHAR(255) NOT NULL,
  
  -- Template reference
  template_id VARCHAR(255) NOT NULL,
  
  -- Wallet details
  name VARCHAR(255) NOT NULL,
  flow_id VARCHAR(100) NOT NULL, -- distribution, collection, etc.
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(turnkey_wallet_id),
  UNIQUE(originator_id, flow_id) -- One wallet per flow per originator by default
);

-- Wallet accounts (addresses within wallets)
CREATE TABLE wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Turnkey references
  turnkey_account_id VARCHAR(255) NOT NULL,
  
  -- Account details
  alias VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  public_key TEXT,
  
  -- Configuration
  curve VARCHAR(50) NOT NULL,
  path_format VARCHAR(50) NOT NULL,
  path VARCHAR(255) NOT NULL,
  address_format VARCHAR(50) NOT NULL,
  
  -- Chain-specific
  chain blockchain NOT NULL,
  
  -- Balance tracking (cached)
  balance DECIMAL(36, 18) DEFAULT 0,
  balance_updated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(turnkey_account_id),
  UNIQUE(address, chain)
);

-- Create indexes for wallet queries
CREATE INDEX idx_wallets_originator_flow ON wallets(originator_id, flow_id);
CREATE INDEX idx_wallet_accounts_address ON wallet_accounts(address);

-- Partner-specific wallet mappings
CREATE TABLE partner_wallet_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id VARCHAR(255) NOT NULL,
  originator_id VARCHAR(255) NOT NULL,
  
  flow_id VARCHAR(100) NOT NULL,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id, originator_id) REFERENCES partners(id, originator_id) ON DELETE CASCADE,
  UNIQUE(partner_id, flow_id)
);

-- =============================================
-- POLICY TABLES  
-- =============================================

-- Policy templates
CREATE TABLE policy_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  template_id VARCHAR(255) NOT NULL,
  policy_name VARCHAR(255) NOT NULL,
  
  -- Policy rules
  effect policy_effect NOT NULL,
  condition_expression TEXT NOT NULL, -- Template expression
  consensus_expression TEXT NOT NULL, -- Template expression
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(originator_id, template_id)
);

-- Deployed policy instances
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  -- Turnkey policy ID
  turnkey_policy_id VARCHAR(255) NOT NULL,
  
  -- Reference to template
  template_id UUID REFERENCES policy_templates(id),
  
  -- Rendered policy
  name VARCHAR(255) NOT NULL,
  effect policy_effect NOT NULL,
  condition_rendered TEXT NOT NULL,
  consensus_rendered TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(turnkey_policy_id)
);

-- Policy bindings (what policies apply to)
CREATE TABLE policy_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  binding_type policy_binding_type NOT NULL,
  target_id VARCHAR(255) NOT NULL, -- ID of wallet, partner, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(policy_id, binding_type, target_id)
);

-- Partner policy assignments
CREATE TABLE partner_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id VARCHAR(255) NOT NULL,
  originator_id VARCHAR(255) NOT NULL,
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (partner_id, originator_id) REFERENCES partners(id, originator_id) ON DELETE CASCADE,
  UNIQUE(partner_id, policy_id)
);

-- =============================================
-- TRANSACTION TABLES
-- =============================================

-- Disbursement requests
CREATE TABLE disbursements (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE RESTRICT,
  
  -- Request details
  lender_id VARCHAR(255) NOT NULL REFERENCES lenders(id),
  partner_id VARCHAR(255),
  loan_id VARCHAR(255) NOT NULL,
  
  -- Transaction details
  borrower_address VARCHAR(255) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  asset_type VARCHAR(10) NOT NULL DEFAULT 'USDC',
  chain blockchain NOT NULL,
  
  -- Wallet/account used
  wallet_id UUID REFERENCES wallets(id),
  account_id UUID REFERENCES wallet_accounts(id),
  
  -- Status tracking
  status disbursement_status NOT NULL DEFAULT 'pending',
  
  -- Turnkey references
  turnkey_activity_id VARCHAR(255),
  turnkey_suborg_id VARCHAR(255),
  
  -- Blockchain transaction
  tx_hash VARCHAR(255),
  signed_transaction TEXT,
  
  -- Timeline
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  policies_evaluated_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  broadcasted_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  error_details JSONB,
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT false,
  approval_url TEXT,
  required_approvals INTEGER,
  current_approvals INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for disbursement queries
CREATE INDEX idx_disbursements_originator_status ON disbursements(originator_id, status);
CREATE INDEX idx_disbursements_lender_id ON disbursements(lender_id);
CREATE INDEX idx_disbursements_loan_id ON disbursements(loan_id);
CREATE INDEX idx_disbursements_created_at ON disbursements(created_at DESC);

-- Turnkey activities tracking
CREATE TABLE turnkey_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  activity_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  
  -- Related entities
  disbursement_id VARCHAR(255) REFERENCES disbursements(id),
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  status activity_status NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  failure JSONB,
  
  -- Consensus tracking
  consensus_required BOOLEAN DEFAULT false,
  required_approvals INTEGER,
  current_approvals INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(activity_id)
);

-- Approval records
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What's being approved
  disbursement_id VARCHAR(255) REFERENCES disbursements(id),
  activity_id VARCHAR(255),
  
  -- Who's approving
  approver_id UUID NOT NULL REFERENCES users(id),
  
  -- Approval details
  signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  metadata JSONB DEFAULT '{}'
);

-- Policy evaluation history
CREATE TABLE policy_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What was evaluated
  disbursement_id VARCHAR(255) REFERENCES disbursements(id),
  activity_id VARCHAR(255),
  
  -- Which policies
  policy_id UUID NOT NULL REFERENCES policies(id),
  
  -- Evaluation result
  matched BOOLEAN NOT NULL,
  effect policy_effect,
  consensus_required INTEGER,
  
  -- Context used
  evaluation_context JSONB NOT NULL,
  
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PROVISIONING & CONFIGURATION TABLES
-- =============================================

-- Complete provisioning snapshots
CREATE TABLE provisioning_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL UNIQUE REFERENCES originators(id) ON DELETE CASCADE,
  
  platform_config_hash VARCHAR(64) NOT NULL,
  
  -- Complete snapshot data
  snapshot_data JSONB NOT NULL,
  
  -- Extracted key mappings for queries
  root_user_ids TEXT[],
  automation_user_ids TEXT[],
  wallet_ids JSONB, -- {flowId: walletId}
  policy_ids TEXT[],
  
  provisioned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Automation user templates
CREATE TABLE automation_templates (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  template_id VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template configuration
  user_name_template VARCHAR(500) NOT NULL,
  session_types TEXT[] DEFAULT '{}',
  
  -- Associated user (after provisioning)
  user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(originator_id, template_id)
);

-- =============================================
-- WEBHOOK & NOTIFICATION TABLES
-- =============================================

-- Webhook configurations
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  secret_hash VARCHAR(255),
  
  -- Event subscriptions
  events TEXT[] DEFAULT '{}',
  
  -- Configuration
  retry_attempts INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 5000,
  timeout_ms INTEGER DEFAULT 10000,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  disbursement_id VARCHAR(255) REFERENCES disbursements(id),
  
  -- Payload and response
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  
  -- Delivery tracking
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Error info
  error_message TEXT
);

CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) 
  WHERE next_retry_at IS NOT NULL;

-- =============================================
-- AUDIT TABLES
-- =============================================

-- Comprehensive audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  user_id UUID REFERENCES users(id),
  lender_id VARCHAR(255) REFERENCES lenders(id),
  ip_address INET,
  user_agent TEXT,
  
  -- What
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  
  -- Details
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- When
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at
CREATE TRIGGER update_originators_updated_at BEFORE UPDATE ON originators
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lenders_updated_at BEFORE UPDATE ON lenders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at BEFORE UPDATE ON disbursements
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_turnkey_activities_updated_at BEFORE UPDATE ON turnkey_activities
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_provisioning_snapshots_updated_at BEFORE UPDATE ON provisioning_snapshots
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
