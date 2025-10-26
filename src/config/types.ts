import type { definitions as TurnkeyDefinitions } from '@turnkey/http/dist/__generated__/services/coordinator/public/v1/public_api.types';
import type { SessionType } from '@turnkey/sdk-types';

import type { PolicyTemplate } from '../approvals/types';

type TurnkeyDefs = TurnkeyDefinitions;

export const TURNKEY_ENVIRONMENTS = ['sandbox', 'staging', 'production'] as const;
export type TurnkeyEnvironment = (typeof TURNKEY_ENVIRONMENTS)[number];

// Shared primitives used across the configuration model
export type DecimalString = string;
export type IsoDateString = string;
export type PartnerId = string;
export type UserId = string;
export type TemplateString = string;

// Turnkey enums surfaced in the config surface
export type TurnkeyCurve = TurnkeyDefs['v1Curve'];
export type TurnkeyPathFormat = TurnkeyDefs['v1PathFormat'];
export type TurnkeyAddressFormat = TurnkeyDefs['v1AddressFormat'];
export type TurnkeyFeatureName = TurnkeyDefs['v1FeatureName'];
export type TurnkeyEffect = TurnkeyDefs['v1Effect'];
export type TurnkeyApiKeyCurve = TurnkeyDefs['v1ApiKeyCurve'];

// -----------------------------------------------------------------------------
// Activity polling
// -----------------------------------------------------------------------------
export interface ActivityPollerConfig {
  intervalMs: number;
  numRetries: number;
}

// -----------------------------------------------------------------------------
// Platform & originator identity (Step 1 - "Who am I and where do I operate?")
// -----------------------------------------------------------------------------
export interface OriginatorProfile {
  originatorId: string;
  displayName: string;
  legalEntityName?: string;
  metadata?: Record<string, string>;
}

export interface PlatformConfig {
  environment: TurnkeyEnvironment;
  organizationId: string;
  apiBaseUrl?: string;
  activityPoller?: ActivityPollerConfig;
  originator: OriginatorProfile;
}

// -----------------------------------------------------------------------------
// Shared configuration blocks
// -----------------------------------------------------------------------------
export interface OrganizationFeatureConfig {
  name: TurnkeyFeatureName;
  enabled: boolean;
  value?: string;
  description?: string;
}

export interface WebhookConfig {
  urlTemplate: TemplateString;
  description?: string;
  authHeaderName?: string;
  authSecretRef?: string;
}

export interface RootUserApiKeySeed {
  apiKeyNameTemplate: TemplateString;
  curveType: TurnkeyApiKeyCurve;
  publicKeyRef?: string;
  expirationSeconds?: number;
  metadata?: Record<string, string>;
}

export interface RootUserAuthenticatorSeed {
  authenticatorNameTemplate: TemplateString;
  attestationRef?: string;
  enrollmentStrategy?: 'webauthn_passkey' | 'otp_email' | 'otp_sms' | 'manual';
  metadata?: Record<string, string>;
}

export interface RootUserOauthProviderSeed {
  providerName: string;
  oidcTokenRef: string;
}

export interface RootUserTemplate {
  templateId: string;
  userNameTemplate: TemplateString;
  userEmailTemplate?: TemplateString;
  userPhoneNumberTemplate?: TemplateString;
  apiKeys?: ReadonlyArray<RootUserApiKeySeed>;
  authenticators?: ReadonlyArray<RootUserAuthenticatorSeed>;
  oauthProviders?: ReadonlyArray<RootUserOauthProviderSeed>;
  userTags?: ReadonlyArray<TemplateString>;
}

export interface AutomationApiKeySeed extends RootUserApiKeySeed {
  rotateOnCreate?: boolean;
}

export interface AutomationAuthenticatorSeed extends RootUserAuthenticatorSeed {
  attestationStrategy?: 'generated_at_runtime' | 'provided_via_config';
}

export interface AutomationUserTemplate {
  templateId: string;
  userNameTemplate: TemplateString;
  userEmailTemplate?: TemplateString;
  userPhoneNumberTemplate?: TemplateString;
  apiKeys?: ReadonlyArray<AutomationApiKeySeed>;
  authenticators?: ReadonlyArray<AutomationAuthenticatorSeed>;
  oauthProviders?: ReadonlyArray<RootUserOauthProviderSeed>;
  userTags?: ReadonlyArray<TemplateString>;
  sessionTypes?: ReadonlyArray<SessionType>;
  description?: string;
}

export const WELL_KNOWN_WALLET_USAGES = ['distribution', 'collection', 'escrow', 'operational', 'reserve'] as const;

export type WalletUsage = string;

export interface WalletAccountTemplate
  extends Pick<TurnkeyDefs['v1WalletAccountParams'], 'curve' | 'pathFormat' | 'path' | 'addressFormat'> {
  alias: string;
  chainId?: string;
  assetSymbol?: string;
  notes?: string;
}

