export type OnboardingPhase =
  | 'registration'
  | 'control_plane_provisioning'
  | 'turnkey_suborg'
  | 'wallet_sync'
  | 'finalization';

export type OnboardingSessionStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';

export type OnboardingStepStatus = 'started' | 'completed' | 'failed' | 'skipped';

export interface OnboardingStepResult {
  stepName: string;
  phase: OnboardingPhase;
  status: OnboardingStepStatus;
  message?: string;
  context?: Record<string, unknown>;
  error?: unknown;
  startedAt: Date;
  completedAt?: Date;
}

export interface OnboardingSessionRecord {
  originatorId: string;
  currentPhase: OnboardingPhase;
  status: OnboardingSessionStatus;
  lastStep?: string;
  lastError?: unknown;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  steps?: OnboardingStepResult[];
}

export interface TurnkeyProvisioningArtifact {
  platformConfigHash: string;
  provisioningSnapshot: Record<string, unknown>;
  resolvedTemplates?: Record<string, string>;
}
