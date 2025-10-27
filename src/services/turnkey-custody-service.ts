import type { OriginatorConfiguration, PlatformConfig, WalletFlowId } from '../config/types';
import { ConfigurationValidator } from '../config/validator';
import type {
  ProvisionedAutomationUser,
  ProvisionedWalletFlow,
  ProvisioningArtifacts,
  ProvisioningRuntimeSnapshot,
} from '../provisioner/runtime-snapshots';
import { TurnkeySuborgProvisioner } from '../provisioner/turnkey-suborg-provisioner';
import type {
  ActivityEventEmitter,
  TurnkeyClientManager,
} from '../core/turnkey-client';
import { TurnkeyClientManager as StaticTurnkeyClientManager } from '../core/turnkey-client';
import type { SecretConfig } from '../core/secrets-manager';
import { ErrorCodes, TurnkeyServiceError } from '../core/error-handler';

type NullableString = string | undefined | null;

export type CustodyServiceErrorCode =
  | 'VALIDATION_FAILED'
  | 'SNAPSHOT_STORE_NOT_CONFIGURED'
  | 'SNAPSHOT_NOT_FOUND'
  | 'PARTNER_NOT_FOUND'
  | 'WALLET_NOT_FOUND'
  | 'ACCOUNT_ALIAS_NOT_FOUND'
  | 'AUTOMATION_USER_NOT_FOUND'
  | 'ORIGINATOR_METADATA_MISSING'
  | 'CLIENT_NOT_INITIALIZED'
  | 'TRANSACTION_EXECUTOR_NOT_CONFIGURED';

export class CustodyServiceError extends Error {
  constructor(
    message: string,
    public readonly reason: CustodyServiceErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CustodyServiceError';
  }
}

export interface ProvisioningSnapshotStore {
  save(artifacts: ProvisioningArtifacts): Promise<void>;
  get(originatorId: string): Promise<ProvisioningRuntimeSnapshot | null>;
}

export class InMemorySnapshotStore implements ProvisioningSnapshotStore {
  private readonly artifactsByOriginator = new Map<string, ProvisioningArtifacts>();

  save(artifacts: ProvisioningArtifacts): Promise<void> {
    const originatorId = this.resolveOriginatorId(artifacts.provisioningSnapshot);
    if (originatorId === undefined) {
      throw new CustodyServiceError(
        'Provisioning snapshot metadata is missing originatorId',
        'ORIGINATOR_METADATA_MISSING',
        artifacts.provisioningSnapshot.metadata
      );
    }
    this.artifactsByOriginator.set(originatorId, artifacts);
    return Promise.resolve();
  }

  get(originatorId: string): Promise<ProvisioningRuntimeSnapshot | null> {
    const artifact = this.artifactsByOriginator.get(originatorId);
    return Promise.resolve(artifact?.provisioningSnapshot ?? null);
  }

  private resolveOriginatorId(snapshot: ProvisioningRuntimeSnapshot): string | undefined {
    const candidate = snapshot.metadata?.originatorId;
    return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : undefined;
  }
}

export interface DisbursementRequest {
  originatorId: string;
  partnerId: string;
  loanId: string;
  amount: string;
  assetSymbol: string;
  chainId: string;
  borrowerAddress: string;
  walletFlowId?: WalletFlowId;
  walletAccountAlias?: string;
  automationTemplateId?: string;
  metadata?: Record<string, unknown>;
}

export interface DisbursementExecutionResult {
  loanId: string;
  status: 'submitted' | 'consensus_required' | 'completed' | 'failed';
  turnkeyActivityId?: string;
  transactionHash?: string;
  signedTransaction?: string;
  details?: Record<string, unknown>;
  error?: unknown;
}

export interface DisbursementContext {
  request: DisbursementRequest;
  snapshot: ProvisioningRuntimeSnapshot;
  partner: ProvisioningRuntimeSnapshot['partners'][number];
  wallet: {
    flow: ProvisionedWalletFlow;
    flowId: WalletFlowId;
    walletId: string;
    walletTemplateId: string;
    accountAlias: string;
    accountId: string;
    accountAddress?: string;
  };
  automation?: {
    templateId?: string;
    userId?: string;
    apiKeyId?: string;
    apiKeyPublicKey?: string;
    sessionIds?: ReadonlyArray<string>;
  };
  policyIds: ReadonlyArray<string>;
}

