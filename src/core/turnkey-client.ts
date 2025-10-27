import { Turnkey as TurnkeyServerSDK } from '@turnkey/sdk-server';
import type { TurnkeySDKServerConfig } from '@turnkey/sdk-server';
import type { TActivity, TurnkeyActivityConsensusNeededError } from '@turnkey/http';
import type { definitions as TurnkeyDefinitions } from '@turnkey/http/dist/__generated__/services/coordinator/public/v1/public_api.types';

import type {
  PlatformConfig,
  ProvisioningConfig,
  WalletArchitecture,
  BusinessModelConfig,
  AccessControlConfig,
  PartnerConfiguration,
  WalletFlowId,
  RootUserTemplate,
  RootUserAuthenticatorSeed,
  WalletTemplate,
  WalletAccountTemplate,
  OrganizationFeatureConfig,
  TemplateString,
  AutomationAuthenticatorSeed,
  AutomationUserTemplate,
} from '../config/types';
import type {
  SecretConfig,
  AutomationKeyCredentials,
  PasskeyAttestationSecret,
} from './secrets-manager';
import { SecretProvider, SecretsManager } from './secrets-manager';
import {
  TurnkeyServiceError,
  ErrorCodes,
  buildPolicyDeniedError,
  buildTurnkeyRequestError,
  buildActivityFailedError,
  ConsensusRequiredError,
} from './error-handler';

type TurnkeyClient = InstanceType<typeof TurnkeyServerSDK>;
type TurnkeyDefs = TurnkeyDefinitions;
type RootUserParams = TurnkeyDefs['v1RootUserParamsV4'];
type ApiKeyParams = TurnkeyDefs['v1ApiKeyParamsV2'];
type AuthenticatorParams = TurnkeyDefs['v1AuthenticatorParamsV2'];
type OauthProviderParams = TurnkeyDefs['v1OauthProviderParams'];
type WalletAccountParams = TurnkeyDefs['v1WalletAccountParams'];
type TransactionType = TurnkeyDefs['v1TransactionType'];

type ActivityResponseEnvelope = { activity: TActivity };

type ActivityConsensusMetadata = {
  requiredApprovals?: number;
  currentApprovals?: number;
};

interface SubOrganizationSummary {
  subOrganizationId?: string;
  rootUserIds?: ReadonlyArray<string>;
}

interface WalletCreateSummary {
  walletId?: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export type TemplateContext = Record<string, unknown>;

interface WalletProvisionRecord {
  walletId: string;
  accountIds: string[];
  accountAddresses: string[];
}

const encodeBase64Url = (value: string): string => {
  return Buffer.from(value, 'utf-8')
    .toString('base64')
    .replace(/=+$/u, '')
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_');
};

const decodeBase64Url = (value: string): string => {
  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded.padEnd(padded.length + padLength, '=');
  return Buffer.from(normalized, 'base64').toString('utf-8');
};

export interface ActivitySubmittedEvent {
  activityType: string;
  activityId: string;
  organizationId: string;
  payload: Record<string, unknown>;
}

export interface ActivityCompletedEvent<TResult = unknown> extends ActivitySubmittedEvent {
  result: TResult;
}

export interface ActivityFailedEvent extends ActivitySubmittedEvent {
  error: Error;
}

export interface ActivityConsensusRequiredEvent extends ActivitySubmittedEvent {
  requiredApprovals?: number;
  currentApprovals?: number;
}

export interface ActivityEventEmitter {
  submitted(event: ActivitySubmittedEvent): void;
  completed(event: ActivityCompletedEvent): void;
  failed(event: ActivityFailedEvent): void;
  consensusRequired(event: ActivityConsensusRequiredEvent): void;
}

export interface SubmitActivityOptions {
  organizationId?: string;
  automationTemplateId?: string;
  subOrganizationId?: string;
  pollForResult?: boolean;
}

export interface ActivityOutcome<TResult = unknown> {
  activityId: string;
  status: string;
  result?: TResult;
  raw: TActivity;
  consensusInfo?: ActivityConsensusRequiredEvent;
}

export interface ActivityHandle<TResult = unknown> {
  activityId: string;
  status: string;
  consensusInfo?: ActivityConsensusRequiredEvent;
  wait(): Promise<ActivityOutcome<TResult>>;
}

export interface ProvisionResult {
  subOrgId: string;
  subOrgName: string;
  rootUserIds: string[];
  wallets: Record<WalletFlowId, WalletProvisionRecord>;
}

export interface PolicyProvisionResult {
  policyIds: Record<string, string>;
  partnerPolicies: Record<string, string[]>;
}

export interface AutomationProvisionResult {
  automationUsers: Array<{
    templateId: string;
    userId: string;
    apiKeyId?: string;
    apiKeyIds?: string[];
    sessionIds?: string[];
    credentials?: AutomationKeyCredentials;
  }>;
}

export interface PartnerRuntimeConfig {
  partnerId: string;
  walletAssignments: Record<WalletFlowId, { walletId: string; accountIds: string[] }>;
  policyIds: string[];
  automationUserTemplateId?: string;
}

export interface TurnkeyRuntimeConfig {
  platform: PlatformConfig;
  secretConfig?: SecretConfig;
  events?: ActivityEventEmitter;
}

export interface SignTransactionParams {
  subOrganizationId: string;
  signWith: string;
  unsignedTransaction: string;
  transactionType?: TransactionType;
  automationTemplateId?: string;
}

export interface SignTransactionResult {
  signedTransaction: string;
  activityId: string;
}

export interface SignAndSendTransactionParams extends SignTransactionParams {
  broadcast(signedTransaction: string): Promise<string>;
}

export interface SignAndSendTransactionResult extends SignTransactionResult {
  transactionHash: string;
}

interface ClientCacheKey {
  subOrgId: string;
  templateId?: string;
}

function cacheKeyToString(key: ClientCacheKey): string {
  return key.templateId != null ? `${key.subOrgId}:${key.templateId}` : key.subOrgId;
}

export class TurnkeyClientManager {
  private static instance: TurnkeyClientManager | null = null;

