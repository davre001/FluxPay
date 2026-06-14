// Postgres (Neon) repository implementations.
//
// Each class is a drop-in replacement for its InMemory* counterpart — same
// method names, same arguments, same return shapes — so app.ts can swap them in
// without touching services, routes, or validators. Records are built by the
// same `create*Record()` helpers the in-memory repos use, then persisted as a
// JSONB blob; the promoted columns exist only for filtering/sorting.
import { query } from '../database/client.ts';
import { nowIso } from '../utils/helpers.ts';
import { createJobRecord } from './job.ts';
import { createApplicationRecord } from './application.ts';
import { createMilestoneRecord } from './milestone.ts';
import { createProfileRecord } from './profile.ts';
import { createPaymentRecord } from './payment.ts';
import { createPermissionRecord } from './permission.ts';
import { randomUUID } from 'node:crypto';

const json = (value: any) => JSON.stringify(value);

// ─── Users ────────────────────────────────────────────────────────────────────
export class PgUserRepository {
  async upsert({ key, email, profileType, walletAddress }: { key: string; email?: string; profileType?: string; walletAddress?: string }) {
    const existing = await this.findByKey(key);
    if (existing) {
      const updated = {
        ...existing,
        email: email || existing.email,
        profileType: profileType || existing.profileType,
        walletAddress: walletAddress || existing.walletAddress,
        updatedAt: nowIso(),
      };
      await query(`UPDATE users SET data = $2, updated_at = now() WHERE id = $1`, [key, json(updated)]);
      return { ...updated };
    }
    const user = {
      id: key,
      email: email || '',
      profileType: profileType || null,
      walletAddress: walletAddress || '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await query(
      `INSERT INTO users (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [key, json(user)],
    );
    return { ...user };
  }

  async findByKey(key: string) {
    const rows = await query(`SELECT data FROM users WHERE id = $1`, [key]);
    return rows[0] ? rows[0].data : null;
  }

  async clear() {
    await query(`DELETE FROM users`);
  }
}

// ─── Profiles ───────────────────────────────────────────────────────────────────
export class PgProfileRepository {
  async upsert(userId: string, input: any) {
    const existing = await this.findByUserId(userId);
    const record = existing
      ? { ...existing, ...input, user_id: userId, created_at: existing.created_at, updated_at: nowIso() }
      : createProfileRecord(userId, input);
    const walletAddress = (record as any).wallet_address || null;
    await query(
      `INSERT INTO profiles (user_id, wallet_address, data) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET wallet_address = EXCLUDED.wallet_address, data = EXCLUDED.data, updated_at = now()`,
      [userId, walletAddress, json(record)],
    );
    return { ...record };
  }

  async findByUserId(userId: string) {
    const rows = await query(`SELECT data FROM profiles WHERE user_id = $1`, [userId]);
    return rows[0] ? rows[0].data : null;
  }

  async findByWalletAddress(walletAddress: string) {
    const rows = await query(`SELECT data FROM profiles WHERE wallet_address = $1 LIMIT 1`, [walletAddress]);
    return rows[0] ? rows[0].data : null;
  }

  async clear() {
    await query(`DELETE FROM profiles`);
  }
}

// ─── Jobs ───────────────────────────────────────────────────────────────────────
export class PgJobRepository {
  async create(input: any) {
    const job: any = createJobRecord(input);
    await query(
      `INSERT INTO jobs (id, organization_id, status, target_platform, payout_type, total_budget, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [job.id, job.organization_id, job.status, job.target_platform, job.payout_type, job.total_budget, json(job), job.created_at],
    );
    return { ...job };
  }

  async findById(id: any) {
    const rows = await query(`SELECT data FROM jobs WHERE id = $1`, [id]);
    return rows[0] ? rows[0].data : null;
  }

  async findMany(filters: any = {}) {
    const conds: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => { params.push(value); conds.push(sql.replace('?', `$${params.length}`)); };
    if (filters.organization_id) add('organization_id = ?', filters.organization_id);
    // selected_creator_id isn't a promoted column — filter on the JSONB blob
    // (indexed via jobs_selected_creator_idx) so we don't scan/transfer every job.
    if (filters.selected_creator_id) add("data->>'selected_creator_id' = ?", filters.selected_creator_id);
    if (filters.status) add('status = ?', filters.status);
    if (filters.platform) add('target_platform = ?', filters.platform);
    if (filters.payout_type) add('payout_type = ?', filters.payout_type);
    if (filters.min_budget) add('total_budget >= ?', Number(filters.min_budget));
    if (filters.max_budget) add('total_budget <= ?', Number(filters.max_budget));
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await query(`SELECT data FROM jobs ${where} ORDER BY created_at DESC`, params);
    return rows.map((r: any) => r.data);
  }

  async update(id: any, changes: any) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id: existing.id, created_at: existing.created_at, updated_at: nowIso() };
    await query(
      `UPDATE jobs SET organization_id = $2, status = $3, target_platform = $4, payout_type = $5, total_budget = $6, data = $7 WHERE id = $1`,
      [id, updated.organization_id, updated.status, updated.target_platform, updated.payout_type, updated.total_budget, json(updated)],
    );
    return { ...updated };
  }

  async clear() {
    await query(`DELETE FROM jobs`);
  }
}

