/**
 * MVP integration service that bridges the API with TurnkeyCustodyService
 * Uses mock provisioning data for testing
 */

import { 
  TurnkeyCustodyService, 
  InMemorySnapshotStore,
  type DisbursementRequest,
  type ProvisioningSnapshotStore
} from './turnkey-custody-service';
import {
  TurnkeyDisbursementExecutor,
  StaticTokenRegistry,
  HttpJsonRpcClient,
} from './turnkey-disbursement-executor';
import { SEPOLIA_USDC_ADDRESS } from './constants';
import type { ProvisioningRuntimeSnapshot, ProvisionedWalletFlow } from '../provisioner/runtime-snapshots';
import mockProvisioningData from '../../test-data/provisioning-results.json';

type MockProvisioningWallet = {
  walletId: string;
  accountId: string;
  address: string;
};

type MockProvisioningResult = {
  originatorId: string;
  displayName: string;
  provisioning: {
    subOrganizationId: string;
    wallets: Record<string, MockProvisioningWallet>;
    provisionedAt: string;
  };
};

const CHAIN_SLUG_TO_CHAIN_ID = new Map<string, string>([
  ['sepolia', '11155111'],
  ['ethereum-sepolia', '11155111'],
  ['eth-sepolia', '11155111'],
]);

const FLOW_ID_PATTERN = /^[a-z0-9_-]+$/iu;

// Map lender IDs to originator IDs based on our test data
const LENDER_TO_ORIGINATOR_MAP = new Map<string, string>([
  ['lender_acme_corp', 'originator_demo'], // Legacy test lender
  ['lender_demo', 'originator_demo'], // Legacy test lender
  ['lender_originator_acme_lending_primary', 'originator_acme_lending'],
  ['lender_originator_acme_lending_secondary', 'originator_acme_lending'],
  ['lender_originator_stellar_loans_primary', 'originator_stellar_loans'],
  ['lender_originator_stellar_loans_secondary', 'originator_stellar_loans'],
]);

/**
 * Creates mock provisioning snapshots from our test data
 */
function createMockSnapshots(): Map<string, ProvisioningRuntimeSnapshot> {
  const snapshots = new Map<string, ProvisioningRuntimeSnapshot>();

  // Add legacy demo originator
  snapshots.set('originator_demo', {
    subOrganizationId: 'sub_org_demo_67890',
    name: 'Demo Originator',
    rootQuorumThreshold: 1,
    rootUsers: [],
    metadata: {
      originatorId: 'originator_demo',
      displayName: 'Demo Originator',
      provisionedAt: new Date().toISOString(),
    },
    partners: [{
      partnerId: 'partner_default',
      walletFlows: { distribution: 'wallet_demo_dist_123' },
      policyIds: ['policy_demo_standard'],
    }],
    walletFlows: [{
      flowId: 'distribution',
      walletId: 'wallet_demo_dist_123',
      walletTemplateId: 'wallet-distribution',
      accountIdByAlias: {
        primary: 'account_demo_primary',
      },
      accountAddressByAlias: {
        primary: '0x1234567890123456789012345678901234567890',
      },
    }],
    policies: [{
      policyId: 'policy_demo_standard',
      templateId: 'policy-standard',
    }],
    automationUsers: [],
  });

  // Add test originators from provisioning script
  const provisioningResults = parseProvisioningResults(mockProvisioningData);

  for (const result of provisioningResults) {
    const walletEntries = Object.entries(result.provisioning.wallets).filter(
      (entry): entry is [string, MockProvisioningWallet] => isValidWalletEntry(entry)
    );

    const walletFlowsList: ProvisionedWalletFlow[] = walletEntries.map(([flowId, wallet]) => ({
      flowId,
      walletId: wallet.walletId,
      walletTemplateId: `wallet-${flowId}`,
      accountIdByAlias: {
        primary: wallet.accountId,
      },
      accountAddressByAlias: {
        primary: wallet.address,
      },
    }));

    const walletFlowsRecord = Object.fromEntries(
      walletEntries.map(([flowId, wallet]) => [flowId, wallet.walletId] as const)
    ) as Record<string, string>;

    const snapshot: ProvisioningRuntimeSnapshot = {
      subOrganizationId: result.provisioning.subOrganizationId,
      name: result.displayName,
      rootQuorumThreshold: 1,
      rootUsers: [],
      metadata: {
        originatorId: result.originatorId,
        displayName: result.displayName,
        provisionedAt: result.provisioning.provisionedAt,
      },
      partners: [
        {
          partnerId: 'partner_default',
          walletFlows: walletFlowsRecord,
          policyIds: [`policy_${result.originatorId}_standard`],
        },
      ],
      walletFlows: walletFlowsList,
      policies: [{
        policyId: `policy_${result.originatorId}_standard`,
        templateId: 'policy-standard',
      }],
      automationUsers: [],
    };

    snapshots.set(result.originatorId, snapshot);
  }

  return snapshots;
}

// Singleton instance
let custodyService: TurnkeyCustodyService | null = null;
let snapshotStore: ProvisioningSnapshotStore | null = null;

/**
 * Initialize the custody service with mock data
 */