  static async initialize(config: TurnkeyRuntimeConfig): Promise<TurnkeyClientManager> {
    if (TurnkeyClientManager.instance) {
      return TurnkeyClientManager.instance;
    }

    const manager = new TurnkeyClientManager(config);
    await manager.bootstrap();
    TurnkeyClientManager.instance = manager;
    return manager;
  }

  static getInstance(): TurnkeyClientManager {
    if (!TurnkeyClientManager.instance) {
      throw new TurnkeyServiceError('Turnkey client manager not initialized', ErrorCodes.MISSING_CREDENTIALS);
    }
    return TurnkeyClientManager.instance;
  }

  static isInitialized(): boolean {
    return TurnkeyClientManager.instance !== null;
  }

  static reset(): void {
    TurnkeyClientManager.instance = null;
  }

  private readonly platform: PlatformConfig;
  private readonly events?: ActivityEventEmitter;
  private readonly secretsManager: SecretsManager;
  private serverClient!: TurnkeyClient;
  private readonly clientCache = new Map<string, ReturnType<TurnkeyClient['apiClient']>>();

  private constructor(runtimeConfig: TurnkeyRuntimeConfig) {
    this.platform = runtimeConfig.platform;
    this.events = runtimeConfig.events;
    this.secretsManager = SecretsManager.getInstance(
      runtimeConfig.secretConfig ?? { provider: SecretProvider.ENVIRONMENT }
    );
  }

  private async bootstrap(): Promise<void> {
    const secrets = await this.secretsManager.loadSecrets();

    const clientConfig: TurnkeySDKServerConfig = {
      apiBaseUrl: this.platform.apiBaseUrl ?? 'https://api.turnkey.com',
      apiPrivateKey: secrets.apiPrivateKey,
      apiPublicKey: secrets.apiPublicKey,
      defaultOrganizationId: this.platform.organizationId,
      activityPoller: this.platform.activityPoller,
    };

    this.serverClient = new TurnkeyServerSDK(clientConfig);
  }

  private resolveApiClient(options?: SubmitActivityOptions): ReturnType<TurnkeyClient['apiClient']> {
    if (this.serverClient == null) {
      throw new TurnkeyServiceError('Turnkey client not initialized', ErrorCodes.MISSING_CREDENTIALS);
    }

    const rootCacheKey = cacheKeyToString({ subOrgId: this.platform.organizationId });
    if (!this.clientCache.has(rootCacheKey)) {
      const rootClient = this.serverClient.apiClient();
      this.clientCache.set(rootCacheKey, rootClient);
    }

    if (options?.automationTemplateId == null || options.automationTemplateId.trim() === '') {
      return this.clientCache.get(rootCacheKey)!;
    }

    const credentials = this.secretsManager.getAutomationCredentials(options.automationTemplateId);
    if (credentials == null) {
      throw new TurnkeyServiceError(
        `Automation credentials for template "${options.automationTemplateId}" not found`,
        ErrorCodes.MISSING_CREDENTIALS
      );
    }

    const cacheKey = cacheKeyToString({
      subOrgId: options.subOrganizationId ?? this.platform.organizationId,
      templateId: options.automationTemplateId,
    });

    if (this.clientCache.has(cacheKey)) {
      return this.clientCache.get(cacheKey)!;
    }

    const client = this.serverClient.apiClient({
      apiPrivateKey: credentials.apiPrivateKey,
      apiPublicKey: credentials.apiPublicKey,
    });

    if (credentials.apiKeyId != null && credentials.apiKeyId.trim() !== '') {
      const stampedClient = client as unknown as {
        stamper?: { stamp: (payload: string) => Promise<{ stampHeaderName: string; stampHeaderValue: string }> };
      };
      const baseStamp = stampedClient?.stamper?.stamp?.bind(stampedClient.stamper);
      if (baseStamp != null) {
        const apiKeyId = credentials.apiKeyId;
        stampedClient.stamper!.stamp = async (payload: string) => {
          const stamp = await baseStamp(payload);
          try {
            const decodedPayload = JSON.parse(decodeBase64Url(stamp.stampHeaderValue)) as Record<string, unknown>;
            if (decodedPayload.apiKeyId == null || decodedPayload.apiKeyId === '') {
              const updatedPayload = { ...decodedPayload, apiKeyId };
              return {
                ...stamp,
                stampHeaderValue: encodeBase64Url(JSON.stringify(updatedPayload)),
              };
            }
          } catch {
            // If stamp payload is not JSON we leave it untouched.
          }
          return stamp;
        };
      }
    }

    this.clientCache.set(cacheKey, client);
    return client;
  }

  getApiClient(options?: SubmitActivityOptions): ReturnType<TurnkeyClient['apiClient']> {
    return this.resolveApiClient(options);
  }

