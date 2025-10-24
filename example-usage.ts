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
    approvalStructure: {
      mode: "threshold",
      requirements: {
        numberOfApprovers: 2,
        approverRoles: [
          { role: "Finance Manager", required: true },
          { role: "Risk Officer", required: false }
        ],
        thresholdAmount: 50000,
        alwaysRequireApproval: false
      }
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
    }
  };

  try {
    // Initialize the custody service
    const custodyService = new FireblocksCustodyService(config);
    
    console.log("✅ Fireblocks Custody Service initialized");
    console.log("📋 Configuration validated");
    console.log(`👥 ${config.lendingPartners.partners.length} lending partners configured`);
    console.log(`🔐 Approval mode: ${config.approvalStructure.mode}`);
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