import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { environmentVariables } from './types';

async function runMigrations(dbUrl: string) {
    const sql = postgres(dbUrl, { max: 1 });
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: 'migrations' });
}

async function main() {
    // parses environment variables at runtime
    const envVariables = environmentVariables.parse(process.env);

    await runMigrations(envVariables.DB_CONNECTION_URL);
}

main();
