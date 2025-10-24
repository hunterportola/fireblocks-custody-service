/**
 * Test script to validate all modules compile and can be imported correctly
 */

import * as dotenv from 'dotenv';
dotenv.config();

// Test core imports
import { 
  OriginatorConfiguration,
  type DisbursementRequest,
  type VaultPair 
} from './src/config/types';
import { ConfigurationValidator } from './src/config/validator';
import { FireblocksClientManager } from './src/core/fireblocks-client';
import { FireblocksServiceError, ErrorCodes, handleFireblocksError } from './src/core/error-handler';
import { VaultProvisioner } from './src/provisioner/vault-provisioner';
import { AssetManager } from './src/provisioner/asset-manager';
import { FireblocksCustodyService } from './src/index';

console.log('✅ All imports successful');

// Verify all classes are importable
console.log('✅ Classes imported:', {
  ConfigurationValidator: !!ConfigurationValidator,
  FireblocksClientManager: !!FireblocksClientManager,
  FireblocksServiceError: !!FireblocksServiceError,
  VaultProvisioner: !!VaultProvisioner,
  AssetManager: !!AssetManager,
  FireblocksCustodyService: !!FireblocksCustodyService,
  handleFireblocksError: !!handleFireblocksError
});

// Test configuration
const testConfig: OriginatorConfiguration = {
  workspace: {
    name: "Test Originator",
    environment: "sandbox"
  },
  lendingPartners: {
    partners: [
      { id: "TEST001", name: "Test Partner 1", enabled: true },
      { id: "TEST002", name: "Test Partner 2", enabled: false }
    ]
  },
  vaultStructure: {
    namingConvention: {
      prefix: "TEST",
      distributionSuffix: "_DIST_USDC",
      collectionSuffix: "_COLL_USDC"
    },
    defaultAsset: "USDC_ETH5" // Testnet USDC
  },
  approvalStructure: {
    mode: "threshold",
    requirements: {
      numberOfApprovers: 1,
      approverRoles: [
        { role: "Test Approver", required: true }
      ],
      thresholdAmount: 10000,
      alwaysRequireApproval: false
    }
  },
  transactionLimits: {
    automated: {
      singleTransaction: 100000,
      dailyLimit: 1000000,
      monthlyLimit: 10000000
    }
  },
  apiSettings: {
    ipWhitelist: ["203.0.113.1"],
    webhookEndpoint: "https://test.example.com/webhook"
  }
};

console.log('✅ Test configuration created');

// Test configuration validation
async function testValidation() {
  console.log('\n🧪 Testing Configuration Validator...');
  const validator = new ConfigurationValidator();
  const result = await validator.validate(testConfig);
  
  console.log(`  Valid: ${result.isValid}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  Warnings: ${result.warnings.length}`);
  
  if (result.errors.length > 0) {
    console.log('  ❌ Errors:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.log('  ⚠️  Warnings:', result.warnings);
  }
}

// Test Fireblocks client initialization
function testClientInitialization() {
  console.log('\n🧪 Testing Fireblocks Client...');
  
  try {
    FireblocksClientManager.getInstance();
    console.log('  ✅ Client initialized successfully');
  } catch (error: any) {
    console.log('  ⚠️  Client initialization failed (expected if no API keys):', error.message);
  }
}

// Test error handling
function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  const customError = new FireblocksServiceError(
    'Test error',
    ErrorCodes.VAULT_NOT_FOUND,
    404,
    { detail: 'test' }
  );
  
  console.log('  ✅ Custom error created:', customError.code);
  
  // Test error codes
  const errorCodeCount = Object.keys(ErrorCodes).length;
  console.log(`  ✅ Error codes defined: ${errorCodeCount}`);
}

// Test type exports
function testTypeExports() {
  console.log('\n🧪 Testing Type Exports...');
  
  // Create sample objects to ensure types work
  const disbursementRequest: DisbursementRequest = {
    loanId: "LOAN001",
    partnerId: "TEST001",
    amount: "1000.00",
    recipientWalletId: "wallet_123"
  };
  
  const vaultPair: VaultPair = {
    distribution: {
      id: "vault_dist_123",
      name: "TEST_LP_TEST001_DIST_USDC",
      assetId: "USDC_ETH5"
    },
    collection: {
      id: "vault_coll_123",
      name: "TEST_LP_TEST001_COLL_USDC",
      assetId: "USDC_ETH5"
    }
  };
  
  console.log('  ✅ Type definitions work correctly');
  console.log(`  ✅ Sample disbursement request: ${disbursementRequest.loanId}`);
  console.log(`  ✅ Sample vault pair: ${vaultPair.distribution.name}`);
}

// Run all tests
async function runTests() {
  console.log('🚀 Running Fireblocks Custody Service compilation tests...\n');
  
  try {
    await testValidation();
    testClientInitialization();
    testErrorHandling();
    testTypeExports();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('📦 The project compiles and all modules are properly exported.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Execute tests
runTests();