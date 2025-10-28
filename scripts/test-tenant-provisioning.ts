#!/usr/bin/env npx tsx

/**
 * Tenant Provisioning Test Script
 * 
 * This script tests the complete tenant provisioning flow including:
 * - Database provisioning
 * - Tenant registration
 * - API key generation
 * - Connection testing
 */

import { ControlPlaneService } from '../src/services/control-plane-service';
import { TenantDatabaseService } from '../src/services/tenant-database-service';
import type { OriginatorRegistrationData } from '../src/services/control-plane-service';
import { createHash } from 'node:crypto';

// Test configuration
const TEST_ORIGINATOR_ID = 'acme_lending';
const TEST_DISPLAY_NAME = 'Demo Lender Corporation';

async function main(): Promise<void> {
  console.warn('🧪 Testing Tenant Provisioning Flow...\n');

  // Initialize control plane service
  console.warn('📡 Initializing Control Plane Service...');
  const controlPlane = ControlPlaneService.getInstance();
  console.warn('✅ Control Plane Service initialized\n');

  try {
    // Step 1: Check if test tenant already exists
    console.warn('🔍 Checking for existing test tenant...');
    const existingTenant = await controlPlane.getTenantInfo(TEST_ORIGINATOR_ID);
    
    if (existingTenant) {
      console.warn('⚠️  Test tenant already exists');
      console.warn(`   Status: ${existingTenant.status}`);
      console.warn(`   Database: ${existingTenant.databaseName}`);
      console.warn(`   Isolation: ${existingTenant.isolationType}`);
      
      const forceRecreate = process.argv.includes('--force');
      if (!forceRecreate) {
        console.warn('   Use --force flag to recreate the tenant');
        console.warn('   Testing connection to existing tenant...\n');
        await testExistingTenant(existingTenant.originatorId);
        return;
      }
      
      console.warn('   --force flag detected, recreating tenant...');
      await controlPlane.terminateTenant(TEST_ORIGINATOR_ID);
      console.warn('✅ Existing tenant terminated\n');
    }

    // Step 2: Create test registration data
    console.warn('📝 Creating test registration data...');
    const registrationData: OriginatorRegistrationData = {
      company: {
        legalName: 'Demo Lender Corporation',
        displayName: TEST_DISPLAY_NAME,
        originatorId: TEST_ORIGINATOR_ID,
        taxId: '12-3456789',
        incorporationState: 'DE',
        businessType: 'corporation',
      },
      primaryContact: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@demolender.com',
        phone: '+1-555-0123',
        title: 'Chief Technology Officer',
      },
      businessInfo: {
        yearEstablished: 2020,
        averageMonthlyVolume: '$5M',
        primaryMarkets: ['consumer_lending', 'small_business'],
      },
      configuration: {
        environment: 'sandbox',
        preferredChains: ['sepolia', 'ethereum'],
        complianceLevel: 'basic',
        multiSigRequirement: true,
        isolationType: 'dedicated_database',
      },
    };
    console.warn('✅ Registration data created\n');

    // Step 3: Provision tenant
    console.warn('🚀 Provisioning tenant...');
    console.warn(`   Originator ID: ${TEST_ORIGINATOR_ID}`);
    console.warn(`   Isolation Type: ${registrationData.configuration.isolationType}`);
    console.warn('');

    const provisioningResult = await controlPlane.provisionTenant(registrationData);
    
    console.warn('✅ Tenant provisioned successfully!');
    console.warn(`   Database: ${provisioningResult.databaseConfig.databaseName}`);
    console.warn(`   API Key ID: ${provisioningResult.initialApiKey.keyId}`);
    console.warn(`   Permissions: ${provisioningResult.initialApiKey.permissions.join(', ')}`);
    console.warn(`   Expires: ${provisioningResult.initialApiKey.expiresAt.toISOString()}`);
    console.warn('');

    // Step 4: Test tenant database connection
    console.warn('🔗 Testing tenant database connection...');
    const tenantDB = await TenantDatabaseService.forOriginator(TEST_ORIGINATOR_ID);
    const connectionTest = await tenantDB.testConnection();
    
    if (connectionTest) {
      console.warn('✅ Tenant database connection successful');
    } else {
      throw new Error('Tenant database connection failed');
    }

    // Step 5: Test tenant operations
    console.warn('🧪 Testing tenant database operations...');
    
    // Test originator record creation
    await tenantDB.query(`
      INSERT INTO originators (
        id, name, display_name, environment, 
        turnkey_organization_id, turnkey_suborg_id,
        branding, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = CURRENT_TIMESTAMP
    `, [
      TEST_ORIGINATOR_ID,
      registrationData.company.legalName,
      registrationData.company.displayName,
      registrationData.configuration.environment,
      `${TEST_ORIGINATOR_ID}_org`,
      `${TEST_ORIGINATOR_ID}_suborg`,
      JSON.stringify({ primaryColor: '#007bff' }),
      JSON.stringify({ features: { webhooks: true } })
    ]);
    
    // Verify originator record
    const originatorRecord = await tenantDB.getOriginatorRecord();
    if (originatorRecord) {
      console.warn('✅ Originator record created and retrieved');
      console.warn(`   Display Name: ${originatorRecord.displayName}`);
    } else {
      throw new Error('Failed to retrieve originator record');
    }

    // Step 6: Test API key lookup and user seeding
    console.warn('🔑 Testing API key lookup and user seeding...');
    const apiKeyHash = createHash('sha256')
      .update(provisioningResult.initialApiKey.apiKey)
      .digest('hex');
    
    const userRecord = await tenantDB.getUserByApiKey(apiKeyHash);
    if (userRecord) {
      console.warn('✅ API key lookup successful - user seeding worked!');
      console.warn(`   User ID: ${userRecord.id}`);
      console.warn(`   Username: ${userRecord.username}`);
      console.warn(`   User Type: ${userRecord.userType}`);
      console.warn(`   Role: ${typeof userRecord.role === 'string' && userRecord.role.length > 0 ? userRecord.role : 'N/A'}`);
      console.warn(`   Permissions: ${userRecord.permissions.join(', ')}`);
      console.warn(`   Originator ID: ${userRecord.originatorId}`);
      
      // Validate user data
      if (userRecord.userType !== 'root') {
        throw new Error(`Expected user type 'root', got: ${userRecord.userType}`);
      }
      if (!userRecord.permissions.includes('disbursements:create')) {
        throw new Error('User should have disbursements:create permission');
      }
      if (userRecord.originatorId !== TEST_ORIGINATOR_ID) {
        throw new Error(`User originator ID mismatch: expected ${TEST_ORIGINATOR_ID}, got ${userRecord.originatorId}`);
      }
    } else {
      console.error('❌ API key lookup failed - user seeding did not work properly!');
      console.error('   This indicates the P0 authentication issue has not been resolved');
      throw new Error('User seeding failed: API key does not map to a user in tenant database');
    }

    // Step 7: Clean up (optional)
    const cleanup = process.argv.includes('--cleanup');
    if (cleanup) {
      console.warn('\n🧹 Cleaning up test tenant...');
      await controlPlane.terminateTenant(TEST_ORIGINATOR_ID);
      console.warn('✅ Test tenant cleaned up');
    } else {
      console.warn('\n💾 Test tenant preserved for further testing');
      console.warn('   Use --cleanup flag to remove the test tenant after testing');
    }

    console.warn('\n🎉 Tenant Provisioning Test Complete!');
    console.warn('\n📋 Test Results:');
    console.warn('   ✓ Control plane service initialization');
    console.warn('   ✓ Tenant database provisioning');
    console.warn('   ✓ Tenant registration in control plane');
    console.warn('   ✓ Initial API key generation');
    console.warn('   ✓ Tenant database connection');
    console.warn('   ✓ Tenant database operations');
    console.warn('   ✓ Originator record management');
    
    if (!cleanup) {
      console.warn('\n🔑 API Key for Testing:');
      console.warn(`   Key: ${provisioningResult.initialApiKey.apiKey}`);
      console.warn(`   Test with: curl -H "Authorization: Bearer ${provisioningResult.initialApiKey.apiKey}" http://localhost:3000/api/disbursements`);
    }

  } catch (error) {
    console.error('\n❌ Tenant provisioning test failed:', error);
    
    // Attempt cleanup on failure
    try {
      console.warn('🧹 Attempting cleanup after failure...');
      await controlPlane.terminateTenant(TEST_ORIGINATOR_ID);
      console.warn('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError);
    }
    
    process.exit(1);
  } finally {
    await controlPlane.close();
  }
}

async function testExistingTenant(originatorId: string): Promise<void> {
  try {
    console.warn('🔗 Testing existing tenant connection...');
    const tenantDB = await TenantDatabaseService.forOriginator(originatorId);
    const connectionTest = await tenantDB.testConnection();
    
    if (connectionTest) {
      console.warn('✅ Existing tenant connection successful');
      
      // Test basic operations
      const originatorRecord = await tenantDB.getOriginatorRecord();
      if (originatorRecord) {
        console.warn('✅ Originator record accessible');
        console.warn(`   Display Name: ${originatorRecord.displayName}`);
      }
      
      console.warn('\n🎉 Existing tenant test complete!');
    } else {
      console.warn('❌ Existing tenant connection failed');
    }
    
    await tenantDB.close();
  } catch (error) {
    console.error('❌ Existing tenant test failed:', error);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});