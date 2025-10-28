import crypto from 'node:crypto';

/*
 * NOTE: This file contains multiple ESLint security warnings for "Generic Object Injection Sink"
 * These are flagged at lines: 252, 255, 304, 331, 346, 347, 380, 402
 * 
 * These are likely false positives because:
 * - flowId, index, and alias values come from trusted configuration objects, not user input
 * - TypeScript types constrain property access
 * - These are internal operations on well-defined data structures
 * 
 * TODO: Review and either suppress with eslint-disable comments or refactor to use
 * Object.prototype.hasOwnProperty.call() and Object.defineProperty() for safer access
 */

import type {
  AutomationUserTemplate,
  OriginatorConfiguration,
  PartnerConfiguration,
  ProvisioningConfig,
  TemplateString,
  WalletArchitecture,
  WalletFlowId,
  WalletTemplate,
} from '../config/types';
import { TurnkeyClientManager, type TemplateContext, type AutomationProvisionResult } from '../core/turnkey-client';
import type { AutomationKeyCredentials } from '../core/secrets-manager';
import type {
  ProvisionedAutomationUser,
  ProvisionedRootUser,
  ProvisionedWalletFlow,
  PartnerRuntimeConfig,
  ProvisioningArtifacts,
  ProvisioningRuntimeSnapshot,
} from './runtime-snapshots';
import { PolicyProvisioner } from './policy-provisioner';

interface WalletTemplateSelection {
  template: WalletTemplate;
  source: 'default' | 'override';
}

interface PartnerProvisioningPlan {
  partner: PartnerConfiguration;
  flowSelections: Record<WalletFlowId, WalletTemplateSelection>;
  automationUserTemplate?: AutomationUserTemplate;
}

export class ProvisioningConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProvisioningConfigurationError';
  }
}

export class TurnkeySuborgProvisioner {
  constructor(
    private readonly client: TurnkeyClientManager = TurnkeyClientManager.getInstance(),
    private readonly policyProvisioner: PolicyProvisioner = new PolicyProvisioner()
  ) {}

