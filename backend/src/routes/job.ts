import { JobService } from '../services/jobService.ts';

export function createJobRoutes(service = new JobService()) {
  return {
    async create(user: any, body: any) {
      return { statusCode: 201, body: await service.createJob(user.id, body) };
    },

    async list(query: any) {
      return {
        statusCode: 200,
        body: await service.listJobs({
          status: query.get('status') || undefined,
          platform: query.get('platform') || undefined,
          payout_type: query.get('payout_type') || undefined,
          min_budget: query.get('min_budget') || undefined,
          max_budget: query.get('max_budget') || undefined,
        }),
      };
    },

    async listMine(user: any, query: any) {
      return {
        statusCode: 200,
        body: await service.listMyJobs(user.id, {
          status: query.get('status') || undefined,
        }),
      };
    },

    async quote(body: any) {
      return { statusCode: 200, body: await service.quoteJob(body) };
    },

    async get(jobId: string) {
      return { statusCode: 200, body: await service.getJob(jobId) };
    },

    async apply(jobId: string, user: any, body: any) {
      return { statusCode: 201, body: await service.applyToJob(jobId, user.id, body) };
    },

    async listApplications(jobId: string) {
      return { statusCode: 200, body: await service.listApplications(jobId) };
    },

    async selectCreator(jobId: string, creatorId: string) {
      return { statusCode: 200, body: await service.selectCreator(jobId, creatorId) };
    },

    async cancel(jobId: string) {
      return { statusCode: 200, body: await service.cancelJob(jobId) };
    },

    async confirmFunding(jobId: string, body: any) {
      return { statusCode: 200, body: await service.confirmFunding(jobId, body) };
    },

    async listMilestones(jobId: string) {
      return { statusCode: 200, body: await service.listMilestones(jobId) };
    },

    async submitMilestone(milestoneId: string, body: any) {
      return { statusCode: 200, body: await service.submitMilestone(milestoneId, body) };
    },

    async submitDealDeliverable(jobId: string, user: any, body: any, settlement?: any) {
      return { statusCode: 200, body: await service.submitDealDeliverable(jobId, user.id, body, settlement) };
    },

    async recheckMilestone(milestoneId: string, body: any, settlement?: any) {
      return { statusCode: 200, body: await service.recheckMilestone(milestoneId, body, settlement) };
    },

    async approveMilestone(milestoneId: string) {
      return { statusCode: 200, body: await service.approveMilestone(milestoneId) };
    },

    async disputeMilestone(milestoneId: string, body: any) {
      return { statusCode: 200, body: await service.disputeMilestone(milestoneId, body) };
    },

    async listMyApplications(user: any) {
      return { statusCode: 200, body: await service.getMyApplications(user.id) };
    },

    async withdrawApplication(user: any, applicationId: string) {
      return { statusCode: 200, body: await service.withdrawApplication(applicationId, user.id) };
    },

    async rejectApplication(user: any, applicationId: string) {
      return { statusCode: 200, body: await service.rejectApplication(applicationId, user.id) };
    },

    async listIncomingApplications(user: any) {
      return { statusCode: 200, body: await service.getIncomingApplications(user.id) };
    },
  };
}
