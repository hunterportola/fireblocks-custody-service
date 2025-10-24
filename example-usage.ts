/* eslint-disable no-console */

/**
 * Example usage of the Fireblocks Custody Service SDK
 * This demonstrates how an originator would use the SDK
 */

import { FireblocksCustodyService, OriginatorConfiguration } from './src/index';

async function main() {
  // Configuration that would normally come from a form/UI
  const config: OriginatorConfiguration = {
    workspace: {
      name: "ACME Lending",
      environment: "sandbox"
    },
    lendingPartners: {
      partners: [
        { id: "LP001", name: "Capital Finance", enabled: true },
        { id: "LP002", name: "Quick Loans Inc", enabled: true }
      ]
    },
    vaultStructure: {
      namingConvention: {
        prefix: "ACME",
        distributionSuffix: "_DIST_USDC",
        collectionSuffix: "_COLL_USDC"
      },
      defaultAsset: "USDC_ETH5" // Testnet USDC
    },
    approval: {
      workflows: [
        {
          workflowId: "wf-standard",
          name: "Standard Review",
          trigger: { id: "default", predicate: { kind: "always" } },
          steps: [
            {
              id: "step-finance",
              name: "Finance Manager Review",
              approverRoleIds: ["finance_manager"],
              minApprovals: 1
            },
            {
              id: "step-compliance",
              name: "Compliance Sign-off",
              approverRoleIds: ["compliance_officer"],
              minApprovals: 1,
              escalationRoleId: "senior_reviewer"
            }
          ]
        },
        {
          workflowId: "wf-high-value",
          name: "High Value Approval",
          trigger: {
            id: "high-value",
            predicate: { kind: "amount_greater_than", amount: "500000" }
          },
          steps: [
            {
              id: "step-senior",
              name: "Senior Reviewer",
              approverRoleIds: ["senior_reviewer"],
              minApprovals: 1
            },
            {
              id: "step-executive",
              name: "Executive Approval",
              approverRoleIds: ["executive_committee"],
              minApprovals: 1,
              requiresSequentialApproval: true
            }
          ],
          timeoutBehaviour: {
            timeoutHours: 24,
            onTimeout: "escalate",
            escalationRoleId: "executive_committee"
          }
        }
      ]
    },
    transactionLimits: {
      automated: {
        singleTransaction: 100000,
        dailyLimit: 500000,
        monthlyLimit: 5000000
      }
    },
    apiSettings: {
      ipWhitelist: ["203.0.113.1", "203.0.113.2"],
      webhookEndpoint: "https://api.acmelending.com/fireblocks/webhook"
    },
    roleDefinitions: [
      {
        roleId: "finance_manager",
        roleName: "Finance Manager",
        description: "Reviews standard disbursements",
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false
        },
        requiresApproval: false
      },
      {
        roleId: "compliance_officer",
        roleName: "Compliance Officer",
        description: "Reviews compliance-sensitive transactions",
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false
        },
        requiresApproval: true
      },
      {
        roleId: "senior_reviewer",
        roleName: "Senior Reviewer",
        description: "Approves escalated transactions",
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false
        },
        requiresApproval: true
      },
      {
        roleId: "executive_committee",
        roleName: "Executive Committee",
        description: "Final approval authority for large loans",
        permissions: {
          viewDistributions: true,
          viewCollections: true,
          initiateDisbursements: false,
          approveDisbursements: true,
          viewReports: true,
          manageRoles: false,
          configureSettings: false
        },
        requiresApproval: true
      }
    ]
  };

  try {
    // Initialize the custody service
    const custodyService = new FireblocksCustodyService(config);
    
    console.log("✅ Fireblocks Custody Service initialized");
    console.log("📋 Configuration validated");
    console.log(`👥 ${config.lendingPartners.partners.length} lending partners configured`);
    const primaryWorkflow = config.approval.workflows[0];
    console.log(`🔐 Primary approval workflow: ${primaryWorkflow.name}`);
    console.log(`💰 Daily transaction limit: $${config.transactionLimits.automated.dailyLimit.toLocaleString()}`);
    
    // In a real implementation, you would:
    // 1. Call custodyService.setup() to provision vaults
    // 2. Use custodyService to process disbursements
    // 3. Monitor collections via webhooks
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the example
main().catch(console.error);
