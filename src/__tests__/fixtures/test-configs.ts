// @ts-nocheck
/**
 * Test configuration builders and fixtures
 */

import type {
  OriginatorConfiguration,
  PartnerConfiguration,
  PolicyTemplate,
  WalletTemplate,
  AutomationUserTemplate,
  RootUserTemplate,
  PlatformEnvironment,
} from '../../config/types';

interface BuildConfigOptions {
  originatorId?: string;
  displayName?: string;
  environment?: PlatformEnvironment;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  partners?: Partial<PartnerConfiguration>[] | undefined;
  policies?: Partial<PolicyTemplate>[];
  walletTemplates?: Partial<WalletTemplate>[];
  automationTemplates?: Partial<AutomationUserTemplate>[];
  rootUsers?: Partial<RootUserTemplate>[];
  rootQuorumThreshold?: number;
}

/**
 * Builds a complete originator configuration for testing
 */
export function buildOriginatorConfig(options: BuildConfigOptions = {}): OriginatorConfiguration {
  const {
    originatorId = 'TEST_ORIG',
    displayName = 'Test Originator',
    environment = 'production' as const,
    organizationId = 'org-test-123',
    metadata,
    partners,
    policies = [],
    walletTemplates = [],
    automationTemplates = [],
    rootUsers = [],
    rootQuorumThreshold = 2,
  } = options;

  // Default wallet templates if none provided
  const defaultWalletTemplates: WalletTemplate[] = walletTemplates.length > 0 
    ? walletTemplates.map(t => ({
        templateId: t.templateId ?? 'wallet-test',
        walletNameTemplate: t.walletNameTemplate ?? 'Test Wallet',
        usage: t.usage ?? 'distribution',
        accounts: t.accounts ?? [{ alias: 'primary' }],
        ...t,
      } as WalletTemplate))
    : [
        {
          templateId: 'wallet-distribution',
          walletNameTemplate: 'Distribution Wallet',
          usage: 'distribution',
          accounts: [{ alias: 'distribution_primary' }],
        },
        {
          templateId: 'wallet-collection',
          walletNameTemplate: 'Collection Wallet',
          usage: 'collection',
          accounts: [{ alias: 'collection_primary' }],
        },
        {
          templateId: 'wallet-distribution-isolated',
          walletNameTemplate: 'Isolated Distribution Wallet',
          usage: 'distribution',
          accounts: [{ alias: 'distribution_isolated' }],
        },
        {
          templateId: 'wallet-collection-isolated',
          walletNameTemplate: 'Isolated Collection Wallet',
          usage: 'collection',
          accounts: [{ alias: 'collection_isolated' }],
        },
      ];

  // Default partners if none provided
  // Note: If partners is explicitly passed as empty array, respect that
  const defaultPartners: PartnerConfiguration[] = partners === undefined
    ? [
        {
          partnerId: 'LP001',
          displayName: 'Lending Partner One',
          enabled: true,
        },
        {
          partnerId: 'LP002',
          displayName: 'Lending Partner Two',
          enabled: true,
        },
      ]
    : partners.map(p => ({
        partnerId: p.partnerId ?? 'LP001',
        displayName: p.displayName ?? 'Test Partner',
        enabled: p.enabled !== false,
        flowOverrides: p.flowOverrides ?? {},
        metadata: p.metadata,
        ...p,
      } as PartnerConfiguration));

  // Default policies if none provided
  const defaultPolicies: PolicyTemplate[] = policies.length > 0
    ? policies.map(p => ({
        templateId: p.templateId ?? 'policy-test',
        policyName: p.policyName ?? 'Test Policy',
        effect: p.effect ?? 'EFFECT_ALLOW',
        condition: p.condition ?? { expression: 'true' },
        consensus: p.consensus ?? { expression: 'true' },
        appliesTo: p.appliesTo ?? [],
        ...p,
      } as PolicyTemplate))
    : [
        {
          templateId: 'policy-distribution-limit',
          policyName: 'Distribution Amount Limit',
          effect: 'EFFECT_ALLOW',
          condition: {
            expression: "amount <= 1000000 && asset == 'USDC'",
          },
          consensus: {
            expression: 'approvers >= 2',
          },
          appliesTo: [
            { type: 'wallet_template', target: 'wallet-distribution' },
          ],
        },
      ];

  // Default automation templates if none provided
  const defaultAutomationTemplates: AutomationUserTemplate[] = automationTemplates.length > 0
    ? automationTemplates.map(a => ({
        templateId: a.templateId || 'auto-test',
        userName: a.userName || 'test-automation',
        userTags: a.userTags || ['automation'],
        apiKeys: a.apiKeys || { keyName: 'test-key' },
        ...a,
      } as AutomationUserTemplate))
    : [
        {
          templateId: 'auto-primary',
          userName: 'primary-automation',
          userTags: ['automation', 'primary'],
          apiKeys: {
            keyName: 'primary-key',
          },
        },
      ];

  // Default root users if none provided
  const defaultRootUsers: RootUserTemplate[] = rootUsers.length > 0
    ? rootUsers.map(r => ({
        templateId: r.templateId || 'root-test',
        userName: r.userName || 'test-root',
        userEmail: r.userEmail || 'test@example.com',
        userTags: r.userTags || ['root'],
        ...r,
      } as RootUserTemplate))
    : [
        {
          templateId: 'root-primary',
          userName: 'primary-root',
          userEmail: 'primary@example.com',
          userTags: ['root', 'primary'],
        },
        {
          templateId: 'root-secondary',
          userName: 'secondary-root',
          userEmail: 'secondary@example.com',
          userTags: ['root', 'secondary'],
        },
      ];

  return {
    platform: {
      environment,
      originator: {
        originatorId,
        displayName,
        legalEntityName: `${displayName} LLC`,
        metadata,
      },
      organizationId,
    },
    provisioning: {
      nameTemplate: `originator-{originatorId}`,
      rootQuorumThreshold,
      rootUsers: defaultRootUsers,
      featureToggles: {
        enableApiKeys: true,
        enableWebAuthn: true,
        enableEmailAuth: false,
        enableEmailRecovery: false,
        enableSmsAuth: false,
      },
    },
    businessModel: {
      partners: {
        catalog: defaultPartners,
        defaultPolicyIds: ['policy-distribution-limit'],
      },
      wallets: {
        templates: defaultWalletTemplates,
        flows: {
          distribution: {
            templateId: 'wallet-distribution',
          },
          collection: {
            templateId: 'wallet-collection',
          },
        },
      },
    },
    accessControl: {
      roles: [],
      policies: {
        templates: defaultPolicies,
        defaultPolicyIds: [],
      },
      automation: {
        templates: defaultAutomationTemplates,
        defaultTemplateId: 'auto-primary',
      },
    },
  };
}

