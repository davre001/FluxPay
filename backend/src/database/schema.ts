// Schema for the Neon (Postgres) persistence layer.
//
// Each entity is stored as a JSONB `data` blob (the exact record shape the
// existing `create*Record()` helpers produce) plus a few promoted columns that
// the repositories filter / sort on. This keeps the Postgres repos a 1:1 swap
// for the in-memory ones — no service, route, or validator changes — and means
// new fields on a record never require a migration.
//
// Statements run one-by-one over the Neon HTTP driver (no multi-statement
// support), so keep each entry a single self-contained DDL statement.
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     data JSONB NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS profiles (
     user_id TEXT PRIMARY KEY,
     wallet_address TEXT,
     data JSONB NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS profiles_wallet_idx ON profiles (wallet_address)`,

  `CREATE TABLE IF NOT EXISTS jobs (
     id TEXT PRIMARY KEY,
     organization_id TEXT,
     status TEXT,
     target_platform TEXT,
     payout_type TEXT,
     total_budget DOUBLE PRECISION,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS jobs_org_idx ON jobs (organization_id)`,
  `CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status)`,

  `CREATE TABLE IF NOT EXISTS applications (
     id TEXT PRIMARY KEY,
     job_id TEXT,
     creator_id TEXT,
     status TEXT,
     data JSONB NOT NULL,
     applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS applications_job_idx ON applications (job_id)`,
  `CREATE INDEX IF NOT EXISTS applications_creator_idx ON applications (creator_id)`,

  `CREATE TABLE IF NOT EXISTS milestones (
     id TEXT PRIMARY KEY,
     job_id TEXT,
     status TEXT,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS milestones_job_idx ON milestones (job_id)`,

  `CREATE TABLE IF NOT EXISTS payments (
     id TEXT PRIMARY KEY,
     user_id TEXT,
     dataset_id TEXT,
     status TEXT,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id)`,

  `CREATE TABLE IF NOT EXISTS wallet_balances (
     user_id TEXT PRIMARY KEY,
     balance DOUBLE PRECISION NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS wallet_transactions (
     id TEXT PRIMARY KEY,
     user_id TEXT,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS wallet_tx_user_idx ON wallet_transactions (user_id)`,
];
