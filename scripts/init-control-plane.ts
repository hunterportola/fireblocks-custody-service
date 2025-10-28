#!/usr/bin/env npx tsx

/**
 * Control Plane Database Initialization Script
 * 
 * This script initializes the control plane database and sets up the foundational
 * multi-tenant architecture. It should be run once during initial setup.
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config();

// Configuration from environment - require explicit configuration
const CONTROL_PLANE_DB_URL = process.env.CONTROL_PLANE_DATABASE_URL;
const TENANT_DB_ENCRYPTION_KEY = process.env.TENANT_DB_ENCRYPTION_KEY;

if (typeof CONTROL_PLANE_DB_URL !== 'string' || CONTROL_PLANE_DB_URL.length === 0) {
  console.error('❌ CONTROL_PLANE_DATABASE_URL environment variable is required');
  console.error('   This should point to a dedicated control plane database');
  process.exit(1);
}

if (typeof TENANT_DB_ENCRYPTION_KEY !== 'string' || TENANT_DB_ENCRYPTION_KEY.length === 0) {
  console.error('❌ TENANT_DB_ENCRYPTION_KEY environment variable is required');
  console.error('   Generate a secure key with: openssl rand -hex 32');
  process.exit(1);
}

async function main(): Promise<void> {
  console.warn('🚀 Initializing Control Plane Database...\n');

  const pool = new Pool({
    connectionString: CONTROL_PLANE_DB_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    application_name: 'custody_control_plane_init'
  });

  try {
    // Test connection
    console.warn('🔗 Testing database connection...');
    await pool.query('SELECT 1');
    console.warn('✅ Database connection successful\n');

    // Check if control plane is already initialized
    console.warn('🔍 Checking if control plane is already initialized...');
    const checkResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'tenant_registry'
    `);

    if (checkResult.rows.length > 0) {
      console.warn('⚠️  Control plane appears to already be initialized');
      console.warn('   Found existing tenant_registry table');
      
      const continueChoice = process.argv.includes('--force');
      if (!continueChoice) {
        console.warn('   Use --force flag to reinitialize\n');
        return;
      }
      
      console.warn('   --force flag detected, proceeding with reinitialization...\n');
    }

    // Read and execute control-plane schema files in lexical order
    console.warn('📄 Loading control plane schema...');
    const schemaDir = path.join(__dirname, '../database/control-plane');
    if (!fs.existsSync(schemaDir)) {
      throw new Error(`Control plane schema directory not found: ${schemaDir}`);
    }

    const schemaFiles = fs
      .readdirSync(schemaDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (schemaFiles.length === 0) {
      throw new Error(`No schema files found in ${schemaDir}`);
    }

    for (const file of schemaFiles) {
      const fullPath = path.join(schemaDir, file);
      console.warn(`🗄️  Executing ${file}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await pool.query(sql);
      console.warn(`✅ Applied ${file}`);
    }
    console.warn('');

    // Verify schema installation
    console.warn('🔬 Verifying schema installation...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'tenant_registry',
          'control_plane_api_keys',
          'tenant_provisioning_logs',
          'control_plane_health_metrics'
        )
      ORDER BY table_name
    `);

    console.warn('📊 Control plane tables:');
    tables.rows.forEach((row: { table_name: string }) => {
      console.warn(`   ✓ ${row.table_name}`);
    });

    if (tables.rows.length !== 4) {
      console.warn('⚠️  Warning: Expected 4 tables, found', tables.rows.length);
    } else {
      console.warn('✅ All control plane tables created successfully\n');
    }

    // Display encryption key information
    console.warn('🔐 Encryption Configuration:');
    console.warn('   ✓ Using TENANT_DB_ENCRYPTION_KEY from environment');
    console.warn('   🔑 Key length:', (TENANT_DB_ENCRYPTION_KEY ?? '').length, 'characters');
    console.warn('');

    // Display next steps
    console.warn('🎉 Control Plane Initialization Complete!\n');
    console.warn('📋 Next Steps:');
    console.warn('   1. Set TENANT_DB_ENCRYPTION_KEY in your environment if not already set');
    console.warn('   2. Test tenant provisioning with: npm run test-tenant-provisioning');
    console.warn('   3. Create your first tenant with the provisioning API');
    console.warn('   4. Update your application to use the new tenant authentication\n');

  } catch (error) {
    console.error('❌ Control plane initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the initialization
main().catch((error: unknown) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
