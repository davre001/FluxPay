import { PermissionService } from '../services/permissionService.ts';

export function createPermissionRoutes(service = new PermissionService(), payoutService: any = null) {
  return {
    // POST /api/permissions — store a granted ERC-7715 permission for a job.
    async store(_user: any, body: any) {
      const { jobId, ...data } = body || {};
      const permission = await service.storeForJob(jobId, data);
      return { statusCode: 201, body: permission };
    },

    // POST /api/permissions/redeem — release an approved milestone's USDC to the
    // creator by redeeming the job's stored permission (ERC-7710). `via` selects
    // the rail: 'direct' (agent EOA, ETH gas) or 'relayer' (1Shot, USDC gas).
    async redeem(_user: any, body: any) {
      if (!payoutService) {
        return { statusCode: 503, body: { error: { code: 'unavailable', message: 'Payout service not configured' } } };
      }
      const result = await payoutService.releaseMilestone(body?.milestoneId || '', {
        via: body?.via === 'relayer' ? 'relayer' : 'direct',
        chainId: body?.chainId,
      });
      return { statusCode: 200, body: result };
    },

    // GET /api/permissions/:jobId — the latest active permission for a job.
    async getForJob(jobId: string) {
      return { statusCode: 200, body: await service.getForJob(jobId) };
    },
  };
}
