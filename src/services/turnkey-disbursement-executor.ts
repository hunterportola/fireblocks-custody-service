import { TurnkeyClientManager } from '../core/turnkey-client';
import { TurnkeyServiceError, ErrorCodes, ConsensusRequiredError } from '../core/error-handler';
import type {
  DisbursementContext,
  DisbursementExecutionResult,
  DisbursementExecutor,
} from './turnkey-custody-service';

type TransactionType =
  | 'TRANSACTION_TYPE_ETHEREUM'
  | 'TRANSACTION_TYPE_SOLANA'
  | 'TRANSACTION_TYPE_TRON'
  | 'TRANSACTION_TYPE_BITCOIN';

export type DisbursementExecutionErrorCode =
  | 'TOKEN_NOT_CONFIGURED'
  | 'ACCOUNT_ADDRESS_UNAVAILABLE'
  | 'ACCOUNT_IDENTIFIER_UNAVAILABLE'
  | 'RPC_ENDPOINT_NOT_CONFIGURED'
  | 'RPC_ERROR'
  | 'INVALID_CHAIN_ID'
  | 'TURNKEY_SIGNING_FAILED'
  | 'INVALID_AMOUNT_FORMAT'
  | 'AMOUNT_PRECISION_EXCEEDED'
  | 'ENCODING_ERROR';

export class DisbursementExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: DisbursementExecutionErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DisbursementExecutionError';
  }
}

export interface TokenMetadata {
  symbol: string;
  chainId: string;
  contractAddress: string;
  decimals: number;
}

export interface TokenRegistry {
  resolveToken(assetSymbol: string, chainId: string): TokenMetadata | undefined;
}

export class StaticTokenRegistry implements TokenRegistry {
  private readonly tokens: Map<string, TokenMetadata>;

  constructor(entries: ReadonlyArray<TokenMetadata>) {
    this.tokens = new Map(
      entries.map((token) => [
        this.composeKey(token.symbol, token.chainId),
        { ...token, contractAddress: normalizeAddress(token.contractAddress) },
      ])
    );
  }

  resolveToken(assetSymbol: string, chainId: string): TokenMetadata | undefined {
    return this.tokens.get(this.composeKey(assetSymbol, chainId));
  }

  private composeKey(symbol: string, chainId: string): string {
    return `${symbol.toUpperCase()}::${chainId}`;
  }
}

export interface JsonRpcClient {
  request<T>(chainId: string, method: string, params: unknown[]): Promise<T>;
}

type FetchFn = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}>;

export class HttpJsonRpcClient implements JsonRpcClient {
  private readonly fetchFn: FetchFn;
  private readonly endpoints: Map<string, string>;

  constructor(endpoints: Record<string, string>, fetchFn?: FetchFn) {
    this.endpoints = new Map(Object.entries(endpoints));

    if (fetchFn) {
      this.fetchFn = fetchFn;
      return;
    }

    const globalFetch = (globalThis as { fetch?: unknown }).fetch;
    if (typeof globalFetch !== 'function') {
      // eslint-disable-next-line @typescript-eslint/require-await, require-await
      this.fetchFn = async () => {
        throw new DisbursementExecutionError(
          'Global fetch is not available; provide a fetch implementation',
          'RPC_ERROR'
        );
      };
      return;
    }

    this.fetchFn = ((url: string, init) => (globalFetch as typeof fetch)(url, init)) as FetchFn;
  }

  async request<T>(chainId: string, method: string, params: unknown[]): Promise<T> {
    const endpoint = this.endpoints.get(chainId);
    if (endpoint === undefined) {
      throw new DisbursementExecutionError(
        `RPC endpoint not configured for chain ${chainId}`,
        'RPC_ENDPOINT_NOT_CONFIGURED',
        { chainId }
      );
    }

    const response = await this.fetchFn(
      endpoint,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      }
    );

    if (!response.ok) {
      throw new DisbursementExecutionError(
        `RPC request failed with status ${response.status}`,
        'RPC_ERROR',
        {
          chainId,
          method,
          status: response.status,
          statusText: response.statusText,
        }
      );
    }

