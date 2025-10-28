-- Base tenant schema (must run before any ALTER statements)
-- Extensions are created by provisioner with admin privileges

-- Enum types
CREATE TYPE disbursement_status AS ENUM (
  'pending',
  'signing',
  'broadcasting',
  'completed',
  'failed',
  'pending_approval'
);

CREATE TYPE transaction_chain AS ENUM (
  'ethereum-sepolia',
  'sepolia'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'originator',
  'viewer'
);

-- Originators table (base table required for ALTERs in later migrations)
CREATE TABLE originators (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_hash VARCHAR(255) NOT NULL UNIQUE,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  name VARCHAR(255),
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create index for API key lookups
CREATE INDEX idx_api_keys_api_key_hash ON api_keys(api_key_hash);
CREATE INDEX idx_api_keys_originator_id ON api_keys(originator_id);

-- Disbursements table
CREATE TABLE disbursements (
  id VARCHAR(255) PRIMARY KEY,
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE RESTRICT,
  loan_id VARCHAR(255) NOT NULL,
  borrower_address VARCHAR(42) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  asset_type VARCHAR(10) NOT NULL DEFAULT 'USDC',
  chain transaction_chain NOT NULL,
  status disbursement_status NOT NULL DEFAULT 'pending',
  
  -- Transaction details
  tx_hash VARCHAR(66),
  turnkey_activity_id VARCHAR(255),
  turnkey_suborg_id VARCHAR(255),
  
  -- Timeline tracking
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
  
  -- Approval workflow
  approval_url TEXT,
  required_approvals INTEGER,
  current_approvals INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_disbursements_originator_id ON disbursements(originator_id);
CREATE INDEX idx_disbursements_loan_id ON disbursements(loan_id);
CREATE INDEX idx_disbursements_status ON disbursements(status);
CREATE INDEX idx_disbursements_created_at ON disbursements(created_at);
CREATE INDEX idx_disbursements_chain ON disbursements(chain);

-- Wallet information table
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
  
  UNIQUE(turnkey_wallet_id)
);

-- Create indexes for wallet queries
CREATE INDEX idx_wallets_originator_id ON wallets(originator_id);
CREATE INDEX idx_wallets_turnkey_wallet_id ON wallets(turnkey_wallet_id);
CREATE INDEX idx_wallets_flow_id ON wallets(flow_id);

-- Webhook configurations
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_hash VARCHAR(255),
  events JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  disbursement_id VARCHAR(255) REFERENCES disbursements(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for webhook queries
CREATE INDEX idx_webhook_deliveries_webhook_config_id ON webhook_deliveries(webhook_config_id);
CREATE INDEX idx_webhook_deliveries_disbursement_id ON webhook_deliveries(disbursement_id);
CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_originators_updated_at BEFORE UPDATE ON originators
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_disbursements_updated_at BEFORE UPDATE ON disbursements
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();