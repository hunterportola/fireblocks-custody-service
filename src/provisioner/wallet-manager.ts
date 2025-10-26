import type { TGetWalletAccountsResponse, TGetWalletsResponse } from '@turnkey/sdk-server/dist/__generated__/sdk_api_types';

import type { WalletFlowId } from '../config/types';
import type { ProvisioningRuntimeSnapshot, ProvisionedWalletFlow } from './runtime-snapshots';
import { TurnkeyClientManager, type SubmitActivityOptions } from '../core/turnkey-client';

export interface BalanceProvider {
  getBalance(params: { chainId?: string; address: string }): Promise<string>;
}

export interface WalletBalanceRequest {
  subOrganizationId: string;
  walletId: string;
  walletAccountId: string;
  chainId?: string;
  expectedAmount: string;
  address: string;
  automationTemplateId?: string;
}

type WalletSummary = TGetWalletsResponse['wallets'][number];
type WalletAccountSummary = TGetWalletAccountsResponse['accounts'][number];

export class TurnkeyWalletManager {
  constructor(
    private readonly client: TurnkeyClientManager = TurnkeyClientManager.getInstance(),
    private readonly balanceProvider?: BalanceProvider
  ) {}

  async listWallets(subOrganizationId: string, automationTemplateId?: string): Promise<WalletSummary[]> {
    const options: SubmitActivityOptions = {
      subOrganizationId,
      automationTemplateId,
    };

    const apiClient = this.client.getApiClient(options);
    const response = await apiClient.getWallets({ organizationId: subOrganizationId });
    return response.wallets;
  }

  async listWalletAccounts(
    subOrganizationId: string,
    walletId: string,
    automationTemplateId?: string
  ): Promise<WalletAccountSummary[]> {
    const options: SubmitActivityOptions = {
      subOrganizationId,
      automationTemplateId,
    };

    const apiClient = this.client.getApiClient(options);
    const response = await apiClient.getWalletAccounts({
      organizationId: subOrganizationId,
      walletId,
    });
    return response.accounts;
  }

  tagWallet(
    subOrganizationId: string,
    walletId: string,
    tags: ReadonlyArray<string>,
    automationTemplateId?: string
  ): never {
    throw new Error(
      [
        'Wallet tagging is not supported by Turnkey updateWallet API.',
        `Requested walletId: ${walletId}`,
        `subOrganizationId: ${subOrganizationId}`,
        `automationTemplateId: ${automationTemplateId ?? 'n/a'}`,
        `tags: [${tags.join(', ')}]`,
        'Use private key tag operations (createPrivateKeyTag, listPrivateKeyTags) to manage tags.',
      ].join(' ')
    );
  }

  async hasSufficientBalance(request: WalletBalanceRequest): Promise<boolean> {
    if (!this.balanceProvider) {
      throw new Error('Balance provider not configured for TurnkeyWalletManager');
    }

    const balance = await this.balanceProvider.getBalance({
      chainId: request.chainId,
      address: request.address,
    });

    const current = BigInt(balance);
    const expected = BigInt(request.expectedAmount);
    return current >= expected;
  }

  getWalletByFlow(snapshot: ProvisioningRuntimeSnapshot, flowId: WalletFlowId): ProvisionedWalletFlow | undefined {
    return snapshot.walletFlows.find((flow) => flow.flowId === flowId);
  }
}