  async provision(config: OriginatorConfiguration): Promise<ProvisioningArtifacts> {
    this.assertWalletArchitecture(config.businessModel.wallets);

    const templateContext = this.buildTemplateContext(config);
    const partnerPlans = this.buildPartnerPlans(config);

    const provisionResult = await this.client.provisionSubOrganization(
      config.provisioning,
      config.businessModel.wallets,
      templateContext
    );

    const runtimeContext: TemplateContext = {
      ...templateContext,
      subOrganizationId: provisionResult.subOrgId,
      subOrganizationName: provisionResult.subOrgName,
    };

    const automationResult = await this.client.bootstrapAutomation(
      config.accessControl.automation,
      runtimeContext,
      provisionResult.subOrgId
    );
    const automationCredentialMap: Record<string, AutomationKeyCredentials> = {};
    const automationUsers = automationResult.automationUsers.map((user) => {
      const credentialKey = this.buildCredentialKey(user.templateId);
      if (user.credentials) {
        automationCredentialMap[credentialKey] = user.credentials;
      }
      return this.mapAutomationUser(user, { credentialKey });
    });
    const automationUserIdMap = automationUsers.reduce<Record<string, string>>((acc, user) => {
      if (user.userId && user.userId !== 'pending') {
        acc[user.templateId] = user.userId;
      }
      return acc;
    }, {});
    const partnerAutomationUserIds = new Map<string, string[]>();

    const defaultWalletFlows = this.buildWalletFlowSnapshots(
      config.businessModel.wallets,
      provisionResult.wallets
    );

    const defaultWalletMap = new Map<WalletFlowId, ProvisionedWalletFlow>();
    defaultWalletFlows.forEach((flow) => defaultWalletMap.set(flow.flowId, flow));

    const overrideWalletMap = new Map<string, ProvisionedWalletFlow>();
    const overrideWalletFlows: ProvisionedWalletFlow[] = [];

    for (const plan of partnerPlans) {
      for (const [flowId, selection] of Object.entries(plan.flowSelections)) {
        if (selection.source !== 'override') {
          continue;
        }

        const overrideKey = `${plan.partner.partnerId}:${flowId}`;
        if (overrideWalletMap.has(overrideKey)) {
          continue;
        }

        const overrideContext: TemplateContext = {
          ...runtimeContext,
          partnerId: plan.partner.partnerId,
          walletFlowId: flowId,
          walletTemplateId: selection.template.templateId,
          walletUsage: selection.template.usage,
        };

        const walletRecord = await this.client.provisionWalletForTemplate(
          provisionResult.subOrgId,
          selection.template,
          overrideContext
        );

        const overrideSnapshot = this.createProvisionedWalletFlow(
          flowId,
          selection.template,
          walletRecord,
          {
            partnerId: plan.partner.partnerId,
            flowSource: 'override',
          }
        );

        overrideWalletMap.set(overrideKey, overrideSnapshot);
        overrideWalletFlows.push(overrideSnapshot);
      }

      if (plan.automationUserTemplate) {
        const partnerContext: TemplateContext = {
          ...runtimeContext,
          partnerId: plan.partner.partnerId,
          partnerDisplayName: plan.partner.displayName,
        };

        const partnerAutomation = await this.client.provisionAutomationUser(
          plan.automationUserTemplate,
          partnerContext,
          provisionResult.subOrgId
        );

        const credentialKey = this.buildCredentialKey(plan.automationUserTemplate.templateId, plan.partner.partnerId);
        if (partnerAutomation.credentials) {
          automationCredentialMap[credentialKey] = partnerAutomation.credentials;
        }

        const mappedAutomationUser = this.mapAutomationUser(partnerAutomation, {
          partnerId: plan.partner.partnerId,
          credentialKey,
        });
        automationUsers.push(mappedAutomationUser);

        if (!partnerAutomationUserIds.has(plan.partner.partnerId)) {
          partnerAutomationUserIds.set(plan.partner.partnerId, []);
        }
        partnerAutomationUserIds.get(plan.partner.partnerId)?.push(mappedAutomationUser.userId);
      }
    }

    const walletFlows = [...defaultWalletFlows, ...overrideWalletFlows];

    const walletFlowMap = defaultWalletFlows.reduce<Record<WalletFlowId, string>>((acc, flow) => {
      acc[flow.flowId] = flow.walletId;
      return acc;
    }, {} as Record<WalletFlowId, string>);

    const walletTemplateMap = defaultWalletFlows.reduce<Record<string, string>>((acc, flow) => {
      if (!acc[flow.walletTemplateId]) {
        acc[flow.walletTemplateId] = flow.walletId;
      }
      return acc;
    }, {});

    overrideWalletFlows.forEach((flow) => {
      if (!walletTemplateMap[flow.walletTemplateId]) {
        walletTemplateMap[flow.walletTemplateId] = flow.walletId;
      }
    });

    const walletAliasMap = this.buildWalletAliasMap(walletFlows);

    const policyOutput = await this.policyProvisioner.deploy({
      accessControl: config.accessControl,
      businessModel: config.businessModel,
      bindingContext: {
        walletTemplateMap,
        walletAliasMap,
        walletFlowMap,
        partnerIds: config.businessModel.partners.catalog
          .filter((partner) => partner.enabled)
          .map((partner) => partner.partnerId),
        userTagTemplates: this.collectUserTagTemplates(config),
        automationTemplateIds: (config.accessControl.automation?.templates ?? []).map(
          (template) => template.templateId
        ),
        automationUserIds: automationUserIdMap,
      },
      subOrganizationId: provisionResult.subOrgId,
      templateContext: runtimeContext,
    });

    const partnerSnapshots = this.buildPartnerSnapshots(
      partnerPlans,
      policyOutput.partnerPolicies,
      defaultWalletMap,
      overrideWalletMap,
      partnerAutomationUserIds
    );

    const provisioningSnapshot: ProvisioningRuntimeSnapshot = {
      subOrganizationId: provisionResult.subOrgId,
      name: provisionResult.subOrgName,
      rootQuorumThreshold: config.provisioning.rootQuorumThreshold,
      rootUsers: this.mapRootUsers(config.provisioning, provisionResult.rootUserIds),
      featureToggles: config.provisioning.featureToggles,
      automationUsers,
      walletFlows,
      policies: policyOutput.policies,
      partners: partnerSnapshots,
      metadata: {
        originatorId: config.platform.originator.originatorId,
        subOrganizationName: provisionResult.subOrgName,
        ...(config.platform.originator.metadata
          ? { originatorMetadata: JSON.stringify(config.platform.originator.metadata) }
          : {}),
      },
    };

    return {
      platformConfigHash: this.computePlatformHash(config),
      provisioningSnapshot,
      resolvedTemplates: {
        [config.provisioning.nameTemplate]: provisioningSnapshot.name,
      },
      automationCredentials: Object.keys(automationCredentialMap).length ? automationCredentialMap : undefined,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private buildTemplateContext(config: OriginatorConfiguration): TemplateContext {
    const { platform } = config;
    const { originator } = platform;

    return {
      originatorId: originator.originatorId,
      originatorDisplayName: originator.displayName,
      originatorLegalEntityName: originator.legalEntityName,
      platformEnvironment: platform.environment,
      platformOrganizationId: platform.organizationId,
      originatorMetadata: originator.metadata,
    };
  }

  private buildPartnerPlans(config: OriginatorConfiguration): PartnerProvisioningPlan[] {
    return config.businessModel.partners.catalog
      .filter((partner) => partner.enabled)
      .map((partner) => ({
        partner,
        flowSelections: this.resolveFlowSelections(config.businessModel.wallets, partner),
        automationUserTemplate: this.resolveAutomationTemplate(config, partner),
      }));
  }

  private resolveFlowSelections(
    wallets: WalletArchitecture,
    partner: PartnerConfiguration
  ): Record<WalletFlowId, WalletTemplateSelection> {
    const selections: Record<WalletFlowId, WalletTemplateSelection> = {};
    Object.entries(wallets.flows).forEach(([flowId, flowConfig]) => {
      const overrideId = partner.flowOverrides?.[flowId];
      const templateId = overrideId ?? flowConfig.templateId;
      const template = this.findWalletTemplate(wallets, templateId);
      selections[flowId] = {
        template,
        source: overrideId != null ? 'override' : 'default',
      };
    });
    return selections;
  }

  private findWalletTemplate(wallets: WalletArchitecture, templateId: string): WalletTemplate {
    const template = wallets.templates.find((candidate) => candidate.templateId === templateId);
    if (!template) {
      throw new ProvisioningConfigurationError(
        `Wallet template "${templateId}" referenced in businessModel.wallets is not defined`
      );
    }
    return template;
  }

  private resolveAutomationTemplate(
    config: OriginatorConfiguration,
    partner: PartnerConfiguration
  ): AutomationUserTemplate | undefined {
    const automationTemplates = config.accessControl.automation?.templates ?? [];
    if (!automationTemplates.length) {
      return undefined;
    }

    const candidateTemplateId = partner.automationUserTemplateId;

    if (candidateTemplateId == null) {
      return undefined;
    }

    const template = automationTemplates.find((item) => item.templateId === candidateTemplateId);
    if (!template) {
      throw new ProvisioningConfigurationError(
        `Automation user template "${candidateTemplateId}" referenced by partner "${partner.partnerId}" is not defined`
      );
    }

    return template;
  }

  private mapRootUsers(provisioning: ProvisioningConfig, rootUserIds: string[]): ProvisionedRootUser[] {
    return provisioning.rootUsers.map((template, index) => ({
      templateId: template.templateId,
      userId: (Array.isArray(rootUserIds) && index < rootUserIds.length) ? rootUserIds[index] : 'pending',
      apiKeyIds: [],
      authenticatorIds: [],
    }));
  }

  private mapAutomationUser(
    user: AutomationProvisionResult['automationUsers'][number],
    overrides?: { partnerId?: string; credentialKey?: string }
  ): ProvisionedAutomationUser {
    const apiKeyIds = user.apiKeyIds ?? (user.apiKeyId != null ? [user.apiKeyId] : undefined);
    const primaryApiKeyId = apiKeyIds?.[0];
    return {
      templateId: user.templateId,
      userId: user.userId,
      apiKeyId: primaryApiKeyId,
      apiKeyIds,
      apiKeyPublicKey: user.credentials?.apiPublicKey,
      sessionIds: user.sessionIds ?? [],
      partnerId: overrides?.partnerId,
      credentialKey: overrides?.credentialKey ?? this.buildCredentialKey(user.templateId, overrides?.partnerId),
    };
  }

  private buildWalletFlowSnapshots(
    wallets: WalletArchitecture,
    provisionedWallets: Record<
      WalletFlowId,
      { walletId: string; walletName: string; accountIds: string[]; accountAddresses: string[] }
    >
  ): ProvisionedWalletFlow[] {
    return Object.entries(wallets.flows).map(([flowId, flowConfig]) => {
      const template = this.findWalletTemplate(wallets, flowConfig.templateId);
      const record = provisionedWallets[flowId];
      return this.createProvisionedWalletFlow(flowId, template, record);
    });
  }

  private createProvisionedWalletFlow(
    flowId: WalletFlowId,
    template: WalletTemplate,
    record?: { walletId?: string; walletName?: string; accountIds?: string[]; accountAddresses?: string[] },
    metadata?: Record<string, string>
  ): ProvisionedWalletFlow {
    const accountIdByAlias: Record<string, string> = {};
    const accountAddressByAlias: Record<string, string> = {};

    template.accounts.forEach((account, index) => {
      const resolvedAccountId = record?.accountIds?.[index];
      const resolvedAddress = record?.accountAddresses?.[index];
      accountIdByAlias[account.alias] = resolvedAccountId ?? 'pending';
      if (resolvedAddress != null) {
        accountAddressByAlias[account.alias] = resolvedAddress;
      }
    });

    return {
      flowId,
      walletTemplateId: template.templateId,
      walletId: record?.walletId ?? 'pending',
      walletName: record?.walletName ?? template.walletNameTemplate,
      accountIdByAlias,
      accountAddressByAlias: Object.keys(accountAddressByAlias).length ? accountAddressByAlias : undefined,
      metadata,
    };
  }

  private buildPartnerSnapshots(
    plans: PartnerProvisioningPlan[],
    partnerPolicyMap: Record<string, string[]>,
    defaultWalletMap: Map<WalletFlowId, ProvisionedWalletFlow>,
    overrideWalletMap: Map<string, ProvisionedWalletFlow>,
    partnerAutomationUserIds: Map<string, string[]>
  ): PartnerRuntimeConfig[] {
    return plans.map((plan) => {
      const walletAssignments: Record<WalletFlowId, string> = {};
      Object.entries(plan.flowSelections).forEach(([flowId, selection]) => {
        let walletId = 'pending';
        if (selection.source === 'override') {
          const override = overrideWalletMap.get(`${plan.partner.partnerId}:${flowId}`);
          walletId = override?.walletId ?? walletId;
        } else {
          walletId = defaultWalletMap.get(flowId)?.walletId ?? walletId;
        }
        walletAssignments[flowId] = walletId;
      });

      return {
        partnerId: plan.partner.partnerId,
        walletFlows: walletAssignments,
        policyIds: partnerPolicyMap[plan.partner.partnerId] ?? [],
        automationUserTemplateId: plan.automationUserTemplate?.templateId,
        automationUserIds: partnerAutomationUserIds.get(plan.partner.partnerId) ?? [],
        webhookUrl: plan.partner.webhookOverride?.urlTemplate,
        metadata: plan.partner.metadata,
      };
    });
  }

  private buildCredentialKey(templateId: string, partnerId?: string): string {
    return partnerId != null && partnerId.length > 0 ? `${partnerId}::${templateId}` : templateId;
  }

  private buildWalletAliasMap(
    walletFlows: ProvisionedWalletFlow[]
  ): Record<string, { walletId: string; accountId: string; address?: string }> {
    const map: Record<string, { walletId: string; accountId: string; address?: string }> = {};

    const assignIfMissing = (key: string, entry: { walletId: string; accountId: string; address?: string }): void => {
      if (!key || key.trim().length === 0) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return;
      }
      Object.defineProperty(map, key, {
        value: entry,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    };

    walletFlows.forEach((flow) => {
      Object.entries(flow.accountIdByAlias).forEach(([alias, accountId]) => {
        if (!alias || accountId == null) {
          return;
        }

        const address = flow.accountAddressByAlias?.[alias];
        const entry = {
          walletId: flow.walletId,
          accountId,
          address,
        };

        // Plain alias respects first writer wins (defaults come first in walletFlows).
        assignIfMissing(alias, entry);

        // Allow targeting by flow identifier.
        assignIfMissing(`${flow.flowId}:${alias}`, entry);

        // Allow targeting by wallet template identifier.
        assignIfMissing(`${flow.walletTemplateId}:${alias}`, entry);

        const partnerId = flow.metadata?.partnerId;
        if (partnerId != null && partnerId !== '') {
          // Partner scoped aliases enable partner-specific bindings without clobbering defaults.
          assignIfMissing(`${partnerId}:${alias}`, entry);
          assignIfMissing(`${partnerId}:${flow.flowId}:${alias}`, entry);
          assignIfMissing(`${partnerId}:${flow.walletTemplateId}:${alias}`, entry);
        }
      });
    });

    return map;
  }

  private collectUserTagTemplates(config: OriginatorConfiguration): ReadonlyArray<TemplateString> | undefined {
    const tags = new Set<string>();

    config.provisioning.rootUsers.forEach((user) => {
      user.userTags?.forEach((tag) => tags.add(tag));
    });

    (config.accessControl.automation?.templates ?? []).forEach((template) => {
      template.userTags?.forEach((tag) => tags.add(tag));
    });

    (config.accessControl.roles ?? []).forEach((role) => {
      if (role.turnkeyUserTagTemplate) {
        tags.add(role.turnkeyUserTagTemplate);
      }
    });

    return tags.size ? Array.from(tags) : undefined;
  }

  private computePlatformHash(config: OriginatorConfiguration): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(config.platform));
    return hash.digest('hex');
  }

  private assertWalletArchitecture(wallets: WalletArchitecture | undefined): asserts wallets is WalletArchitecture {
    if (wallets == null || !Array.isArray(wallets.templates) || wallets.templates.length === 0) {
      throw new ProvisioningConfigurationError('businessModel.wallets.templates must contain at least one wallet template');
    }
    if (wallets.flows == null || typeof wallets.flows !== 'object') {
      throw new ProvisioningConfigurationError('businessModel.wallets.flows must be defined');
    }
  }
}
