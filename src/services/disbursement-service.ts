import { randomBytes } from 'node:crypto';

import { TurnkeyClientManager } from '../core/turnkey-client';
import {
  TurnkeyServiceError,
  ErrorCodes,
  ConsensusRequiredError as TurnkeyConsensusRequiredError,
} from '../core/error-handler';
import {
  PolicyViolationError,
  ConsensusRequiredError as ApiConsensusRequiredError,
} from '../api/middleware/error-handler';
import type { 
  DisbursementContext, 
  DisbursementExecutionResult 
} from './turnkey-custody-service';
import { SEPOLIA_USDC_ADDRESS } from './constants';
import type {
  ProvisionedWalletFlow,
  ProvisioningRuntimeSnapshot,
  ProvisionedRootUser,
  ProvisionedAutomationUser,
  ProvisionedPolicyTemplate
} from '../provisioner/runtime-snapshots';
import { DatabaseService } from './database-service';

// Type definitions
interface TokenMetadata {
  symbol: string;
  chainId: string;
  contractAddress: string;
  decimals: number;
}

// Custom error class for disbursement execution
class DisbursementExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DisbursementExecutionError';
  }
}


const SEPOLIA_CHAIN_ID = '11155111';
const SEPOLIA_CHAIN_NAME = 'sepolia';

type SupportedChain = typeof SEPOLIA_CHAIN_NAME;

interface ChainDefinition {
  chainId: string;
  decimals: number;
  token: TokenMetadata;
}

const CHAIN_DEFINITIONS: Record<SupportedChain, ChainDefinition> = {
  [SEPOLIA_CHAIN_NAME]: {
    chainId: SEPOLIA_CHAIN_ID,
    decimals: 6,
    token: {
      symbol: 'USDC',
      chainId: SEPOLIA_CHAIN_ID,
      contractAddress: SEPOLIA_USDC_ADDRESS,
      decimals: 6,
    },
  },
};

export interface DisbursementParams {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  assetType: 'USDC';
  chain: SupportedChain;
  lenderId: string;
  turnkeySubOrgId: string;
  metadata?: Record<string, unknown>;
}

export interface DisbursementStatus {
  disbursementId: string;
  status: 'pending' | 'signing' | 'broadcasting' | 'completed' | 'failed' | 'pending_approval';
  loanId: string;
  amount: string;
  borrowerAddress: string;
  chain: string;
  txHash?: string;
  turnkeyActivityId?: string;
  timeline?: {
    initiated?: string;
    policiesEvaluated?: string;
    signed?: string;
    broadcasted?: string;
    confirmed?: string;
  };
  approvalUrl?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  originatorId?: string;
  turnkeySubOrgId?: string;
  metadata?: Record<string, unknown>;
}

export class DisbursementService {
  private turnkeyManager: TurnkeyClientManager;
  private databaseService: DatabaseService;

  constructor() {
    this.turnkeyManager = TurnkeyClientManager.getInstance();
    this.databaseService = DatabaseService.getInstance();
  }

  async createDisbursement(params: DisbursementParams): Promise<DisbursementStatus> {
    const disbursementId = this.generateDisbursementId();
    const timeline: NonNullable<DisbursementStatus['timeline']> = {
      initiated: new Date().toISOString(),
    };

    console.log(`💸 Starting disbursement ${disbursementId} for loan ${params.loanId}`);

    try {
      const chainDefinition = this.getChainDefinition(params.chain);
      this.assertAmountPrecision(params.amount, chainDefinition.decimals);

      const walletDetails = await this.resolveWalletDetails(params.turnkeySubOrgId, params.chain);
      timeline.policiesEvaluated = new Date().toISOString();

      const context = this.buildDisbursementContext(params, walletDetails, chainDefinition);
      const executorResult = await this.executeTransaction(context, chainDefinition, params.chain);

      timeline.signed = new Date().toISOString();
      timeline.broadcasted = new Date().toISOString();

      console.log(
        `✅ Disbursement ${disbursementId} submitted with tx: ${executorResult.transactionHash ?? 'pending'}`
      );

      const response = this.buildSuccessResponse(disbursementId, params, executorResult, timeline);
      
      // Save to database
      await this.databaseService.saveDisbursement(response);
      
      return response;
    } catch (error) {
      console.error(`❌ Disbursement ${disbursementId} failed:`, error);
      const turnkeyError = this.extractTurnkeyError(error);

      if (turnkeyError instanceof TurnkeyServiceError) {
        if (turnkeyError.code === ErrorCodes.POLICY_DENIED) {
          throw new PolicyViolationError('Transaction violates configured policies', {
            disbursementId,
            error: turnkeyError.message,
          });
        }
        if (turnkeyError.code === ErrorCodes.CONSENSUS_REQUIRED) {
          const consensusError = turnkeyError as TurnkeyConsensusRequiredError;
          throw new ApiConsensusRequiredError('Transaction requires additional approvals', {
            disbursementId,
            activityId: consensusError.activityId,
            requiredApprovals: consensusError.requiredApprovals,
            currentApprovals: consensusError.currentApprovals,
          });
        }
      }

      const failureResponse = this.buildFailureResponse(disbursementId, params, timeline, error);
      
      // Save failed disbursement to database
      await this.databaseService.saveDisbursement(failureResponse);
      
      return failureResponse;
    }
  }

