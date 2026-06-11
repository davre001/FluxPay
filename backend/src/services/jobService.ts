import { InMemoryJobRepository } from '../models/job.ts';
import { InMemoryApplicationRepository } from '../models/application.ts';
import { InMemoryMilestoneRepository } from '../models/milestone.ts';
import { InMemoryProfileRepository } from '../models/profile.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';
import { assertJobStatus, parseApplicationInput, parseJobInput, parseMilestoneInput } from '../utils/validators.ts';

const MILESTONE_TRANSITIONS: Record<string, string[]> = {
  pending: ['submitted'],
  submitted: ['approved', 'disputed'],
  approved: [],
  disputed: ['submitted'],
};

export class JobService {
  private jobs: InMemoryJobRepository;
  private applications: InMemoryApplicationRepository;
  private milestones: InMemoryMilestoneRepository;
  private profiles: InMemoryProfileRepository;

  constructor(
    jobs = new InMemoryJobRepository(),
    applications = new InMemoryApplicationRepository(),
    milestones = new InMemoryMilestoneRepository(),
    profiles = new InMemoryProfileRepository()
  ) {
    this.jobs = jobs;
    this.applications = applications;
    this.milestones = milestones;
    this.profiles = profiles;
  }

  private async enrichJob(job: any) {
    if (!job) return null;
    const [milestones, applications] = await Promise.all([
      this.milestones.findMany({ job_id: job.id }),
      this.applications.findMany({ job_id: job.id }),
    ]);
    return { ...job, milestones, application_count: applications.length };
  }

  async createJob(organizationId: string, jobData: any) {
    const input = parseJobInput(jobData);
    const profile = await this.profiles.findByUserId(organizationId);
    const organization = { brand_name: profile?.name || organizationId };

    const job = await this.jobs.create({ ...input, organization_id: organizationId, organization });

    for (const msDef of input.milestones) {
      const msInput = parseMilestoneInput(msDef);
      await this.milestones.create({ ...msInput, job_id: job.id, deadline: msDef.deadline });
    }

    return this.enrichJob(job);
  }

  async getJob(jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    return this.enrichJob(job);
  }

  async listJobs(filters: any = {}) {
    if (filters.status) assertJobStatus(filters.status);
    const jobs = await this.jobs.findMany(filters);
    return Promise.all(jobs.map((j: any) => this.enrichJob(j)));
  }

  async listMyJobs(organizationId: string, filters: any = {}) {
    if (filters.status) assertJobStatus(filters.status);
    const jobs = await this.jobs.findMany({ organization_id: organizationId, ...filters });
    return Promise.all(jobs.map((j: any) => this.enrichJob(j)));
  }

  async quoteJob(jobData: any) {
    const input = parseJobInput(jobData);
    return {
      id: `quote_${Date.now()}`,
      quote: { total_usdc: input.total_budget },
    };
  }

  async applyToJob(jobId: string, creatorId: string, applicationData: any) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'open') throw new ValidationError('Job is not open for applications');

    const input = parseApplicationInput(applicationData);
    return this.applications.create({ ...input, job_id: jobId, creator_id: creatorId });
  }

  async listApplications(jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    return this.applications.findMany({ job_id: jobId });
  }

  async selectCreator(jobId: string, creatorId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    if (job.status !== 'open') throw new ValidationError('Job is not open for selection');

    const allApplications = await this.applications.findMany({ job_id: jobId });
    const chosen = allApplications.find((a: any) => a.creator_id === creatorId);
    if (!chosen) throw new NotFoundError('No application from this creator');

    for (const app of allApplications) {
      await this.applications.update(app.id, {
        status: app.creator_id === creatorId ? 'accepted' : 'rejected',
      });
    }

    return this.jobs.update(jobId, { status: 'in_progress', selected_creator_id: creatorId });
  }

  async cancelJob(jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    if (job.status === 'completed') throw new ValidationError('Cannot cancel a completed job');
    return this.jobs.update(jobId, { status: 'cancelled' });
  }

  async confirmFunding(jobId: string, data: any) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    return this.jobs.update(jobId, {
      funded: true,
      escrow_tx_hash: data.tx_hash || null,
    });
  }

  async listMilestones(jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    return this.milestones.findMany({ job_id: jobId });
  }

  async submitMilestone(milestoneId: string, data: any) {
    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'pending' && milestone.status !== 'disputed') {
      throw new ValidationError(`Cannot submit milestone from status: ${milestone.status}`);
    }
    const deliverable_url = String(data.deliverable_url || '').trim();
    if (!deliverable_url) throw new ValidationError('deliverable_url is required');
    return this.milestones.update(milestoneId, {
      status: 'submitted',
      deliverable_url,
      deliverable_note: data.deliverable_note || null,
    });
  }

  async approveMilestone(milestoneId: string) {
    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'submitted') {
      throw new ValidationError(`Cannot approve milestone from status: ${milestone.status}`);
    }
    return this.milestones.update(milestoneId, { status: 'approved' });
  }

  async getMyApplications(creatorId: string) {
    const apps = await this.applications.findMany({ creator_id: creatorId });
    return Promise.all(apps.map(async (app: any) => {
      const job = await this.jobs.findById(app.job_id);
      return {
        ...app,
        job_title: job?.title || '',
        job_total_budget: job?.total_budget || 0,
        job_target_platform: job?.target_platform || '',
        organization: job?.organization || {},
      };
    }));
  }

  async disputeMilestone(milestoneId: string, data: any) {
    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'submitted') {
      throw new ValidationError(`Cannot dispute milestone from status: ${milestone.status}`);
    }
    const reason = String(data.reason || '').trim();
    if (!reason) throw new ValidationError('reason is required');
    return this.milestones.update(milestoneId, { status: 'disputed', dispute_reason: reason });
  }
}
