/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./db/schema.js", // path to your schema file
  out: "./drizzle", // folder where migrations will be stored
  dialect: "postgresql", // ✅ Required in new versions

  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
