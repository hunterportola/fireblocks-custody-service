/**
 * Example: Basic setup for Fireblocks Custody Service
 * This example shows how to configure and provision vaults for lending partners
 */

import * as dotenv from 'dotenv';
import { 
  OriginatorConfiguration,
  ConfigurationValidator,
  VaultProvisioner,
  FireblocksClientManager 
} from '../src';

// Load environment variables
dotenv.config();

//Example configuration for a loan originator
const exampleConfig: OriginatorConfiguration = {
  workspace: {
    name: "Example Lending Platform",
    environment: "sandbox"
  },
  
  lendingPartners: {
    partners: [
      { id: "LP001", name: "Capital Partners Inc", enabled: true },
      { id: "LP002", name: "Growth Fund LLC", enabled: true },
      { id: "LP003", name: "Venture Capital Co", enabled: false } // Disabled for now
    ]
  },
  
  vaultStructure: {
    namingConvention: {
      prefix: "EXAMPLE",
      distributionSuffix: "_DIST_USDC",
      collectionSuffix: "_COLL_USDC"
    },
    defaultAsset: "USDC_ETH5" // Testnet USDC on Ethereum
  },
  
  approvalStructure: {
    mode: "threshold",
    requirements: {
      numberOfApprovers: 2,
      approverRoles: [
        { role: "Risk Officer", required: true },
        { role: "Finance Manager", required: false },
        { role: "Compliance Officer", required: false }
      ],
      thresholdAmount: 50000, // Require approval for amounts >= $50k
      alwaysRequireApproval: false
    }
  },
  
  transactionLimits: {
    automated: {
      singleTransaction: 1000000,  // $1M max per transaction
      dailyLimit: 5000000,         // $5M daily limit
      monthlyLimit: 50000000       // $50M monthly limit
    }
  },
  
  apiSettings: {
    ipWhitelist: ["127.0.0.1"], // Replace with actual service IPs
    webhookEndpoint: "https://example.com/webhooks/fireblocks"
  }
};

//Main setup function

async function setupCustodyService() {
  console.log('=== Fireblocks Custody Service Setup ===\n');
  
  // Step 1: Validate configuration
  console.log('Step 1: Validating configuration...');
  const validator = new ConfigurationValidator();
  const validationResult = await validator.validate(exampleConfig);
  
  if (!validationResult.isValid) {
    console.error('Configuration validation failed:');
    validationResult.errors.forEach(error => console.error('  - ' + error));
    process.exit(1);
  }
  
  console.log('✅ Configuration is valid');
  
  if (validationResult.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validationResult.warnings.forEach(warning => console.log('  - ' + warning));
  }
  
  // Step 2: Initialize Fireblocks client
  console.log('\nStep 2: Initializing Fireblocks client...');
  try {
    const fireblocks = FireblocksClientManager.getInstance();
    console.log('✅ Fireblocks client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Fireblocks client:', error);
    console.log('\nMake sure to set the following environment variables:');
    console.log('  - FIREBLOCKS_API_KEY');
    console.log('  - FIREBLOCKS_SECRET_KEY');
    process.exit(1);
  }
  
  // Step 3: Provision vaults for enabled partners
  console.log('\nStep 3: Provisioning vaults for lending partners...');
  const provisioner = new VaultProvisioner();
  
  const enabledPartners = exampleConfig.lendingPartners.partners.filter(p => p.enabled);
  console.log(`Found ${enabledPartners.length} enabled partners`);
  
  for (const partner of enabledPartners) {
    try {
      console.log(`\nProvisioning vaults for ${partner.name} (${partner.id})...`);
      const vaults = await provisioner.provisionPartnerVaults(exampleConfig, partner.id);
      
      console.log(`✅ Created vaults for ${partner.name}:`);
      console.log(`   Distribution: ${vaults.distribution.name} (ID: ${vaults.distribution.id})`);
      console.log(`   Collection: ${vaults.collection.name} (ID: ${vaults.collection.id})`);
    } catch (error: any) {
      console.error(`❌ Failed to provision vaults for ${partner.name}:`, error.message);
      
      // Check if it's because vaults already exist
      if (error.message?.includes('already exists')) {
        console.log('   (Vaults may already exist - this is OK for testing)');
      }
    }
  }
  
  console.log('\n=== Setup Complete ===');
  console.log('\nNext steps:');
  console.log('1. Fund the distribution vaults with USDC');
  console.log('2. Whitelist recipient wallet addresses in Fireblocks console');
  console.log('3. Implement the disbursement service');
  console.log('4. Set up webhook handlers for transaction monitoring');
}

// Run the setup
setupCustodyService().catch(console.error);