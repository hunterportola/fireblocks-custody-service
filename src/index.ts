/**
 * Fireblocks Custody Service - Main entry point
 * Provides a low-code SDK for loan originators to manage custody operations
 */

export * from './config/types';
export * from './config/presets/roles';
export * from './config/validator-strict';
export * from './approvals/types';
export * from './approvals/validator';
export * from './core/fireblocks-client';
export * from './core/error-handler';
export * from './provisioner/vault-provisioner';
export * from './provisioner/asset-manager';

// Main service class (to be implemented)
export class FireblocksCustodyService {
  // TODO: Implement main service orchestration
  constructor(config: any) {
    void config;
  }
}
