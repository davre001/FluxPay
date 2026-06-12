import { config } from '../config/index.ts';
import { sql, isDbEnabled } from './client.ts';
import { SCHEMA_STATEMENTS } from './schema.ts';

// Ensures every table/index exists. Idempotent (all CREATE ... IF NOT EXISTS),
// so it's safe to run on every boot. The Neon HTTP driver runs one statement
// per call, so we execute the DDL list sequentially.
async function runMigrations() {
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.query(statement);
  }
}

export async function connectDatabase() {
  if (!isDbEnabled()) {
    console.log('[db] DATABASE_URL not set — using in-memory repositories (data resets on restart)');
    return { connected: false, driver: 'memory' };
  }

  try {
    await runMigrations();
    console.log('[db] ✓ connected to Neon Postgres — schema ready, data persists across restarts');
    return { connected: true, driver: 'postgres' };
  } catch (error) {
    console.error('[db] ✗ Postgres connection/migration failed:', (error as Error).message);
    // Surface loudly: with DATABASE_URL set we expect persistence, so a silent
    // fall-through to memory would hide a real misconfiguration.
    throw error;
  }
}

export async function disconnectDatabase() {
  // HTTP driver holds no persistent connection to close.
  return { connected: false };
}
