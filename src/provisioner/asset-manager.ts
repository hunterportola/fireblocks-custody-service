/**
 * Asset management utilities for Fireblocks vaults
 * Handles asset activation, balance checking, and asset information
 */

import { FireblocksClientManager } from '../core/fireblocks-client';
import { handleFireblocksError } from '../core/error-handler';
import type {
  Asset,
  FireblocksResponse,
  GetSupportedAssetsResponse,
  GetVaultAssetsResponse,
  VaultAsset,
} from '@fireblocks/ts-sdk';

/**
 * Service for managing assets within vault accounts
 */
export class AssetManager {
  private fireblocks = FireblocksClientManager.getInstance();

  private unwrapResponse<T>(response: FireblocksResponse<T>): T {
    if (!response || typeof response !== 'object' || response.data === undefined) {
      throw new Error('Unexpected Fireblocks response structure');
    }
    return response.data;
  }

  /**
   * Get the balance of a specific asset in a vault
   * @param vaultId - Vault account ID
   * @param assetId - Asset ID (e.g., "USDC_ETH")
   * @returns Asset balance information
   */
  async getAssetBalance(vaultId: string, assetId: string): Promise<VaultAsset | null> {
    try {
      const response = await this.fireblocks.vaults.getVaultAccountAsset({
        vaultAccountId: vaultId,
        assetId: assetId,
      });
      return this.unwrapResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      handleFireblocksError(error);
    }
  }

  /**
   * Get all assets balance summary (not specific to a single vault)
   * Note: This returns assets across all vaults, filtered by optional name prefix/suffix
   * @param accountNamePrefix - Optional filter by vault name prefix
   * @param accountNameSuffix - Optional filter by vault name suffix
   * @returns Array of vault assets
   */
  async getVaultAssetsSummary(
    accountNamePrefix?: string,
    accountNameSuffix?: string
  ): Promise<GetVaultAssetsResponse> {
    try {
      const response = await this.fireblocks.vaults.getVaultAssets({
        accountNamePrefix,
        accountNameSuffix,
      });
      return this.unwrapResponse(response);
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Check if a vault has sufficient balance for a transaction
   * @param vaultId - Vault account ID
   * @param assetId - Asset ID
   * @param amount - Required amount (as string for precision)
   * @returns True if sufficient balance exists
   */
  async hasSufficientBalance(vaultId: string, assetId: string, amount: string): Promise<boolean> {
    const asset = await this.getAssetBalance(vaultId, assetId);

    if (!asset || !asset.available) {
      return false;
    }

    const available = parseFloat(asset.available);
    const required = parseFloat(amount);

    return available >= required;
  }

  /**
   * Get all supported assets in the workspace
   * @returns Array of supported asset information
   */
  async getSupportedAssets(): Promise<GetSupportedAssetsResponse> {
    try {
      const response = await this.fireblocks.blockchainsAssets.getSupportedAssets();
      return this.unwrapResponse(response);
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Validate that an asset ID exists and is supported
   * @param assetId - Asset ID to validate
   * @returns True if asset is valid
   */
  async validateAssetId(assetId: string): Promise<boolean> {
    try {
      const supportedAssets = await this.getSupportedAssets();
      return supportedAssets.some((asset) => asset.id === assetId);
    } catch (error) {
      handleFireblocksError(error);
    }
  }

  /**
   * Get asset details including current price
   * @param assetId - Asset ID
   * @returns Asset details with price information
   */
  async getAssetDetails(assetId: string): Promise<Asset> {
    try {
      const response = await this.fireblocks.blockchainsAssets.getAsset({
        id: assetId,
      });
      return this.unwrapResponse(response);
    } catch (error) {
      handleFireblocksError(error);
    }
  }
}
