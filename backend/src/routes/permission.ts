import { PermissionService } from '../services/permissionService.ts';

export function createPermissionRoutes(service = new PermissionService()) {
  return {
    // POST /api/permissions — store a granted ERC-7715 permission for a job.
    async store(_user: any, body: any) {
      const { jobId, ...data } = body || {};
      const permission = await service.storeForJob(jobId, data);
      return { statusCode: 201, body: permission };
    },

    // GET /api/permissions/:jobId — the latest active permission for a job.
    async getForJob(jobId: string) {
      return { statusCode: 200, body: await service.getForJob(jobId) };
    },
  };
}