export interface DisbursementExecutor {
  execute(context: DisbursementContext): Promise<DisbursementExecutionResult>;
}

export interface TurnkeyClientGatewayOptions {
  secretConfig?: SecretConfig;
  events?: ActivityEventEmitter;
}

export interface TurnkeyClientGateway {
  initialize(platform: PlatformConfig, options: TurnkeyClientGatewayOptions): Promise<TurnkeyClientManager>;
  getInstance(): TurnkeyClientManager;
}

export interface TurnkeyCustodyServiceOptions {
  validator?: ConfigurationValidator;
  provisioner?: TurnkeySuborgProvisioner;
  snapshotStore?: ProvisioningSnapshotStore;
  disbursementExecutor?: DisbursementExecutor;
  runtime?: TurnkeyClientGatewayOptions;
  clientGateway?: TurnkeyClientGateway;
  defaults?: {
    walletFlowId?: WalletFlowId;
    walletAccountAlias?: string;
    automationTemplateId?: string;
  };
}

export interface ProvisioningResult {
  artifacts: ProvisioningArtifacts;
  validationWarnings: ReadonlyArray<string>;
}

export interface DisbursementExecutionOptions {
  snapshot?: ProvisioningRuntimeSnapshot;
}

export class TurnkeyCustodyService {
  private readonly validator: ConfigurationValidator;
  private readonly provisioner: TurnkeySuborgProvisioner;
  private readonly snapshotStore?: ProvisioningSnapshotStore;
  private readonly disbursementExecutor?: DisbursementExecutor;
  private readonly clientGateway: TurnkeyClientGateway;
  private readonly clientOptions: TurnkeyClientGatewayOptions;
  private readonly defaultFlowId: WalletFlowId;
  private readonly defaultAccountAlias?: string;
  private readonly defaultAutomationTemplateId?: string;

  constructor(options: TurnkeyCustodyServiceOptions = {}) {
    this.validator = options.validator ?? new ConfigurationValidator();
    this.provisioner = options.provisioner ?? new TurnkeySuborgProvisioner();
    this.snapshotStore = options.snapshotStore;
    this.disbursementExecutor = options.disbursementExecutor;
    this.clientOptions = options.runtime ?? {};
    this.clientGateway =
      options.clientGateway ??
      {
        initialize: (platform) =>
          StaticTurnkeyClientManager.initialize({
            platform,
            secretConfig: this.clientOptions.secretConfig,
            events: this.clientOptions.events,
          }),
        getInstance: () => StaticTurnkeyClientManager.getInstance(),
      };

    this.defaultFlowId = options.defaults?.walletFlowId ?? 'distribution';
    this.defaultAccountAlias = options.defaults?.walletAccountAlias;
    this.defaultAutomationTemplateId = options.defaults?.automationTemplateId;
  }

  async initialize(platform: PlatformConfig): Promise<void> {
    await this.ensureClient(platform);
  }

  async provisionOriginator(config: OriginatorConfiguration): Promise<ProvisioningResult> {
    const validation = await this.validator.validate(config);
    if (!validation.isValid) {
      throw new CustodyServiceError(
        'Originator configuration failed validation',
        'VALIDATION_FAILED',
        validation
      );
    }

    await this.ensureClient(config.platform);

    const artifacts = await this.provisioner.provision(config);
    if (this.snapshotStore) {
      await this.snapshotStore.save(artifacts);
    }

    return {
      artifacts,
      validationWarnings: validation.warnings,
    };
  }

  async registerProvisioningArtifacts(artifacts: ProvisioningArtifacts): Promise<void> {
    const store = this.snapshotStore;
    if (!store) {
      throw new CustodyServiceError(
        'Snapshot store not configured; cannot register provisioning artifacts',
        'SNAPSHOT_STORE_NOT_CONFIGURED'
      );
    }
    await store.save(artifacts);
  }

  getProvisioningSnapshot(originatorId: string): Promise<ProvisioningRuntimeSnapshot | null> {
    const store = this.snapshotStore;
    if (store === undefined) {
      throw new CustodyServiceError(
        'Snapshot store not configured; unable to load provisioning snapshot',
        'SNAPSHOT_STORE_NOT_CONFIGURED'
      );
    }
    return store.get(originatorId);
  }

