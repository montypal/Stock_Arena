import pg from 'pg';

const { Pool, types } = pg;

// NUMERIC and BIGINT arrive as strings by default. Money here is for display
// and pre-trade checks only -- the worker does the authoritative Decimal math
// -- so plain JS numbers are fine. DATE stays a 'YYYY-MM-DD' string so week
// boundaries never shift with the server's time zone.
types.setTypeParser(1700, (v) => parseFloat(v)); // numeric
types.setTypeParser(20, (v) => parseInt(v, 10)); // int8
types.setTypeParser(1082, (v) => v); // date

function makePool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
}

// Reuse one pool per server instance, including across dev hot reloads.
const pool = globalThis.__stockarenaPool ?? makePool();
globalThis.__stockarenaPool = pool;

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
