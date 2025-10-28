import {
  ControlPlaneService,
  type OriginatorRegistrationData,
  type TenantInfo,
  type TenantProvisioningResult,
} from '../control-plane-service';
import { TenantDatabaseService, type OriginatorBootstrapData } from '../tenant-database-service';
import type {
  OnboardingPhase,
  OnboardingSessionRecord,
  OnboardingSessionStatus,
  OnboardingStepStatus,
} from './types';
import { TurnkeyServiceError, ErrorCodes } from '../../core/error-handler';
import { TurnkeySuborgProvisioner } from '../../provisioner/turnkey-suborg-provisioner';
import type { OriginatorConfiguration } from '../../config/types';
import type { ProvisioningArtifacts } from '../../provisioner/runtime-snapshots';
import { TenantEncryption } from '../../core/tenant-encryption';

export interface OriginatorOnboardingStatus {
  originatorId: string;
  tenant?: Awaited<ReturnType<ControlPlaneService['getTenantInfo']>>;
  session?: OnboardingSessionRecord | null;
}

const PHASES: Record<string, OnboardingPhase> = {
  CONTROL_PLANE: 'control_plane_provisioning',
  TURNKEY: 'turnkey_suborg',
  FINALIZATION: 'finalization',
};

interface ControlPlaneOnboardingClient {
  provisionTenant(registration: OriginatorRegistrationData): Promise<TenantProvisioningResult>;
  appendOnboardingStep(params: {
    originatorId: string;
    stepName: string;
    phase: OnboardingPhase;
    status: OnboardingStepStatus;
    message?: string;
    context?: Record<string, unknown>;
    error?: unknown;
    startedAt?: Date;
    completedAt?: Date;
  }): Promise<void>;
  upsertOnboardingSession(params: {
    originatorId: string;
    phase: OnboardingPhase;
    status: OnboardingSessionStatus;
    lastStep?: string;
    lastError?: unknown;
    completedAt?: Date;
  }): Promise<void>;
  getTenantInfo(originatorId: string): Promise<TenantInfo | null>;
  getOnboardingSession(originatorId: string): Promise<OnboardingSessionRecord | null>;
  storeTurnkeyProvisioningArtifacts(originatorId: string, artifact: ProvisioningArtifacts): Promise<void>;
  storeAutomationCredential(params: {
    originatorId: string;
    templateId: string;
    partnerId?: string | null;
    encryptedPayload: string;
    metadata?: Record<string, unknown>;
    rotatedAt?: Date;
  }): Promise<void>;
  updateTenantTurnkeyAssignment(params: {
    originatorId: string;
    subOrganizationId?: string | null;
    turnkeyOrganizationId?: string | null;
    encryptedCredentials?: string | null;
    status?: TenantInfo['status'];
  }): Promise<void>;
}

export class OriginatorOnboardingService {
  constructor(
    private readonly controlPlane: ControlPlaneOnboardingClient = ControlPlaneService.getInstance() as unknown as ControlPlaneOnboardingClient,
    private readonly provisioner: TurnkeySuborgProvisioner = new TurnkeySuborgProvisioner(),
    private readonly tenantEncryption: TenantEncryption = TenantEncryption.getInstance()
  ) {}

  async registerOriginator(registration: OriginatorRegistrationData): Promise<TenantProvisioningResult> {
    const { originatorId, displayName, legalName } = {
      originatorId: registration.company.originatorId,
      displayName: registration.company.displayName,
      legalName: registration.company.legalName,
    };

    await this.beginSession(originatorId, 'control_plane_provisioning', 'in_progress');

    try {
      await this.controlPlane.appendOnboardingStep({
        originatorId,
        stepName: 'register-originator',
        phase: PHASES.CONTROL_PLANE,
        status: 'started',
        context: {
          environment: registration.configuration.environment,
          isolationType: registration.configuration.isolationType ?? 'dedicated_database',
        },
      });

      const provisioningResult = await this.controlPlane.provisionTenant(registration);

      await this.controlPlane.appendOnboardingStep({
        originatorId,
        stepName: 'register-originator',
        phase: PHASES.CONTROL_PLANE,
        status: 'completed',
        context: {
          databaseName: provisioningResult.databaseConfig.databaseName,
        },
      });

      // Bootstrap tenant schema with metadata
      await this.bootstrapTenantDatabase({
        originatorId,
        displayName,
        legalEntityName: legalName,
        environment: registration.configuration.environment,
        metadata: {
          registrationTimestamp: new Date().toISOString(),
          businessInfo: registration.businessInfo ?? {},
        },
      });

      await this.controlPlane.appendOnboardingStep({
        originatorId,
        stepName: 'tenant-database-bootstrap',
        phase: PHASES.CONTROL_PLANE,
        status: 'completed',
      });

      await this.controlPlane.upsertOnboardingSession({
        originatorId,
        phase: PHASES.TURNKEY,
        status: 'pending',
        lastStep: 'tenant-database-bootstrap',
      });

      return provisioningResult;
    } catch (error) {
      await this.controlPlane.upsertOnboardingSession({
        originatorId,
        phase: PHASES.CONTROL_PLANE,
        status: 'failed',
        lastStep: 'register-originator',
        lastError: error instanceof Error ? { message: error.message } : error,
      });
      throw error;
    }
  }

