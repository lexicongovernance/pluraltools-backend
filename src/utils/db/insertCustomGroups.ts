import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import * as fs from 'fs';
import csvParser from 'csv-parser';

async function insertGroupsFromCsv(dbPool: PostgresJsDatabase<typeof db>, csvFilePath: string) {
  const names: string[] = [];

  return new Promise<void>((resolve, reject) => {
    console.log('Reading CSV file:', csvFilePath);

    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.name) {
          names.push(row.name.trim());
        }
      })
      .on('end', async () => {
        console.log('Number of names:', names.length);
        console.log('Names:', names);

        const groupPromises = names.map(async (name: string) => {
          await dbPool
            .insert(db.groups)
            .values({
              name,
            })
            .returning();
        });

        await Promise.all(groupPromises);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export { insertGroupsFromCsv };