  getDisbursementStatus(disbursementId: string): Promise<DisbursementStatus | null> {
    return this.databaseService.getDisbursement(disbursementId);
  }

  private async executeTransaction(
    context: DisbursementContext,
    chainDefinition: ChainDefinition,
    chain: SupportedChain
  ): Promise<DisbursementExecutionResult> {
    try {
      const senderAddress = context.wallet.accountAddress;
      if (typeof senderAddress !== 'string' || senderAddress.trim().length === 0) {
        throw new DisbursementExecutionError(
          'Wallet address is required to construct transaction',
          'ACCOUNT_ADDRESS_UNAVAILABLE',
          {
            walletId: context.wallet.walletId,
            accountId: context.wallet.accountId,
          }
        );
      }

      // Construct unsigned transaction
      const unsignedTx = this.constructUSDCTransfer(
        context.request.amount,
        context.request.borrowerAddress,
        chainDefinition,
        senderAddress,
        chain
      );

      // Sign transaction with Turnkey
      const signResult = await this.turnkeyManager.signTransaction({
        subOrganizationId: context.snapshot.subOrganizationId,
        signWith: context.wallet.accountId,
        unsignedTransaction: unsignedTx,
        transactionType: 'TRANSACTION_TYPE_ETHEREUM',
      });

      // Mock broadcast for MVP
      const txHash = await this.broadcastTransaction(
        chain,
        signResult.signedTransaction
      );

      return {
        loanId: context.request.loanId,
        status: 'submitted',
        turnkeyActivityId: signResult.activityId,
        transactionHash: txHash,
        signedTransaction: signResult.signedTransaction,
      };
    } catch (error) {
      throw new DisbursementExecutionError(
        'Failed to execute disbursement transaction',
        'EXECUTION_FAILED',
        error
      );
    }
  }

  private buildDisbursementContext(
    params: DisbursementParams,
    walletDetails: WalletDetails,
    chainDefinition: ChainDefinition
  ): DisbursementContext {
    const flowId = 'distribution';
    const walletTemplateId = 'default_distribution';

    const walletFlow: ProvisionedWalletFlow = {
      flowId,
      walletTemplateId,
      walletId: walletDetails.walletId,
      accountIdByAlias: {
        primary: walletDetails.accountId,
      },
      accountAddressByAlias: {
        primary: walletDetails.address,
      },
    };

    const partner = {
      partnerId: params.lenderId,
      walletFlows: { [flowId]: walletDetails.walletId },
      policyIds: [] as string[],
    };

    const snapshot: ProvisioningRuntimeSnapshot = {
      subOrganizationId: params.turnkeySubOrgId,
      name: params.turnkeySubOrgId,
      rootQuorumThreshold: 1,
      rootUsers: [] as ProvisionedRootUser[],
      automationUsers: [] as ProvisionedAutomationUser[],
      walletFlows: [walletFlow],
      policies: [] as ProvisionedPolicyTemplate[],
      partners: [partner],
      metadata: {
        originatorId: params.lenderId,
      },
    };

    return {
      request: {
        originatorId: params.lenderId,
        partnerId: params.lenderId,
        loanId: params.loanId,
        amount: params.amount,
        assetSymbol: params.assetType,
        chainId: chainDefinition.chainId,
        borrowerAddress: params.borrowerAddress,
        walletFlowId: flowId,
        walletAccountAlias: 'primary',
        metadata: params.metadata,
      },
      snapshot,
      partner,
      wallet: {
        flow: walletFlow,
        flowId,
        walletId: walletDetails.walletId,
        walletTemplateId,
        accountAlias: 'primary',
        accountId: walletDetails.accountId,
        accountAddress: walletDetails.address,
      },
      automation: undefined,
      policyIds: [],
    };
  }

