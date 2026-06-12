import { neon } from '@neondatabase/serverless';
import { config } from '../config/index.ts';

// Single Neon HTTP client. The HTTP driver issues one round-trip per query with
// no pool/socket to manage — ideal for both a long-running server and
// serverless. `null` when DATABASE_URL is unset, so callers fall back to memory.
export const sql: any = config.databaseUrl ? neon(config.databaseUrl) : null;

export function isDbEnabled(): boolean {
  return Boolean(sql);
}

// Parameterized query helper. jsonb columns are bound as JSON.stringify(...)
// text by the repos; Neon returns jsonb already parsed into JS objects.
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  if (!sql) throw new Error('Database not configured (DATABASE_URL missing)');
  return (await sql.query(text, params)) as T[];
}
