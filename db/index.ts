import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = process.env.DATABASE_URL;

// For migrations and seeding (CLI operations)
export const migrationClient = postgres(connectionString, { max: 1 });
export const db = drizzle(migrationClient, { schema });

// For application usage
export const queryClient = postgres(connectionString, { max: 10 });

// Utility function to run migrations
export async function runMigrations() {
  console.log('Running migrations...');
  try {
    // Drop existing enum types if they exist
    await migrationClient`
      DO $$ 
      BEGIN
        DROP TYPE IF EXISTS rfq_status CASCADE;
        DROP TYPE IF EXISTS user_role CASCADE;
        DROP TYPE IF EXISTS customer_type CASCADE;
        DROP TYPE IF EXISTS version_status CASCADE;
        DROP TYPE IF EXISTS response_status CASCADE;
      EXCEPTION
        WHEN undefined_object THEN null;
      END $$;
    `;

    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}