import { runMigrations } from '../db/index';

async function main() {
  try {
    await runMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));