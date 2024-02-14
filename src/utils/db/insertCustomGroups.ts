import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as db from '../../db';

/**
 * Inserts groups into the 'groups' table based on data from a CSV file, after
 * first deleting all existing data from the table.
 * @param {PostgresJsDatabase<typeof db>} dbPool - The database connection pool.
 * @param {string[]} groups - a list of groups to insert into the database.
 * @returns {Promise<void>} A promise that resolves when the insertion is complete.
 * @throws {Error} If there is an error during file reading, database operations, or deletion of existing data.
 */
async function insertCustomGroups(dbPool: PostgresJsDatabase<typeof db>, groups: string[]) {
  await dbPool.delete(db.groups);
  await dbPool.insert(db.groups).values(groups.map((name) => ({ name })));
}

export { insertCustomGroups };
