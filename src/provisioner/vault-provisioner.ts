/* eslint-disable no-console */

/**
 * Vault provisioning service for creating and managing Fireblocks vaults
 * Handles creation of distribution and collection vaults for lending partners
 */

import { FireblocksClientManager } from '../core/fireblocks-client';
import { handleFireblocksError, FireblocksServiceError, ErrorCodes } from '../core/error-handler';
import { OriginatorConfiguration, VaultPair } from '../config/types';
import type { FireblocksResponse, VaultAccount, CreateVaultAccountRequest } from '@fireblocks/ts-sdk';
import { isNonEmptyString } from '../utils/type-guards';

/**
 * Service for provisioning and managing vault accounts
 */
export class VaultProvisioner {
  private fireblocks = FireblocksClientManager.getInstance();

  private unwrapResponse<T>(response: FireblocksResponse<T>): T {
    if (!response || typeof response !== 'object' || response.data === undefined) {
      throw new FireblocksServiceError(
        'Unexpected Fireblocks response format',
        ErrorCodes.API_ERROR
      );
    }
    return response.data;
  }

  private ensureVaultIdentity(vault: VaultAccount, context: string): { id: string; name: string } {
    if (!isNonEmptyString(vault.id)) {
      throw new FireblocksServiceError(
        `Vault ID missing for ${context}`,
        ErrorCodes.VAULT_CREATION_FAILED
      );
    }

    if (!isNonEmptyString(vault.name)) {
      throw new FireblocksServiceError(
        `Vault name missing for ${context}`,
        ErrorCodes.VAULT_CREATION_FAILED
      );
    }

    return { id: vault.id, name: vault.name };
  }

  /**
   * Provision distribution and collection vaults for a lending partner
   * @param config - Originator configuration
   * @param partnerId - Unique partner identifier
   * @returns Object containing both vault details
   */
  async provisionPartnerVaults(
    config: OriginatorConfiguration,
    partnerId: string
  ): Promise<VaultPair> {
    const { prefix, distributionSuffix, collectionSuffix } = config.vaultStructure.namingConvention;

    // Validate partner exists in configuration
    const partner = config.lendingPartners.partners.find((p) => p.id === partnerId);
    if (!partner) {
      throw new FireblocksServiceError(
        `Partner ${partnerId} not found in configuration`,
        ErrorCodes.INVALID_CONFIG
      );
    }

    if (!partner.enabled) {
      throw new FireblocksServiceError(
        `Partner ${partnerId} is not enabled`,
        ErrorCodes.INVALID_CONFIG
      );
    }

    // Create distribution vault (hidden from UI)
    const distributionRequest: CreateVaultAccountRequest = {
      name: `${prefix}_LP_${partnerId}${distributionSuffix}`,
      hiddenOnUI: true, // Always hidden for API-only access
      autoFuel: false, // Manual gas management
      customerRefId: `${config.workspace.name}_${partnerId}_DIST`,
    };

    // Create collection vault (visible for monitoring)
    const collectionRequest: CreateVaultAccountRequest = {
      name: `${prefix}_LP_${partnerId}${collectionSuffix}`,
      hiddenOnUI: false, // Visible for monitoring collections
      autoFuel: false,
      customerRefId: `${config.workspace.name}_${partnerId}_COLL`,
    };

    try {
      const [distVaultResponse, collVaultResponse] = await Promise.all([
        this.fireblocks.vaults.createVaultAccount({
          createVaultAccountRequest: distributionRequest,
        }),
        this.fireblocks.vaults.createVaultAccount({
          createVaultAccountRequest: collectionRequest,
        }),
      ]);

      const distVault = this.unwrapResponse(distVaultResponse);
      const collVault = this.unwrapResponse(collVaultResponse);

      const distributionIdentity = this.ensureVaultIdentity(distVault, 'distribution vault');
      const collectionIdentity = this.ensureVaultIdentity(collVault, 'collection vault');

      await this.activateAssetsInVaults(
        [distributionIdentity.id, collectionIdentity.id],
        config.vaultStructure.defaultAsset
      );

      return {
        distribution: {
          id: distributionIdentity.id,
          name: distributionIdentity.name,
          assetId: config.vaultStructure.defaultAsset,
        },
        collection: {
          id: collectionIdentity.id,
          name: collectionIdentity.name,
          assetId: config.vaultStructure.defaultAsset,
        },
      };
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Activate an asset in multiple vault accounts
   * @param vaultIds - Array of vault account IDs
   * @param assetId - Fireblocks asset ID to activate
   */
  private async activateAssetsInVaults(vaultIds: string[], assetId: string): Promise<void> {
    const activationPromises = vaultIds.map((vaultId) =>
      this.fireblocks.vaults
        .activateAssetForVaultAccount({
          vaultAccountId: vaultId,
          assetId: assetId,
          idempotencyKey: `activate_${vaultId}_${assetId}_${Date.now()}`, // Unique idempotency key
        })
        .catch((error) => {
          // If asset is already active, that's OK
          if (error?.response?.data?.message?.includes('already active')) {
            console.log(`Asset ${assetId} already active in vault ${vaultId}`);
            return;
          }
          throw error;
        })
    );

    try {
      await Promise.all(activationPromises);
    } catch (error) {
      throw new FireblocksServiceError(
        'Failed to activate asset in one or more vaults',
        ErrorCodes.ASSET_ACTIVATION_FAILED,
        undefined,
        error
      );
    }
  }

  /**
   * Get all vaults for a specific partner
   * @param config - Originator configuration
   * @param partnerId - Partner identifier
   * @returns Array of vault accounts
   */
  async getPartnerVaults(
    config: OriginatorConfiguration,
    partnerId: string
  ): Promise<VaultAccount[]> {
    const { prefix } = config.vaultStructure.namingConvention;
    const namePrefix = `${prefix}_LP_${partnerId}`;

    try {
      const response = await this.fireblocks.vaults.getPagedVaultAccounts({
        namePrefix,
        limit: 10,
      });

      return this.unwrapResponse(response).accounts ?? [];
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Get vault by name
   * @param vaultName - Full vault name
   * @returns Vault account if found
   */
  async getVaultByName(vaultName: string): Promise<VaultAccount | null> {
    try {
      const response = await this.fireblocks.vaults.getPagedVaultAccounts({
        namePrefix: vaultName,
        limit: 1,
      });

      const vaults = this.unwrapResponse(response).accounts ?? [];

      // Exact match only
      const vault = vaults.find((v) => v.name === vaultName);
      return vault || null;
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Provision vaults for all enabled partners
   * @param config - Originator configuration
   * @returns Map of partner IDs to vault pairs
   */
  async provisionAllPartnerVaults(
    config: OriginatorConfiguration
  ): Promise<Map<string, VaultPair>> {
    const vaultMap = new Map<string, VaultPair>();

    const enabledPartners = config.lendingPartners.partners.filter((p) => p.enabled);
    console.log(`Provisioning vaults for ${enabledPartners.length} partners...`);

    // Process partners sequentially to avoid rate limits
    for (const partner of enabledPartners) {
      try {
        const vaults = await this.provisionPartnerVaults(config, partner.id);
        vaultMap.set(partner.id, vaults);

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to provision vaults for partner ${partner.id}:`, error);
        // Continue with other partners
      }
    }

    console.log(`Successfully provisioned vaults for ${vaultMap.size} partners`);
    return vaultMap;
  }
}