    const payload = (await response.json()) as { result?: T; error?: { code: number; message: string } };
    if (payload.error) {
      throw new DisbursementExecutionError(
        `RPC error: ${payload.error.message}`,
        'RPC_ERROR',
        { chainId, method, params, error: payload.error }
      );
    }

    return payload.result as T;
  }
}

export interface TurnkeyDisbursementExecutorOptions {
  client?: TurnkeyClientManager;
  tokenRegistry: TokenRegistry;
  rpcClient: JsonRpcClient;
  transactionType?: TransactionType;
  defaultDecimals?: number;
}

export class TurnkeyDisbursementExecutor implements DisbursementExecutor {
  private readonly clientProvider: TurnkeyClientManager | undefined;
  private readonly tokens: TokenRegistry;
  private readonly rpcClient: JsonRpcClient;
  private readonly transactionType: TransactionType;
  private readonly defaultDecimals: number;

  constructor(options: TurnkeyDisbursementExecutorOptions) {
    if (options == null) {
      throw new Error('TurnkeyDisbursementExecutor options are required');
    }
    if (options.tokenRegistry == null) {
      throw new Error('tokenRegistry is required for TurnkeyDisbursementExecutor');
    }
    if (options.rpcClient == null) {
      throw new Error('rpcClient is required for TurnkeyDisbursementExecutor');
    }

    this.clientProvider = options.client;
    this.tokens = options.tokenRegistry;
    this.rpcClient = options.rpcClient;
    this.transactionType = options.transactionType ?? 'TRANSACTION_TYPE_ETHEREUM';
    this.defaultDecimals = options.defaultDecimals ?? 6;
  }

  private get client(): TurnkeyClientManager {
    if (this.clientProvider !== undefined) {
      return this.clientProvider;
    }
    // Defer getInstance() call until execution time, not construction time
    return TurnkeyClientManager.getInstance();
  }

  async execute(context: DisbursementContext): Promise<DisbursementExecutionResult> {
    const { request, wallet, automation } = context;

    const parsedChainId = parseChainId(request.chainId);
    if (parsedChainId <= 0n) {
      throw new DisbursementExecutionError(
        `Invalid chain ID: ${request.chainId}`,
        'INVALID_CHAIN_ID',
        { chainId: request.chainId }
      );
    }

    // Preserve original chainId format for lookups since registries/RPC endpoints
    // are configured with the exact format (hex or decimal) the developer chose
    const chainIdForLookup = request.chainId.trim();
    const token = this.tokens.resolveToken(request.assetSymbol, chainIdForLookup);
    if (!token) {
      throw new DisbursementExecutionError(
        `Token ${request.assetSymbol} is not configured for chain ${request.chainId}`,
        'TOKEN_NOT_CONFIGURED',
        { assetSymbol: request.assetSymbol, chainId: request.chainId }
      );
    }

    const fromAddress = wallet.accountAddress;
    if (fromAddress === undefined || fromAddress === '') {
      throw new DisbursementExecutionError(
        `Wallet account address unavailable for alias ${wallet.accountAlias}`,
        'ACCOUNT_ADDRESS_UNAVAILABLE',
        { accountAlias: wallet.accountAlias }
      );
    }

    const accountId = (wallet.accountId ?? '').trim();
    if (accountId === '' || accountId === 'pending') {
      throw new DisbursementExecutionError(
        'Wallet account identifier is required for signing',
        'ACCOUNT_IDENTIFIER_UNAVAILABLE',
        { walletId: wallet.walletId, accountAlias: wallet.accountAlias, accountId: wallet.accountId }
      );
    }

    const borrowerAddress = normalizeAddress(request.borrowerAddress);
    const tokenAddress = token.contractAddress;
    const decimals = token.decimals ?? this.defaultDecimals;
    const amountInBaseUnits = coerceAmountToBaseUnits(request.amount, decimals, request.metadata);
    const transferData = buildErc20TransferCalldata(borrowerAddress, amountInBaseUnits);

    const nonceHex = await this.rpcClient.request<string>(chainIdForLookup, 'eth_getTransactionCount', [
      normalizeAddress(fromAddress),
      'pending',
    ]);
    const gasPriceHex = await this.rpcClient.request<string>(chainIdForLookup, 'eth_gasPrice', []);
    const gasLimitHex = await this.rpcClient.request<string>(chainIdForLookup, 'eth_estimateGas', [
      {
        from: normalizeAddress(fromAddress),
        to: tokenAddress,
        data: transferData,
        value: '0x0',
      },
    ]);

    const nonce = hexToBigInt(nonceHex);
    const gasPrice = hexToBigInt(gasPriceHex);
    const gasLimit = hexToBigInt(gasLimitHex);

    const unsignedTransaction = buildLegacyEip155Transaction({
      nonce,
      gasPrice,
      gasLimit,
      to: tokenAddress,
      value: 0n,
      data: transferData,
      chainId: parsedChainId,
    });

    let signed;
    try {
      signed = await this.signAndSendWithTurnkey(
        context,
        accountId,
        unsignedTransaction,
        chainIdForLookup,
        automation?.templateId
      );
    } catch (error) {
      const consensusResult = this.buildConsensusResult(
        error,
        context,
        {
          tokenAddress,
          fromAddress: normalizeAddress(fromAddress),
          borrowerAddress,
          amountInBaseUnits,
          nonce,
          gasPrice,
          gasLimit,
          chainId: chainIdForLookup,
        }
      );
      if (consensusResult) {
        return consensusResult;
      }
      throw error;
    }

    return {
      loanId: request.loanId,
      status: 'submitted',
      turnkeyActivityId: signed.activityId,
      signedTransaction: signed.signedTransaction,
      transactionHash: signed.transactionHash,
      details: {
        tokenAddress,
        fromAddress: normalizeAddress(fromAddress),
        toAddress: borrowerAddress,
        amount: amountInBaseUnits.toString(),
        nonce: quantityHex(nonce),
        gasPrice: quantityHex(gasPrice),
        gasLimit: quantityHex(gasLimit),
        policyIds: context.policyIds,
        chainId: chainIdForLookup,
      },
    };
  }