  private buildSuccessResponse(
    disbursementId: string,
    params: DisbursementParams,
    result: DisbursementExecutionResult,
    timeline: NonNullable<DisbursementStatus['timeline']>
  ): DisbursementStatus {
    // Map execution result status to disbursement status
    let status: DisbursementStatus['status'];
    switch (result.status) {
      case 'submitted':
        status = 'broadcasting';
        break;
      case 'consensus_required':
        status = 'pending_approval';
        break;
      case 'completed':
        status = 'completed';
        break;
      case 'failed':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    return {
      disbursementId,
      status,
      loanId: params.loanId,
      amount: params.amount,
      borrowerAddress: params.borrowerAddress,
      chain: params.chain,
      txHash: result.transactionHash,
      turnkeyActivityId: result.turnkeyActivityId,
      timeline,
      originatorId: params.lenderId, // TODO: Get actual originator from context
      turnkeySubOrgId: params.turnkeySubOrgId,
      metadata: params.metadata,
    };
  }

  private buildFailureResponse(
    disbursementId: string,
    params: DisbursementParams,
    timeline: NonNullable<DisbursementStatus['timeline']>,
    error: unknown
  ): DisbursementStatus {
    return {
      disbursementId,
      status: 'failed',
      loanId: params.loanId,
      amount: params.amount,
      borrowerAddress: params.borrowerAddress,
      chain: params.chain,
      timeline,
      error: {
        code: error instanceof DisbursementExecutionError ? error.code : 'DISBURSEMENT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      originatorId: params.lenderId, // TODO: Get actual originator from context
      turnkeySubOrgId: params.turnkeySubOrgId,
      metadata: params.metadata,
    };
  }

  private extractTurnkeyError(error: unknown): TurnkeyServiceError | undefined {
    if (error instanceof TurnkeyServiceError) {
      return error;
    }
    if (error instanceof DisbursementExecutionError) {
      const details = error.details as { error?: unknown } | TurnkeyServiceError | undefined;
      if (details instanceof TurnkeyServiceError) {
        return details;
      }
      if (isTurnkeyErrorContainer(details)) {
        return details.error;
      }
    }
    return undefined;
  }

  private async resolveWalletDetails(subOrgId: string, chain: string): Promise<WalletDetails> {
    try {
      const apiClient = this.turnkeyManager.getApiClient({ subOrganizationId: subOrgId });
      const walletsResponse = await apiClient.getWallets({ organizationId: subOrgId });

      if (!Array.isArray(walletsResponse.wallets) || walletsResponse.wallets.length === 0) {
        throw new TurnkeyServiceError(
          `No wallets found in sub-organization ${subOrgId}`,
          ErrorCodes.NOT_FOUND
        );
      }

      const wallet = walletsResponse.wallets[0];
      if (!wallet.walletId) {
        throw new TurnkeyServiceError('Wallet ID is missing from wallet response', ErrorCodes.API_ERROR);
      }

      const accountsResponse = await apiClient.getWalletAccounts({
        organizationId: subOrgId,
        walletId: wallet.walletId,
      });

      if (!Array.isArray(accountsResponse.accounts) || accountsResponse.accounts.length === 0) {
        throw new TurnkeyServiceError(
          `No accounts found in wallet ${wallet.walletId}`,
          ErrorCodes.NOT_FOUND
        );
      }

      const account = accountsResponse.accounts[0];
      if (!account.walletAccountId) {
        throw new TurnkeyServiceError(
          'Wallet account ID is missing from account response',
          ErrorCodes.API_ERROR
        );
      }

      const accountResponse = await apiClient.getWalletAccount({
        organizationId: subOrgId,
        walletId: wallet.walletId,
        address: account.address,
      });

      const walletAccountData =
        accountResponse.account ??
        (accountResponse as { walletAccount?: { address?: string | null } }).walletAccount;
      const resolvedAddress = typeof walletAccountData?.address === 'string' ? walletAccountData.address.trim() : '';

      if (resolvedAddress.length === 0) {
        throw new TurnkeyServiceError(
          `Wallet account ${account.walletAccountId} has no address`,
          ErrorCodes.NOT_FOUND
        );
      }

      console.log(
        `🔑 Using wallet account ${account.walletAccountId} (${resolvedAddress}) for chain ${chain}`
      );
      return {
        walletId: wallet.walletId,
        accountId: account.walletAccountId,
        address: resolvedAddress,
      };
    } catch (error) {
      console.error('Failed to resolve wallet details:', error);
      throw new TurnkeyServiceError(
        'Failed to retrieve wallet information for signing',
        ErrorCodes.API_ERROR,
        undefined,
        error
      );
    }
  }

  private getChainDefinition(chain: SupportedChain): ChainDefinition {
    const definition = CHAIN_DEFINITIONS[chain];
    if (definition === undefined) {
      throw new TurnkeyServiceError(
        `Unsupported chain configuration: ${chain}`,
        ErrorCodes.INVALID_CONFIG,
        undefined,
        { chain }
      );
    }
    return definition;
  }

  private assertAmountPrecision(amount: string, decimals: number): void {
    const [, fractional = ''] = amount.split('.');
    if (fractional.length > decimals) {
      throw new TurnkeyServiceError(
        `Amount precision exceeds ${decimals} decimal places`,
        ErrorCodes.INVALID_CONFIG,
        undefined,
        { amount }
      );
    }
  }

  private generateDisbursementId(): string {
    return `disb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private constructUSDCTransfer(
    amount: string,
    recipientAddress: string,
    chainDefinition: ChainDefinition,
    fromAddress: string,
    chainLabel: SupportedChain
  ): string {
    const usdcContract = chainDefinition.token.contractAddress;
    
    // Convert amount to base units (USDC has 6 decimals)
    const amountInBaseUnits = this.parseUSDCAmount(amount);
    
    // Construct transaction data
    const data = this.constructUSDCTransferCalldata(recipientAddress, amountInBaseUnits);

    const normalizedRecipient = normalizeHexAddress(recipientAddress);
    const normalizedToken = normalizeHexAddress(usdcContract);
    const normalizedFrom = normalizeHexAddress(fromAddress);

    const unsignedTransaction = buildLegacyUnsignedTransaction({
      nonce: 0n,
      gasPrice: 2_000_000_000n, // 2 gwei placeholder
      gasLimit: 100_000n,
      to: normalizedToken,
      value: 0n,
      data,
      chainId: parseChainIdToBigInt(chainDefinition.chainId),
    });

    console.log(`🔨 Constructed USDC transfer:`, {
      from: normalizedFrom,
      to: normalizedToken,
      amount,
      recipient: normalizedRecipient,
      chain: chainLabel,
    });

    return unsignedTransaction;
  }

  private async broadcastTransaction(
    chain: string,
    _signedTransaction: string
  ): Promise<string> {
    // Mock transaction broadcasting for MVP
    console.log(`📡 Broadcasting transaction to ${chain}...`);
    
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
    
    // Generate mock transaction hash
    const txHash = `0x${randomBytes(32).toString('hex')}`;
    
    console.log(`✅ Transaction broadcasted: ${txHash}`);
    return txHash;
  }

  private parseUSDCAmount(amount: string): bigint {
    const decimals = 6;
    const trimmed = amount.trim();
    if (trimmed.length === 0) {
      throw new DisbursementExecutionError('Amount cannot be empty', 'INVALID_AMOUNT_FORMAT', { amount });
    }

    if (trimmed.startsWith('-')) {
      throw new DisbursementExecutionError('Amount must be positive', 'INVALID_AMOUNT_FORMAT', { amount });
    }

    const [rawWhole, rawFractional = ''] = trimmed.split('.');
    if (!/^[0-9]+$/.test(rawWhole ?? '')) {
      throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT', { amount });
    }
    if (!/^[0-9]*$/.test(rawFractional ?? '')) {
      throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT', { amount });
    }
    if (rawFractional.length > decimals) {
      throw new DisbursementExecutionError(
        `Amount precision exceeds ${decimals} decimal places`,
        'AMOUNT_PRECISION_EXCEEDED',
        { amount }
      );
    }

    const wholeWei = BigInt(rawWhole.length ? rawWhole : '0') * BigInt(10 ** decimals);
    const fractionalWei = BigInt(rawFractional.padEnd(decimals, '0') || '0');

    return wholeWei + fractionalWei;
  }

  private constructUSDCTransferCalldata(to: string, amount: bigint): string {
    const selector = '0xa9059cbb';
    const toEncoded = normalizeHexAddress(to).slice(2).padStart(64, '0');
    const amountEncoded = amount.toString(16).padStart(64, '0');
    return `${selector}${toEncoded}${amountEncoded}`;
  }

}

interface WalletDetails {
  walletId: string;
  accountId: string;
  address: string;
}

interface LegacyUnsignedTransactionFields {
  nonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  to: string;
  value: bigint;
  data: string;
  chainId: bigint;
}

function buildLegacyUnsignedTransaction(fields: LegacyUnsignedTransactionFields): string {
  const elements: Buffer[] = [
    quantityToBuffer(fields.nonce),
    quantityToBuffer(fields.gasPrice),
    quantityToBuffer(fields.gasLimit),
    addressToBuffer(fields.to),
    quantityToBuffer(fields.value),
    dataToBuffer(fields.data),
    quantityToBuffer(fields.chainId),
    Buffer.alloc(0),
    Buffer.alloc(0),
  ];

  const encoded = rlpEncodeList(elements);
  return `0x${encoded.toString('hex')}`;
}

function parseChainIdToBigInt(chainId: string): bigint {
  try {
    return chainId.trim().startsWith('0x') ? BigInt(chainId) : BigInt(chainId);
  } catch (error) {
    throw new DisbursementExecutionError('Invalid chain ID', 'INVALID_CHAIN_ID', {
      chainId,
      error,
    });
  }
}

function normalizeHexAddress(address: string): string {
  const trimmed = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new DisbursementExecutionError('Invalid address format', 'ENCODING_ERROR', { address });
  }
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

function isTurnkeyErrorContainer(
  value: unknown
): value is { error: TurnkeyServiceError } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (value as { error?: unknown }).error instanceof TurnkeyServiceError;
}

function quantityToBuffer(value: bigint): Buffer {
  if (value === 0n) {
    return Buffer.alloc(0);
  }
  let hex = value.toString(16);
  if (hex.length % 2 === 1) {
    hex = `0${hex}`;
  }
  return Buffer.from(hex, 'hex');
}

function addressToBuffer(address: string): Buffer {
  return Buffer.from(normalizeHexAddress(address).slice(2), 'hex');
}

function dataToBuffer(data: string): Buffer {
  const stripped = data.trim().startsWith('0x') ? data.trim().slice(2) : data.trim();
  if (stripped.length === 0) {
    return Buffer.alloc(0);
  }
  if (stripped.length % 2 === 1) {
    return Buffer.from(`0${stripped}`, 'hex');
  }
  return Buffer.from(stripped, 'hex');
}

function rlpEncodeList(elements: Buffer[]): Buffer {
  const encodedElements = elements.map(rlpEncodeElement);
  const payload = Buffer.concat(encodedElements);

  if (payload.length <= 55) {
    return Buffer.concat([Buffer.from([0xc0 + payload.length]), payload]);
  }

  const lengthBuffer = encodeLength(payload.length);
  return Buffer.concat([Buffer.from([0xf7 + lengthBuffer.length]), lengthBuffer, payload]);
}

function rlpEncodeElement(data: Buffer): Buffer {
  if (data.length === 0) {
    return Buffer.from([0x80]);
  }
  if (data.length === 1 && data[0] < 0x80) {
    return data;
  }
  if (data.length <= 55) {
    return Buffer.concat([Buffer.from([0x80 + data.length]), data]);
  }
  const lengthBuffer = encodeLength(data.length);
  return Buffer.concat([Buffer.from([0xb7 + lengthBuffer.length]), lengthBuffer, data]);
}

function encodeLength(length: number): Buffer {
  let hex = length.toString(16);
  if (hex.length % 2 === 1) {
    hex = `0${hex}`;
  }
  return Buffer.from(hex, 'hex');
}
