import type { Pool } from 'pg';
import type {
  OnboardingPhase,
  OnboardingSessionRecord,
  OnboardingSessionStatus,
  OnboardingStepResult,
  OnboardingStepStatus,
  TurnkeyProvisioningArtifact,
} from '../onboarding/types';

interface SessionUpsertParams {
  originatorId: string;
  currentPhase: OnboardingPhase;
  status: OnboardingSessionStatus;
  lastStep?: string;
  lastError?: unknown;
  completedAt?: Date | null;
}

interface AppendStepParams {
  originatorId: string;
  stepName: string;
  phase: OnboardingPhase;
  status: OnboardingStepStatus;
  message?: string;
  context?: Record<string, unknown>;
  error?: unknown;
  startedAt?: Date;
  completedAt?: Date | null;
}

interface StoreAutomationCredentialsParams {
  originatorId: string;
  templateId: string;
  partnerId?: string | null;
  encryptedPayload: string;
  metadata?: Record<string, unknown>;
  rotatedAt?: Date | null;
}

export class ControlPlaneOnboardingRepository {
  constructor(private readonly pool: Pool) {}

  async upsertSession(params: SessionUpsertParams): Promise<void> {
    const { originatorId, currentPhase, status, lastStep, lastError, completedAt } = params;
    await this.pool.query(
      `
        INSERT INTO tenant_onboarding_sessions (
          originator_id,
          current_phase,
          status,
          last_step,
          last_error,
          completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (originator_id)
        DO UPDATE SET
          current_phase = EXCLUDED.current_phase,
          status = EXCLUDED.status,
          last_step = EXCLUDED.last_step,
          last_error = EXCLUDED.last_error,
          completed_at = EXCLUDED.completed_at,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        originatorId,
        currentPhase,
        status,
        lastStep ?? null,
        lastError != null ? JSON.stringify(lastError) : null,
        completedAt ?? null,
      ]
    );
  }

  async appendStep(params: AppendStepParams): Promise<void> {
    const { originatorId, stepName, phase, status, message, context, error, startedAt, completedAt } = params;
    await this.pool.query(
      `
        INSERT INTO tenant_onboarding_steps (
          originator_id,
          step_name,
          phase,
          status,
          message,
          context,
          error,
          started_at,
          completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP), $9)
      `,
      [
        originatorId,
        stepName,
        phase,
        status,
        message ?? null,
        context != null ? JSON.stringify(context) : null,
        error != null ? JSON.stringify(error) : null,
        startedAt ?? null,
        completedAt ?? null,
      ]
    );
  }

  async getSession(originatorId: string): Promise<OnboardingSessionRecord | null> {
    const sessionResult = await this.pool.query<{
      originator_id: string;
      current_phase: OnboardingPhase;
      status: OnboardingSessionStatus;
      last_step: string | null;
      last_error: unknown;
      started_at: Date;
      updated_at: Date;
      completed_at: Date | null;
    }>(
      `
        SELECT
          originator_id,
          current_phase,
          status,
          last_step,
          last_error,
          started_at,
          updated_at,
          completed_at
        FROM tenant_onboarding_sessions
        WHERE originator_id = $1
      `,
      [originatorId]
    );

    if (sessionResult.rows.length === 0) {
      return null;
    }

    const row = sessionResult.rows[0];
    const steps = await this.pool.query<{
      step_name: string;
      phase: OnboardingPhase;
      status: OnboardingStepStatus;
      message: string | null;
      context: unknown;
      error: unknown;
      started_at: Date;
      completed_at: Date | null;
    }>(
      `
        SELECT
          step_name,
          phase,
          status,
          message,
          context,
          error,
          started_at,
          completed_at
        FROM tenant_onboarding_steps
        WHERE originator_id = $1
        ORDER BY started_at ASC
      `,
      [originatorId]
    );

    const stepResults: OnboardingStepResult[] = steps.rows.map((step) => ({
      stepName: step.step_name,
      phase: step.phase,
      status: step.status,
      message: step.message ?? undefined,
      context: typeof step.context === 'string' ? JSON.parse(step.context) : (step.context as Record<string, unknown> | undefined),
      error: typeof step.error === 'string' ? JSON.parse(step.error) : step.error,
      startedAt: step.started_at,
      completedAt: step.completed_at ?? undefined,
    }));

    return {
      originatorId: row.originator_id,
      currentPhase: row.current_phase,
      status: row.status,
      lastStep: row.last_step ?? undefined,
      lastError: typeof row.last_error === 'string' ? JSON.parse(row.last_error) : row.last_error,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? undefined,
      steps: stepResults,
    };
  }

  async storeTurnkeyArtifacts(originatorId: string, artifacts: TurnkeyProvisioningArtifact): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO turnkey_provisioning_artifacts (
          originator_id,
          platform_config_hash,
          provisioning_snapshot,
          resolved_templates
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (originator_id)
        DO UPDATE SET
          platform_config_hash = EXCLUDED.platform_config_hash,
          provisioning_snapshot = EXCLUDED.provisioning_snapshot,
          resolved_templates = EXCLUDED.resolved_templates,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        originatorId,
        artifacts.platformConfigHash,
        JSON.stringify(artifacts.provisioningSnapshot),
        artifacts.resolvedTemplates ? JSON.stringify(artifacts.resolvedTemplates) : null,
      ]
    );
  }

  async storeAutomationCredentials(params: StoreAutomationCredentialsParams): Promise<void> {
    const { originatorId, templateId, encryptedPayload, metadata, rotatedAt } = params;
    await this.pool.query(
      `
        INSERT INTO turnkey_automation_credentials (
          originator_id,
          template_id,
          partner_id,
          encrypted_credentials,
          metadata,
          rotated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (originator_id, template_id, partner_id)
        DO UPDATE SET
          encrypted_credentials = EXCLUDED.encrypted_credentials,
          metadata = EXCLUDED.metadata,
          rotated_at = EXCLUDED.rotated_at,
          created_at = LEAST(turnkey_automation_credentials.created_at, CURRENT_TIMESTAMP)
      `,
      [
        originatorId,
        templateId,
        params.partnerId ?? null,
        encryptedPayload,
        metadata ? JSON.stringify(metadata) : JSON.stringify({}),
        rotatedAt ?? null,
      ]
    );
  }

  async listAutomationCredentials(originatorId: string): Promise<
    Array<{
      originatorId: string;
      templateId: string;
      partnerId?: string;
      encryptedCredentials: string;
      metadata: Record<string, unknown>;
      createdAt: Date;
      rotatedAt?: Date;
    }>
  > {
    const result = await this.pool.query<{
      originator_id: string;
      template_id: string;
      partner_id: string | null;
      encrypted_credentials: string;
      metadata: unknown;
      created_at: Date;
      rotated_at: Date | null;
    }>(
      `
        SELECT
          originator_id,
          template_id,
          partner_id,
          encrypted_credentials,
          metadata,
          created_at,
          rotated_at
        FROM turnkey_automation_credentials
        WHERE originator_id = $1
      `,
      [originatorId]
    );

    return result.rows.map((row) => ({
      originatorId: row.originator_id,
      templateId: row.template_id,
       partnerId: row.partner_id ?? undefined,
      encryptedCredentials: row.encrypted_credentials,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata as Record<string, unknown> | undefined) ?? {},
      createdAt: row.created_at,
      rotatedAt: row.rotated_at ?? undefined,
    }));
  }
}
