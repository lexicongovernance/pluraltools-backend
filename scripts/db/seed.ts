import { environmentVariables } from '../../src/types';
import { createDbClient } from '../../src/utils/db/create-db-connection';
import { cleanup, seed } from '../../src/utils/db/seed';

async function main() {
  if (process.argv.includes('--cleanup')) {
    const envVariables = environmentVariables.parse(process.env);
    const { client, db } = await createDbClient({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });

    await cleanup(db);
    await client.end();
    console.log('Cleaned up database');
  } else {
    const envVariables = environmentVariables.parse(process.env);
    const { client, db } = await createDbClient({
      database: envVariables.DATABASE_NAME,
      host: envVariables.DATABASE_HOST,
      password: envVariables.DATABASE_PASSWORD,
      user: envVariables.DATABASE_USER,
      port: envVariables.DATABASE_PORT,
    });
    await seed(db);
    await client.end();
    console.log('Seeded database');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
