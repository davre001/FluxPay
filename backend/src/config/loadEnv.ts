import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Loads .env files into process.env for LOCAL development. On Render/Vercel the
// platform injects real env vars and these files don't exist, so this is a safe
// no-op there. Real process.env values ALWAYS win — the file only fills gaps —
// so platform config can never be overridden by a stale local file.
//
// Import this FIRST (before ./config/index.ts) so the vars exist when config
// reads them at module-eval time.
function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim(); // trim() also fixes "KEY= value" spacing
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const here = dirname(fileURLToPath(import.meta.url)); // backend/src/config
loadEnvFile(resolve(here, '../../.env'));    // backend/.env (backend-specific)
loadEnvFile(resolve(here, '../../../.env')); // repo-root .env (shared vars)