// ─── Applications ───────────────────────────────────────────────────────────────
export class PgApplicationRepository {
  async create(input: any) {
    const application: any = createApplicationRecord(input);
    await query(
      `INSERT INTO applications (id, job_id, creator_id, status, data, applied_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [application.id, application.job_id, application.creator_id, application.status, json(application), application.applied_at],
    );
    return { ...application };
  }

  async findById(id: any) {
    const rows = await query(`SELECT data FROM applications WHERE id = $1`, [id]);
    return rows[0] ? rows[0].data : null;
  }

  async findMany(filters: any = {}) {
    const conds: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => { params.push(value); conds.push(sql.replace('?', `$${params.length}`)); };
    if (filters.job_id) add('job_id = ?', filters.job_id);
    if (filters.creator_id) add('creator_id = ?', filters.creator_id);
    if (filters.status) add('status = ?', filters.status);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await query(`SELECT data FROM applications ${where} ORDER BY applied_at DESC`, params);
    return rows.map((r: any) => r.data);
  }

  async update(id: any, changes: any) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id: existing.id, applied_at: existing.applied_at, updated_at: nowIso() };
    await query(`UPDATE applications SET status = $2, data = $3 WHERE id = $1`, [id, updated.status, json(updated)]);
    return { ...updated };
  }

  async clear() {
    await query(`DELETE FROM applications`);
  }
}

// ─── Milestones ─────────────────────────────────────────────────────────────────
export class PgMilestoneRepository {
  async create(input: any) {
    const milestone: any = createMilestoneRecord(input);
    await query(
      `INSERT INTO milestones (id, job_id, status, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [milestone.id, milestone.job_id, milestone.status, json(milestone), milestone.created_at],
    );
    return { ...milestone };
  }

  async findById(id: any) {
    const rows = await query(`SELECT data FROM milestones WHERE id = $1`, [id]);
    return rows[0] ? rows[0].data : null;
  }

  async findMany(filters: any = {}) {
    const conds: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => { params.push(value); conds.push(sql.replace('?', `$${params.length}`)); };
    if (filters.job_id) add('job_id = ?', filters.job_id);
    if (filters.status) add('status = ?', filters.status);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await query(`SELECT data FROM milestones ${where} ORDER BY created_at ASC`, params);
    return rows.map((r: any) => r.data);
  }

  async update(id: any, changes: any) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id: existing.id, created_at: existing.created_at, updated_at: nowIso() };
    await query(`UPDATE milestones SET status = $2, data = $3 WHERE id = $1`, [id, updated.status, json(updated)]);
    return { ...updated };
  }

  async clear() {
    await query(`DELETE FROM milestones`);
  }
}