  private async pollActivity(
    client: ReturnType<TurnkeyClient['apiClient']>,
    activityId: string,
    requestOrganizationId?: string
  ): Promise<TActivity> {
    const interval = this.platform.activityPoller?.intervalMs ?? 1000;
    const maxAttempts = this.platform.activityPoller?.numRetries ?? 30;
    let attempts = 0;
    let currentResponse = await client.getActivity({
      activityId,
      organizationId: requestOrganizationId ?? this.platform.organizationId,
    });

    while (true) {
      const activity = currentResponse?.activity;
      if (activity == null) {
        throw new TurnkeyServiceError(
          `Activity ${activityId} could not be retrieved during polling`,
          ErrorCodes.NOT_FOUND,
          undefined,
          currentResponse
        );
      }

      if (this.isTerminalStatus(activity.status) || activity.status === 'ACTIVITY_STATUS_CONSENSUS_NEEDED') {
        return activity as TActivity;
      }

      if (attempts >= maxAttempts) {
        throw new TurnkeyServiceError(
          `Activity ${activityId} did not reach a terminal state after ${maxAttempts} polling attempts`,
          ErrorCodes.ACTIVITY_TIMEOUT,
          undefined,
          activity
        );
      }

      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, interval));
      currentResponse = await client.getActivity({
        activityId,
        organizationId: requestOrganizationId ?? this.platform.organizationId,
      });
    }
  }

  private isTerminalStatus(status?: string): boolean {
    return status === 'ACTIVITY_STATUS_COMPLETED' || status === 'ACTIVITY_STATUS_FAILED';
  }

  submitActivity<TResult = unknown>(
    urlPath: string,
    body: Record<string, unknown>,
    options?: SubmitActivityOptions
  ): Promise<ActivityHandle<TResult>> {
    const organizationId = options?.organizationId ?? options?.subOrganizationId ?? this.platform.organizationId;
    const payload = {
      ...body,
      organizationId,
    };

    const activityType = this.resolveActivityType(payload);

    this.events?.submitted({
      activityId: 'pending',
      activityType,
      organizationId,
      payload,
    });

    let normalizedSubmissionError: Error | undefined;
    const execute = async (): Promise<ActivityHandle<TResult>> => {
      const client = this.resolveApiClient(options);
      let response: ActivityResponseEnvelope;
      try {
        response = await client.request<typeof payload, ActivityResponseEnvelope>(urlPath, payload);
      } catch (error) {
        normalizedSubmissionError = this.normalizeError(error, payload);
        throw normalizedSubmissionError;
      }
      const activity = response.activity;
      const { id: activityId, status } = activity;

      const consensusInfo = this.buildConsensusInfo(activity, payload);
      if (consensusInfo) {
        this.events?.consensusRequired(consensusInfo);
      }

      const initialActivity = activity;

      const handle: ActivityHandle<TResult> = {
        activityId,
        status,
        consensusInfo,
        wait: async (): Promise<ActivityOutcome<TResult>> => {
          const shouldPoll = !this.isTerminalStatus(status);
          const finalActivity = shouldPoll
            ? await this.pollActivity(client, activityId, organizationId)
            : initialActivity;
          const finalConsensus = this.buildConsensusInfo(finalActivity, payload);

          if (finalActivity.status === 'ACTIVITY_STATUS_COMPLETED') {
            const result = (finalActivity.result ?? {}) as TResult;
            this.events?.completed({
              activityId,
              activityType,
              organizationId,
              payload,
              result,
            });
            return {
              activityId,
              status: finalActivity.status,
              result,
              raw: finalActivity,
              consensusInfo: finalConsensus,
            };
          }

          if (finalActivity.status === 'ACTIVITY_STATUS_CONSENSUS_NEEDED') {
            if (finalConsensus) {
              this.events?.consensusRequired(finalConsensus);
            }
            throw new ConsensusRequiredError(
              `Activity ${activityId} requires additional approvals`,
              activityId,
              finalActivity.status,
              activityType,
              finalConsensus?.requiredApprovals,
              finalConsensus?.currentApprovals,
              { ...payload, activityType }
            );
          }

          const failureMessage =
            this.extractFailureMessage(finalActivity) ?? 'Turnkey activity failed';
          const error = buildActivityFailedError(finalActivity, failureMessage, {
            ...payload,
            activityType,
          });
          this.events?.failed({
            activityId,
            activityType,
            organizationId,
            payload,
            error,
          });
          throw error;
        },
      };

      return handle;
    };

    return execute().catch((error) => {
      const turnkeyError =
        normalizedSubmissionError != null && error === normalizedSubmissionError
          ? normalizedSubmissionError
          : this.normalizeError(error, payload);
      this.events?.failed({
        activityId: 'unknown',
        activityType,
        organizationId,
        payload,
        error: turnkeyError,
      });
      throw turnkeyError;
    });
  }

  private buildConsensusInfo(activity: TActivity, payload: Record<string, unknown>): ActivityConsensusRequiredEvent | undefined {
    if (activity.status !== 'ACTIVITY_STATUS_CONSENSUS_NEEDED') {
      return undefined;
    }

    const consensusMetadata = this.extractConsensusMetadata(activity);
    if (!consensusMetadata) {
      return undefined;
    }
    return {
      activityId: activity.id,
      activityType: this.resolveActivityType(payload),
      organizationId: (payload.organizationId as string) ?? activity.organizationId ?? this.platform.organizationId,
      payload,
      requiredApprovals: consensusMetadata.requiredApprovals,
      currentApprovals: consensusMetadata.currentApprovals,
    };
  }

  private extractConsensusMetadata(activity: TActivity): ActivityConsensusMetadata | undefined {
    if (!isPlainObject(activity)) {
      return undefined;
    }
    const metadataCandidate = (activity as { consensusMetadata?: unknown }).consensusMetadata;
    if (!isPlainObject(metadataCandidate)) {
      return undefined;
    }
    const requiredApprovals =
      typeof metadataCandidate.requiredApprovals === 'number' ? metadataCandidate.requiredApprovals : undefined;
    const currentApprovals =
      typeof metadataCandidate.currentApprovals === 'number' ? metadataCandidate.currentApprovals : undefined;
    if (requiredApprovals === undefined && currentApprovals === undefined) {
      return undefined;
    }
    return { requiredApprovals, currentApprovals };
  }

  private extractFailureMessage(activity: TActivity): string | undefined {
    if (!isPlainObject(activity)) {
      return undefined;
    }
    const failure = (activity as { failure?: unknown }).failure;
    if (!isPlainObject(failure)) {
      return undefined;
    }
    const message = (failure as { failureMessage?: unknown }).failureMessage;
    return typeof message === 'string' && message.trim().length > 0 ? message : undefined;
  }

  private normalizeError(error: unknown, payload: Record<string, unknown>): Error {
    const activityType = this.resolveActivityType(payload);
    if ((error as TurnkeyActivityConsensusNeededError)?.name === 'TurnkeyActivityConsensusNeededError') {
      const consensusError = error as TurnkeyActivityConsensusNeededError;
      const event: ActivityConsensusRequiredEvent = {
        activityId: consensusError.activityId ?? 'unknown',
        activityType: consensusError.activityType ?? activityType,
        organizationId: (payload.organizationId as string) ?? this.platform.organizationId,
        payload,
      };
      this.events?.consensusRequired(event);
      return new ConsensusRequiredError(
        consensusError.message,
        consensusError.activityId,
        consensusError.activityStatus,
        consensusError.activityType,
        undefined,
        undefined,
        { ...payload, activityType }
      );
    }

    if (error instanceof TurnkeyServiceError) {
      return error;
    }

    return (
      buildPolicyDeniedError(error, { ...payload, activityType }) ??
      buildTurnkeyRequestError(error, { ...payload, activityType })
    );
  }

  // ---------------------------------------------------------------------------
  // Workflow helpers (lightweight scaffolding; domain services add orchestration)
  // ---------------------------------------------------------------------------

  async provisionSubOrganization(
    provisioning: ProvisioningConfig,
    wallets: WalletArchitecture,
    context: TemplateContext
  ): Promise<ProvisionResult> {
    const timestampMs = Date.now().toString();
    const subOrganizationName = this.renderTemplate(provisioning.nameTemplate, context);
    const provisioningContext: TemplateContext = {
      ...context,
      subOrganizationName,
    };

    const rootUsers = this.buildRootUsers(provisioning.rootUsers, provisioningContext);

    const payload = {
      timestampMs,
      type: 'ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7',
      parameters: {
        subOrganizationName,
        rootUsers,
        rootQuorumThreshold: provisioning.rootQuorumThreshold,
      },
    };

    const handle = await this.submitActivity('/public/v1/submit/create_sub_organization', payload, {
      pollForResult: true,
    });

    const outcome = await handle.wait();
    const subOrgResult = this.extractCreateSubOrganizationResult(outcome.raw.result);
    const subOrgId = subOrgResult?.subOrganizationId;
    if (!isNonEmptyString(subOrgId)) {
      throw new TurnkeyServiceError('Failed to create sub-organization', ErrorCodes.API_ERROR);
    }
    const rootUserIds = subOrgResult?.rootUserIds ? Array.from(subOrgResult.rootUserIds) : [];

    if (provisioning.featureToggles && provisioning.featureToggles.length > 0) {
      await this.applyFeatureToggles(subOrgId, provisioning.featureToggles, provisioningContext);
    }

    const walletEntries: Array<[WalletFlowId, WalletProvisionRecord]> = [];
    for (const [flowId, flowConfig] of Object.entries(wallets.flows)) {
      const walletTemplate = this.findWalletTemplate(wallets.templates, flowConfig.templateId);
      const walletContext: TemplateContext = {
        ...provisioningContext,
        walletFlowId: flowId,
        walletTemplateId: walletTemplate.templateId,
        walletUsage: walletTemplate.usage,
      };
      const walletRecord = await this.createWallet(subOrgId, walletTemplate, walletContext);
      walletEntries.push([flowId, walletRecord]);
    }
    const walletAssignments = Object.fromEntries(walletEntries);

    return {
      subOrgId,
      subOrgName: subOrganizationName,
      rootUserIds,
      wallets: walletAssignments,
    };
  }

  async configurePolicies(
    accessControl: AccessControlConfig,
    businessModel: BusinessModelConfig,
    options?: {
      subOrganizationId?: string;
      bindingContexts?: Record<string, TemplateContext>;
      templateContext?: TemplateContext;
      resolvedBindings?: Record<string, Array<{ type: string; target: string }>>;
    }
  ): Promise<PolicyProvisionResult> {
    const timestampMs = Date.now().toString();
    const renderContextFor = (templateId: string): TemplateContext => {
      const bindingContext = this.getBindingContext(options?.bindingContexts, templateId);
      return {
        ...(options?.templateContext ?? {}),
        ...(bindingContext ?? {}),
      };
    };

    const payload = {
      timestampMs,
      type: 'ACTIVITY_TYPE_CREATE_POLICIES',
      parameters: {
        policies: accessControl.policies.templates.map((template) => {
          const context = renderContextFor(template.templateId);
          const policyPayload: Record<string, unknown> = {
            policyName: template.policyName,
            effect: template.effect,
            consensus: this.renderTemplate(template.consensus.expression, context),
            condition: this.renderTemplate(template.condition.expression, context),
          };

          if (isNonEmptyString(template.notes)) {
            policyPayload.notes = this.renderTemplate(template.notes, context);
          }

          // Include resolved policy bindings if available
          const resolvedBindings = options?.resolvedBindings?.[template.templateId];
          if (resolvedBindings && resolvedBindings.length > 0) {
            policyPayload.appliesTo = resolvedBindings;
          }

          return policyPayload;
        }),
      },
    };

    const handle = await this.submitActivity<PolicyProvisionResult>('/public/v1/submit/create_policies', payload, {
      subOrganizationId: options?.subOrganizationId,
      pollForResult: true,
    });

    const outcome = await handle.wait();
    const createdPolicyIds = this.extractCreatedPolicyIds(outcome.raw.result);

    const policyIdMap = accessControl.policies.templates.reduce<Map<string, string>>((acc, template, index) => {
      const templateId = template.templateId;
      // eslint-disable-next-line security/detect-object-injection -- index is derived from trusted template iteration
      const policyId = createdPolicyIds[index];
      if (isNonEmptyString(templateId) && isNonEmptyString(policyId)) {
        acc.set(templateId, policyId);
      }
      return acc;
    }, new Map<string, string>());
    const policyIds = Object.fromEntries(policyIdMap);

    const defaultPolicyIdSet = new Set([
      ...(businessModel.partners.defaultPolicyIds ?? []).filter(isNonEmptyString),
      ...(accessControl.policies.defaultPolicyIds ?? []).filter(isNonEmptyString)
    ]);
    const partnerEntries = businessModel.partners.catalog.map<[string, string[]]>((partner: PartnerConfiguration) => {
      const requestedIds = new Set<string>(defaultPolicyIdSet);
      (partner.policyIds ?? []).filter(isNonEmptyString).forEach((policyId) => requestedIds.add(policyId));

      const resolvedIds = Array.from(requestedIds)
        .map((requestedId) => this.safeGetRecordValue(policyIds, requestedId))
        .filter(isNonEmptyString);

      return [partner.partnerId, resolvedIds];
    });
    const partnerPolicies = Object.fromEntries(partnerEntries);

    return { policyIds, partnerPolicies };
  }

  async bootstrapAutomation(
    automation: AccessControlConfig['automation'],
    context: TemplateContext,
    subOrganizationId: string
  ): Promise<AutomationProvisionResult> {
    const automationUsers: AutomationProvisionResult['automationUsers'] = [];

    const templates = automation?.templates ?? [];
    for (const [index, template] of templates.entries()) {
      const userContext: TemplateContext = {
        ...context,
        automationTemplateId: template.templateId,
        automationUserIndex: index,
      };
      const existingCredentials = this.secretsManager.getAutomationCredentials(template.templateId);
      const apiKeys = this.resolveAutomationApiKeys(template, userContext, existingCredentials);
      if (apiKeys.length === 0) {
        throw new TurnkeyServiceError(
          `Automation template "${template.templateId}" is missing API key material; provide apiKeys or pre-load TURNKEY_AUTOMATION_KEYS`,
          ErrorCodes.INVALID_CONFIG
        );
      }
      const authenticatorSeeds = this.filterAutomationAuthenticators(template.authenticators);
      const authenticators = this.mapRootUserAuthenticators(authenticatorSeeds, userContext, template.templateId);
      const oauthProviders = this.mapRootUserOauthProviders(template.oauthProviders);
      const userTags = this.mapAutomationUserTags(template.userTags, userContext);

      const timestampMs = Date.now().toString();
      const payload = {
        timestampMs,
        type: 'ACTIVITY_TYPE_CREATE_USERS_V3',
        parameters: {
          users: [
            {
              userName: this.renderTemplate(template.userNameTemplate, userContext),
              userEmail: this.renderOptionalTemplate(template.userEmailTemplate, userContext),
              userPhoneNumber: this.renderOptionalTemplate(template.userPhoneNumberTemplate, userContext),
              apiKeys,
              authenticators,
              oauthProviders,
              userTags,
            },
          ],
        },
      };

      const handle = await this.submitActivity('/public/v1/submit/create_users', payload, {
        pollForResult: true,
        subOrganizationId,
      });
      const outcome = await handle.wait();
      const { userIds, apiKeyIds: issuedApiKeyIds } = this.extractCreateUsersArtifacts(outcome.raw.result);
      const userId = userIds[0];

      const updatedCredentials = existingCredentials
        ? {
            ...existingCredentials,
            apiKeyId: issuedApiKeyIds[0] ?? existingCredentials.apiKeyId,
          }
        : undefined;

      if (updatedCredentials) {
        this.setAutomationCredentials(template.templateId, updatedCredentials);
      }

      if (isNonEmptyString(userId)) {
        automationUsers.push({
          templateId: template.templateId,
          userId,
          apiKeyId: issuedApiKeyIds[0] ?? updatedCredentials?.apiKeyId,
          apiKeyIds: issuedApiKeyIds,
          sessionIds: [],
          credentials: updatedCredentials,
        });
      }
    }

    return { automationUsers };
  }

  provisionWalletForTemplate(
    subOrganizationId: string,
    template: WalletTemplate,
    context: TemplateContext
  ): Promise<WalletProvisionRecord> {
    return this.createWallet(subOrganizationId, template, context);
  }

  deployPartnerOverrides(partner: PartnerConfiguration): PartnerRuntimeConfig {
    const assignments: Record<WalletFlowId, { walletId: string; accountIds: string[] }> = {};
    Object.keys(partner.flowOverrides ?? {}).forEach((flowId) => {
      Object.defineProperty(assignments, flowId, {
        value: { walletId: 'pending', accountIds: [] },
        writable: true,
        enumerable: true,
        configurable: true,
      });
    });

    return {
      partnerId: partner.partnerId,
      walletAssignments: assignments,
      policyIds: partner.policyIds ? Array.from(partner.policyIds) : [],
      automationUserTemplateId: partner.automationUserTemplateId,
    };
  }

  private buildRootUsers(templates: ReadonlyArray<RootUserTemplate>, context: TemplateContext): RootUserParams[] {
    return templates.map((template, index) => {
      const userContext: TemplateContext = {
        ...context,
        rootUserTemplateId: template.templateId,
        rootUserIndex: index,
      };

      const userName = this.renderTemplate(template.userNameTemplate, userContext).trim();
      if (userName == null || userName.trim() === '') {
        throw new TurnkeyServiceError(
          `Root user template "${template.templateId}" rendered an empty user name`,
          ErrorCodes.INVALID_CONFIG
        );
      }

      return {
        userName,
        userEmail: this.renderOptionalTemplate(template.userEmailTemplate, userContext),
        userPhoneNumber: this.renderOptionalTemplate(template.userPhoneNumberTemplate, userContext),
        apiKeys: this.mapRootUserApiKeys(template.apiKeys, userContext, template.templateId),
        authenticators: this.mapRootUserAuthenticators(template.authenticators, userContext, template.templateId),
        oauthProviders: this.mapRootUserOauthProviders(template.oauthProviders),
      };
    });
  }

  private mapRootUserApiKeys(
    seeds: ReadonlyArray<NonNullable<RootUserTemplate['apiKeys']>[number]> | undefined,
    context: TemplateContext,
    templateId: string,
    existingCredentials?: AutomationKeyCredentials
  ): ApiKeyParams[] {
    const apiKeys: ApiKeyParams[] = [];
    seeds?.forEach((seed, index) => {
      const keyContext: TemplateContext = {
        ...context,
        rootUserTemplateId: templateId,
        apiKeyIndex: index,
      };
      const apiKeyName = this.renderTemplate(seed.apiKeyNameTemplate, keyContext).trim();
      if (!isNonEmptyString(apiKeyName)) {
        return;
      }

      let publicKey: string | undefined;
      if (isNonEmptyString(seed.publicKeyRef)) {
        const referencedKey = this.secretsManager.getSecretByRef(seed.publicKeyRef);
        if (isNonEmptyString(referencedKey)) {
          publicKey = referencedKey.trim();
        }
      }

      if (!isNonEmptyString(publicKey) && isNonEmptyString(existingCredentials?.apiPublicKey)) {
        publicKey = existingCredentials.apiPublicKey.trim();
      }

      if (!isNonEmptyString(publicKey)) {
        return;
      }

      apiKeys.push({
        apiKeyName,
        publicKey,
        curveType: seed.curveType,
        expirationSeconds: seed.expirationSeconds !== undefined ? String(seed.expirationSeconds) : undefined,
      });
    });

    return apiKeys;
  }

  private resolveAutomationApiKeys(
    template: AutomationUserTemplate,
    context: TemplateContext,
    existingCredentials: AutomationKeyCredentials | undefined
  ): ApiKeyParams[] {
    const seeds = this.mapRootUserApiKeys(template.apiKeys, context, template.templateId, existingCredentials);
    if (seeds.length > 0) {
      return seeds;
    }

    const existingPublicKey = existingCredentials?.apiPublicKey?.trim() ?? '';
    if (!isNonEmptyString(existingPublicKey)) {
      return [];
    }

    const nameTemplate = template.apiKeys?.[0]?.apiKeyNameTemplate ?? template.userNameTemplate;
    const apiKeyName = this.renderTemplate(nameTemplate, context).trim();
    if (!isNonEmptyString(apiKeyName)) {
      return [];
    }

    return [
      {
        apiKeyName,
        publicKey: existingPublicKey,
        curveType: template.apiKeys?.[0]?.curveType ?? 'API_KEY_CURVE_P256',
        expirationSeconds: template.apiKeys?.[0]?.expirationSeconds != null
          ? String(template.apiKeys[0].expirationSeconds)
          : undefined,
      },
    ];
  }

  private mapRootUserAuthenticators(
    seeds: ReadonlyArray<NonNullable<RootUserTemplate['authenticators']>[number]> | undefined,
    context: TemplateContext,
    templateId: string
  ): AuthenticatorParams[] {
    if (seeds == null || seeds.length === 0) {
      return [];
    }

    const authenticators: AuthenticatorParams[] = [];
    seeds.forEach((seed, index) => {
      const authenticatorContext: TemplateContext = {
        ...context,
        rootUserTemplateId: templateId,
        authenticatorIndex: index,
      };
      const authenticatorName = this.renderTemplate(seed.authenticatorNameTemplate, authenticatorContext).trim();
      if (!isNonEmptyString(authenticatorName)) {
        return;
      }

      // Handle passkey authenticators (webauthn_passkey)
      if (seed.enrollmentStrategy === 'webauthn_passkey' || seed.enrollmentStrategy == null) {
        if (seed.attestationRef == null || seed.attestationRef.trim() === '') {
          return;
        }

        const attestationSecret: PasskeyAttestationSecret | undefined = this.secretsManager.getPasskeyAttestation(
          seed.attestationRef
        );
        if (attestationSecret == null) {
          return;
        }

        const transportsSource = (attestationSecret.attestation as { transports?: unknown }).transports;
        const transports =
          Array.isArray(transportsSource)
            ? transportsSource
                .filter((transport): transport is string => isNonEmptyString(transport))
                .map(
                  (transport) =>
                    transport as AuthenticatorParams['attestation']['transports'][number]
                )
            : [];

        authenticators.push({
          authenticatorName,
          challenge: attestationSecret.challenge,
          attestation: {
            ...attestationSecret.attestation,
            transports,
          },
        });
      }
      // Handle OTP authenticators (otp_email, otp_sms)
      else if (seed.enrollmentStrategy === 'otp_email' || seed.enrollmentStrategy === 'otp_sms') {
        // For OTP authenticators, we need to create a basic authenticator without attestation data
        // The Turnkey API will handle OTP setup during enrollment
        authenticators.push({
          authenticatorName,
          challenge: '', // Empty challenge for OTP authenticators
          attestation: {
            credentialId: '',
            clientDataJson: '',
            attestationObject: '',
            transports: [],
          },
        });
      }
    });

    return authenticators;
  }

  private mapRootUserOauthProviders(
    seeds: ReadonlyArray<NonNullable<RootUserTemplate['oauthProviders']>[number]> | undefined
  ): OauthProviderParams[] {
    if (seeds == null || seeds.length === 0) {
      return [];
    }

    const providers: OauthProviderParams[] = [];
    seeds.forEach((seed) => {
      const oidcToken = this.secretsManager.getSecretByRef(seed.oidcTokenRef);
      if (!isNonEmptyString(oidcToken)) {
        return;
      }
      providers.push({
        providerName: seed.providerName,
        oidcToken: oidcToken.trim(),
      });
    });

    return providers;
  }

  private filterAutomationAuthenticators(
    seeds: ReadonlyArray<AutomationAuthenticatorSeed> | undefined
  ): ReadonlyArray<RootUserAuthenticatorSeed> | undefined {
    if (seeds == null || seeds.length === 0) {
      return undefined;
    }

    const filtered = seeds.filter((seed) => seed.attestationStrategy !== 'generated_at_runtime');
    return filtered.length ? (filtered as ReadonlyArray<RootUserAuthenticatorSeed>) : undefined;
  }

  private mapAutomationUserTags(
    tags: ReadonlyArray<TemplateString> | undefined,
    context: TemplateContext
  ): string[] {
    if (tags == null || tags.length === 0) {
      return [];
    }

    const rendered = tags
      .map((tag, index) =>
        this.renderTemplate(tag, {
          ...context,
          automationUserTagIndex: index,
        }).trim()
      )
      .filter((tag): tag is string => tag.length > 0);

    return Array.from(new Set(rendered));
  }

  private renderOptionalTemplate(template: TemplateString | undefined, context: TemplateContext): string | undefined {
    if (!isNonEmptyString(template)) {
      return undefined;
    }
    const rendered = this.renderTemplate(template, context).trim();
    return rendered.length ? rendered : undefined;
  }

  private extractCreateSubOrganizationResult(
    result: unknown
  ): SubOrganizationSummary | undefined {
    if (result == null) {
      return undefined;
    }

    const payload = result as {
      createSubOrganizationResultV7?: unknown;
      createSubOrganizationResultV6?: unknown;
      createSubOrganizationResultV5?: unknown;
      createSubOrganizationResultV4?: unknown;
      createSubOrganizationResult?: unknown;
      createOrganizationResult?: unknown;
    };

    const candidate =
      payload.createSubOrganizationResultV7 ??
      payload.createSubOrganizationResultV6 ??
      payload.createSubOrganizationResultV5 ??
      payload.createSubOrganizationResultV4 ??
      payload.createSubOrganizationResult ??
      payload.createOrganizationResult ??
      undefined;

    if (!isPlainObject(candidate)) {
      return undefined;
    }

    const subOrganizationIdRaw = (candidate as { subOrganizationId?: unknown }).subOrganizationId;
    const rootUserIdsRaw = (candidate as { rootUserIds?: unknown }).rootUserIds;

    const subOrganizationId = isNonEmptyString(subOrganizationIdRaw) ? subOrganizationIdRaw.trim() : undefined;
    const rootUserIds = Array.isArray(rootUserIdsRaw)
      ? rootUserIdsRaw.filter(isNonEmptyString).map((id) => id.trim())
      : undefined;

    return { subOrganizationId, rootUserIds };
  }

  private extractCreateWalletResult(
    result: unknown
  ): WalletCreateSummary | undefined {
    if (result == null) {
      return undefined;
    }

    const payload = result as {
      createWalletResult?: unknown;
      createWalletResultV2?: unknown;
    };

    const candidate = payload.createWalletResult ?? payload.createWalletResultV2 ?? undefined;
    if (!isPlainObject(candidate)) {
      return undefined;
    }

    const walletIdRaw = (candidate as { walletId?: unknown }).walletId;
    const walletId = isNonEmptyString(walletIdRaw) ? walletIdRaw.trim() : undefined;
    return { walletId };
  }

  private extractCreatedPolicyIds(result: unknown): ReadonlyArray<string> {
    const payload = result as { createPoliciesResult?: { policyIds?: unknown } } | undefined;
    const policyIds = payload?.createPoliciesResult?.policyIds;
    if (!Array.isArray(policyIds)) {
      return [];
    }
    return policyIds
      .filter(isNonEmptyString)
      .map((id) => id.trim());
  }

  private extractCreateUsersArtifacts(
    result: unknown
  ): { userIds: string[]; apiKeyIds: string[] } {
    const payload = result as { 
      createUsersResult?: { userIds?: unknown }; 
      createApiKeysResult?: { apiKeyIds?: unknown }; 
    } | undefined;
    
    const createUsersResult = payload?.createUsersResult;
    const createApiKeysResult = payload?.createApiKeysResult;

    const userIdsRaw = createUsersResult ? (createUsersResult as { userIds?: unknown }).userIds : undefined;
    const userIds = Array.isArray(userIdsRaw)
      ? userIdsRaw.filter(isNonEmptyString).map((value) => value.trim())
      : [];

    const apiKeyIdsRaw = createApiKeysResult ? (createApiKeysResult as { apiKeyIds?: unknown }).apiKeyIds : undefined;
    const apiKeyIds = Array.isArray(apiKeyIdsRaw)
      ? apiKeyIdsRaw.filter(isNonEmptyString).map((value) => value.trim())
      : [];

    return { userIds, apiKeyIds };
  }

  private normalizeWalletAccounts(
    accounts: unknown
  ): TurnkeyDefs['v1WalletAccount'][] {
    if (!Array.isArray(accounts)) {
      return [];
    }

    return accounts.filter((candidate): candidate is TurnkeyDefs['v1WalletAccount'] => {
      if (!isPlainObject(candidate)) {
        return false;
      }
      const walletAccountId = (candidate as { walletAccountId?: unknown }).walletAccountId;
      const address = (candidate as { address?: unknown }).address;
      return isNonEmptyString(walletAccountId) && typeof address === 'string';
    });
  }

  private getBindingContext(
    contexts: Record<string, TemplateContext> | undefined,
    templateId: string
  ): TemplateContext | undefined {
    if (!contexts || !Object.prototype.hasOwnProperty.call(contexts, templateId)) {
      return undefined;
    }
    const descriptor = Object.getOwnPropertyDescriptor(contexts, templateId);
    return descriptor?.value as TemplateContext | undefined;
  }

  private safeGetRecordValue<T>(record: Record<string, T>, key: string): T | undefined {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      return undefined;
    }
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor?.value as T | undefined;
  }

  private async applyFeatureToggles(
    subOrganizationId: string,
    features: ReadonlyArray<OrganizationFeatureConfig>,
    context: TemplateContext
  ): Promise<void> {
    for (const feature of features) {
      if (feature.enabled) {
        const valueTemplate = feature.value ?? 'true';
        const value = this.renderTemplate(valueTemplate, context);
        const payload = {
          timestampMs: Date.now().toString(),
          type: 'ACTIVITY_TYPE_SET_ORGANIZATION_FEATURE',
          parameters: {
            name: feature.name,
            value,
          },
        };
        const handle = await this.submitActivity('/public/v1/submit/set_organization_feature', payload, {
          pollForResult: true,
          subOrganizationId,
        });
        await handle.wait();
      } else {
        const payload = {
          timestampMs: Date.now().toString(),
          type: 'ACTIVITY_TYPE_REMOVE_ORGANIZATION_FEATURE',
          parameters: {
            name: feature.name,
          },
        };
        const handle = await this.submitActivity('/public/v1/submit/remove_organization_feature', payload, {
          pollForResult: true,
          subOrganizationId,
        });
        await handle.wait();
      }
    }
  }

  private findWalletTemplate(templates: ReadonlyArray<WalletTemplate>, templateId: string): WalletTemplate {
    const template = templates.find((candidate) => candidate.templateId === templateId);
    if (!template) {
      throw new TurnkeyServiceError(
        `Wallet template "${templateId}" referenced in wallet flows is not defined`,
        ErrorCodes.INVALID_CONFIG
      );
    }
    return template;
  }

  private mapWalletAccount(account: WalletAccountTemplate): WalletAccountParams {
    return {
      curve: account.curve,
      pathFormat: account.pathFormat,
      path: account.path,
      addressFormat: account.addressFormat,
    };
  }

  private async createWallet(
    subOrganizationId: string,
    template: WalletTemplate,
    context: TemplateContext
  ): Promise<WalletProvisionRecord> {
    const timestampMs = Date.now().toString();
    const walletName = this.renderTemplate(template.walletNameTemplate, context);
    const accounts = template.accounts.map((account) => this.mapWalletAccount(account));

    const payload = {
      timestampMs,
      type: 'ACTIVITY_TYPE_CREATE_WALLET',
      parameters: {
        walletName,
        accounts,
        mnemonicLength: template.mnemonicLength,
      },
    };

    const handle = await this.submitActivity('/public/v1/submit/create_wallet', payload, {
      pollForResult: true,
      subOrganizationId,
    });
    const outcome = await handle.wait();
    const walletResult = this.extractCreateWalletResult(outcome.raw.result);
    const walletId = walletResult?.walletId;

    if (!isNonEmptyString(walletId)) {
      throw new TurnkeyServiceError(
        `Wallet creation failed for template "${template.templateId}"`,
        ErrorCodes.API_ERROR,
        undefined,
        undefined,
        { templateId: template.templateId }
      );
    }

    const apiClient = this.getApiClient({ subOrganizationId });
    const accountsResponse = await apiClient.getWalletAccounts({
      organizationId: subOrganizationId,
      walletId,
    });
    const walletAccounts = this.normalizeWalletAccounts(accountsResponse.accounts);

    const accountIds = walletAccounts.map((account) => account.walletAccountId);
    const accountAddresses = walletAccounts.map((account) => account.address ?? '');

    return {
      walletId,
      accountIds,
      accountAddresses,
    };
  }

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  invalidateClient(subOrgId: string, templateId?: string): void {
    const key = cacheKeyToString({ subOrgId, templateId });
    this.clientCache.delete(key);
  }

  private renderTemplate(template: string, context: TemplateContext): string {
    return template.replace(/\{(.*?)\}/g, (_substring: string, token: string) => {
      const key = token.trim();
      if (!Object.prototype.hasOwnProperty.call(context, key)) {
        return '';
      }
      const descriptor = Object.getOwnPropertyDescriptor(context, key);
      const value: unknown = descriptor?.value;
      if (value == null) {
        return '';
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return JSON.stringify(value);
    });
  }

  private resolveActivityType(payload: Record<string, unknown>): string {
    const value = payload?.['type'];
    return typeof value === 'string' ? value : 'UNKNOWN';
  }

  setAutomationCredentials(templateId: string, credentials: AutomationKeyCredentials): void {
    this.secretsManager.setAutomationCredentials(templateId, credentials);
    this.invalidateAutomationClients(templateId);
  }

  removeAutomationCredentials(templateId: string): void {
    this.secretsManager.removeAutomationCredentials(templateId);
    this.invalidateAutomationClients(templateId);
  }

  getAutomationCredentials(templateId: string): AutomationKeyCredentials | undefined {
    return this.secretsManager.getAutomationCredentials(templateId);
  }

  private invalidateAutomationClients(templateId: string): void {
    const suffix = `:${templateId}`;
    for (const key of Array.from(this.clientCache.keys())) {
      if (key === templateId || key.endsWith(suffix)) {
        this.clientCache.delete(key);
      }
    }
  }

  async signTransaction(params: SignTransactionParams): Promise<SignTransactionResult> {
    const { subOrganizationId, signWith, unsignedTransaction } = params;
    if (!this.isUsableIdentifier(signWith)) {
      throw new TurnkeyServiceError('signWith identifier is required to sign transaction', ErrorCodes.INVALID_CONFIG, undefined, {
        signWith,
      });
    }

    if (!this.isUsableIdentifier(unsignedTransaction)) {
      throw new TurnkeyServiceError(
        'Unsigned transaction payload is required to sign transaction',
        ErrorCodes.INVALID_CONFIG,
        undefined,
        { unsignedTransaction }
      );
    }

    const payload = {
      timestampMs: Date.now().toString(),
      type: 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
      organizationId: subOrganizationId,
      parameters: {
        signWith,
        unsignedTransaction,
        type: params.transactionType ?? 'TRANSACTION_TYPE_ETHEREUM',
      },
    };

    const handle = await this.submitActivity('/public/v1/submit/sign_transaction', payload, {
      pollForResult: true,
      subOrganizationId,
      automationTemplateId: params.automationTemplateId,
    });

    const outcome = await handle.wait();
    const transactionType = params.transactionType ?? 'TRANSACTION_TYPE_ETHEREUM';
    const signedTransaction = this.extractSignedTransaction(outcome.raw.result, transactionType);
    if (!isNonEmptyString(signedTransaction)) {
      throw new TurnkeyServiceError(
        'Turnkey sign transaction result did not include signedTransaction',
        ErrorCodes.API_ERROR,
        undefined,
        outcome.raw.result
      );
    }

    return {
      signedTransaction,
      activityId: outcome.activityId,
    };
  }

  async signAndSendTransaction(
    params: SignAndSendTransactionParams
  ): Promise<SignAndSendTransactionResult> {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { broadcast, ...signParamsRaw } = params;
    if (typeof broadcast !== 'function') {
      throw new TurnkeyServiceError(
        'Broadcast callback is required to sign and send transaction',
        ErrorCodes.INVALID_CONFIG,
        undefined,
        {
          subOrganizationId: params.subOrganizationId,
          signWith: params.signWith,
        }
      );
    }

    const signParams = signParamsRaw as SignTransactionParams;
    const signResult = await this.signTransaction(signParams);

    const transactionHash = await broadcast(signResult.signedTransaction);
    if (!isNonEmptyString(transactionHash)) {
      throw new TurnkeyServiceError(
        'Broadcast did not return transaction hash',
        ErrorCodes.API_ERROR,
        undefined,
        { signWith: signParams.signWith }
      );
    }

    return {
      ...signResult,
      transactionHash,
    };
  }

  private isUsableIdentifier(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && value.trim() !== 'pending';
  }

  private extractSignedTransaction(result: unknown, transactionType: string): string | undefined {
    if (!isPlainObject(result)) {
      return undefined;
    }

    const payload = result as { signTransactionResult?: unknown };
    const signResult = payload.signTransactionResult;
    if (!isPlainObject(signResult)) {
      return undefined;
    }

    const signed = (signResult as { signedTransaction?: unknown }).signedTransaction;
    if (!isNonEmptyString(signed)) {
      return undefined;
    }
    
    // Only add 0x prefix for Ethereum/EVM transactions
    // Other chains like Solana return base64, Bitcoin returns hex without prefix, etc.
    if (transactionType === 'TRANSACTION_TYPE_ETHEREUM') {
      return signed.startsWith('0x') ? signed : `0x${signed}`;
    }
    
    // Return raw payload for non-EVM chains
    return signed;
  }
}