  async initiateDisbursement(
    request: DisbursementRequest,
    options: DisbursementExecutionOptions = {}
  ): Promise<DisbursementExecutionResult> {
    const executor = this.disbursementExecutor;
    if (executor === undefined) {
      throw new CustodyServiceError(
        'Disbursement executor not configured for TurnkeyCustodyService',
        'TRANSACTION_EXECUTOR_NOT_CONFIGURED'
      );
    }

    this.assertClientInitialized();

    const snapshot = await this.resolveSnapshot(request, options);
    const partner = snapshot.partners.find((candidate) => candidate.partnerId === request.partnerId);
    if (!partner) {
      throw new CustodyServiceError(
        `Partner "${request.partnerId}" not found in provisioning snapshot`,
        'PARTNER_NOT_FOUND',
        { partnerId: request.partnerId }
      );
    }

    const flowId = request.walletFlowId ?? this.defaultFlowId;
    const walletId = this.resolveWalletId(partner, snapshot, flowId);
    if (walletId === undefined) {
      throw new CustodyServiceError(
        `Wallet not configured for partner "${request.partnerId}" and flow "${flowId}"`,
        'WALLET_NOT_FOUND',
        { partnerId: request.partnerId, flowId }
      );
    }

    const walletFlow = this.resolveWalletFlow(snapshot, walletId, flowId, partner.partnerId);
    this.assertWalletFlowReady(walletFlow);

    const accountAlias = request.walletAccountAlias ?? this.selectAccountAlias(walletFlow);
    if (accountAlias === undefined) {
      throw new CustodyServiceError(
        `Wallet flow "${flowId}" has no accounts to service disbursement`,
        'ACCOUNT_ALIAS_NOT_FOUND',
        { flowId, walletId }
      );
    }

    const accountId = walletFlow.accountIdByAlias[accountAlias];
    if (!this.isUsableIdentifier(accountId)) {
      throw new CustodyServiceError(
        `Account alias "${accountAlias}" is not ready for wallet "${walletId}"`,
        'ACCOUNT_ALIAS_NOT_FOUND',
        { flowId, walletId, accountAlias, accountId }
      );
    }

    const automation = this.resolveAutomation(snapshot, partner, request.automationTemplateId);

    const context: DisbursementContext = {
      request,
      snapshot,
      partner,
      wallet: {
        flow: walletFlow,
        flowId,
        walletId: walletFlow.walletId,
        walletTemplateId: walletFlow.walletTemplateId,
        accountAlias,
        accountId,
        accountAddress: walletFlow.accountAddressByAlias?.[accountAlias],
      },
      automation,
      policyIds: Array.from(partner.policyIds ?? []),
    };

    return executor.execute(context);
  }

  private async ensureClient(platform: PlatformConfig): Promise<TurnkeyClientManager> {
    try {
      return this.clientGateway.getInstance();
    } catch (error) {
      if (error instanceof TurnkeyServiceError && error.code === ErrorCodes.MISSING_CREDENTIALS) {
        await this.clientGateway.initialize(platform, this.clientOptions);
        return this.clientGateway.getInstance();
      }
      throw error;
    }
  }

  private assertClientInitialized(): void {
    try {
      this.clientGateway.getInstance();
    } catch (error) {
      throw new CustodyServiceError(
        'Turnkey client manager not initialized; call initialize() or provision an originator first',
        'CLIENT_NOT_INITIALIZED',
        error
      );
    }
  }

  private async resolveSnapshot(
    request: DisbursementRequest,
    options: DisbursementExecutionOptions
  ): Promise<ProvisioningRuntimeSnapshot> {
    if (options.snapshot) {
      return options.snapshot;
    }

    if (!this.snapshotStore) {
      throw new CustodyServiceError(
        'Provisioning snapshot store not configured; supply snapshot explicitly when initiating disbursement',
        'SNAPSHOT_STORE_NOT_CONFIGURED'
      );
    }

    const snapshot = await this.snapshotStore.get(request.originatorId);
    if (!snapshot) {
      throw new CustodyServiceError(
        `Provisioning snapshot not found for originator "${request.originatorId}"`,
        'SNAPSHOT_NOT_FOUND',
        { originatorId: request.originatorId }
      );
    }
    return snapshot;
  }