export async function initializeMVPCustodyService(): Promise<TurnkeyCustodyService> {
  if (custodyService) {
    return custodyService;
  }

  // Create snapshot store with mock data
  snapshotStore = new InMemorySnapshotStore();
  const mockSnapshots = createMockSnapshots();
  
  // Save all mock snapshots
  for (const [, snapshot] of mockSnapshots) {
    await snapshotStore.save({
      platformConfigHash: 'mock-hash',
      provisioningSnapshot: snapshot,
    });
  }

  // Create disbursement executor with test configuration
  const tokenRegistry = new StaticTokenRegistry([
    {
      symbol: 'USDC',
      chainId: '0xaa36a7',
      contractAddress: SEPOLIA_USDC_ADDRESS,
      decimals: 6,
    },
  ]);

  const rpcClient = new HttpJsonRpcClient({
    '0xaa36a7': process.env.SEPOLIA_RPC_URL ?? 'https://eth-sepolia.g.alchemy.com/v2/FMX-Ig07NkgHO7V5RHuJ9',
  });

  // Create custody service with dependencies (but don't assign yet)
  const tempCustodyService = new TurnkeyCustodyService({
    snapshotStore,
    disbursementExecutor: new TurnkeyDisbursementExecutor({
      tokenRegistry,
      rpcClient,
    }),
    defaults: {
      walletFlowId: 'distribution',
      walletAccountAlias: 'primary',
    },
  });

  // Initialize with mock platform config
  const resolvedOrganizationId =
    typeof process.env.TURNKEY_ORGANIZATION_ID === 'string' &&
    process.env.TURNKEY_ORGANIZATION_ID.trim().length > 0
      ? process.env.TURNKEY_ORGANIZATION_ID.trim()
      : 'org_test_123';

  await tempCustodyService.initialize({
    environment: 'sandbox',
    organizationId: resolvedOrganizationId,
    originator: {
      originatorId: 'mvp_test',
      displayName: 'MVP Test Originator',
    },
  });

  // Only assign to module variable after successful initialization
  custodyService = tempCustodyService;

  console.log('✅ MVP Custody Service initialized with mock data');
  console.log(`📋 Loaded ${mockSnapshots.size} test originators`);

  return custodyService;
}

/**
 * Get the custody service instance
 */
export function getMVPCustodyService(): TurnkeyCustodyService {
  if (!custodyService) {
    throw new Error('MVP Custody Service not initialized. Call initializeMVPCustodyService() first.');
  }
  return custodyService;
}

/**
 * Convert API disbursement request to custody service format
 */
export function convertDisbursementRequest(
  apiRequest: {
    loanId: string;
    borrowerAddress: string;
    amount: string;
    assetType: string;
    chain: string;
    metadata?: Record<string, unknown>;
  },
  lenderId: string
): DisbursementRequest {
  // Look up originator ID from lender ID
  const originatorId = LENDER_TO_ORIGINATOR_MAP.get(lenderId);
  if (typeof originatorId !== 'string' || originatorId.trim().length === 0) {
    throw new Error(`No originator mapping found for lender: ${lenderId}`);
  }

  const chainSlug = apiRequest.chain.trim().toLowerCase();
  const chainId = CHAIN_SLUG_TO_CHAIN_ID.get(chainSlug);
  if (typeof chainId !== 'string') {
    throw new Error(`Unsupported chain '${apiRequest.chain}' for custody disbursement`);
  }

  return {
    originatorId,
    partnerId: 'partner_default', // Use default partner for MVP
    loanId: apiRequest.loanId,
    amount: apiRequest.amount,
    assetSymbol: apiRequest.assetType,
    chainId,
    borrowerAddress: apiRequest.borrowerAddress,
    metadata: {
      ...apiRequest.metadata,
      requestedChain: apiRequest.chain,
    },
  };
}

function parseProvisioningResults(data: unknown): MockProvisioningResult[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((candidate): candidate is MockProvisioningResult => isMockProvisioningResult(candidate));
}

function isMockProvisioningResult(value: unknown): value is MockProvisioningResult {
  if (!isRecord(value)) {
    return false;
  }

  const { originatorId, displayName, provisioning } = value;
  if (!isNonEmptyString(originatorId) || !isNonEmptyString(displayName) || !isRecord(provisioning)) {
    return false;
  }

  const { subOrganizationId, wallets, provisionedAt } = provisioning;
  if (!isNonEmptyString(subOrganizationId) || !isRecord(wallets) || !isNonEmptyString(provisionedAt)) {
    return false;
  }

  return Object.entries(wallets).every(isValidWalletEntry);
}

function isValidWalletEntry(entry: [string, unknown]): entry is [string, MockProvisioningWallet] {
  const [flowId, wallet] = entry;
  if (!FLOW_ID_PATTERN.test(flowId)) {
    return false;
  }
  return isMockProvisioningWallet(wallet);
}

function isMockProvisioningWallet(value: unknown): value is MockProvisioningWallet {
  if (!isRecord(value)) {
    return false;
  }

  const { walletId, accountId, address } = value;
  return isNonEmptyString(walletId) && isNonEmptyString(accountId) && isNonEmptyString(address);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
