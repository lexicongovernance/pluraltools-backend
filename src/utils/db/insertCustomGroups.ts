import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';
import * as fs from 'fs';
import csvParser from 'csv-parser';

/**
 * Inserts groups into the 'groups' table based on data from a CSV file, after
 * first deleting all existing data from the table.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string} csvFilePath - The file path to the CSV containing group data.
 * @returns {Promise<void>} A promise that resolves when the insertion is complete.
 * @throws {Error} If there is an error during file reading, database operations, or deletion of existing data.
 */
async function insertGroupsFromCsv(dbPool: PostgresJsDatabase<typeof db>, csvFilePath: string) {
  const names: string[] = [];

  return new Promise<void>((resolve, reject) => {
    dbPool
      .delete(db.groups)
      .execute()
      .then(async () => {
        console.log('Deleted all data from the groups table.');
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
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export { insertGroupsFromCsv };
