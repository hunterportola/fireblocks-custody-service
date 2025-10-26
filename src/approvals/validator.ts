import type { PartnerId, TemplateString } from '../config/types';
import { isNonEmptyString, isRecord } from '../utils/type-guards';
import type {
  PolicyBindingDefinition,
  PolicyConditionTemplate,
  PolicyConsensusTemplate,
  PolicyVariableDefinition,
} from './types';

export interface PolicyValidationContext {
  walletTemplateIds: ReadonlyArray<string>;
  walletAliases: ReadonlyArray<string>;
  partnerIds: ReadonlyArray<PartnerId>;
  userTagTemplates?: ReadonlyArray<TemplateString>;
  automationUserTemplateIds?: ReadonlyArray<string>;
}

export interface PolicyValidationResult {
  errors: string[];
  warnings: string[];
}

function validateVariables(
  variables: ReadonlyArray<PolicyVariableDefinition> | undefined,
  path: string,
  errors: string[]
): void {
  if (variables === undefined) {
    return;
  }

  const seenKeys = new Set<string>();

  variables.forEach((variable, index) => {
    const variablePath = `${path}.variables[${index}]`;
    if (variable === null || typeof variable !== 'object') {
      errors.push(`${variablePath}: variable must be an object`);
      return;
    }

    if (!isNonEmptyString(variable.key)) {
      errors.push(`${variablePath}: key is required`);
    } else if (seenKeys.has(variable.key)) {
      errors.push(`${variablePath}: duplicate variable key "${variable.key}"`);
    } else {
      seenKeys.add(variable.key);
    }

    if (variable.description !== undefined && !isNonEmptyString(variable.description)) {
      errors.push(`${variablePath}: description must be a non-empty string when provided`);
    }

    if (variable.exampleValue !== undefined && !isNonEmptyString(variable.exampleValue)) {
      errors.push(`${variablePath}: exampleValue must be a non-empty string when provided`);
    }

    if (
      variable.source !== undefined &&
      !['transaction', 'partner', 'wallet', 'session', 'custom'].includes(variable.source)
    ) {
      errors.push(`${variablePath}: unsupported source "${variable.source}"`);
    }
  });
}

function validateExpressionTemplate(
  template: PolicyConditionTemplate | PolicyConsensusTemplate | undefined,
  path: string,
  errors: string[]
): void {
  if (template === null || typeof template !== 'object') {
    errors.push(`${path}: template must be an object`);
    return;
  }

  if (!isNonEmptyString(template.expression)) {
    errors.push(`${path}: expression is required`);
  }

  if (template.description !== undefined && !isNonEmptyString(template.description)) {
    errors.push(`${path}: description must be a non-empty string when provided`);
  }

  validateVariables(template.variables, path, errors);
}

function validateBinding(
  binding: PolicyBindingDefinition,
  index: number,
  context: PolicyValidationContext,
  path: string,
  errors: string[]
): void {
  const bindingPath = `${path}[${index}]`;

  if (binding === null || typeof binding !== 'object') {
    errors.push(`${bindingPath}: binding must be an object`);
    return;
  }

  if (!isNonEmptyString(binding.type)) {
    errors.push(`${bindingPath}: type is required`);
    return;
  }

  const { target } = binding;
  if (!isNonEmptyString(target)) {
    errors.push(`${bindingPath}: target is required`);
    return;
  }

  if (binding.description !== undefined && !isNonEmptyString(binding.description)) {
    errors.push(`${bindingPath}: description must be a non-empty string when provided`);
  }

  switch (binding.type) {
    case 'wallet_template':
      if (!context.walletTemplateIds.includes(target)) {
        errors.push(`${bindingPath}: wallet template "${target}" is not defined`);
      }
      break;
    case 'wallet_alias':
      if (!context.walletAliases.includes(target)) {
        errors.push(`${bindingPath}: wallet alias "${target}" is not defined`);
      }
      break;
    case 'partner':
      if (!context.partnerIds.includes(target)) {
        errors.push(`${bindingPath}: partner "${target}" is not defined`);
      }
      break;
    case 'user_tag':
      if (context.userTagTemplates !== undefined && !context.userTagTemplates.includes(target)) {
        errors.push(`${bindingPath}: user tag template "${target}" is not defined`);
      }
      break;
    case 'automation_user':
      if (context.automationUserTemplateIds !== undefined && !context.automationUserTemplateIds.includes(target)) {
        errors.push(`${bindingPath}: automation user "${target}" is not defined`);
      }
      break;
    case 'custom':
      break;
    default:
      errors.push(`${bindingPath}: unsupported binding type "${String(binding.type)}"`);
  }
}

