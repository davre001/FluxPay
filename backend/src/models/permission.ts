import { nowIso } from '../utils/helpers.ts';
import { randomUUID } from 'node:crypto';

export function generatePermissionId() {
  return `perm_${randomUUID().replaceAll('-', '')}`;
}

// A brand's ERC-7715 spending permission for one job. `permissions_context` +
// `delegation_manager` are what the backend later redeems (ERC-7710) to release
// milestone USDC to the creator. `raw` keeps the full grant response for safety.
export function createPermissionRecord(input) {
  const timestamp = nowIso();
  return {
    id: generatePermissionId(),
    job_id: input.job_id,
    organization_id: input.organization_id || null,
    creator_id: input.creator_id || null,
    signer: input.signer || null,
    token_address: input.token_address || null,
    amount: input.amount ?? null,
    chain_id: input.chain_id ?? null,
    permissions_context: input.permissions_context || null,
    delegation_manager: input.delegation_manager || null,
    account_meta: input.account_meta || null,
    raw: input.raw || null,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class InMemoryPermissionRepository {
  permissions: Map<string, any>;

  constructor(initialPermissions: any = []) {
    this.permissions = new Map();
    initialPermissions.forEach((p: any) => this.permissions.set(p.id, { ...p }));
  }

  async create(input: any) {
    const permission: any = createPermissionRecord(input);
    this.permissions.set(permission.id, permission);
    return { ...permission };
  }

  async findById(id: any) {
    const permission = this.permissions.get(id);
    return permission ? { ...permission } : null;
  }

  // Most recent active permission for a job (the one the backend would redeem).
  async findByJobId(jobId: any) {
    const matches = [...this.permissions.values()]
      .filter((p: any) => p.job_id === jobId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return matches[0] ? { ...matches[0] } : null;
  }

  async findMany(filters: any = {}) {
    const matches = [...this.permissions.values()].filter((p: any) => {
      if (filters.job_id && p.job_id !== filters.job_id) return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });
    return matches
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p: any) => ({ ...p }));
  }

  async update(id: any, changes: any) {
    const permission = this.permissions.get(id);
    if (!permission) return null;
    const updated = { ...permission, ...changes, id: permission.id, created_at: permission.created_at, updated_at: nowIso() };
    this.permissions.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.permissions.clear();
  }
}
