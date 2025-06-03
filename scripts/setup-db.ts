#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates all tables using Drizzle schema
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient } from '../db';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Check if database is accessible
    console.log('📡 Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');

    // Create all tables by running a comprehensive CREATE TABLE script
    console.log('📝 Creating tables...');
    
    // Create enums first
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE rfq_status AS ENUM ('NEW', 'DRAFT', 'PRICED', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'PROCESSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE customer_type AS ENUM ('WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    const createTablesSQL = `
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'EMPLOYEE',
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Customers Table
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type customer_type NOT NULL,
        region VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        contact_person VARCHAR(255),
        quickbooks_id VARCHAR(100),
        is_active BOOLEAN DEFAULT true NOT NULL,
        main_customer BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Vendors Table
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        contact_person VARCHAR(255),
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true NOT NULL,
        quickbooks_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Inventory Items Table
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL UNIQUE,
        mpn VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
        description TEXT NOT NULL,
        stock INTEGER DEFAULT 0 NOT NULL,
        cost_cad REAL,
        cost_usd REAL,
        warehouse_location VARCHAR(100),
        quantity_on_hand INTEGER NOT NULL DEFAULT 0,
        quantity_reserved INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        last_sale_date DATE,
        quickbooks_item_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- RFQs Table
      CREATE TABLE IF NOT EXISTS rfqs (
        id SERIAL PRIMARY KEY,
        rfq_number VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requestor_id INTEGER REFERENCES users(id) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) NOT NULL,
        vendor_id INTEGER REFERENCES vendors(id),
        status rfq_status DEFAULT 'NEW' NOT NULL,
        due_date DATE,
        attachments JSONB,
        total_budget REAL,
        approved_by INTEGER REFERENCES users(id),
        rejection_reason TEXT,
        source VARCHAR(100) NOT NULL,
        notes TEXT,
        current_version_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- RFQ Items Table
      CREATE TABLE IF NOT EXISTS rfq_items (
        id SERIAL PRIMARY KEY,
        rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50),
        customer_sku VARCHAR(100),
        internal_product_id INTEGER REFERENCES inventory_items(id),
        suggested_price REAL,
        final_price REAL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        estimated_price REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Quotations Table
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quote_number VARCHAR(100) NOT NULL UNIQUE,
        rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) NOT NULL,
        vendor_id INTEGER REFERENCES vendors(id) NOT NULL,
        total_amount REAL NOT NULL,
        delivery_time VARCHAR(100),
        valid_until DATE,
        terms_and_conditions TEXT,
        attachments JSONB,
        is_selected BOOLEAN DEFAULT false,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        expiry_date DATE,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Quotation Items Table
      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES quotations(id) NOT NULL,
        rfq_item_id INTEGER REFERENCES rfq_items(id) NOT NULL,
        product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        extended_price REAL NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Comments Table
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Email Templates Table
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        variables JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Settings Table
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- SKU Mappings Table
      CREATE TABLE IF NOT EXISTS sku_mappings (
        id SERIAL PRIMARY KEY,
        standard_sku VARCHAR(100) NOT NULL UNIQUE,
        standard_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- SKU Variations Table
      CREATE TABLE IF NOT EXISTS sku_variations (
        id SERIAL PRIMARY KEY,
        mapping_id INTEGER REFERENCES sku_mappings(id) ON DELETE CASCADE NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
        variation_sku VARCHAR(100) NOT NULL,
        source VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Audit Log Table
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details JSONB
      );

      -- Sales History Table
      CREATE TABLE IF NOT EXISTS sales_history (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) NOT NULL,
        product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        extended_price REAL NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        sale_date DATE NOT NULL,
        quickbooks_invoice_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Purchase Orders Table
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(100) NOT NULL UNIQUE,
        vendor_id INTEGER REFERENCES vendors(id) NOT NULL,
        status VARCHAR(50) NOT NULL,
        order_date TIMESTAMP NOT NULL,
        expected_arrival_date DATE,
        total_amount REAL NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        quickbooks_po_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Purchase Order Items Table
      CREATE TABLE IF NOT EXISTS po_items (
        id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(id) NOT NULL,
        product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_cost REAL NOT NULL,
        extended_cost REAL NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Market Pricing Table
      CREATE TABLE IF NOT EXISTS market_pricing (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        source VARCHAR(255) NOT NULL,
        price REAL NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- RFQ Templates Table
      CREATE TABLE IF NOT EXISTS rfq_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        columns JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Email Settings Table
      CREATE TABLE IF NOT EXISTS email_settings (
        id SERIAL PRIMARY KEY,
        enabled BOOLEAN DEFAULT true NOT NULL,
        check_interval INTEGER DEFAULT 5 NOT NULL,
        sku_detection_enabled BOOLEAN DEFAULT true NOT NULL,
        sku_auto_map BOOLEAN DEFAULT true NOT NULL,
        sku_confidence_threshold INTEGER DEFAULT 85 NOT NULL,
        customer_detection_enabled BOOLEAN DEFAULT true NOT NULL,
        customer_auto_assign BOOLEAN DEFAULT true NOT NULL,
        customer_confidence_threshold INTEGER DEFAULT 80 NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Email Accounts Table
      CREATE TABLE IF NOT EXISTS email_accounts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        protocol VARCHAR(50) NOT NULL,
        server VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL,
        ssl BOOLEAN DEFAULT true NOT NULL,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        folders JSONB DEFAULT '["INBOX"]',
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Email Rules Table
      CREATE TABLE IF NOT EXISTS email_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        condition VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL DEFAULT 'parse',
        prioritize BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      -- Email Parsing Results Table
      CREATE TABLE IF NOT EXISTS email_parsing_results (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(255),
        subject VARCHAR(255),
        sender VARCHAR(255),
        received_at TIMESTAMP,
        parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        customer_info JSONB,
        items JSONB,
        confidence INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
        rfq_id INTEGER REFERENCES rfqs(id),
        notes TEXT
      );

      -- Reports Table
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by INTEGER REFERENCES users(id),
        filters JSONB,
        data JSONB
      );

      -- Quotation Versions Table
      CREATE TABLE IF NOT EXISTS quotation_versions (
        id SERIAL PRIMARY KEY,
        rfq_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        entry_type VARCHAR(20) NOT NULL DEFAULT 'internal_quote',
        status VARCHAR(20) NOT NULL DEFAULT 'NEW',
        estimated_price INTEGER NOT NULL,
        final_price INTEGER NOT NULL,
        changes TEXT,
        notes TEXT,
        created_by VARCHAR(100) NOT NULL,
        submitted_by_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Quotation Version Items Table
      CREATE TABLE IF NOT EXISTS quotation_version_items (
        id SERIAL PRIMARY KEY,
        version_id INTEGER REFERENCES quotation_versions(id) NOT NULL,
        sku_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Customer Responses Table
      CREATE TABLE IF NOT EXISTS customer_responses (
        id SERIAL PRIMARY KEY,
        version_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL,
        comments TEXT,
        requested_changes TEXT,
        responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- NEGOTIATION TABLES
      -- Negotiation Communications Table
      CREATE TABLE IF NOT EXISTS negotiation_communications (
        id SERIAL PRIMARY KEY,
        rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
        version_id INTEGER REFERENCES quotation_versions(id),
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
        entered_by_user_id INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- SKU Negotiation History Table
      CREATE TABLE IF NOT EXISTS sku_negotiation_history (
        id SERIAL PRIMARY KEY,
        rfq_id INTEGER REFERENCES rfqs(id) NOT NULL,
        sku_id INTEGER REFERENCES inventory_items(id) NOT NULL,
        version_id INTEGER REFERENCES quotation_versions(id),
        communication_id INTEGER REFERENCES negotiation_communications(id),
        change_type VARCHAR(20) NOT NULL,
        old_quantity INTEGER,
        new_quantity INTEGER,
        old_unit_price DECIMAL(10,2),
        new_unit_price DECIMAL(10,2),
        change_reason TEXT,
        changed_by VARCHAR(20) DEFAULT 'CUSTOMER',
        entered_by_user_id INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.execute(sql.raw(createTablesSQL));
    console.log('✅ All tables created successfully');

    // Create indexes
    console.log('📊 Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_rfqs_customer_id ON rfqs(customer_id);
      CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
      CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON rfq_items(rfq_id);
      CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
      CREATE INDEX IF NOT EXISTS idx_negotiation_communications_rfq_id ON negotiation_communications(rfq_id);
      CREATE INDEX IF NOT EXISTS idx_negotiation_communications_date ON negotiation_communications(communication_date);
      CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_rfq_id ON sku_negotiation_history(rfq_id);
      CREATE INDEX IF NOT EXISTS idx_sku_negotiation_history_sku_id ON sku_negotiation_history(sku_id);
    `;
    
    await db.execute(sql.raw(indexSQL));
    console.log('✅ Indexes created successfully');

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    console.log('🔌 Closing database connection...');
    await migrationClient.end();
  }
}

setupDatabase().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
