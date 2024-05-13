/** @type { import("drizzle-kit").Config } */
export default {
  dialect: 'postgresql',
  schema: './src/db/*',
  out: './migrations',
  dbCredentials: {
    url: process.env.DB_CONNECTION_URL,
  },
};
