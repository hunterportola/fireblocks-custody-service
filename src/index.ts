export * from './config/types';
export * from './config/presets/roles';
export * from './config/validator-strict';
export * from './approvals/types';
export * from './approvals/validator';
export * from './core/error-handler';
export * from './core/secrets-manager';
export * from './core/turnkey-client';
export * from './provisioner/turnkey-suborg-provisioner';
export * from './provisioner/wallet-template-registry';
export * from './provisioner/policy-provisioner';
export {
  ProvisioningArtifacts,
  ProvisioningRuntimeSnapshot,
  ProvisionedAutomationUser,
  ProvisionedPolicyTemplate,
  ProvisionedRootUser,
  ProvisionedWalletFlow,
} from './provisioner/runtime-snapshots';
export type { PartnerRuntimeConfig as ProvisionedPartnerRuntimeConfig } from './provisioner/runtime-snapshots';
export * from './provisioner/policy-binding-resolver';

export class TurnkeyCustodyService {
  // TODO: implement orchestration logic in subsequent iterations
  constructor(config: unknown) {
    void config;
  }
}