/**
 * Creates a minimal valid configuration for testing
 */
export function buildMinimalConfig(): OriginatorConfiguration {
  return buildOriginatorConfig({
    rootUsers: [{
      templateId: 'root-solo',
      userName: 'solo-root',
      userEmail: 'solo@example.com',
    }],
    rootQuorumThreshold: 1,
    walletTemplates: [{
      templateId: 'wallet-simple',
      walletName: 'Simple Wallet',
      usage: 'general',
      network: 'ETH',
      accounts: [{ alias: 'primary' }],
    }],
    partners: [],
    policies: [],
    automationTemplates: [],
  });
}

/**
 * Creates a configuration with complex policy setup
 */
export function buildComplexPolicyConfig(): OriginatorConfiguration {
  return buildOriginatorConfig({
    policies: [
      {
        templateId: 'policy-amount-limit',
        policyName: 'Transaction Amount Limit',
        effect: 'EFFECT_ALLOW',
        condition: { expression: 'amount <= 100000' },
        consensus: { expression: 'approvers >= 2' },
        appliesTo: [
          { type: 'wallet_template', target: 'wallet-distribution' },
          { type: 'partner', target: 'LP001' },
        ],
      },
      {
        templateId: 'policy-time-restriction',
        policyName: 'Business Hours Only',
        effect: 'EFFECT_DENY',
        condition: { expression: 'hour < 8 || hour > 17' },
        consensus: { expression: 'false' },
        appliesTo: [
          { type: 'user_tag', target: 'role:junior' },
        ],
      },
      {
        templateId: 'policy-asset-whitelist',
        policyName: 'Approved Assets Only',
        effect: 'EFFECT_ALLOW',
        condition: { expression: "asset in ['USDC', 'USDT', 'DAI']" },
        consensus: { expression: 'approvers >= 1' },
        appliesTo: [
          { type: 'wallet_alias', target: 'distribution_primary' },
        ],
      },
    ],
  });
}

/**
 * Creates a configuration with partner overrides
 */
export function buildPartnerOverrideConfig(): OriginatorConfiguration {
  return buildOriginatorConfig({
    partners: [
      {
        partnerId: 'LP_ISOLATED',
        displayName: 'Isolated Partner',
        enabled: true,
        flowOverrides: {
          distribution: 'wallet-distribution-isolated',
          collection: 'wallet-collection-isolated',
        },
        policyIds: ['policy-strict-limit'],
        automationUserTemplateId: 'auto-isolated',
      },
      {
        partnerId: 'LP_PARTIAL',
        displayName: 'Partial Override Partner',
        enabled: true,
        flowOverrides: {
          distribution: 'wallet-distribution-isolated',
          // Uses default collection
        },
      },
    ],
    walletTemplates: [
      {
        templateId: 'wallet-distribution',
        walletName: 'Standard Distribution',
        usage: 'distribution',
        network: 'ETH',
        accounts: [{ alias: 'dist_primary' }],
      },
      {
        templateId: 'wallet-collection',
        walletName: 'Standard Collection',
        usage: 'collection',
        network: 'ETH',
        accounts: [{ alias: 'coll_primary' }],
      },
      {
        templateId: 'wallet-distribution-isolated',
        walletName: 'Isolated Distribution',
        usage: 'distribution',
        network: 'ETH',
        accounts: [{ alias: 'dist_isolated' }],
      },
      {
        templateId: 'wallet-collection-isolated',
        walletName: 'Isolated Collection',
        usage: 'collection',
        network: 'ETH',
        accounts: [{ alias: 'coll_isolated' }],
      },
    ],
    policies: [
      {
        templateId: 'policy-strict-limit',
        policyName: 'Strict Partner Limit',
        effect: 'EFFECT_ALLOW',
        condition: { expression: 'amount <= 10000' },
        consensus: { expression: 'approvers >= 3' },
      },
    ],
    automationTemplates: [
      {
        templateId: 'auto-primary',
        userName: 'primary-automation',
        userTags: ['automation'],
        apiKeys: { keyName: 'primary-key' },
      },
      {
        templateId: 'auto-isolated',
        userName: 'isolated-automation',
        userTags: ['automation', 'isolated'],
        apiKeys: {
          keyName: 'isolated-key',
          publicKeyRef: 'ISOLATED_PUBLIC_KEY',
        },
      },
    ],
  });
}