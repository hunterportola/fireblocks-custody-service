import { ConfigurationValidator } from '../validator-strict';
import type { OriginatorConfiguration } from '../types';

const validator = new ConfigurationValidator();

const baseConfig: OriginatorConfiguration = {
  workspace: {
    name: 'Test Company',
    environment: 'sandbox',
  },
  lendingPartners: {
    partners: [{ id: 'LP001', name: 'Partner 1', enabled: true }],
  },
  vaultStructure: {
    namingConvention: {
      prefix: 'TEST',
      distributionSuffix: '_DIST_USDC',
      collectionSuffix: '_COLL_USDC',
    },
    defaultAsset: 'USDC_ETH',
  },
  approval: {
    workflows: [
      {
        workflowId: 'wf-basic',
        name: 'Basic Review',
        trigger: {
          id: 'always',
          predicate: { kind: 'always' },
        },
        steps: [
          {
            id: 'step-review',
            name: 'Reviewer approval',
            approverRoleIds: ['junior_reviewer'],
            minApprovals: 1,
          },
        ],
      },
    ],
  },
  transactionLimits: {
    automated: {
      singleTransaction: 100000,
      dailyLimit: 1000000,
      monthlyLimit: 10000000,
    },
  },
  apiSettings: {
    ipWhitelist: ['192.0.2.1'],
    webhookEndpoint: 'https://example.com/webhook',
  },
  roleDefinitions: [
    {
      roleId: 'junior_reviewer',
      roleName: 'Junior Reviewer',
      description: 'Reviews standard disbursements',
      permissions: {
        viewDistributions: true,
        viewCollections: false,
        initiateDisbursements: false,
        approveDisbursements: true,
        viewReports: false,
        manageRoles: false,
        configureSettings: false,
      },
      requiresApproval: false,
    },
    {
      roleId: 'compliance_officer',
      roleName: 'Compliance Officer',
      description: 'Reviews high-risk transactions',
      permissions: {
        viewDistributions: true,
        viewCollections: true,
        initiateDisbursements: false,
        approveDisbursements: true,
        viewReports: true,
        manageRoles: false,
        configureSettings: false,
      },
      requiresApproval: true,
    },
  ],
};

describe('ConfigurationValidator (approval workflows)', () => {
  it('accepts a valid configuration with a simple workflow', async () => {
    const result = await validator.validate(baseConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects workflows with unknown approver roles', async () => {
    const config: OriginatorConfiguration = {
      ...baseConfig,
      approval: {
        workflows: [
          {
            workflowId: 'wf-invalid-role',
            name: 'Invalid Role Workflow',
            trigger: { id: 'always', predicate: { kind: 'always' } },
            steps: [
              {
                id: 'step-invalid',
                name: 'Invalid step',
                approverRoleIds: ['nonexistent_role'],
                minApprovals: 1,
              },
            ],
          },
        ],
      },
    };

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('roleId "nonexistent_role" is not defined in roleDefinitions')
      ])
    );
  });

  it('rejects workflows without steps', async () => {
    const config: OriginatorConfiguration = {
      ...baseConfig,
      approval: {
        workflows: [
          {
            workflowId: 'wf-no-steps',
            name: 'No Steps Workflow',
            trigger: { id: 'always', predicate: { kind: 'always' } },
            steps: [],
          },
        ],
      },
    };

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'approval.workflows[0]: at least one approval step is required'
    );
  });

  it('rejects workflows with invalid predicate values', async () => {
    const config: OriginatorConfiguration = {
      ...baseConfig,
      approval: {
        workflows: [
          {
            workflowId: 'wf-invalid-condition',
            name: 'Invalid condition',
            trigger: {
              id: 'amount-check',
              predicate: { kind: 'amount_greater_than', amount: 'abc' },
            },
            steps: baseConfig.approval.workflows[0].steps,
          },
        ],
      },
    };

    const result = await validator.validate(config);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('predicate amount must be a valid decimal string')
      ])
    );
  });

  it('produces warnings when sequential approval has insufficient minApprovals', async () => {
    const config: OriginatorConfiguration = {
      ...baseConfig,
      approval: {
        workflows: [
          {
            workflowId: 'wf-warning',
            name: 'Warning workflow',
            trigger: { id: 'always', predicate: { kind: 'always' } },
            steps: [
              {
                id: 'step-sequential',
                name: 'Sequential with warning',
                approverRoleIds: ['junior_reviewer', 'compliance_officer'],
                minApprovals: 1,
                requiresSequentialApproval: true,
              },
            ],
          },
        ],
      },
    };

    const result = await validator.validate(config);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'requiresSequentialApproval is true but minApprovals is less than approverRoleIds length'
        )
      ])
    );
  });
});
