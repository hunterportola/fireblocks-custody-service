-- Ensure originators table has onboarding-friendly columns
ALTER TABLE originators
  ADD COLUMN IF NOT EXISTS legal_entity_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS environment VARCHAR(50) DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS turnkey_organization_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP WITH TIME ZONE;

-- Users table (aligned with onboarding requirements)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  originator_id VARCHAR(255) NOT NULL REFERENCES originators(id) ON DELETE CASCADE,
  turnkey_user_id VARCHAR(255),
  user_type VARCHAR(50) NOT NULL DEFAULT 'root',
  template_id VARCHAR(255),
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  role VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(originator_id, username)
);

CREATE INDEX IF NOT EXISTS idx_users_originator ON users(originator_id);
CREATE INDEX IF NOT EXISTS idx_users_tags ON users USING GIN (tags);

-- Credentials table storing API keys/passkeys
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_type VARCHAR(50) NOT NULL,
  api_key_hash VARCHAR(255),
  api_key_name VARCHAR(255),
  api_public_key TEXT,
  curve_type VARCHAR(50),
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_api_key_hash UNIQUE(api_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_api_key_hash ON user_credentials(api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Extend provisioning_snapshots table with onboarding-specific columns
ALTER TABLE provisioning_snapshots
  ADD COLUMN IF NOT EXISTS root_user_ids TEXT[],
  ADD COLUMN IF NOT EXISTS automation_user_ids TEXT[],
  ADD COLUMN IF NOT EXISTS wallet_ids JSONB,
  ADD COLUMN IF NOT EXISTS policy_ids TEXT[],
  ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep updated_at trigger in sync
CREATE TRIGGER IF NOT EXISTS trigger_provisioning_snapshots_updated_at
  BEFORE UPDATE ON provisioning_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
