// scripts/check-db.ts
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT current_database(), current_user;`);
    console.log('✅ Database connection successful:', result[0]);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATABASE STRUCTURE ANALYSIS');
    console.log('='.repeat(60));
    
    // Check all tables
    console.log('\n📋 All tables in database:');
    const allTables = await db.execute(sql`
      SELECT 
        table_name,
        table_type,
        CASE 
          WHEN table_type = 'BASE TABLE' THEN '📄'
          WHEN table_type = 'VIEW' THEN '👁️'
          ELSE '❓'
        END as icon
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (allTables.length === 0) {
      console.log('❌ No tables found in the database!');
    } else {
      console.table(allTables.map(t => ({
        'Table': `${t.icon} ${t.table_name}`,
        'Type': t.table_type
      })));
    }
    
    // Check enums
    console.log('\n🏷️  Enums in database:');
    const enumsInfo = await db.execute(sql`
      SELECT 
        typname as enum_name, 
        array_agg(enumlabel ORDER BY enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      GROUP BY typname
      ORDER BY typname;
    `);
    
    if (enumsInfo.length === 0) {
      console.log('❌ No enums found!');
    } else {
      console.table(enumsInfo);
    }
    
    // Expected tables from schema
    const expectedTables = [
      'users', 'customers', 'vendors', 'rfqs', 'rfq_items',
      'quotations', 'quotation_items', 'quotation_versions', 'quotation_version_items',
      'customer_responses', 'comments', 'email_templates', 'settings',
      'sku_mappings', 'sku_variations', 'audit_log', 'inventory_items',
      'sales_history', 'purchase_orders', 'po_items', 'market_pricing',
      'rfq_templates', 'email_settings', 'email_accounts', 'email_rules',
      'email_parsing_results', 'reports'
    ];
    
    const existingTableNames = allTables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));
    const extraTables = existingTableNames.filter(table => !expectedTables.includes(table));
    
    console.log('\n📊 Table Analysis:');
    console.log(`✅ Expected tables: ${expectedTables.length}`);
    console.log(`📄 Existing tables: ${existingTableNames.length}`);
    console.log(`❌ Missing tables: ${missingTables.length}`);
    console.log(`➕ Extra tables: ${extraTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    }
    
    if (extraTables.length > 0) {
      console.log('\n➕ Extra tables (not in schema):');
      extraTables.forEach(table => console.log(`   - ${table}`));
    }
    
    // Check critical tables structure in detail
    const criticalTables = ['users', 'rfqs', 'quotation_versions', 'quotation_version_items'];
    
    for (const tableName of criticalTables) {
      if (existingTableNames.includes(tableName)) {
        console.log(`\n🔍 Structure of table: ${tableName}`);
        const tableInfo = await db.execute(sql`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position;
        `);
        
        console.table(tableInfo.map(col => ({
          'Column': col.column_name,
          'Type': col.data_type + (col.character_maximum_length ? `(${col.character_maximum_length})` : ''),
          'Nullable': col.is_nullable,
          'Default': col.column_default || 'None'
        })));
      } else {
        console.log(`\n❌ Critical table missing: ${tableName}`);
      }
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:');
    const fkConstraints = await db.execute(sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    
    if (fkConstraints.length === 0) {
      console.log('❌ No foreign key constraints found!');
    } else {
      console.table(fkConstraints.map(fk => ({
        'Table': fk.table_name,
        'Column': fk.column_name,
        'References': `${fk.foreign_table_name}.${fk.foreign_column_name}`,
        'Constraint': fk.constraint_name
      })));
    }
    
    // Check indexes
    console.log('\n📇 Indexes:');
    const indexes = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname;
    `);
    
    if (indexes.length === 0) {
      console.log('ℹ️  No custom indexes found (only primary keys exist)');
    } else {
      console.table(indexes.map(idx => ({
        'Table': idx.tablename,
        'Index': idx.indexname,
        'Definition': idx.indexdef.length > 50 ? idx.indexdef.substring(0, 50) + '...' : idx.indexdef
      })));
    }
    
    // Database size and statistics
    console.log('\n📈 Database Statistics:');
    const dbStats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC;
    `);
    
    if (dbStats.length > 0) {
      console.table(dbStats.map(stat => ({
        'Table': stat.tablename,
        'Live Rows': stat.live_rows,
        'Dead Rows': stat.dead_rows,
        'Inserts': stat.inserts,
        'Updates': stat.updates,
        'Deletes': stat.deletes
      })));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database analysis complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

checkDatabase();