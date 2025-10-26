import type {
  ActivityPollerConfig,
  AutomationApiKeySeed,
  AutomationAuthenticatorSeed,
  AutomationUserTemplate,
  BusinessModelConfig,
  ComplianceConfig,
  OriginatorConfiguration,
  OrganizationFeatureConfig,
  PartnerConfiguration,
  PlatformConfig,
  ProvisioningConfig,
  OperationsConfig,
  RootUserApiKeySeed,
  RootUserAuthenticatorSeed,
  RootUserOauthProviderSeed,
  RootUserTemplate,
  SessionConfiguration,
  SessionTemplate,
  TemplateString,
  UserRoleDefinition,
  WalletAccountTemplate,
  WalletArchitecture,
  WalletFlowId,
  WalletTemplate,
} from './types';
import { SessionType } from '@turnkey/sdk-types';
import { validatePolicyTemplates } from '../approvals/validator';
import { isNonEmptyString, isNonNegativeInteger, isTurnkeyEnvironment } from '../utils/type-guards';

const ALLOWED_MNEMONIC_LENGTHS = new Set([12, 15, 18, 21, 24]);

const URL_FEATURES = new Set(['FEATURE_NAME_WEBHOOK', 'FEATURE_NAME_AUTH_PROXY']);

export interface ValidationResult {
  isValid: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface RootUserValidationResult {
  userTagTemplates: string[];
}

interface WalletValidationResult {
  walletTemplateIds: string[];
  walletAliases: string[];
}

interface BusinessModelValidationResult extends WalletValidationResult {
  partnerIds: string[];
  flows: Record<WalletFlowId, string>;
  defaultPartnerPolicyIds: ReadonlyArray<string>;
}

interface AutomationValidationResult {
  templateIds: string[];
  userTagTemplates: string[];
}

function isValidUrl(url: string | null | undefined): boolean {
  if (url == null || url === '') {
    return false;
  }

  if (url.length === 0) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function ensureUnique(values: Iterable<string>, path: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${path}: duplicate identifier "${value}"`);
    } else {
      seen.add(value);
    }
  }
}

function validateActivityPoller(
  poller: ActivityPollerConfig | undefined,
  path: string,
  errors: string[]
): void {
  if (poller === undefined) {
    return;
  }

  if (!isNonNegativeInteger(poller.intervalMs) || poller.intervalMs <= 0) {
    errors.push(`${path}: intervalMs must be a positive integer`);
  }

  if (!isNonNegativeInteger(poller.numRetries) || poller.numRetries < 0) {
    errors.push(`${path}: numRetries must be zero or a positive integer`);
  }
}

function validateFeatureToggles(
  features: ReadonlyArray<OrganizationFeatureConfig> | undefined,
  path: string,
  errors: string[]
): void {
  if (features === undefined) {
    return;
  }

  if (!Array.isArray(features)) {
    errors.push(`${path}: feature toggles must be an array`);
    return;
  }

  const seen = new Set<string>();

  features.forEach((feature: OrganizationFeatureConfig, index: number) => {
    const featurePath = `${path}[${index}]`;

    if (feature === null || typeof feature !== 'object') {
      errors.push(`${featurePath}: feature toggle must be an object`);
      return;
    }

    if (!isNonEmptyString(feature.name)) {
      errors.push(`${featurePath}: name is required`);
    } else if (seen.has(feature.name)) {
      errors.push(`${featurePath}: duplicate feature "${feature.name}"`);
    } else {
      seen.add(feature.name);
    }

    if (feature.value !== undefined && !isNonEmptyString(feature.value)) {
      errors.push(`${featurePath}: value must be a non-empty string when provided`);
    }

    if (feature.enabled && URL_FEATURES.has(feature.name) && !isValidUrl(feature.value)) {
      errors.push(`${featurePath}: feature "${feature.name}" requires a valid URL value when enabled`);
    }
  });
}

function validateApiKeySeed(seed: RootUserApiKeySeed, path: string, errors: string[]): void {
  if (!isNonEmptyString(seed.apiKeyNameTemplate)) {
    errors.push(`${path}: apiKeyNameTemplate is required`);
  }

  if (!isNonEmptyString(seed.curveType)) {
    errors.push(`${path}: curveType is required`);
  }

  if (seed.publicKeyRef !== undefined && !isNonEmptyString(seed.publicKeyRef)) {
    errors.push(`${path}: publicKeyRef must be a non-empty string when provided`);
  }

  if (seed.expirationSeconds !== undefined) {
    if (!isNonNegativeInteger(seed.expirationSeconds) || seed.expirationSeconds <= 0) {
      errors.push(`${path}: expirationSeconds must be a positive integer when provided`);
    }
  }
}

function validateAuthenticatorSeed(
  seed: RootUserAuthenticatorSeed,
  path: string,
  errors: string[]
): void {
  if (!isNonEmptyString(seed.authenticatorNameTemplate)) {
    errors.push(`${path}: authenticatorNameTemplate is required`);
  }

  if (seed.attestationRef !== undefined && !isNonEmptyString(seed.attestationRef)) {
    errors.push(`${path}: attestationRef must be a non-empty string when provided`);
  }

  if (
    seed.enrollmentStrategy &&
    !['webauthn_passkey', 'otp_email', 'otp_sms', 'manual'].includes(seed.enrollmentStrategy)
  ) {
    errors.push(`${path}: enrollmentStrategy "${seed.enrollmentStrategy}" is not supported`);
  }
}

function validateRootUsers(
  rootUsers: ReadonlyArray<RootUserTemplate>,
  quorumThreshold: number,
  path: string,
  errors: string[],
  warnings: string[]
): RootUserValidationResult {
  if (!Array.isArray(rootUsers) || rootUsers.length === 0) {
    errors.push(`${path}: at least one root user template is required`);
    return { userTagTemplates: [] };
  }

  const templateIds = new Set<string>();
  const userTagTemplates = new Set<string>();

  rootUsers.forEach((rootUser: RootUserTemplate, index: number) => {
    const rootPath = `${path}[${index}]`;

    if (rootUser === null || typeof rootUser !== 'object') {
      errors.push(`${rootPath}: root user template must be an object`);
      return;
    }

    if (!isNonEmptyString(rootUser.templateId)) {
      errors.push(`${rootPath}: templateId is required`);
    } else if (templateIds.has(rootUser.templateId)) {
      errors.push(`${rootPath}: templateId "${rootUser.templateId}" must be unique`);
    } else {
      templateIds.add(rootUser.templateId);
    }

    if (!isNonEmptyString(rootUser.userNameTemplate)) {
      errors.push(`${rootPath}: userNameTemplate is required`);
    }

    if (rootUser.userEmailTemplate !== undefined && !isNonEmptyString(rootUser.userEmailTemplate)) {
      errors.push(`${rootPath}: userEmailTemplate must be a non-empty string when provided`);
    }

    if (
      rootUser.userPhoneNumberTemplate !== undefined &&
      !isNonEmptyString(rootUser.userPhoneNumberTemplate)
    ) {
      errors.push(`${rootPath}: userPhoneNumberTemplate must be a non-empty string when provided`);
    }

    if (rootUser.apiKeys !== undefined) {
      rootUser.apiKeys.forEach((seed: RootUserApiKeySeed, seedIndex: number) =>
        validateApiKeySeed(seed, `${rootPath}.apiKeys[${seedIndex}]`, errors)
      );
    }

    if (rootUser.authenticators !== undefined) {
      rootUser.authenticators.forEach((seed: RootUserAuthenticatorSeed, seedIndex: number) =>
        validateAuthenticatorSeed(seed, `${rootPath}.authenticators[${seedIndex}]`, errors)
      );
    }

    if (rootUser.oauthProviders !== undefined) {
      rootUser.oauthProviders.forEach((provider: RootUserOauthProviderSeed, providerIndex: number) => {
        const providerPath = `${rootPath}.oauthProviders[${providerIndex}]`;
        if (!isNonEmptyString(provider.providerName)) {
          errors.push(`${providerPath}: providerName is required`);
        }
        if (!isNonEmptyString(provider.oidcTokenRef)) {
          errors.push(`${providerPath}: oidcTokenRef is required`);
        }
      });
    }

    if (rootUser.userTags !== undefined) {
      rootUser.userTags.forEach((tag: TemplateString, tagIndex: number) => {
        if (!isNonEmptyString(tag)) {
          errors.push(`${rootPath}.userTags[${tagIndex}]: tag must be a non-empty string`);
        } else {
          userTagTemplates.add(tag);
        }
      });
    }
  });

  if (!isNonNegativeInteger(quorumThreshold) || quorumThreshold <= 0) {
    errors.push('provisioning: rootQuorumThreshold must be a positive integer');
  } else if (quorumThreshold > rootUsers.length) {
    errors.push('provisioning: rootQuorumThreshold cannot exceed the number of root users');
  } else if (quorumThreshold < Math.ceil(rootUsers.length / 2)) {
    warnings.push(
      `provisioning: rootQuorumThreshold is below simple majority (${Math.ceil(rootUsers.length / 2)})`
    );
  }

  return { userTagTemplates: Array.from(userTagTemplates) };
}

function validateWalletTemplates(
  templates: ReadonlyArray<WalletTemplate>,
  path: string,
  errors: string[]
): WalletValidationResult {
  if (!Array.isArray(templates) || templates.length === 0) {
    errors.push(`${path}: at least one wallet template must be defined`);
    return { walletTemplateIds: [], walletAliases: [] };
  }

  const templateIds: string[] = [];
  const aliases: string[] = [];
  const globalAliasSet = new Set<string>();

  templates.forEach((template: WalletTemplate, index: number) => {
    const templatePath = `${path}[${index}]`;

    if (template === null || typeof template !== 'object') {
      errors.push(`${templatePath}: wallet template must be an object`);
      return;
    }

    if (!isNonEmptyString(template.templateId)) {
      errors.push(`${templatePath}: templateId is required`);
    } else {
      templateIds.push(template.templateId);
    }

    if (!isNonEmptyString(template.walletNameTemplate)) {
      errors.push(`${templatePath}: walletNameTemplate is required`);
    }

    if (!isNonEmptyString(template.usage)) {
      errors.push(`${templatePath}: usage is required`);
    }

    if (
      template.mnemonicLength !== undefined &&
      !ALLOWED_MNEMONIC_LENGTHS.has(template.mnemonicLength)
    ) {
      errors.push(
        `${templatePath}: mnemonicLength must be one of ${Array.from(ALLOWED_MNEMONIC_LENGTHS).join(', ')}`
      );
    }

    if (!Array.isArray(template.accounts) || template.accounts.length === 0) {
      errors.push(`${templatePath}: at least one wallet account template is required`);
    } else {
      const localAliases = new Set<string>();

      template.accounts.forEach((account: WalletAccountTemplate, accountIndex: number) => {
        const accountPath = `${templatePath}.accounts[${accountIndex}]`;

        if (!isNonEmptyString(account.alias)) {
          errors.push(`${accountPath}: alias is required`);
        } else {
          if (localAliases.has(account.alias)) {
            errors.push(`${accountPath}: duplicate alias "${account.alias}" within wallet template`);
          } else {
            localAliases.add(account.alias);
          }

          if (globalAliasSet.has(account.alias)) {
            errors.push(`${templatePath}: alias "${account.alias}" is already used by another wallet template`);
          } else {
            globalAliasSet.add(account.alias);
            aliases.push(account.alias);
          }
        }

        if (!isNonEmptyString(account.path)) {
          errors.push(`${accountPath}: path is required`);
        }

        if (!isNonEmptyString(account.curve)) {
          errors.push(`${accountPath}: curve is required`);
        }

        if (!isNonEmptyString(account.pathFormat)) {
          errors.push(`${accountPath}: pathFormat is required`);
        }

        if (!isNonEmptyString(account.addressFormat)) {
          errors.push(`${accountPath}: addressFormat is required`);
        }

        if (account.chainId !== undefined && !isNonEmptyString(account.chainId)) {
          errors.push(`${accountPath}: chainId must be a non-empty string when provided`);
        }

        if (account.assetSymbol !== undefined && !isNonEmptyString(account.assetSymbol)) {
          errors.push(`${accountPath}: assetSymbol must be a non-empty string when provided`);
        }
      });
    }
  });

  ensureUnique(templateIds, `${path}`, errors);

  return { walletTemplateIds: templateIds, walletAliases: aliases };
}

function validateWalletArchitecture(
  architecture: WalletArchitecture | undefined,
  path: string,
  errors: string[]
): BusinessModelValidationResult {
  if (architecture === undefined || architecture === null || typeof architecture !== 'object') {
    errors.push(`${path}: wallet architecture is required`);
    return { walletTemplateIds: [], walletAliases: [], partnerIds: [], flows: {}, defaultPartnerPolicyIds: [] };
  }

  const { walletTemplateIds, walletAliases } = validateWalletTemplates(architecture.templates, `${path}.templates`, errors);

  const flows: Record<WalletFlowId, string> = {};

  if (architecture.flows === undefined || architecture.flows === null || typeof architecture.flows !== 'object') {
    errors.push(`${path}: flows map is required`);
  } else {
    Object.entries(architecture.flows).forEach(([flowId, config]) => {
      const flowPath = `${path}.flows["${flowId}"]`;
      if (config === null || typeof config !== 'object') {
        errors.push(`${flowPath}: flow configuration must be an object`);
        return;
      }

      if (!isNonEmptyString(config.templateId)) {
        errors.push(`${flowPath}: templateId is required`);
      } else if (!walletTemplateIds.includes(config.templateId)) {
        errors.push(`${flowPath}: templateId "${config.templateId}" is not defined in templates`);
      } else {
        Object.defineProperty(flows, flowId, {
          value: config.templateId,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    });

    if (flows['distribution'] === undefined) {
      errors.push(`${path}.flows: distribution flow must be defined`);
    }

    if (flows['collection'] === undefined) {
      errors.push(`${path}.flows: collection flow must be defined`);
    }
  }

  return {
    walletTemplateIds,
    walletAliases,
    partnerIds: [],
    flows,
    defaultPartnerPolicyIds: [],
  };
}

function validatePartners(
  partners: ReadonlyArray<PartnerConfiguration>,
  flows: Record<WalletFlowId, string>,
  walletTemplateIds: ReadonlyArray<string>,
  path: string,
  errors: string[]
): string[] {
  if (!Array.isArray(partners) || partners.length === 0) {
    errors.push(`${path}: at least one partner configuration is required`);
    return [];
  }

  const partnerIds: string[] = [];

  partners.forEach((partner: PartnerConfiguration, index: number) => {
    const partnerPath = `${path}[${index}]`;

    if (partner === null || typeof partner !== 'object') {
      errors.push(`${partnerPath}: partner configuration must be an object`);
      return;
    }

    if (!isNonEmptyString(partner.partnerId)) {
      errors.push(`${partnerPath}: partnerId is required`);
    } else if (partnerIds.includes(partner.partnerId)) {
      errors.push(`${partnerPath}: partnerId "${partner.partnerId}" must be unique`);
    } else {
      partnerIds.push(partner.partnerId);
    }

    if (!isNonEmptyString(partner.displayName)) {
      errors.push(`${partnerPath}: displayName is required`);
    }

    if (typeof partner.enabled !== 'boolean') {
      errors.push(`${partnerPath}: enabled must be a boolean`);
    }

    if (partner.flowOverrides !== undefined) {
      Object.entries(partner.flowOverrides).forEach(([flowId, templateId]) => {
        const overridePath = `${partnerPath}.flowOverrides["${flowId}"]`;
        if (!Object.prototype.hasOwnProperty.call(flows, flowId)) {
          errors.push(`${overridePath}: flow "${flowId}" is not defined in wallet architecture`);
        } else if (!walletTemplateIds.includes(templateId!)) {
          errors.push(`${overridePath}: templateId "${templateId}" is not defined in wallet templates`);
        }
      });
    }

    if (
      partner.policyIds !== undefined &&
      (!Array.isArray(partner.policyIds) || partner.policyIds.some((id) => !isNonEmptyString(id)))
    ) {
      errors.push(`${partnerPath}: policyIds must be an array of non-empty strings when provided`);
    }

    if (partner.webhookOverride !== undefined && !isValidUrl(partner.webhookOverride.urlTemplate)) {
      errors.push(`${partnerPath}: webhookOverride.urlTemplate must be a valid URL`);
    }
  });

  return partnerIds;
}

function validateRoles(
  roles: ReadonlyArray<UserRoleDefinition> | undefined,
  path: string,
  errors: string[],
  warnings: string[]
): string[] {
  if (roles === undefined) {
    return [];
  }

  const roleIds = new Set<string>();
  const userTagTemplates: string[] = [];

  roles.forEach((role: UserRoleDefinition, index: number) => {
    const rolePath = `${path}[${index}]`;

    if (role === null || typeof role !== 'object') {
      errors.push(`${rolePath}: role definition must be an object`);
      return;
    }

    if (!isNonEmptyString(role.roleId)) {
      errors.push(`${rolePath}: roleId is required`);
    } else if (roleIds.has(role.roleId)) {
      errors.push(`${rolePath}: roleId "${role.roleId}" must be unique`);
    } else {
      roleIds.add(role.roleId);
    }

    if (!isNonEmptyString(role.roleName)) {
      errors.push(`${rolePath}: roleName is required`);
    }

    if (!isNonEmptyString(role.description)) {
      warnings.push(`${rolePath}: description is empty; consider documenting the role`);
    }

    if (role.permissions === undefined || role.permissions === null || typeof role.permissions !== 'object') {
      errors.push(`${rolePath}: permissions are required`);
    } else {
      const permissions = role.permissions;
      const mandatoryPermissions: Array<keyof UserRoleDefinition['permissions']> = [
        'viewDistributions',
        'viewCollections',
        'initiateDisbursements',
        'approveDisbursements',
      ];
      const optionalPermissions: Array<keyof UserRoleDefinition['permissions']> = [
        'viewReports',
        'manageRoles',
        'configureSettings',
      ];

      mandatoryPermissions.forEach((perm) => {
        if (typeof (Object.prototype.hasOwnProperty.call(permissions, perm) ? permissions[perm] : undefined) !== 'boolean') {
          errors.push(`${rolePath}: permissions.${perm} must be a boolean`);
        }
      });

      optionalPermissions.forEach((perm) => {
        const value = permissions[perm];
        if (value !== undefined && typeof value !== 'boolean') {
          errors.push(`${rolePath}: permissions.${perm} must be a boolean when provided`);
        }
      });
    }

    if (!isNonEmptyString(role.turnkeyUserTagTemplate)) {
      errors.push(`${rolePath}: turnkeyUserTagTemplate is required`);
    } else {
      userTagTemplates.push(role.turnkeyUserTagTemplate);
    }

    const requiresPolicyApproval = role.requiresPolicyApproval === true;
    const approvesDisbursements = role.permissions?.approveDisbursements === true;
    if (!requiresPolicyApproval && approvesDisbursements) {
      warnings.push(
        `${rolePath}: role can approve disbursements without requiresPolicyApproval flag; verify intent`
      );
    }

    if (role.maxUsers !== undefined) {
      if (!isNonNegativeInteger(role.maxUsers) || role.maxUsers <= 0) {
        errors.push(`${rolePath}: maxUsers must be a positive integer when provided`);
      }
    }
  });

  return userTagTemplates;
}

function validateAutomationUsers(
  automationUsers: ReadonlyArray<AutomationUserTemplate> | undefined,
  path: string,
  errors: string[],
  warnings: string[]
): AutomationValidationResult {
  if (!Array.isArray(automationUsers) || automationUsers.length === 0) {
    errors.push(`${path}: at least one automation user template is required`);
    return { templateIds: [], userTagTemplates: [] };
  }

  const templateIds: string[] = [];
  const userTagTemplates: string[] = [];

  automationUsers.forEach((user: AutomationUserTemplate, index: number) => {
    const userPath = `${path}[${index}]`;

    if (user === null || typeof user !== 'object') {
      errors.push(`${userPath}: automation user template must be an object`);
      return;
    }

    if (!isNonEmptyString(user.templateId)) {
      errors.push(`${userPath}: templateId is required`);
    } else if (templateIds.includes(user.templateId)) {
      errors.push(`${userPath}: templateId "${user.templateId}" must be unique`);
    } else {
      templateIds.push(user.templateId);
    }

    if (!isNonEmptyString(user.userNameTemplate)) {
      errors.push(`${userPath}: userNameTemplate is required`);
    }

    if (user.userEmailTemplate !== undefined && !isNonEmptyString(user.userEmailTemplate)) {
      errors.push(`${userPath}: userEmailTemplate must be a non-empty string when provided`);
    }

    if (
      user.userPhoneNumberTemplate !== undefined &&
      !isNonEmptyString(user.userPhoneNumberTemplate)
    ) {
      errors.push(`${userPath}: userPhoneNumberTemplate must be a non-empty string when provided`);
    }

    if (user.apiKeys !== undefined) {
      user.apiKeys.forEach((seed: AutomationApiKeySeed, seedIndex: number) =>
        validateApiKeySeed(seed, `${userPath}.apiKeys[${seedIndex}]`, errors)
      );
    }

    if (user.authenticators !== undefined) {
      user.authenticators.forEach((seed: AutomationAuthenticatorSeed, seedIndex: number) =>
        validateAuthenticatorSeed(seed, `${userPath}.authenticators[${seedIndex}]`, errors)
      );
    }

    if (user.oauthProviders !== undefined) {
      user.oauthProviders.forEach((provider: RootUserOauthProviderSeed, providerIndex: number) => {
        const providerPath = `${userPath}.oauthProviders[${providerIndex}]`;
        if (!isNonEmptyString(provider.providerName)) {
          errors.push(`${providerPath}: providerName is required`);
        }
        if (!isNonEmptyString(provider.oidcTokenRef)) {
          errors.push(`${providerPath}: oidcTokenRef is required`);
        }
      });
    }

    if (user.userTags !== undefined) {
      user.userTags.forEach((tag: TemplateString, tagIndex: number) => {
        if (!isNonEmptyString(tag)) {
          errors.push(`${userPath}.userTags[${tagIndex}]: tag must be a non-empty string`);
        } else {
          userTagTemplates.push(tag);
        }
      });
    }

    if (user.sessionTypes !== undefined && user.sessionTypes.length === 0) {
      warnings.push(`${userPath}: sessionTypes is empty; consider removing the property`);
    }
  });

  ensureUnique(templateIds, path, errors);

  return { templateIds, userTagTemplates };
}

function validateSessionConfiguration(
  sessions: SessionConfiguration | undefined,
  path: string,
  errors: string[],
  automationTemplateIds: ReadonlyArray<string>
): void {
  if (sessions === undefined) {
    return;
  }

  const validateTemplate = (template: SessionTemplate, templatePath: string): void => {
    if (template === null || typeof template !== 'object') {
      errors.push(`${templatePath}: session template must be an object`);
      return;
    }

    if (template.type === undefined || template.type === null) {
      errors.push(`${templatePath}: type is required`);
    } else if (!Object.values(SessionType).includes(template.type)) {
      errors.push(
        `${templatePath}: type must be one of ${Object.values(SessionType)
          .map((value) => value.toString())
          .join(', ')}`
      );
    }

    if (!isNonNegativeInteger(template.defaultExpirationSeconds) || template.defaultExpirationSeconds <= 0) {
      errors.push(`${templatePath}: defaultExpirationSeconds must be a positive integer`);
    }

    if (template.notes !== undefined && !isNonEmptyString(template.notes)) {
      errors.push(`${templatePath}: notes must be a non-empty string when provided`);
    }
  };

  if (sessions.readOnly !== undefined) {
    validateTemplate(sessions.readOnly, `${path}.readOnly`);
  }

  if (sessions.readWrite !== undefined) {
    validateTemplate(sessions.readWrite, `${path}.readWrite`);
  }

  if (sessions.automationOverrides !== undefined) {
    Object.entries(sessions.automationOverrides).forEach(([templateId, template]) => {
      const overridePath = `${path}.automationOverrides["${templateId}"]`;
      if (!automationTemplateIds.includes(templateId)) {
        errors.push(`${overridePath}: unknown automation user template "${templateId}"`);
      }
      validateTemplate(template, overridePath);
    });
  }
}

function validatePlatform(
  platform: PlatformConfig | undefined,
  errors: string[],
  warnings: string[]
): void {
  if (platform === undefined || platform === null || typeof platform !== 'object') {
    errors.push('platform configuration is required');
    return;
  }

  if (!isTurnkeyEnvironment(platform.environment)) {
    errors.push('platform.environment must be a supported Turnkey environment');
  }

  if (!isNonEmptyString(platform.organizationId)) {
    errors.push('platform.organizationId is required');
  }

  if (platform.apiBaseUrl !== undefined && !isValidUrl(platform.apiBaseUrl)) {
    errors.push('platform.apiBaseUrl must be a valid URL when provided');
  }

  validateActivityPoller(platform.activityPoller, 'platform.activityPoller', errors);

  if (platform.originator === undefined || platform.originator === null || typeof platform.originator !== 'object') {
    errors.push('platform.originator is required');
  } else {
    if (!isNonEmptyString(platform.originator.originatorId)) {
      errors.push('platform.originator.originatorId is required');
    }

    if (!isNonEmptyString(platform.originator.displayName)) {
      errors.push('platform.originator.displayName is required');
    }

    if (
      platform.originator.legalEntityName !== undefined &&
      !isNonEmptyString(platform.originator.legalEntityName)
    ) {
      warnings.push('platform.originator.legalEntityName is empty; legal entity tracking may be impacted');
    }
  }
}

function validateProvisioning(
  provisioning: ProvisioningConfig | undefined,
  errors: string[],
  warnings: string[]
): { rootUserTags: string[]; defaultAutomationTemplateId?: string } {
  if (provisioning === undefined || provisioning === null || typeof provisioning !== 'object') {
    errors.push('provisioning configuration is required');
    return { rootUserTags: [] };
  }

  if (!isNonEmptyString(provisioning.nameTemplate)) {
    errors.push('provisioning.nameTemplate is required');
  }

  const { userTagTemplates } = validateRootUsers(
    provisioning.rootUsers,
    provisioning.rootQuorumThreshold,
    'provisioning.rootUsers',
    errors,
    warnings
  );

  validateFeatureToggles(provisioning.featureToggles, 'provisioning.featureToggles', errors);

  if (provisioning.provisioningWebhook !== undefined && !isValidUrl(provisioning.provisioningWebhook.urlTemplate)) {
    errors.push('provisioning.provisioningWebhook.urlTemplate must be a valid URL');
  }

  return { rootUserTags: userTagTemplates, defaultAutomationTemplateId: provisioning.defaultAutomationTemplateId };
}

function validateBusinessModel(
  businessModel: BusinessModelConfig | undefined,
  errors: string[]
): BusinessModelValidationResult {
  if (businessModel === undefined || businessModel === null || typeof businessModel !== 'object') {
    errors.push('businessModel configuration is required');
    return {
      walletTemplateIds: [],
      walletAliases: [],
      partnerIds: [],
      flows: {},
      defaultPartnerPolicyIds: [],
    };
  }

  const walletResult = validateWalletArchitecture(
    businessModel.wallets,
    'businessModel.wallets',
    errors
  );

  const partnerConfig = businessModel.partners;
  if (partnerConfig === undefined || partnerConfig === null || typeof partnerConfig !== 'object') {
    errors.push('businessModel.partners configuration is required');
  }

  const partnerIds = validatePartners(
    partnerConfig?.catalog ?? [],
    walletResult.flows,
    walletResult.walletTemplateIds,
    'businessModel.partners.catalog',
    errors
  );

  return {
    walletTemplateIds: walletResult.walletTemplateIds,
    walletAliases: walletResult.walletAliases,
    partnerIds,
    flows: walletResult.flows,
    defaultPartnerPolicyIds: partnerConfig?.defaultPolicyIds ?? [],
  };
}

function validateOperations(operations: OperationsConfig | undefined, errors: string[]): void {
  if (operations === undefined) {
    return;
  }

  const monitoring = operations.monitoring;
  if (monitoring !== undefined) {
    if (monitoring.webhooks !== undefined) {
      if (monitoring.webhooks.activity !== undefined && !isValidUrl(monitoring.webhooks.activity.urlTemplate)) {
        errors.push('operations.monitoring.webhooks.activity.urlTemplate must be a valid URL');
      }
      if (monitoring.webhooks.policy !== undefined && !isValidUrl(monitoring.webhooks.policy.urlTemplate)) {
        errors.push('operations.monitoring.webhooks.policy.urlTemplate must be a valid URL');
      }
      if (monitoring.webhooks.alerts !== undefined && !isValidUrl(monitoring.webhooks.alerts.urlTemplate)) {
        errors.push('operations.monitoring.webhooks.alerts.urlTemplate must be a valid URL');
      }
    }

    validateActivityPoller(monitoring.activityPolling, 'operations.monitoring.activityPolling', errors);

    if (
      monitoring.logRetentionDays !== undefined &&
      (!isNonNegativeInteger(monitoring.logRetentionDays) || monitoring.logRetentionDays <= 0)
    ) {
      errors.push('operations.monitoring.logRetentionDays must be a positive integer when provided');
    }
  }

  const reporting = operations.reporting;
  if (reporting !== undefined) {
    if (typeof reporting.enableLedgerExport !== 'boolean') {
      errors.push('operations.reporting.enableLedgerExport must be a boolean');
    }

    if (
      reporting.ledgerExportFrequency !== undefined &&
      !['daily', 'weekly', 'monthly'].includes(reporting.ledgerExportFrequency)
    ) {
      errors.push('operations.reporting.ledgerExportFrequency must be one of "daily", "weekly", or "monthly"');
    }

    if (reporting.storageBucketRef !== undefined && !isNonEmptyString(reporting.storageBucketRef)) {
      errors.push('operations.reporting.storageBucketRef must be a non-empty string when provided');
    }

    if (reporting.additionalReports !== undefined) {
      reporting.additionalReports.forEach((report: string, index: number) => {
        if (!isNonEmptyString(report)) {
          errors.push(`operations.reporting.additionalReports[${index}]: report must be a non-empty string`);
        }
      });
    }
  }
}

function validateCompliance(
  compliance: ComplianceConfig | undefined,
  errors: string[],
  warnings: string[]
): void {
  if (compliance === undefined) {
    return;
  }

  if (compliance.amlProvider !== undefined && !isNonEmptyString(compliance.amlProvider)) {
    warnings.push('compliance.amlProvider is empty; AML integration may be incomplete');
  }

  if (compliance.sanctionListRefs !== undefined) {
    compliance.sanctionListRefs.forEach((ref: string, index: number) => {
      if (!isNonEmptyString(ref)) {
        errors.push(`compliance.sanctionListRefs[${index}]: reference must be a non-empty string`);
      }
    });
  }

  if (compliance.auditRequirements !== undefined) {
    if (!isNonNegativeInteger(compliance.auditRequirements.retentionYears) || compliance.auditRequirements.retentionYears <= 0) {
      errors.push('compliance.auditRequirements.retentionYears must be a positive integer');
    }
    if (typeof compliance.auditRequirements.encryptionRequired !== 'boolean') {
      errors.push('compliance.auditRequirements.encryptionRequired must be a boolean');
    }
  }
}

export class ConfigurationValidator {
  validate(config: OriginatorConfiguration): Promise<ValidationResult> {
    return Promise.resolve(this.computeValidation(config));
  }

  validateConfiguration(config: OriginatorConfiguration): ValidationResult {
    return this.computeValidation(config);
  }

  private computeValidation(config: OriginatorConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config === null || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return this.buildResult(errors, warnings);
    }

    validatePlatform(config.platform, errors, warnings);

    const provisioningResult = validateProvisioning(config.provisioning, errors, warnings);

    const businessModelResult = validateBusinessModel(config.businessModel, errors);

    if (config.accessControl === undefined || config.accessControl === null || typeof config.accessControl !== 'object') {
      errors.push('accessControl configuration is required');
    } else {
      const roleTagTemplates = validateRoles(
        config.accessControl.roles,
        'accessControl.roles',
        errors,
        warnings
      );

      if (config.accessControl.automation === undefined || config.accessControl.automation === null || typeof config.accessControl.automation !== 'object') {
        errors.push('accessControl.automation configuration is required');
      }

      const automationResult = validateAutomationUsers(
        config.accessControl.automation?.templates,
        'accessControl.automation.templates',
        errors,
        warnings
      );

      const partnerCatalog = config.businessModel?.partners?.catalog ?? [];
      partnerCatalog.forEach((partner: PartnerConfiguration, index: number) => {
        if (
          partner.automationUserTemplateId !== undefined &&
          !automationResult.templateIds.includes(partner.automationUserTemplateId)
        ) {
          errors.push(
            `businessModel.partners.catalog[${index}]: automation user template "${partner.automationUserTemplateId}" is not defined`
          );
        }
      });

      validateSessionConfiguration(
        config.accessControl.automation?.sessionConfig,
        'accessControl.automation.sessionConfig',
        errors,
        automationResult.templateIds
      );

      if (
        config.provisioning?.defaultAutomationTemplateId !== undefined &&
        !automationResult.templateIds.includes(config.provisioning.defaultAutomationTemplateId)
      ) {
        errors.push(
          'provisioning.defaultAutomationTemplateId must reference a defined automation user template'
        );
      }

      if (config.accessControl.policies === undefined || config.accessControl.policies === null || typeof config.accessControl.policies !== 'object') {
        errors.push('accessControl.policies configuration is required');
      } else {
        const { templates, defaultPolicyIds, overridePolicyIds } = config.accessControl.policies;
        const policyContext = {
          walletTemplateIds: businessModelResult.walletTemplateIds,
          walletAliases: businessModelResult.walletAliases,
          partnerIds: businessModelResult.partnerIds,
          userTagTemplates: [
            ...provisioningResult.rootUserTags,
            ...automationResult.userTagTemplates,
            ...roleTagTemplates,
          ],
          automationUserTemplateIds: automationResult.templateIds,
        };

        const { errors: policyErrors, warnings: policyWarnings } = validatePolicyTemplates(
          templates ?? [],
          policyContext
        );

        errors.push(...policyErrors);
        warnings.push(...policyWarnings);

        const policyTemplateIds = templates?.map((template) => template.templateId) ?? [];
        if (!Array.isArray(defaultPolicyIds) || defaultPolicyIds.length === 0) {
          errors.push('accessControl.policies.defaultPolicyIds must contain at least one policy id');
        } else {
          defaultPolicyIds.forEach((policyId, index) => {
            if (!policyTemplateIds.includes(String(policyId))) {
              errors.push(
                `accessControl.policies.defaultPolicyIds[${index}]: policyId "${String(policyId)}" is not defined in policy templates`
              );
            }
          });
        }

        if (overridePolicyIds !== undefined) {
          overridePolicyIds.forEach((policyId, index) => {
            if (!policyTemplateIds.includes(policyId)) {
              errors.push(
                `accessControl.policies.overridePolicyIds[${index}]: policyId "${policyId}" is not defined in policy templates`
              );
            }
          });
        }

        if (businessModelResult.defaultPartnerPolicyIds.length > 0) {
          businessModelResult.defaultPartnerPolicyIds.forEach((policyId, index) => {
            if (!policyTemplateIds.includes(policyId)) {
              errors.push(
                `businessModel.partners.defaultPolicyIds[${index}]: policyId "${policyId}" is not defined in accessControl.policies`
              );
            }
          });
        }
      }
    }

    validateOperations(config.operations, errors);
    validateCompliance(config.compliance, errors, warnings);

    return this.buildResult(errors, warnings);
  }

  private buildResult(errors: string[], warnings: string[]): ValidationResult {
    const isValid = errors.length === 0;
    return {
      isValid,
      valid: isValid,
      errors,
      warnings,
    };
  }
}
