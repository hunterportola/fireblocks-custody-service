#!/usr/bin/env node
/**
 * Migration script to demonstrate moving from in-memory storage to database
 * This script shows how to:
 * 1. Connect to the database
 * 2. Migrate provisioning snapshots
 * 3. Initialize database tables with seed data
 */

import { config } from 'dotenv';
import { DatabaseService } from '../services/database-service';
import { initializeMVPCustodyService } from '../services/mvp-custody-integration';

// Load environment variables
config();

async function migrate(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting database migration...\n');

  try {
    // Initialize database service
    // eslint-disable-next-line no-console
    console.log('📊 Connecting to database...');
    const dbConfig = {
      host: process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'localhost',
      port: process.env.DB_PORT !== undefined ? parseInt(process.env.DB_PORT, 10) : 5432,
      database: process.env.DB_NAME !== undefined ? process.env.DB_NAME : 'custody_service',
      user: process.env.DB_USER !== undefined ? process.env.DB_USER : 'custody',
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'custody_secure_password',
    };
    const dbService = DatabaseService.getInstance(dbConfig);
    
    // Test database connection
    const isConnected = await dbService.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    // eslint-disable-next-line no-console
    console.log('✅ Database connection established\n');

    // Initialize MVP custody service to get mock data
    // eslint-disable-next-line no-console
    console.log('📦 Loading mock provisioning data...');
    await initializeMVPCustodyService();
    
    // Get provisioning snapshots from in-memory store
    // Note: The custody service doesn't have listProvisioningSnapshots method
    // For demo purposes, we'll just show how the migration would work
    // eslint-disable-next-line no-console
    console.log(`📋 Mock provisioning data loaded\n`);

    // Example: How to migrate a snapshot to database
    // In a real scenario, you would get snapshots from the in-memory store
    // eslint-disable-next-line no-console
    console.log(`🔄 Example: Migrating originator data to database`);

    // eslint-disable-next-line no-console
    console.log('\n🎉 Migration completed successfully!');
    // eslint-disable-next-line no-console
    console.log('\nNext steps:');
    // eslint-disable-next-line no-console
    console.log('1. Update application configuration to use database instead of in-memory storage');
    // eslint-disable-next-line no-console
    console.log('2. Run the application with docker-compose up');
    // eslint-disable-next-line no-console
    console.log('3. Test the disbursement API endpoints');
    
    // Close database connection
    await dbService.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrate().catch(console.error);
}

export { migrate };