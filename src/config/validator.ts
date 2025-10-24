/**
 * Configuration validation for originator setup - strict TypeScript version.
 * Ensures all required fields are present, typed, and within acceptable ranges.
 */

import { OriginatorConfiguration, RoleDefinition, ValidationResult } from './types';
import { isNonEmptyString, isWorkspaceEnvironment } from '../utils/type-guards';
import { validateApprovalWorkflows } from '../approvals/validator';

type LendingPartner = OriginatorConfiguration['lendingPartners']['partners'][number];

const IPV4_REGEX = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
];

function isValidWorkspace(workspace: unknown): workspace is OriginatorConfiguration['workspace'] {
  if (!workspace || typeof workspace !== 'object') return false;
  const w = workspace as Record<string, unknown>;
  return isNonEmptyString(w.name) && isWorkspaceEnvironment(w.environment);
}

function isValidPartner(partner: unknown): partner is LendingPartner {
  if (!partner || typeof partner !== 'object') return false;
  const p = partner as Record<string, unknown>;
  return (
    isNonEmptyString(p.id) &&
    isNonEmptyString(p.name) &&
    typeof p.enabled === 'boolean'
  );
}

function isValidLendingPartners(
  partners: unknown
): partners is OriginatorConfiguration['lendingPartners'] {
  if (!partners || typeof partners !== 'object') return false;
  const p = partners as Record<string, unknown>;
  return Array.isArray(p.partners) && p.partners.length > 0 && p.partners.every(isValidPartner);
}

function isValidNamingConvention(
  naming: unknown
): naming is OriginatorConfiguration['vaultStructure']['namingConvention'] {
  if (!naming || typeof naming !== 'object') return false;
  const n = naming as Record<string, unknown>;
  return (
    isNonEmptyString(n.prefix) &&
    /^[A-Z0-9_]+$/.test(n.prefix) &&
    isNonEmptyString(n.distributionSuffix) &&
    isNonEmptyString(n.collectionSuffix)
  );
}

function isValidVaultStructure(vault: unknown): vault is OriginatorConfiguration['vaultStructure'] {
  if (!vault || typeof vault !== 'object') return false;
  const v = vault as Record<string, unknown>;
  return isValidNamingConvention(v.namingConvention) && isNonEmptyString(v.defaultAsset);
}

function isApprovalConfiguration(
  approval: unknown
): approval is OriginatorConfiguration['approval'] {
  if (!approval || typeof approval !== 'object') {
    return false;
  }

  const candidate = approval as Record<string, unknown>;
  return Array.isArray(candidate.workflows);
}

function isValidTransactionLimits(
  limits: unknown
): limits is OriginatorConfiguration['transactionLimits'] {
  if (!limits || typeof limits !== 'object') return false;
  const l = limits as Record<string, unknown>;
  if (!l.automated || typeof l.automated !== 'object') return false;

  const automated = l.automated as Record<string, unknown>;
  if (typeof automated.singleTransaction !== 'number' || automated.singleTransaction <= 0) {
    return false;
  }

  if (
    automated.dailyLimit !== undefined &&
    (typeof automated.dailyLimit !== 'number' || automated.dailyLimit <= 0)
  ) {
    return false;
  }

  if (
    automated.monthlyLimit !== undefined &&
    (typeof automated.monthlyLimit !== 'number' || automated.monthlyLimit <= 0)
  ) {
    return false;
  }

  return true;
}

function isValidIpAddress(ip: unknown): ip is string {
  if (typeof ip !== 'string') return false;
  if (!IPV4_REGEX.test(ip)) return false;

  return ip.split('.').every((segment) => {
    const value = Number.parseInt(segment, 10);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function isValidUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidApiSettings(api: unknown): api is OriginatorConfiguration['apiSettings'] {
  if (!api || typeof api !== 'object') return false;
  const a = api as Record<string, unknown>;

  if (!Array.isArray(a.ipWhitelist) || a.ipWhitelist.length === 0) return false;
  if (!a.ipWhitelist.every(isValidIpAddress)) return false;

  if (a.webhookEndpoint !== undefined && !isValidUrl(a.webhookEndpoint)) return false;

  return true;
}

/**
 * Validates originator configuration with strict type checking.
 */
export class ConfigurationValidator {
  async validate(config: OriginatorConfiguration): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isValidWorkspace(config.workspace)) {
      errors.push('Invalid workspace configuration');
    }

    if (!isValidLendingPartners(config.lendingPartners)) {
      errors.push('Invalid lending partners configuration');
    } else {
      const enabledCount = config.lendingPartners.partners.filter((p) => p.enabled).length;
      if (enabledCount === 0) {
        warnings.push('No partners are currently enabled');
      }

      const ids = config.lendingPartners.partners.map((p) => p.id);
      if (ids.length !== new Set(ids).size) {
        errors.push('Duplicate partner IDs found');
      }
    }

    if (!isValidVaultStructure(config.vaultStructure)) {
      errors.push('Invalid vault structure configuration');
    }

    if (!isApprovalConfiguration(config.approval)) {
      errors.push('Invalid approval configuration');
    } else {
      const roleDefinitions: ReadonlyArray<RoleDefinition> = config.roleDefinitions ?? [];
      const { errors: approvalErrors, warnings: approvalWarnings } = validateApprovalWorkflows(
        config.approval.workflows,
        roleDefinitions
      );
      errors.push(...approvalErrors);
      warnings.push(...approvalWarnings);
    }

    if (!isValidTransactionLimits(config.transactionLimits)) {
      errors.push('Invalid transaction limits configuration');
    } else {
      const limits = config.transactionLimits.automated;
      if (limits.dailyLimit && limits.dailyLimit < limits.singleTransaction) {
        warnings.push('Daily limit is less than single transaction limit');
      }
      if (limits.monthlyLimit && limits.dailyLimit && limits.monthlyLimit < limits.dailyLimit) {
        warnings.push('Monthly limit is less than daily limit');
      }
    }

    if (!isValidApiSettings(config.apiSettings)) {
      errors.push('Invalid API settings configuration');
    } else {
      const hasPrivateIp = config.apiSettings.ipWhitelist.some((ip) =>
        PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip))
      );
      if (hasPrivateIp) {
        warnings.push('Private IP addresses detected in whitelist');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