/**
 * Helper function to safely get a property from an unknown object
 */
function safeGetProperty(obj: unknown, key: string): unknown {
  if (!isRecord(obj)) {
    return undefined;
  }
  return Object.prototype.hasOwnProperty.call(obj, key) ? 
    Object.getOwnPropertyDescriptor(obj, key)?.value : undefined;
}

/**
 * Interface for validating potentially unsafe policy template data
 */
interface UnvalidatedPolicyTemplate {
  templateId?: unknown;
  policyName?: unknown;
  effect?: unknown;
  condition?: unknown;
  consensus?: unknown;
  notes?: unknown;
  appliesTo?: unknown;
  metadata?: unknown;
  tags?: unknown;
}

export function validatePolicyTemplates(
  templates: ReadonlyArray<UnvalidatedPolicyTemplate>,
  context: PolicyValidationContext
): PolicyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(templates)) {
    return {
      errors: ['Policy configuration must contain an array of templates'],
      warnings,
    };
  }

  const templateIds = new Set<string>();
  const policyNames = new Set<string>();

  templates.forEach((template, index) => {
    const path = `policies.templates[${index}]`;

    if (template === null || typeof template !== 'object') {
      errors.push(`${path}: template must be an object`);
      return;
    }

    // Validate templateId
    const templateId = safeGetProperty(template, 'templateId');
    if (!isNonEmptyString(templateId)) {
      errors.push(`${path}: templateId is required`);
    } else {
      const templateIdStr = String(templateId);
      if (templateIds.has(templateIdStr)) {
        errors.push(`${path}: templateId "${templateIdStr}" must be unique`);
      } else {
        templateIds.add(templateIdStr);
      }
    }

    // Validate policyName
    const policyName = safeGetProperty(template, 'policyName');
    if (!isNonEmptyString(policyName)) {
      errors.push(`${path}: policyName is required`);
    } else {
      const policyNameStr = String(policyName);
      if (policyNames.has(policyNameStr)) {
        warnings.push(`${path}: duplicate policy name "${policyNameStr}" detected`);
      } else {
        policyNames.add(policyNameStr);
      }
    }

    // Validate effect
    const effect = safeGetProperty(template, 'effect');
    if (!isNonEmptyString(effect)) {
      errors.push(`${path}: effect is required`);
    } else {
      const effectStr = String(effect);
      if (effectStr !== 'EFFECT_ALLOW' && effectStr !== 'EFFECT_DENY') {
        errors.push(`${path}: effect must be either "EFFECT_ALLOW" or "EFFECT_DENY"`);
      }
    }

    // Validate condition and consensus 
    const condition = safeGetProperty(template, 'condition');
    const consensus = safeGetProperty(template, 'consensus');
    validateExpressionTemplate(condition as PolicyConditionTemplate | undefined, `${path}.condition`, errors);
    validateExpressionTemplate(consensus as PolicyConsensusTemplate | undefined, `${path}.consensus`, errors);

    // Validate notes
    const notes = safeGetProperty(template, 'notes');
    if (notes !== undefined && !isNonEmptyString(notes)) {
      errors.push(`${path}: notes must be a non-empty string when provided`);
    }

    // Validate tags
    const tags = safeGetProperty(template, 'tags');
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        errors.push(`${path}: tags must be an array when provided`);
      } else {
        const tagsArray = tags as unknown[];
        tagsArray.forEach((tag: unknown, tagIndex: number) => {
          if (!isNonEmptyString(tag)) {
            errors.push(`${path}.tags[${tagIndex}]: tag must be a non-empty string`);
          }
        });
      }
    }

    // Validate appliesTo
    const appliesTo = safeGetProperty(template, 'appliesTo');
    if (appliesTo !== undefined) {
      if (!Array.isArray(appliesTo)) {
        errors.push(`${path}: appliesTo must be an array when provided`);
      } else {
        const appliesToArray = appliesTo as unknown[];
        appliesToArray.forEach((binding: unknown, bindingIndex: number) =>
          validateBinding(binding as PolicyBindingDefinition, bindingIndex, context, `${path}.appliesTo`, errors)
        );
      }
    }
  });

  return { errors, warnings };
}
