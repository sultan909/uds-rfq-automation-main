import { migrationClient } from '../db';
import { sql } from 'drizzle-orm';

async function dropAll() {
  console.log('Dropping all database objects...');
  try {
    // Drop schema
    await migrationClient`DROP SCHEMA public CASCADE`;
    
    // Create new schema
    await migrationClient`CREATE SCHEMA public`;
    
    console.log('Successfully dropped all database objects');
  } catch (error) {
    console.error('Error dropping database objects:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

dropAll().catch((err) => {
  console.error('Failed to drop database objects:', err);
  process.exit(1);
}); 