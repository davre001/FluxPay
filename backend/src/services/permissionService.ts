import { InMemoryPermissionRepository } from '../models/permission.ts';
import { ValidationError, NotFoundError } from '../utils/errors.ts';

// Stores and retrieves the ERC-7715 spending permissions brands grant per job.
// Redemption (ERC-7710) lives in a later step; this slice persists the signed
// permission so it survives restarts and can be redeemed when milestones pass.
export class PermissionService {
  private permissions: InMemoryPermissionRepository;

  constructor(permissions = new InMemoryPermissionRepository()) {
    this.permissions = permissions;
  }

  async storeForJob(jobId: string, data: any) {
    if (!jobId) throw new ValidationError('jobId is required');
    if (!data?.permissions_context) {
      throw new ValidationError('permissions_context is required');
    }
    return this.permissions.create({
      job_id: jobId,
      organization_id: data.organization_id,
      creator_id: data.creator_id,
      signer: data.signer,
      token_address: data.token_address,
      amount: data.amount,
      chain_id: data.chain_id,
      permissions_context: data.permissions_context,
      delegation_manager: data.delegation_manager,
      account_meta: data.account_meta,
      raw: data.raw,
    });
  }

  async getForJob(jobId: string) {
    const permission = await this.permissions.findByJobId(jobId);
    if (!permission) throw new NotFoundError('No permission granted for this job yet');
    return permission;
  }
}