  async getStatus(originatorId: string): Promise<OriginatorOnboardingStatus> {
    const [tenant, session] = await Promise.all([
      this.controlPlane.getTenantInfo(originatorId),
      this.controlPlane.getOnboardingSession(originatorId),
    ]);

    return {
      originatorId,
      tenant: tenant ?? undefined,
      session,
    };
  }

  async provisionTurnkey(originatorId: string, config: OriginatorConfiguration): Promise<ProvisioningArtifacts> {
    await this.controlPlane.upsertOnboardingSession({
      originatorId,
      phase: PHASES.TURNKEY,
      status: 'in_progress',
      lastStep: 'turnkey-provision:started',
    });

    await this.controlPlane.appendOnboardingStep({
      originatorId,
      stepName: 'turnkey-provision',
      phase: PHASES.TURNKEY,
      status: 'started',
      message: 'Creating Turnkey sub-organization, wallets, automation, and policies',
    });

    try {
      const artifacts = await this.provisioner.provision(config);

      await this.controlPlane.appendOnboardingStep({
        originatorId,
        stepName: 'turnkey-provision',
        phase: PHASES.TURNKEY,
        status: 'completed',
        context: {
          subOrganizationId: artifacts.provisioningSnapshot.subOrganizationId,
          walletCount: artifacts.provisioningSnapshot.walletFlows.length,
          automationUsers: artifacts.provisioningSnapshot.automationUsers.length,
        },
      });

      await this.persistTurnkeyArtifacts(originatorId, config, artifacts);

      await this.controlPlane.upsertOnboardingSession({
        originatorId,
        phase: PHASES.FINALIZATION,
        status: 'completed',
        lastStep: 'turnkey-artifacts:completed',
      });

      return artifacts;
    } catch (error) {
      await this.controlPlane.upsertOnboardingSession({
        originatorId,
        phase: PHASES.TURNKEY,
        status: 'failed',
        lastStep: 'turnkey-provision',
        lastError: error instanceof Error ? { message: error.message } : error,
      });
      throw error;
    }
  }

  private async beginSession(
    originatorId: string,
    phase: OnboardingPhase,
    status: OnboardingSessionStatus
  ): Promise<void> {
    await this.controlPlane.upsertOnboardingSession({
      originatorId,
      phase,
      status,
      lastStep: undefined,
      lastError: undefined,
    });
  }

  private async persistTurnkeyArtifacts(
    originatorId: string,
    config: OriginatorConfiguration,
    artifacts: ProvisioningArtifacts
  ): Promise<void> {
    await this.controlPlane.appendOnboardingStep({
      originatorId,
      stepName: 'turnkey-artifacts',
      phase: PHASES.TURNKEY,
      status: 'started',
      message: 'Persisting provisioning snapshot, automation credentials, and wallet metadata',
    });

    await this.controlPlane.storeTurnkeyProvisioningArtifacts(originatorId, artifacts);

    if (artifacts.automationCredentials) {
      for (const [key, credentials] of Object.entries(artifacts.automationCredentials)) {
        const { templateId, partnerId } = this.parseAutomationCredentialKey(key);
        const encryptedPayload = this.tenantEncryption.encryptPayload(JSON.stringify(credentials));
        const metadata: Record<string, unknown> = partnerId
          ? { scope: 'partner', partnerId }
          : { scope: 'global' };

        await this.controlPlane.storeAutomationCredential({
          originatorId,
          templateId,
          partnerId,
          encryptedPayload,
          metadata,
        });
      }
    }

    const walletTemplates = Object.fromEntries(
      config.businessModel.wallets.templates.map((template) => [template.templateId, template])
    );

    let tenantService: TenantDatabaseService | null = null;
    try {
      tenantService = await TenantDatabaseService.forOriginator(originatorId);
      await tenantService.saveProvisioningSnapshot(originatorId, artifacts);
      await tenantService.persistProvisionedWallets(artifacts.provisioningSnapshot, walletTemplates);
    } finally {
      if (tenantService && typeof tenantService.close === 'function') {
        await Promise.resolve(tenantService.close()).catch(() => undefined);
      }
    }

    await this.controlPlane.updateTenantTurnkeyAssignment({
      originatorId,
      subOrganizationId: artifacts.provisioningSnapshot.subOrganizationId,
    });

    await this.controlPlane.appendOnboardingStep({
      originatorId,
      stepName: 'turnkey-artifacts',
      phase: PHASES.TURNKEY,
      status: 'completed',
    });
  }

  private async bootstrapTenantDatabase(data: OriginatorBootstrapData): Promise<void> {
    let tenantService: TenantDatabaseService | null = null;
    try {
      tenantService = await TenantDatabaseService.forOriginator(data.originatorId);
      await tenantService.bootstrapOriginator(data);
    } catch (error) {
      throw new TurnkeyServiceError(
        `Failed to bootstrap tenant database for ${data.originatorId}`,
        ErrorCodes.API_ERROR,
        undefined,
        error
      );
    } finally {
      if (tenantService && typeof tenantService.close === 'function') {
        await Promise.resolve(tenantService.close()).catch(() => undefined);
      }
    }
  }

  private parseAutomationCredentialKey(key: string): { templateId: string; partnerId?: string } {
    if (key.includes('::')) {
      const [partnerId, templateId] = key.split('::');
      return { templateId, partnerId };
    }
    return { templateId: key };
  }
}