export interface WalletTemplate extends Pick<TurnkeyDefs['v1WalletParams'], 'mnemonicLength'> {
  templateId: string;
  usage: WalletUsage;
  walletNameTemplate: TemplateString;
  accounts: ReadonlyArray<WalletAccountTemplate>;
  description?: string;
  tags?: ReadonlyArray<string>;
}

export const WELL_KNOWN_WALLET_FLOW_IDS = ['distribution', 'collection', 'reserve', 'operational'] as const;

export type WalletFlowId = string;

export interface WalletFlowConfig {
  templateId: string;
  description?: string;
}

export interface RolePermissions {
  viewDistributions: boolean;
  viewCollections: boolean;
  initiateDisbursements: boolean;
  approveDisbursements: boolean;
  viewReports?: boolean;
  manageRoles?: boolean;
  configureSettings?: boolean;
}

export interface UserRoleDefinition {
  roleId: string;
  roleName: string;
  description: string;
  permissions: RolePermissions;
  turnkeyUserTagTemplate: TemplateString;
  requiresPolicyApproval: boolean;
  maxUsers?: number;
}

export interface SessionTemplate {
  type: SessionType;
  defaultExpirationSeconds: number;
  notes?: string;
}

export interface SessionConfiguration {
  readOnly?: SessionTemplate;
  readWrite?: SessionTemplate;
  automationOverrides?: Record<string, SessionTemplate>;
}

export interface ReportingConfig {
  enableLedgerExport: boolean;
  ledgerExportFrequency?: 'daily' | 'weekly' | 'monthly';
  storageBucketRef?: string;
  additionalReports?: ReadonlyArray<string>;
}

export interface ComplianceConfig {
  amlProvider?: string;
  travelRuleRequired?: boolean;
  sanctionListRefs?: ReadonlyArray<string>;
  auditRequirements?: {
    retentionYears: number;
    encryptionRequired: boolean;
  };
}

export interface MonitoringConfig {
  webhooks?: {
    activity?: WebhookConfig;
    policy?: WebhookConfig;
    alerts?: WebhookConfig;
  };
  activityPolling?: ActivityPollerConfig;
  logRetentionDays?: number;
}

// -----------------------------------------------------------------------------
// Step 2 - Provisioning inputs (createSubOrganization payload)
// -----------------------------------------------------------------------------
export interface ProvisioningConfig {
  nameTemplate: TemplateString;
  rootQuorumThreshold: number;
  rootUsers: ReadonlyArray<RootUserTemplate>;
  featureToggles?: ReadonlyArray<OrganizationFeatureConfig>;
  provisioningWebhook?: WebhookConfig;
  defaultAutomationTemplateId?: string;
}

// -----------------------------------------------------------------------------
// Step 3 - Business model: partners + wallet architecture
// -----------------------------------------------------------------------------
export interface WalletArchitecture {
  templates: ReadonlyArray<WalletTemplate>;
  flows: Record<WalletFlowId, WalletFlowConfig>;
}

export interface PartnerConfiguration {
  partnerId: PartnerId;
  displayName: string;
  enabled: boolean;
  flowOverrides?: Partial<Record<WalletFlowId, string>>;
  automationUserTemplateId?: string;
  policyIds?: ReadonlyArray<string>;
  webhookOverride?: WebhookConfig;
  metadata?: Record<string, string>;
}

export interface BusinessModelConfig {
  partners: {
    catalog: ReadonlyArray<PartnerConfiguration>;
    defaultPolicyIds?: ReadonlyArray<string>;
    defaultWebhookTemplate?: WebhookConfig;
  };
  wallets: WalletArchitecture;
}

// -----------------------------------------------------------------------------
// Step 4 - Access control: roles, automation, policies
// -----------------------------------------------------------------------------
export interface AccessControlConfig {
  roles: ReadonlyArray<UserRoleDefinition>;
  automation: {
    templates: ReadonlyArray<AutomationUserTemplate>;
    defaultTemplateId?: string;
    sessionConfig?: SessionConfiguration;
  };
  policies: {
    templates: ReadonlyArray<PolicyTemplate>;
    defaultPolicyIds: ReadonlyArray<string>;
    overridePolicyIds?: ReadonlyArray<string>;
  };
}

// -----------------------------------------------------------------------------
// Step 5 - Operations overlays
// -----------------------------------------------------------------------------
export interface OperationsConfig {
  monitoring?: MonitoringConfig;
  reporting?: ReportingConfig;
}

// -----------------------------------------------------------------------------
// Final configuration surface exposed to originators
// -----------------------------------------------------------------------------
export interface OriginatorConfiguration {
  platform: PlatformConfig;
  provisioning: ProvisioningConfig;
  businessModel: BusinessModelConfig;
  accessControl: AccessControlConfig;
  operations?: OperationsConfig;
  compliance?: ComplianceConfig;
}
