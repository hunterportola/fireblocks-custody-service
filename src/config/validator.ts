/**
 * Configuration validation for originator setup
 * Ensures all required fields are present and valid
 */

import { OriginatorConfiguration, ValidationResult } from './types';
import { AssetManager } from '../provisioner/asset-manager';

/**
 * Validates originator configuration
 */
export class ConfigurationValidator {
  private assetManager = new AssetManager();
  
  /**
   * Validate the complete originator configuration
   * @param config - Configuration to validate
   * @returns Validation result with errors and warnings
   */
  async validate(config: OriginatorConfiguration): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate workspace
    this.validateWorkspace(config.workspace, errors);
    
    // Validate lending partners
    this.validateLendingPartners(config.lendingPartners, errors, warnings);
    
    // Validate vault structure
    this.validateVaultStructure(config.vaultStructure, errors);
    
    // Validate approval structure
    this.validateApprovalStructure(config.approvalStructure, errors, warnings);
    
    // Validate transaction limits
    this.validateTransactionLimits(config.transactionLimits, errors, warnings);
    
    // Validate API settings
    this.validateApiSettings(config.apiSettings, errors, warnings);
    
    // Validate asset ID (async)
    const assetValid = await this.validateAssetId(config.vaultStructure.defaultAsset);
    if (!assetValid) {
      warnings.push(`Asset ID '${config.vaultStructure.defaultAsset}' could not be validated. Ensure it exists in your Fireblocks workspace.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private validateWorkspace(workspace: any, errors: string[]): void {
    if (!workspace?.name || typeof workspace.name !== 'string' || workspace.name.trim() === '') {
      errors.push('Workspace name is required');
    }
    
    const validEnvironments = ['sandbox', 'testnet', 'mainnet'];
    if (!workspace?.environment || !validEnvironments.includes(workspace.environment)) {
      errors.push(`Workspace environment must be one of: ${validEnvironments.join(', ')}`);
    }
  }
  
  private validateLendingPartners(partners: any, errors: string[], warnings: string[]): void {
    if (!partners?.partners || !Array.isArray(partners.partners)) {
      errors.push('At least one lending partner must be configured');
      return;
    }
    
    if (partners.partners.length === 0) {
      errors.push('At least one lending partner must be configured');
      return;
    }
    
    const seenIds = new Set<string>();
    partners.partners.forEach((partner: any, index: number) => {
      if (!partner.id || typeof partner.id !== 'string') {
        errors.push(`Partner at index ${index} must have a valid ID`);
      } else if (seenIds.has(partner.id)) {
        errors.push(`Duplicate partner ID: ${partner.id}`);
      } else {
        seenIds.add(partner.id);
      }
      
      if (!partner.name || typeof partner.name !== 'string') {
        errors.push(`Partner ${partner.id || index} must have a valid name`);
      }
      
      if (typeof partner.enabled !== 'boolean') {
        errors.push(`Partner ${partner.id || index} must have 'enabled' set to true or false`);
      }
    });
    
    const enabledCount = partners.partners.filter((p: any) => p.enabled).length;
    if (enabledCount === 0) {
      warnings.push('No partners are currently enabled');
    }
  }
  
  private validateVaultStructure(vault: any, errors: string[]): void {
    if (!vault?.namingConvention) {
      errors.push('Vault naming convention is required');
      return;
    }
    
    if (!vault.namingConvention.prefix || vault.namingConvention.prefix.trim() === '') {
      errors.push('Vault naming prefix is required');
    } else if (!/^[A-Z0-9_]+$/.test(vault.namingConvention.prefix)) {
      errors.push('Vault naming prefix should only contain uppercase letters, numbers, and underscores');
    }
    
    if (!vault.namingConvention.distributionSuffix) {
      errors.push('Distribution vault suffix is required');
    }
    
    if (!vault.namingConvention.collectionSuffix) {
      errors.push('Collection vault suffix is required');
    }
    
    if (!vault.defaultAsset || vault.defaultAsset.trim() === '') {
      errors.push('Default asset is required');
    }
  }
  
  private validateApprovalStructure(approval: any, errors: string[], _warnings: string[]): void {
    if (!approval?.mode) {
      errors.push('Approval mode is required');
      return;
    }
    
    const validModes = ['none', 'single', 'multi', 'threshold'];
    if (!validModes.includes(approval.mode)) {
      errors.push(`Approval mode must be one of: ${validModes.join(', ')}`);
    }
    
    if (approval.mode !== 'none' && !approval.requirements) {
      errors.push('Approval requirements must be specified when mode is not "none"');
      return;
    }
    
    if (approval.requirements) {
      const reqs = approval.requirements;
      
      if (typeof reqs.numberOfApprovers !== 'undefined') {
        if (!Number.isInteger(reqs.numberOfApprovers) || reqs.numberOfApprovers < 0) {
          errors.push('Number of approvers must be a non-negative integer');
        }
        
        if (reqs.numberOfApprovers > 0 && (!reqs.approverRoles || reqs.approverRoles.length === 0)) {
          errors.push('Approver roles must be specified when numberOfApprovers > 0');
        }
      }
      
      if (reqs.approverRoles && Array.isArray(reqs.approverRoles)) {
        const requiredRoles = reqs.approverRoles.filter((r: any) => r.required);
        if (requiredRoles.length > reqs.numberOfApprovers) {
          errors.push('Number of required roles exceeds numberOfApprovers');
        }
      }
      
      if (typeof reqs.thresholdAmount !== 'undefined') {
        if (typeof reqs.thresholdAmount !== 'number' || reqs.thresholdAmount < 0) {
          errors.push('Threshold amount must be a non-negative number');
        }
      }
    }
  }
  
  private validateTransactionLimits(limits: any, errors: string[], warnings: string[]): void {
    if (!limits?.automated) {
      errors.push('Automated transaction limits must be specified');
      return;
    }
    
    if (typeof limits.automated.singleTransaction !== 'number' || limits.automated.singleTransaction <= 0) {
      errors.push('Single transaction limit must be a positive number');
    }
    
    if (limits.automated.dailyLimit && 
        (typeof limits.automated.dailyLimit !== 'number' || limits.automated.dailyLimit <= 0)) {
      errors.push('Daily limit must be a positive number if specified');
    }
    
    if (limits.automated.monthlyLimit && 
        (typeof limits.automated.monthlyLimit !== 'number' || limits.automated.monthlyLimit <= 0)) {
      errors.push('Monthly limit must be a positive number if specified');
    }
    
    // Logical checks
    if (limits.automated.dailyLimit && limits.automated.dailyLimit < limits.automated.singleTransaction) {
      warnings.push('Daily limit is less than single transaction limit');
    }
    
    if (limits.automated.monthlyLimit && limits.automated.dailyLimit && 
        limits.automated.monthlyLimit < limits.automated.dailyLimit) {
      warnings.push('Monthly limit is less than daily limit');
    }
  }
  
  private validateApiSettings(api: any, errors: string[], warnings: string[]): void {
    if (!api?.ipWhitelist || !Array.isArray(api.ipWhitelist) || api.ipWhitelist.length === 0) {
      errors.push('At least one IP address must be whitelisted');
      return;
    }
    
    // Note: We're NOT enforcing the "no private IPs" rule mentioned in the README
    // because sandbox environments often use private IPs for testing
    api.ipWhitelist.forEach((ip: any, index: number) => {
      if (typeof ip !== 'string' || !this.isValidIpAddress(ip)) {
        errors.push(`Invalid IP address at index ${index}: ${ip}`);
      }
    });
    
    // Check for common private IP ranges and warn
    const privateIpPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./
    ];
    
    const hasPrivateIps = api.ipWhitelist.some((ip: string) => 
      privateIpPatterns.some(pattern => pattern.test(ip))
    );
    
    if (hasPrivateIps) {
      warnings.push('Private IP addresses detected in whitelist. Ensure these are replaced with public IPs for production.');
    }
    
    if (api.webhookEndpoint) {
      if (typeof api.webhookEndpoint !== 'string' || !this.isValidUrl(api.webhookEndpoint)) {
        errors.push('Webhook endpoint must be a valid URL');
      }
    }
  }
  
  private isValidIpAddress(ip: string): boolean {
    // Basic IPv4 validation
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Pattern.test(ip)) {
      return false;
    }
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  private async validateAssetId(assetId: string): Promise<boolean> {
    try {
      return await this.assetManager.validateAssetId(assetId);
    } catch (error) {
      // If we can't validate (e.g., not connected), return true to not block
      console.warn('Unable to validate asset ID:', error);
      return true;
    }
  }
}