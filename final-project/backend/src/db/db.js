// Now anywhere in the backend can import:
// import { db } from "../db/db.js";

import pgPromise from "pg-promise";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env")
});
// dotenv.config();

const pgp = pgPromise();

// THIS FILE is the database connection manager
// db.js creates 1 db connection → every file reuses it

// allows every route to write SQL like db.any();
export const db = pgp(process.env.DATABASE_URL);
