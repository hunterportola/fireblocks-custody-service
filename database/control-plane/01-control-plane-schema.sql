-- =============================================
-- CONTROL PLANE DATABASE SCHEMA
-- This database manages tenant registration, routing, and metadata
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUM TYPES
-- =============================================

CREATE TYPE tenant_status AS ENUM (
  'registering',      -- Initial registration in progress
  'provisioning',     -- Database and Turnkey provisioning
  'kyc_pending',      -- Waiting for KYC/compliance approval
  'active',           -- Fully operational
  'suspended',        -- Temporarily disabled
  'terminated'        -- Permanently closed
);

CREATE TYPE environment_type AS ENUM (
  'sandbox',
  'staging', 
  'production'
);

CREATE TYPE database_isolation_type AS ENUM (
  'shared_with_rls',     -- Row-level security (legacy)
  'dedicated_schema',    -- Schema per tenant
  'dedicated_database',  -- Database per tenant (recommended)
  'dedicated_instance'   -- Separate DB instance (enterprise)
);

-- =============================================
-- TENANT REGISTRY
-- =============================================

-- Main tenant registry - the source of truth for all originators
CREATE TABLE tenant_registry (
    originator_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    legal_entity_name VARCHAR(255),
    
    -- Environment and status
    environment environment_type NOT NULL DEFAULT 'sandbox',
    status tenant_status NOT NULL DEFAULT 'registering',
    
    -- Database isolation configuration
    isolation_type database_isolation_type NOT NULL DEFAULT 'dedicated_database',
    database_name VARCHAR(255),
    database_schema VARCHAR(255), -- For schema-based isolation
    database_host VARCHAR(255) DEFAULT 'localhost',
    database_port INTEGER DEFAULT 5432,
    database_user VARCHAR(255),
    
    -- Connection configuration (encrypted)
    encrypted_connection_string TEXT,
    connection_pool_config JSONB DEFAULT '{
        "max_connections": 10,
        "idle_timeout_ms": 30000,
        "connection_timeout_ms": 5000
    }',
    
    -- Turnkey configuration
    turnkey_suborg_id VARCHAR(255) UNIQUE,
    turnkey_organization_id VARCHAR(255),
    encrypted_turnkey_credentials TEXT,
    
    -- API routing and limits
    api_base_url VARCHAR(255),
    api_rate_limits JSONB DEFAULT '{
        "requests_per_minute": 100,
        "burst_limit": 200,
        "daily_limit": 10000
    }',
    
    -- Branding and customization
    branding_config JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    
    -- Compliance and business info
    kyc_status VARCHAR(50) DEFAULT 'pending',
    compliance_level VARCHAR(50) DEFAULT 'standard',
    business_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    provisioned_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_database_name CHECK (
        database_name IS NULL OR 
        database_name ~ '^custody_[a-z0-9_]+$'
    ),
    CONSTRAINT valid_originator_id CHECK (
        originator_id ~ '^[a-z0-9_]+$'
    )
);

-- Conditional unique constraint for dedicated databases only
-- (Schema-based and RLS tenants can share database names)
CREATE UNIQUE INDEX idx_tenant_registry_unique_database_name 
    ON tenant_registry (database_name) 
    WHERE isolation_type = 'dedicated_database';

-- =============================================
-- API KEY REGISTRY  
-- =============================================

-- API keys for initial tenant resolution
CREATE TABLE control_plane_api_keys (
    key_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    
    -- Key identification and security
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    api_key_name VARCHAR(255),
    key_type VARCHAR(50) DEFAULT 'tenant_api_key',
    
    -- Permissions and scope
    permissions JSONB NOT NULL DEFAULT '[]',
    scope_restrictions JSONB DEFAULT '{}',
    
    -- Usage tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by VARCHAR(255),
    revoked_reason TEXT,
    
    -- Usage statistics
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    last_used_ip INET,
    last_used_user_agent TEXT,
    
    -- Rate limiting
    rate_limit_override JSONB,
    
    CONSTRAINT valid_permissions CHECK (jsonb_typeof(permissions) = 'array'),
    CONSTRAINT non_expired_if_not_revoked CHECK (
        revoked_at IS NOT NULL OR expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
    )
);

-- =============================================
-- TENANT PROVISIONING AUDIT TRAIL
-- =============================================

-- Track the complete provisioning lifecycle
CREATE TABLE tenant_provisioning_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    
    -- Provisioning step tracking
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(50) NOT NULL, -- started, completed, failed, skipped
    step_order INTEGER NOT NULL,
    
    -- Step details
    step_description TEXT,
    step_input JSONB,
    step_output JSONB,
    step_error JSONB,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
            ELSE NULL 
        END
    ) STORED,
    
    -- Context
    triggered_by VARCHAR(255),
    correlation_id UUID,
    
    CONSTRAINT valid_step_status CHECK (
        step_status IN ('started', 'completed', 'failed', 'skipped', 'retry')
    )
);

