-- Add wallet_accounts table for storing individual accounts within wallets
-- This supports the onboarding flow that provisions multiple accounts per wallet

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  turnkey_account_id VARCHAR(255) NOT NULL UNIQUE,
  alias VARCHAR(255) NOT NULL,
  address VARCHAR(100),
  curve VARCHAR(50) NOT NULL,
  path_format VARCHAR(50) NOT NULL,
  path VARCHAR(255) NOT NULL,
  address_format VARCHAR(50) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(wallet_id, alias)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_wallet_id ON wallet_accounts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_turnkey_account_id ON wallet_accounts(turnkey_account_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_address ON wallet_accounts(address);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_chain ON wallet_accounts(chain);

-- Add update trigger for wallet_accounts
CREATE TRIGGER IF NOT EXISTS update_wallet_accounts_updated_at 
  BEFORE UPDATE ON wallet_accounts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();