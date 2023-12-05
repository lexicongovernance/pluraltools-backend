/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./src/db/*",
  out: "./migrations",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DB_CONNECTION_URL,
  }
};