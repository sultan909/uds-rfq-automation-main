import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function addIndexes() {
  const pool = new Pool({
    connectionString,
  });

  try {
    console.log('🔧 Adding performance indexes to database...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Performance indexes added successfully!');
    
    // Get index information
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;
    
    const result = await pool.query(indexQuery);
    
    console.log(`\n📊 Summary: ${result.rows.length} performance indexes created`);
    console.log('\nIndexes by table:');
    
    const indexesByTable: Record<string, number> = {};
    result.rows.forEach(row => {
      indexesByTable[row.tablename] = (indexesByTable[row.tablename] || 0) + 1;
    });
    
    Object.entries(indexesByTable)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([table, count]) => {
        console.log(`  ${table}: ${count} indexes`);
      });

    console.log('\n🚀 Database is now optimized for better query performance!');
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addIndexes();