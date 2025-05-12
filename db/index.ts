import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Connection options for Supabase
const connectionOptions = {
  ssl: {
    rejectUnauthorized: false, // This will allow self-signed certificates
  },
};

// For migrations and seeding (CLI operations)
export const migrationClient = postgres(process.env.DATABASE_URL, { 
  ...connectionOptions,
  max: 1 
});
export const db = drizzle(migrationClient, { schema });

// For application usage
const queryClient = postgres(process.env.DATABASE_URL, {
  ...connectionOptions,
  max: 10 // You can adjust this based on your needs
});
export const queryDb = drizzle(queryClient, { schema });

// Utility function to run migrations
export const runMigrations = async () => {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};