// ─── Payments ───────────────────────────────────────────────────────────────────
export class PgPaymentRepository {
  async create(input: any) {
    const payment: any = createPaymentRecord(input);
    await query(
      `INSERT INTO payments (id, user_id, dataset_id, status, data, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [payment.id, payment.userId, payment.datasetId, payment.status, json(payment), payment.createdAt],
    );
    return { ...payment };
  }

  async findById(id: any) {
    const rows = await query(`SELECT data FROM payments WHERE id = $1`, [id]);
    return rows[0] ? rows[0].data : null;
  }

  async findMany(filters: any = {}) {
    const conds: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => { params.push(value); conds.push(sql.replace('?', `$${params.length}`)); };
    if (filters.userId) add('user_id = ?', filters.userId);
    if (filters.status) add('status = ?', filters.status);
    if (filters.datasetId) add('dataset_id = ?', filters.datasetId);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await query(`SELECT data FROM payments ${where} ORDER BY created_at DESC`, params);
    return rows.map((r: any) => r.data);
  }

  async updateStatus(id: any, status: any) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, status, updatedAt: nowIso() };
    await query(`UPDATE payments SET status = $2, data = $3 WHERE id = $1`, [id, status, json(updated)]);
    return { ...updated };
  }

  async clear() {
    await query(`DELETE FROM payments`);
  }
}

// ─── Permissions (ERC-7715) ─────────────────────────────────────────────────────
export class PgPermissionRepository {
  async create(input: any) {
    const permission: any = createPermissionRecord(input);
    await query(
      `INSERT INTO permissions (id, job_id, status, data, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [permission.id, permission.job_id, permission.status, json(permission), permission.created_at],
    );
    return { ...permission };
  }

  async findById(id: any) {
    const rows = await query(`SELECT data FROM permissions WHERE id = $1`, [id]);
    return rows[0] ? rows[0].data : null;
  }

  async findByJobId(jobId: any) {
    const rows = await query(
      `SELECT data FROM permissions WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1`, [jobId],
    );
    return rows[0] ? rows[0].data : null;
  }

  async findMany(filters: any = {}) {
    const conds: string[] = [];
    const params: any[] = [];
    const add = (sql: string, value: any) => { params.push(value); conds.push(sql.replace('?', `$${params.length}`)); };
    if (filters.job_id) add('job_id = ?', filters.job_id);
    if (filters.status) add('status = ?', filters.status);
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await query(`SELECT data FROM permissions ${where} ORDER BY created_at DESC`, params);
    return rows.map((r: any) => r.data);
  }

  async update(id: any, changes: any) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes, id: existing.id, created_at: existing.created_at, updated_at: nowIso() };
    await query(`UPDATE permissions SET status = $2, data = $3 WHERE id = $1`, [id, updated.status, json(updated)]);
    return { ...updated };
  }

  async clear() {
    await query(`DELETE FROM permissions`);
  }
}

// ─── Wallet (balances + transactions) ───────────────────────────────────────────
export class PgWalletRepository {
  private async ensureUser(userId: string) {
    await query(
      `INSERT INTO wallet_balances (user_id, balance) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
  }

  async getBalance(userId: string) {
    await this.ensureUser(userId);
    const rows = await query(`SELECT balance FROM wallet_balances WHERE user_id = $1`, [userId]);
    return {
      balance: Number(rows[0]?.balance ?? 0),
      chain_name: 'sepolia',
      chain_id: 11155111,
    };
  }

  async deposit(userId: string, amount: number, tx_hash: string | null) {
    await this.ensureUser(userId);
    await query(`UPDATE wallet_balances SET balance = balance + $2 WHERE user_id = $1`, [userId, amount]);
    const tx = {
      id: `tx_${randomUUID().replaceAll('-', '')}`,
      user_id: userId,
      type: 'deposit',
      amount,
      tx_hash: tx_hash || null,
      created_at: nowIso(),
    };
    await query(`INSERT INTO wallet_transactions (id, user_id, data, created_at) VALUES ($1, $2, $3, $4)`,
      [tx.id, userId, json(tx), tx.created_at]);
    return tx;
  }

  async withdraw(userId: string, amount: number, to_address: string) {
    await this.ensureUser(userId);
    const current = (await this.getBalance(userId)).balance;
    if (amount > current) throw new Error('Insufficient balance');
    await query(`UPDATE wallet_balances SET balance = balance - $2 WHERE user_id = $1`, [userId, amount]);
    const tx = {
      id: `tx_${randomUUID().replaceAll('-', '')}`,
      user_id: userId,
      type: 'withdrawal',
      amount,
      to_address,
      tx_hash: null,
      created_at: nowIso(),
    };
    await query(`INSERT INTO wallet_transactions (id, user_id, data, created_at) VALUES ($1, $2, $3, $4)`,
      [tx.id, userId, json(tx), tx.created_at]);
    return tx;
  }

  async getTransactions(userId: string, page = 1, page_size = 20) {
    const offset = (page - 1) * page_size;
    const rows = await query(
      `SELECT data FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3`,
      [userId, offset, page_size],
    );
    return rows.map((r: any) => r.data);
  }

  async clear() {
    await query(`DELETE FROM wallet_transactions`);
    await query(`DELETE FROM wallet_balances`);
  }
}
