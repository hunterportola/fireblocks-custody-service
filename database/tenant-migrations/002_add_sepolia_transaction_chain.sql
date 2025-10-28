-- Allow storing sepolia chain identifier alongside legacy enum values
ALTER TYPE transaction_chain ADD VALUE IF NOT EXISTS 'sepolia';