  private async signAndSendWithTurnkey(
    context: DisbursementContext,
    accountId: string,
    unsignedTransaction: string,
    chainId: string,
    automationTemplateId?: string
  ): Promise<{ signedTransaction: string; activityId: string; transactionHash: string }> {
    const clientWithHelper = this.client as TurnkeyClientManager & {
      signAndSendTransaction?: TurnkeyClientManager['signAndSendTransaction'];
    };

    const helper = clientWithHelper.signAndSendTransaction;
    if (typeof helper === 'function') {
      try {
        return await helper.call(this.client, {
          subOrganizationId: context.snapshot.subOrganizationId,
          signWith: accountId,
          unsignedTransaction,
          transactionType: this.transactionType,
          automationTemplateId,
          broadcast: async (signedTransaction: string) => {
            try {
              return await this.rpcClient.request<string>(chainId, 'eth_sendRawTransaction', [signedTransaction]);
            } catch (error) {
              throw new DisbursementExecutionError('Failed to broadcast signed transaction', 'RPC_ERROR', {
                error,
                chainId,
                method: 'eth_sendRawTransaction',
              });
            }
          },
        });
      } catch (error) {
        if (
          error instanceof TurnkeyServiceError &&
          error.code === ErrorCodes.CONSENSUS_REQUIRED
        ) {
          throw error;
        }
        if (error instanceof DisbursementExecutionError) {
          throw error;
        }
        throw new DisbursementExecutionError(
          'Failed to sign and send transaction with Turnkey',
          'TURNKEY_SIGNING_FAILED',
          { error, unsignedTransaction, accountId, automationTemplateId }
        );
      }
    }

    const signed = await this.signWithTurnkeyLegacy(context, accountId, unsignedTransaction, automationTemplateId);
    try {
      const transactionHash = await this.rpcClient.request<string>(chainId, 'eth_sendRawTransaction', [
        signed.signedTransaction,
      ]);
      return {
        ...signed,
        transactionHash,
      };
    } catch (error) {
      if (error instanceof DisbursementExecutionError) {
        throw error;
      }
      throw new DisbursementExecutionError('Failed to broadcast signed transaction', 'RPC_ERROR', {
        error,
        chainId,
        method: 'eth_sendRawTransaction',
      });
    }
  }

