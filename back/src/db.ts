import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString }
    : undefined
);

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Backward-compatible upgrades for existing local databases.
  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
  `);
}
