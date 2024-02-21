import { createDbPool } from '../../src/utils/db/createDbPool';
import * as fs from 'fs';
import csvParser from 'csv-parser';
import { insertCustomGroups } from '../../src/utils/db/insertCustomGroups';

const DEFAULT_DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';
const CSV_FILE_PATH = 'assets/groups.csv';

async function main() {
  console.log(process.env.DB_CONNECTION_URL);
  const dbConnectionUrl = process.env.DB_CONNECTION_URL ?? DEFAULT_DB_CONNECTION_URL;
  const { dbPool, connection } = createDbPool(dbConnectionUrl, { max: 1 });

  try {
    const names: string[] = [];
    try {
      const stream = fs.createReadStream(CSV_FILE_PATH);
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (row) => {
            if (row.name) {
              names.push(row.name.trim());
            }
          })
          .on('end', () => {
            console.log('Number of names:', names.length);
            console.log('Names:', names);
            resolve();
          })
          .on('error', (error) => {
            reject(new Error(`Error reading CSV file: ${error}`));
          });
      });
    } catch (error) {
      throw new Error(`Error processing CSV file: ${error}`);
    }

    await insertCustomGroups(dbPool, names);
    console.log('Inserted groups into the database');
  } catch (error) {
    console.error('Error processing groups:', error);
  } finally {
    await connection.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