-- =============================================
-- TENANT HEALTH MONITORING
-- =============================================

-- Track tenant health and usage metrics
CREATE TABLE tenant_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    
    -- Metric collection
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metric_type VARCHAR(100) NOT NULL,
    
    -- Database health
    database_connections_active INTEGER,
    database_connections_idle INTEGER,
    database_query_avg_duration_ms NUMERIC,
    database_size_bytes BIGINT,
    
    -- API health  
    api_requests_last_hour INTEGER,
    api_errors_last_hour INTEGER,
    api_avg_response_time_ms NUMERIC,
    
    -- Turnkey health
    turnkey_api_calls_last_hour INTEGER,
    turnkey_api_errors_last_hour INTEGER,
    turnkey_last_successful_call TIMESTAMP WITH TIME ZONE,
    
    -- Business metrics
    disbursements_last_24h INTEGER,
    total_disbursement_volume_last_24h NUMERIC,
    active_users_last_24h INTEGER,
    
    -- Raw metrics JSON for flexibility
    raw_metrics JSONB DEFAULT '{}',
    
    CONSTRAINT valid_metric_type CHECK (
        metric_type IN ('health_check', 'performance', 'usage', 'security', 'custom')
    )
);

-- =============================================
-- TENANT CONFIGURATION OVERRIDES
-- =============================================

-- Allow per-tenant configuration overrides
CREATE TABLE tenant_config_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    
    -- Configuration details
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL DEFAULT 'custom',
    
    -- Metadata
    description TEXT,
    created_by VARCHAR(255),
    approved_by VARCHAR(255),
    
    -- Lifecycle
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one active config per key per tenant
    UNIQUE(originator_id, config_key, effective_from),
    
    CONSTRAINT valid_config_type CHECK (
        config_type IN ('security', 'feature_flag', 'rate_limit', 'branding', 'compliance', 'custom')
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Tenant registry indexes
CREATE INDEX idx_tenant_registry_status ON tenant_registry(status);
CREATE INDEX idx_tenant_registry_environment ON tenant_registry(environment);
CREATE INDEX idx_tenant_registry_last_accessed ON tenant_registry(last_accessed_at);
CREATE INDEX idx_tenant_registry_turnkey_suborg ON tenant_registry(turnkey_suborg_id);

-- API key indexes
CREATE INDEX idx_api_keys_originator ON control_plane_api_keys(originator_id);
CREATE INDEX idx_api_keys_api_key_hash ON control_plane_api_keys(api_key_hash);
CREATE INDEX idx_api_keys_last_used ON control_plane_api_keys(last_used_at);
CREATE INDEX idx_api_keys_expires ON control_plane_api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Provisioning log indexes
CREATE INDEX idx_provisioning_log_originator ON tenant_provisioning_log(originator_id);
CREATE INDEX idx_provisioning_log_correlation ON tenant_provisioning_log(correlation_id);
CREATE INDEX idx_provisioning_log_step_status ON tenant_provisioning_log(step_status);

-- Health metrics indexes
CREATE INDEX idx_health_metrics_originator_time ON tenant_health_metrics(originator_id, collected_at);
CREATE INDEX idx_health_metrics_type_time ON tenant_health_metrics(metric_type, collected_at);

-- Config overrides indexes
CREATE INDEX idx_config_overrides_originator ON tenant_config_overrides(originator_id);
CREATE INDEX idx_config_overrides_key_active ON tenant_config_overrides(config_key, is_active);
CREATE INDEX idx_config_overrides_effective ON tenant_config_overrides(effective_from, effective_until);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update last_accessed_at when API keys are used
CREATE OR REPLACE FUNCTION update_tenant_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tenant_registry 
    SET last_accessed_at = CURRENT_TIMESTAMP 
    WHERE originator_id = NEW.originator_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tenant last access when API key is used
CREATE TRIGGER trigger_update_tenant_last_accessed
    AFTER UPDATE OF last_used_at ON control_plane_api_keys
    FOR EACH ROW
    WHEN (NEW.last_used_at IS DISTINCT FROM OLD.last_used_at)
    EXECUTE FUNCTION update_tenant_last_accessed();

-- Function to automatically set updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to config overrides
CREATE TRIGGER trigger_config_overrides_updated_at
    BEFORE UPDATE ON tenant_config_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Create a default control plane admin entry (for bootstrapping)
INSERT INTO tenant_registry (
    originator_id,
    display_name,
    legal_entity_name,
    environment,
    status,
    isolation_type,
    database_name
) VALUES (
    'control_plane_admin',
    'Control Plane Administrator',
    'Custody Platform Control Plane',
    'production',
    'active',
    'dedicated_database',
    'custody_control_plane'
) ON CONFLICT (originator_id) DO NOTHING;
