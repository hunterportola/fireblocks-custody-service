import type { PartnerId, TemplateString, WalletFlowId } from '../config/types';
import type { PolicyBindingDefinition } from '../approvals/types';

export interface PolicyBindingContext {
  /**
   * Maps wallet template IDs to provisioned wallet IDs.
   */
  walletTemplateMap: Readonly<Record<string, string>>;
  /**
   * Maps wallet aliases (template alias) to Turnkey account identifiers.
   */
  walletAliasMap: Readonly<Record<string, { walletId: string; accountId: string; address?: string }>>;
  /**
   * Flow ID to wallet ID mapping for quick lookup when bindings reference flows.
   */
  walletFlowMap?: Readonly<Record<WalletFlowId, string>>;
  /**
   * Set of partner identifiers created for the sub-organization.
   */
  partnerIds: ReadonlyArray<PartnerId>;
  /**
   * Turnkey user tag templates that were materialised during provisioning (roles, root users, automation).
   */
  userTagTemplates?: ReadonlyArray<TemplateString>;
  /**
   * Automation user template IDs mapped to the actual Turnkey user IDs created in the sub-organization.
   */
  automationUserIds?: Readonly<Record<string, string>>;
  /**
   * Automation user template IDs that can be referenced prior to provisioning (validation phase).
   */
  automationTemplateIds?: ReadonlyArray<string>;
}

export interface PolicyBindingResolution {
  binding: PolicyBindingDefinition;
  /**
   * Resolved identifier that should be used in the final policy payload.
   */
  resolvedTarget: string;
}

export interface PolicyBindingResolver {
  resolve(binding: PolicyBindingDefinition): PolicyBindingResolution;
  /**
   * Validates all bindings and returns both resolutions and any non-fatal warnings.
   */
  resolveAll(bindings: ReadonlyArray<PolicyBindingDefinition>): {
    resolutions: PolicyBindingResolution[];
    warnings: string[];
  };
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function createPolicyBindingResolver(context: PolicyBindingContext): PolicyBindingResolver {
  const partnerSet = new Set(context.partnerIds);
  const userTagSet = new Set(context.userTagTemplates ?? []);
  const walletTemplateMap = new Map<string, string>(Object.entries(context.walletTemplateMap));
  const walletAliasMap = new Map<string, { walletId: string; accountId: string; address?: string }>(
    Object.entries(context.walletAliasMap)
  );
  const automationUserIdMap = new Map(Object.entries(context.automationUserIds ?? {}));
  const automationTemplateSet = new Set(context.automationTemplateIds ?? []);

  const resolve = (binding: PolicyBindingDefinition): PolicyBindingResolution => {
    if (binding === null || typeof binding !== 'object') {
      throw new Error('Policy binding must be an object');
    }

    const target = binding.target;
    if (!isNonEmptyString(target)) {
      throw new Error(`Policy binding target is required for type "${binding.type}"`);
    }

    const bindingType = binding.type;

    switch (bindingType) {
      case 'wallet_template': {
        const walletId = walletTemplateMap.get(target);
        if (typeof walletId !== 'string' || walletId.length === 0) {
          throw new Error(`Wallet template "${target}" has not been provisioned`);
        }
        return { binding, resolvedTarget: walletId };
      }
      case 'wallet_alias': {
        const aliasRecord = walletAliasMap.get(target);
        if (aliasRecord === undefined || aliasRecord === null) {
          throw new Error(`Wallet alias "${target}" was not materialised during provisioning`);
        }
        return { binding, resolvedTarget: aliasRecord.accountId };
      }
      case 'partner': {
        if (!partnerSet.has(target)) {
          throw new Error(`Partner "${target}" is not known to the current originator`);
        }
        return { binding, resolvedTarget: target };
      }
      case 'user_tag': {
        if (!userTagSet.has(target)) {
          throw new Error(`User tag template "${target}" was not generated during provisioning`);
        }
        return { binding, resolvedTarget: target };
      }
      case 'automation_user': {
        const automationUserId = automationUserIdMap.get(target);
        if (typeof automationUserId === 'string' && automationUserId.length > 0) {
          return { binding, resolvedTarget: automationUserId };
        }
        if (automationTemplateSet.has(target)) {
          return { binding, resolvedTarget: target };
        }
        throw new Error(`Automation user template "${target}" is not available in this sub-organization`);
      }
      case 'custom':
        return { binding, resolvedTarget: target };
      default:
        throw new Error(`Unsupported policy binding type "${String(bindingType)}"`);
    }
  };

  const resolveAll = (
    bindings: ReadonlyArray<PolicyBindingDefinition>
  ): { resolutions: PolicyBindingResolution[]; warnings: string[] } => {
    const resolutions = bindings.map((binding) => resolve(binding));
    return { resolutions, warnings: [] };
  };

  return { resolve, resolveAll };
}