  private buildConsensusResult(
    error: unknown,
    context: DisbursementContext,
    meta: {
      tokenAddress: string;
      fromAddress: string;
      borrowerAddress: string;
      amountInBaseUnits: bigint;
      nonce: bigint;
      gasPrice: bigint;
      gasLimit: bigint;
      chainId: string;
    }
  ): DisbursementExecutionResult | undefined {
    if (!(error instanceof TurnkeyServiceError) || error.code !== ErrorCodes.CONSENSUS_REQUIRED) {
      return undefined;
    }

    const consensusError = error instanceof ConsensusRequiredError ? error : undefined;

    return {
      loanId: context.request.loanId,
      status: 'consensus_required',
      turnkeyActivityId: consensusError?.activityId,
      details: {
        tokenAddress: meta.tokenAddress,
        fromAddress: meta.fromAddress,
        toAddress: meta.borrowerAddress,
        amount: meta.amountInBaseUnits.toString(),
        nonce: quantityHex(meta.nonce),
        gasPrice: quantityHex(meta.gasPrice),
        gasLimit: quantityHex(meta.gasLimit),
        chainId: meta.chainId,
        requiredApprovals: consensusError?.requiredApprovals,
        currentApprovals: consensusError?.currentApprovals,
        activityStatus: consensusError?.activityStatus,
        activityType: consensusError?.activityType,
        policyIds: context.policyIds,
        errorContext: consensusError?.context,
      },
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  private async signWithTurnkeyLegacy(
    context: DisbursementContext,
    accountId: string,
    unsignedTransaction: string,
    automationTemplateId?: string
  ): Promise<{ signedTransaction: string; activityId: string }> {
    try {
      return await this.client.signTransaction({
        subOrganizationId: context.snapshot.subOrganizationId,
        signWith: accountId,
        unsignedTransaction,
        transactionType: this.transactionType,
        automationTemplateId,
      });
    } catch (error) {
      if (
        error instanceof TurnkeyServiceError &&
        error.code === ErrorCodes.CONSENSUS_REQUIRED
      ) {
        throw error;
      }
      throw new DisbursementExecutionError(
        'Failed to sign transaction with Turnkey',
        'TURNKEY_SIGNING_FAILED',
        { error, unsignedTransaction, accountId, automationTemplateId }
      );
    }
  }
}

interface LegacyTransactionFields {
  nonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  to: string;
  value: bigint;
  data: string;
  chainId: bigint;
}

function buildLegacyEip155Transaction(fields: LegacyTransactionFields): string {
  try {
    const elements: Buffer[] = [
      bufferFromQuantity(fields.nonce),
      bufferFromQuantity(fields.gasPrice),
      bufferFromQuantity(fields.gasLimit),
      bufferFromAddress(fields.to),
      bufferFromQuantity(fields.value),
      bufferFromData(fields.data),
      bufferFromQuantity(fields.chainId),
      Buffer.alloc(0),
      Buffer.alloc(0),
    ];
    const encoded = rlpEncodeList(elements);
    return `0x${encoded.toString('hex')}`;
  } catch (error) {
    throw new DisbursementExecutionError('Failed to encode unsigned transaction', 'ENCODING_ERROR', {
      error,
      fields,
    });
  }
}

function buildErc20TransferCalldata(to: string, amount: bigint): string {
  const methodSelector = 'a9059cbb'; // transfer(address,uint256)
  const toEncoded = pad32Bytes(stripHexPrefix(to));
  const amountHex = amount.toString(16);
  const amountEncoded = pad32Bytes(amountHex);
  return `0x${methodSelector}${toEncoded}${amountEncoded}`;
}

function coerceAmountToBaseUnits(
  amount: string,
  decimals: number,
  metadata?: Record<string, unknown>
): bigint {
  if (metadata?.amountInBaseUnits === true) {
    return parseBaseUnitAmount(amount);
  }
  return parseDecimalToBigInt(amount, decimals);
}

function parseDecimalToBigInt(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (trimmed.length === 0) {
    throw new DisbursementExecutionError('Amount cannot be empty', 'INVALID_AMOUNT_FORMAT', { amount });
  }

  if (trimmed.startsWith('-')) {
    throw new DisbursementExecutionError('Amount must be positive', 'INVALID_AMOUNT_FORMAT', { amount });
  }

  const [wholeRaw, fractionalRaw = ''] = trimmed.split('.');
  if (!/^\d+$/.test(wholeRaw ?? '')) {
    throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT', { amount });
  }
  if (!/^\d*$/.test(fractionalRaw ?? '')) {
    throw new DisbursementExecutionError('Amount must be numeric', 'INVALID_AMOUNT_FORMAT', { amount });
  }

  if (fractionalRaw.length > decimals) {
    throw new DisbursementExecutionError(
      `Amount precision exceeds ${decimals} decimal places`,
      'AMOUNT_PRECISION_EXCEEDED',
      { amount, decimals }
    );
  }

  const whole = BigInt(wholeRaw.length === 0 ? '0' : wholeRaw);
  const fractional = BigInt(fractionalRaw.padEnd(decimals, '0') || '0');
  const scale = 10n ** BigInt(decimals);

  return whole * scale + fractional;
}

function parseBaseUnitAmount(amount: string): bigint {
  const trimmed = amount.trim();
  
  if (trimmed.length === 0) {
    throw new DisbursementExecutionError(
      'Base unit amount cannot be empty',
      'INVALID_AMOUNT_FORMAT',
      { amount }
    );
  }
  
  if (trimmed.startsWith('-')) {
    throw new DisbursementExecutionError(
      'Amount must be positive',
      'INVALID_AMOUNT_FORMAT',
      { amount }
    );
  }
  
  try {
    const value = BigInt(trimmed);
    // Additional safety check in case of other negative formats
    if (value < 0n) {
      throw new DisbursementExecutionError(
        'Amount must be positive',
        'INVALID_AMOUNT_FORMAT',
        { amount }
      );
    }
    return value;
  } catch {
    throw new DisbursementExecutionError(
      'Base unit amount must be an integer string',
      'INVALID_AMOUNT_FORMAT',
      { amount }
    );
  }
}

function parseChainId(value: string): bigint {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 0n;
  }

  try {
    return trimmed.startsWith('0x') || trimmed.startsWith('0X') ? BigInt(trimmed) : BigInt(trimmed);
  } catch {
    return 0n;
  }
}

function quantityHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}

