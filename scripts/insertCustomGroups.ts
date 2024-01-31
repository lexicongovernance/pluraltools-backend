import { createDbPool } from '../src/utils/db/createDbPool';
import { insertGroupsFromCsv } from '../src/utils/db/insertCustomGroups';
import * as path from 'path';

const DEFAULT_DB_CONNECTION_URL = 'postgresql://postgres:secretpassword@localhost:5432';
const CSV_FILE_PATH = path.join(__dirname, '../assets/groups.csv');

async function updateDbGroups() {
  const dbConnectionUrl = process.env.DB_CONNECTION_URL ?? DEFAULT_DB_CONNECTION_URL;
  const { dbPool, connection } = createDbPool(dbConnectionUrl, { max: 1 });

  try {
    await insertGroupsFromCsv(dbPool, CSV_FILE_PATH);
    console.log('Inserted groups into the database');
  } catch (error) {
    console.error('Error processing groups:', error);
  } finally {
    await connection.end();
  }
}

updateDbGroups();