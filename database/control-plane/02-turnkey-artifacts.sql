-- =============================================
-- CONTROL PLANE ONBOARDING ARTIFACTS
-- Supplemental schema for tracking originator onboarding
-- =============================================

-- Tenant onboarding session metadata (one row per originator)
CREATE TABLE IF NOT EXISTS tenant_onboarding_sessions (
    originator_id VARCHAR(255) PRIMARY KEY REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    current_phase VARCHAR(100) NOT NULL DEFAULT 'registration',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, paused
    last_step VARCHAR(255),
    last_error JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TRIGGER trigger_onboarding_sessions_updated_at
    BEFORE UPDATE ON tenant_onboarding_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Detailed audit trail for each onboarding step
CREATE TABLE IF NOT EXISTS tenant_onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    phase VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- started, completed, failed, skipped
    message TEXT,
    context JSONB,
    error JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_originator
    ON tenant_onboarding_steps(originator_id, started_at DESC);

-- Persisted Turnkey provisioning artifacts (sub-org + wallets + policies)
CREATE TABLE IF NOT EXISTS turnkey_provisioning_artifacts (
    originator_id VARCHAR(255) PRIMARY KEY REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    platform_config_hash VARCHAR(64) NOT NULL,
    provisioning_snapshot JSONB NOT NULL,
    resolved_templates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_turnkey_artifacts_updated_at
    BEFORE UPDATE ON turnkey_provisioning_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Encrypted automation credentials returned during provisioning
CREATE TABLE IF NOT EXISTS turnkey_automation_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    originator_id VARCHAR(255) NOT NULL REFERENCES tenant_registry(originator_id) ON DELETE CASCADE,
    template_id VARCHAR(255) NOT NULL,
    partner_id VARCHAR(255),
    encrypted_credentials TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(originator_id, template_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_turnkey_automation_credentials_originator
    ON turnkey_automation_credentials(originator_id);