function normalizeAddress(address: string): string {
  const stripped = stripHexPrefix(address);
  if (stripped.length !== 40) {
    throw new DisbursementExecutionError(
      `Invalid address length for ${address}`,
      'ENCODING_ERROR',
      { address }
    );
  }
  return `0x${stripped.toLowerCase()}`;
}

function stripHexPrefix(value: string): string {
  return value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;
}

function pad32Bytes(value: string): string {
  return value.padStart(64, '0');
}

function bufferFromQuantity(value: bigint): Buffer {
  if (value === 0n) {
    return Buffer.alloc(0);
  }
  let hex = value.toString(16);
  if (hex.length % 2 === 1) {
    hex = `0${hex}`;
  }
  return Buffer.from(hex, 'hex');
}

function bufferFromAddress(address: string): Buffer {
  return Buffer.from(stripHexPrefix(address), 'hex');
}

function bufferFromData(data: string): Buffer {
  const stripped = stripHexPrefix(data);
  if (stripped.length === 0) {
    return Buffer.alloc(0);
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

function hexToBigInt(value: string): bigint {
  if (typeof value !== 'string') {
    throw new DisbursementExecutionError('Expected hex string from RPC response', 'RPC_ERROR', { value });
  }
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '0x' || trimmed === '0X') {
    return 0n;
  }
  return BigInt(trimmed);
}
