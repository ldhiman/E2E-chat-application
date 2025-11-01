const postgres = require("postgres");
const { drizzle } = require("drizzle-orm/postgres-js");
const schema = require("./schema.js");
require("dotenv").config();

const client = postgres(process.env.DATABASE_URL, { ssl: "require" });

const db = drizzle(client, { schema });

module.exports = { db };
