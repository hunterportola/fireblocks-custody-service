import type { AccessControlConfig, BusinessModelConfig } from '../config/types';
import type { ProvisionedPolicyTemplate } from './runtime-snapshots';
import type { PolicyBindingContext } from './policy-binding-resolver';
import { createPolicyBindingResolver } from './policy-binding-resolver';
import { TurnkeyClientManager, type TemplateContext } from '../core/turnkey-client';

export interface PolicyProvisionRequest {
  accessControl: AccessControlConfig;
  businessModel: BusinessModelConfig;
  bindingContext: PolicyBindingContext;
  subOrganizationId: string;
  templateContext: TemplateContext;
}

export interface PolicyProvisionOutput {
  policies: ReadonlyArray<ProvisionedPolicyTemplate>;
  partnerPolicies: Record<string, string[]>;
  warnings: ReadonlyArray<string>;
}

export class PolicyProvisioner {
  constructor(private readonly client: TurnkeyClientManager = TurnkeyClientManager.getInstance()) {}

  async deploy(request: PolicyProvisionRequest): Promise<PolicyProvisionOutput> {
    const { accessControl, businessModel, bindingContext, subOrganizationId, templateContext } = request;
    const resolver = createPolicyBindingResolver(bindingContext);

    const bindingWarnings: string[] = [];
    const bindingAssignmentsByTemplate: Record<string, Array<{ type: string; target: string }>> = {};
    const bindingContextByTemplate: Record<string, Record<string, string>> = {};

    accessControl.policies.templates.forEach((template) => {
      if (template.appliesTo && template.appliesTo.length > 0) {
        const { resolutions, warnings } = resolver.resolveAll(template.appliesTo);
        bindingAssignmentsByTemplate[template.templateId] = resolutions.map((resolution) => ({
          type: resolution.binding.type,
          target: resolution.resolvedTarget,
        }));
        bindingWarnings.push(...warnings);
        const contextEntries = resolutions.map((resolution) => {
          const targetKey = String(resolution.binding.target);
          return [targetKey, resolution.resolvedTarget] as const;
        });
        bindingContextByTemplate[template.templateId] = Object.fromEntries(contextEntries);
      } else {
        bindingAssignmentsByTemplate[template.templateId] = [];
        bindingContextByTemplate[template.templateId] = {};
      }
    });

    const provisionResult = await this.client.configurePolicies(accessControl, businessModel, {
      subOrganizationId,
      bindingContexts: bindingContextByTemplate,
      templateContext,
      resolvedBindings: bindingAssignmentsByTemplate,
    });

    const policies: ProvisionedPolicyTemplate[] = accessControl.policies.templates.map((template) => {
      const policyId = provisionResult.policyIds[template.templateId];
      const assignments = bindingAssignmentsByTemplate[template.templateId] ?? [];

      return {
        templateId: template.templateId,
        policyId,
        appliedTo: assignments.map((assignment) => ({
          type: assignment.type,
          target: assignment.target,
          policyId,
        })),
      };
    });

    return {
      policies,
      partnerPolicies: provisionResult.partnerPolicies,
      warnings: bindingWarnings,
    };
  }
}
