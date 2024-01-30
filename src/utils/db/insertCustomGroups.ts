import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import * as fs from 'fs';
import csvParser from 'csv-parser';

async function insertGroupsFromCsv(dbPool: PostgresJsDatabase<typeof db>, csvFilePath: string) {
  // Read CSV file using csv-parser
  const names: string[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.name) {
          names.push(row.name.trim());
        }
      })
      .on('end', async () => {
        // Create a new row in the groups table for each name
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
      .on('error', (error) => reject(error));
  });
}

export { insertGroupsFromCsv };
