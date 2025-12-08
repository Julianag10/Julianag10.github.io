import pgPromise from "pg-promise";
import dotenv from "dotenv";
dotenv.config();

const pgp = pgPromise({});
export const db = pgp(process.env.DATABASE_URL);

// All your raw SQL functions LIVE HERE:

export const SQL = {
  createDonationTable: `
    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      email TEXT,
      name TEXT,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,

  insertDonation: `
    INSERT INTO donations(session_id, amount, email, name, status)
    VALUES($1, $2, $3, $4, $5)
    ON CONFLICT (session_id) DO NOTHING;
  `,

  getAllDonations: `
    SELECT * FROM donations ORDER BY created_at DESC;
  `,

  getDonationStats: `
    SELECT 
      COUNT(*) AS total_donations,
      SUM(amount) AS total_amount
    FROM donations;
  `
};
