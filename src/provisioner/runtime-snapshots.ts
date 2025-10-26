import type { PartnerId, TemplateString, WalletFlowId } from '../config/types';
import type { AutomationKeyCredentials } from '../core/secrets-manager';

/**
 * Represents a single root user that was created as part of sub-organization provisioning.
 */
export interface ProvisionedRootUser {
  /**
   * Template identifier from the provisioning configuration.
   */
  templateId: string;
  /**
   * Turnkey user ID returned by createSubOrganization/createUsers.
   */
  userId: string;
  /**
   * API key identifiers issued for the root user.
   */
  apiKeyIds: ReadonlyArray<string>;
  /**
   * Authenticator identifiers (passkeys/OTP) registered for the root user.
   */
  authenticatorIds: ReadonlyArray<string>;
}

/**
 * Captures the wallet that was instantiated for a specific flow (distribution, collection, etc.).
 */
export interface ProvisionedWalletFlow {
  flowId: WalletFlowId;
  walletTemplateId: string;
  walletId: string;
  /**
   * Map of account alias -> Turnkey account ID.
   */
  accountIdByAlias: Readonly<Record<string, string>>;
  /**
   * Optional map of account alias -> on-chain address derived during provisioning.
   */
  accountAddressByAlias?: Readonly<Record<string, string>>;
  /**
   * Optional external metadata persisted alongside the wallet (tags, notes, etc.).
   */
  metadata?: Record<string, string>;
}

/**
 * Automation user instantiated inside the sub-organization for programmatic operations.
 */
export interface ProvisionedAutomationUser {
  templateId: string;
  userId: string;
  apiKeyId?: string;
  apiKeyIds?: ReadonlyArray<string>;
  apiKeyPublicKey?: string;
  /**
   * When the automation key was last rotated. Used to invalidate cached clients.
   */
  rotatedAt?: string;
  /**
   * Session identifiers issued for this automation user (read-only/read-write).
   */
  sessionIds?: ReadonlyArray<string>;
}

/**
 * Details of policies deployed for the sub-organization.
 */
export interface ProvisionedPolicyTemplate {
  templateId: string;
  policyId: string;
  /**
   * Optional collection of policy IDs applied to partners or override scenarios.
   */
  appliedTo?: ReadonlyArray<{
    type: string;
    target: string;
    policyId: string;
  }>;
}

/**
 * Runtime view of a partner after provisioning has assigned wallets, policies, and automation.
 */
export interface PartnerRuntimeConfig {
  partnerId: PartnerId;
  /**
   * Flow -> wallet mapping scoped to this partner (after considering overrides).
   */
  walletFlows: Readonly<Record<WalletFlowId, string>>;
  /**
   * Policies explicitly attached to this partner.
   */
  policyIds: ReadonlyArray<string>;
  /**
   * Automation user template applied to this partner, if any.
   */
  automationUserTemplateId?: string;
  /**
   * Partner specific webhook resolved during provisioning.
   */
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

/**
 * Snapshot of the sub-organization immediately after provisioning.
 * This object is persisted by callers so that subsequent operations (policy deployment,
 * wallet management, partner overrides) can reuse the resolved identifiers.
 */
export interface ProvisioningRuntimeSnapshot {
  subOrganizationId: string;
  name: string;
  rootQuorumThreshold: number;
  rootUsers: ReadonlyArray<ProvisionedRootUser>;
  featureToggles?: ReadonlyArray<{ name: string; enabled: boolean; value?: string }>;
  automationUsers: ReadonlyArray<ProvisionedAutomationUser>;
  walletFlows: ReadonlyArray<ProvisionedWalletFlow>;
  policies: ReadonlyArray<ProvisionedPolicyTemplate>;
  partners: ReadonlyArray<PartnerRuntimeConfig>;
  /**
   * Arbitrary metadata that may be required for downstream services (e.g., reporting IDs).
   */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Aggregated output structure that provisioning helpers should return so that callers can
 * persist the full runtime state in a single write.
 */
export interface ProvisioningArtifacts {
  platformConfigHash: string;
  provisioningSnapshot: ProvisioningRuntimeSnapshot;
  /**
   * Fully rendered template strings used during provisioning (useful for audit/debug).
   */
  resolvedTemplates?: Record<TemplateString, string>;
  /**
   * Automation credentials persisted post-provisioning (private/public/API key ID).
   */
  automationCredentials?: Record<string, AutomationKeyCredentials>;
}
