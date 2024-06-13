import { environmentVariables } from './src/types';

const envVariables = environmentVariables.parse(process.env);

/** @type { import("drizzle-kit").Config } */
export default {
  dialect: 'postgresql',
  schema: './src/db/*',
  out: './migrations',
  dbCredentials: {
    user: envVariables.DATABASE_USER,
    password: envVariables.DATABASE_PASSWORD,
    host: envVariables.DATABASE_HOST,
    port: envVariables.DATABASE_PORT,
    database: envVariables.DATABASE_NAME,
    ssl: false,
  },
};
