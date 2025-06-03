#!/usr/bin/env node

/**
 * Database Migration Script for Negotiation Tables
 * 
 * This script creates the negotiation_communications and sku_negotiation_history
 * tables if they don't already exist in the database.
 * 
 * Usage: node scripts/migrate-negotiation-tables.js
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🚀 Starting negotiation tables migration...');

    // Check if tables exist
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('negotiation_communications', 'sku_negotiation_history')
    `);

    const existingTables = checkTables.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);

    let createdTables = [];

    // Create negotiation_communications table
    if (!existingTables.includes('negotiation_communications')) {
      console.log('📝 Creating negotiation_communications table...');
      await pool.query(`
        CREATE TABLE negotiation_communications (
          id SERIAL PRIMARY KEY,
          rfq_id INTEGER NOT NULL,
          version_id INTEGER,
          communication_type VARCHAR(20) NOT NULL,
          direction VARCHAR(10) NOT NULL,
          subject VARCHAR(255),
          content TEXT NOT NULL,
          contact_person VARCHAR(255),
          communication_date TIMESTAMP NOT NULL,
          follow_up_required BOOLEAN DEFAULT false,
          follow_up_date TIMESTAMP,
          follow_up_completed BOOLEAN DEFAULT false,
          follow_up_completed_at TIMESTAMP,
          entered_by_user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      createdTables.push('negotiation_communications');
      console.log('✅ Created negotiation_communications table');
    } else {
      console.log('ℹ️  negotiation_communications table already exists');
    }

    // Create sku_negotiation_history table
    if (!existingTables.includes('sku_negotiation_history')) {
      console.log('📝 Creating sku_negotiation_history table...');
      await pool.query(`
        CREATE TABLE sku_negotiation_history (
          id SERIAL PRIMARY KEY,
          rfq_id INTEGER NOT NULL,
          sku_id INTEGER NOT NULL,
          version_id INTEGER,
          communication_id INTEGER,
          change_type VARCHAR(20) NOT NULL,
          old_quantity INTEGER,
          new_quantity INTEGER,
          old_unit_price DECIMAL(10,2),
          new_unit_price DECIMAL(10,2),
          change_reason TEXT,
          changed_by VARCHAR(20) DEFAULT 'CUSTOMER',
          entered_by_user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      createdTables.push('sku_negotiation_history');
      console.log('✅ Created sku_negotiation_history table');
    } else {
      console.log('ℹ️  sku_negotiation_history table already exists');
    }

    // Create indexes for better performance
    if (createdTables.length > 0) {
      console.log('📊 Creating indexes...');
      
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_negotiation_communications_rfq_id ON negotiation_communications(rfq_id)',
        'CREATE INDEX IF NOT EXISTS idx_negotiation_communications_date ON negotiation_communications(communication_date)',
        'CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_rfq_id ON sku_negotiation_history(rfq_id)',
        'CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_sku_id ON sku_negotiation_history(sku_id)'
      ];

      for (const indexQuery of indexes) {
        try {
          await pool.query(indexQuery);
        } catch (error) {
          console.warn('⚠️  Warning: Failed to create index:', error.message);
        }
      }
      console.log('✅ Created indexes');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Tables created: ${createdTables.length}`);
    console.log(`   - Created tables: ${createdTables.join(', ') || 'None (all existed)'}`);
    console.log(`   - Existing tables: ${existingTables.join(', ') || 'None'}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
main().catch(console.error);
