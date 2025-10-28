import { jest } from '@jest/globals';
import type { ProvisioningArtifacts } from '../../provisioner/runtime-snapshots';
import type { WalletTemplate } from '../../config/types';
import { TenantDatabaseService } from '../tenant-database-service';

jest.mock('../../core/tenant-connection-registry', () => ({
  TenantConnectionRegistry: {
    getInstance: jest.fn(),
  },
}));

const mockQuery = jest.fn() as jest.Mock;
const mockGetConnection = jest.fn() as jest.Mock;

const mockedRegistry = {
  getConnection: mockGetConnection,
  query: mockQuery,
  transaction: jest.fn(),
};

const { TenantConnectionRegistry } = jest.requireMock('../../core/tenant-connection-registry') as {
  TenantConnectionRegistry: { getInstance: jest.Mock };
};

describe('TenantDatabaseService onboarding helpers', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockImplementation(async () => ({ rows: [], rowCount: 0 }));
    mockGetConnection.mockReset();
    mockGetConnection.mockImplementation(async () => ({}));
    mockedRegistry.transaction.mockReset();
    (TenantConnectionRegistry.getInstance as jest.Mock).mockReturnValue(mockedRegistry);
  });

  it('bootstraps originator metadata', async () => {
    const service = await TenantDatabaseService.forOriginator('orig-123');

    await service.bootstrapOriginator({
      originatorId: 'orig-123',
      displayName: 'Originator 123',
      legalEntityName: 'Originator 123 LLC',
      environment: 'staging',
      turnkeyOrganizationId: 'org-abc',
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [originatorId, sql, rawParams] = mockQuery.mock.calls[0];
    const params = rawParams as string[];
    expect(originatorId).toBe('orig-123');
    expect(sql).toContain('INSERT INTO originators');
    expect(params[0]).toBe('orig-123');
    expect(params[1]).toBe('orig-123');
    expect(params[2]).toBe('Originator 123');
    expect(params[5]).toContain('Originator 123 LLC');
    expect(params[5]).toContain('"environment":"staging"');
    expect(params[5]).toContain('"turnkeyOrganizationId":"org-abc"');
  });

  it('persists provisioned wallets and accounts', async () => {
    const service = await TenantDatabaseService.forOriginator('orig-wallet');

    mockQuery.mockImplementation((...args: unknown[]) => {
      const text = args[1];
      if (typeof text === 'string' && text.includes('INSERT INTO wallets')) {
        return Promise.resolve({ rows: [{ id: 'wallet-row' }], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    const snapshot: ProvisioningArtifacts['provisioningSnapshot'] = {
      subOrganizationId: 'sub-org',
      name: 'Sub Org',
      rootQuorumThreshold: 1,
      rootUsers: [],
      automationUsers: [],
      walletFlows: [
        {
          flowId: 'distribution',
          walletTemplateId: 'wallet-dist',
          walletId: 'wallet-123',
          walletName: 'DIST-demo',
          accountIdByAlias: { primary: 'acct-1' },
          accountAddressByAlias: { primary: '0xabc' },
        },
      ],
      policies: [],
      partners: [],
    };

    const templates = {
      'wallet-dist': {
        templateId: 'wallet-dist',
        usage: 'distribution',
        walletNameTemplate: 'DIST-{originatorId}',
        accounts: [
          {
            alias: 'primary',
            curve: 'CURVE_SECP256K1',
            pathFormat: 'PATH_FORMAT_BIP32',
            path: "m/44'/60'/0'/0/0",
            addressFormat: 'ADDRESS_FORMAT_ETHEREUM',
          },
        ],
      },
    } as unknown as Record<string, WalletTemplate>;

    await service.persistProvisionedWallets(snapshot, templates);

    expect(mockQuery).toHaveBeenCalledWith(
      'orig-wallet',
      expect.stringContaining('INSERT INTO wallets'),
      expect.arrayContaining(['orig-wallet', 'wallet-123', 'sub-org', 'wallet-dist', 'DIST-demo'])
    );
    expect(mockQuery).toHaveBeenCalledWith(
      'orig-wallet',
      expect.stringContaining('INSERT INTO wallet_accounts'),
      expect.arrayContaining(['wallet-row', 'acct-1', 'primary', '0xabc'])
    );
  });
});
