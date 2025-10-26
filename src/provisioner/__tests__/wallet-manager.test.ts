import { jest } from '@jest/globals';

import type { TGetWalletAccountsResponse, TGetWalletsResponse } from '@turnkey/sdk-server/dist/__generated__/sdk_api_types';
import { TurnkeyWalletManager } from '../wallet-manager';
import { TurnkeyClientManager } from '../../core/turnkey-client';

jest.mock('../../core/turnkey-client');

describe('TurnkeyWalletManager', () => {
  const apiClientMock = {
    getWallets: jest.fn<(args: { organizationId: string }) => Promise<TGetWalletsResponse>>(),
    getWalletAccounts: jest.fn<(args: { organizationId: string; walletId: string }) => Promise<TGetWalletAccountsResponse>>(),
    updateWallet: jest.fn<
      (args: { organizationId: string; walletId: string; updateWalletRequest: { tags: ReadonlyArray<string> } }) => Promise<void>
    >(),
  };

  const clientMock = {
    getApiClient: jest.fn(() => apiClientMock),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    clientMock.getApiClient.mockImplementation(() => apiClientMock);
    (TurnkeyClientManager.getInstance as jest.Mock).mockReturnValue(clientMock as unknown as TurnkeyClientManager);
  });

  it('uses getWalletAccounts API and returns the accounts array', async () => {
    const manager = new TurnkeyWalletManager();
    apiClientMock.getWalletAccounts.mockResolvedValue({
      accounts: [
        { walletAccountId: 'acct-1', address: '0xabc' },
        { walletAccountId: 'acct-2', address: '0xdef' },
      ],
    } as unknown as TGetWalletAccountsResponse);

    const accounts = await manager.listWalletAccounts('sub-org', 'wallet-123');

    expect(apiClientMock.getWalletAccounts).toHaveBeenCalledWith({
      organizationId: 'sub-org',
      walletId: 'wallet-123',
    });
    expect(accounts).toEqual([
      { walletAccountId: 'acct-1', address: '0xabc' },
      { walletAccountId: 'acct-2', address: '0xdef' },
    ]);
  });

  it('delegates wallet tag updates to updateWallet', async () => {
    const manager = new TurnkeyWalletManager();
    await expect(
      manager.tagWallet('sub-org', 'wallet-123', ['tag:one', 'tag:two'])
    ).rejects.toThrow(/wallet tagging is not supported/i);
    expect(apiClientMock.updateWallet).not.toHaveBeenCalled();
  });
});