  private resolveWalletId(
    partner: ProvisioningRuntimeSnapshot['partners'][number],
    snapshot: ProvisioningRuntimeSnapshot,
    flowId: WalletFlowId
  ): string | undefined {
    const partnerWalletId = partner.walletFlows?.[flowId];
    if (this.isUsableIdentifier(partnerWalletId)) {
      return partnerWalletId.trim();
    }

    const defaultFlow = snapshot.walletFlows.find(
      (flow) => flow.flowId === flowId && !this.isUsableIdentifier(flow.metadata?.partnerId)
    );
    return this.isUsableIdentifier(defaultFlow?.walletId) ? defaultFlow?.walletId : undefined;
  }

  private resolveWalletFlow(
    snapshot: ProvisioningRuntimeSnapshot,
    walletId: string,
    flowId: WalletFlowId,
    partnerId: string
  ): ProvisionedWalletFlow {
    const candidate = snapshot.walletFlows.find(
      (flow) => flow.flowId === flowId && flow.walletId === walletId
    );

    if (candidate) {
      return candidate;
    }

    const partnerScoped = snapshot.walletFlows.find(
      (flow) =>
        flow.flowId === flowId &&
        flow.metadata?.partnerId === partnerId &&
        flow.walletId === walletId
    );

    if (partnerScoped) {
      return partnerScoped;
    }

    throw new CustodyServiceError(
      `Wallet flow "${flowId}" not found for wallet "${walletId}"`,
      'WALLET_NOT_FOUND',
      { walletId, flowId, partnerId }
    );
  }

  private assertWalletFlowReady(flow: ProvisionedWalletFlow): void {
    if (!this.isUsableIdentifier(flow.walletId)) {
      throw new CustodyServiceError(
        `Wallet flow "${flow.flowId}" is not fully provisioned`,
        'WALLET_NOT_FOUND',
        { flowId: flow.flowId, walletId: flow.walletId }
      );
    }
  }

  private selectAccountAlias(flow: ProvisionedWalletFlow): string | undefined {
    if (typeof this.defaultAccountAlias === 'string') {
      const accountId = flow.accountIdByAlias[this.defaultAccountAlias];
      if (this.isUsableIdentifier(accountId)) {
        return this.defaultAccountAlias;
      }
    }
    const aliases = Object.keys(flow.accountIdByAlias ?? {});
    for (const alias of aliases) {
      const accountId = flow.accountIdByAlias[alias];
      if (this.isUsableIdentifier(accountId)) {
        return alias;
      }
    }
    return undefined;
  }

  private isUsableIdentifier(value: NullableString): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.trim() !== 'pending';
  }

  private resolveAutomation(
    snapshot: ProvisioningRuntimeSnapshot,
    partner: ProvisioningRuntimeSnapshot['partners'][number],
    requestOverride?: string
  ): DisbursementContext['automation'] {
    const templateId =
      requestOverride ??
      partner.automationUserTemplateId ??
      this.defaultAutomationTemplateId;

    if (templateId === undefined) {
      return undefined;
    }

    if (templateId.length === 0) {
      return undefined;
    }

    const automationUser = snapshot.automationUsers.find(
      (user) => user.templateId === templateId
    );

    if (!automationUser || !this.isUsableIdentifier(automationUser.userId)) {
      throw new CustodyServiceError(
        `Automation user for template "${templateId}" not available`,
        'AUTOMATION_USER_NOT_FOUND',
        { templateId }
      );
    }

    return {
      templateId,
      userId: automationUser.userId,
      apiKeyId: this.resolveApiKeyId(automationUser),
      apiKeyPublicKey: automationUser.apiKeyPublicKey,
      sessionIds: automationUser.sessionIds,
    };
  }

  private resolveApiKeyId(user: ProvisionedAutomationUser): string | undefined {
    if (this.isUsableIdentifier(user.apiKeyId)) {
      return user.apiKeyId;
    }
    const firstKey = user.apiKeyIds?.find((candidate) => this.isUsableIdentifier(candidate));
    return firstKey;
  }
}
