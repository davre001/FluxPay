import { InMemoryJobRepository } from '../models/job.ts';
import { InMemoryApplicationRepository } from '../models/application.ts';
import { InMemoryMilestoneRepository } from '../models/milestone.ts';
import { InMemoryProfileRepository } from '../models/profile.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';
import { assertJobStatus, parseApplicationInput, parseJobInput, parseMilestoneInput, isValidHttpUrl, urlMatchesPlatform } from '../utils/validators.ts';

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
    const application = await this.applications.create({ ...input, job_id: jobId, creator_id: creatorId });

    // Auto-hire: if the brand enabled it and this applicant qualifies, select them
    // immediately. The brand still grants the ERC-7715 permission from the deal
    // page (we can't sign their wallet), so this only advances the selection.
    if (job.auto_hire) {
      const { qualified } = await this.qualifyApplicant(job, creatorId);
      if (qualified) {
        await this.selectCreator(jobId, creatorId).catch(() => null);
      }
    }
    return application;
  }

  async listApplications(jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    const apps = (await this.applications.findMany({ job_id: jobId }))
      .filter((a: any) => a.status !== 'withdrawn');
    return Promise.all(apps.map(async (app: any) => {
      const profile = await this.profiles.findByUserId(app.creator_id).catch(() => null);
      const { qualified, reasons } = await this.qualifyApplicant(job, app.creator_id);
      return {
        ...app,
        creator_name: (profile as any)?.name || app.creator_id,
        creator_reputation: await this.creatorReputation(app.creator_id),
        qualified,
        qualification_reasons: reasons,
      };
    }));
  }

  // Creator reputation on the unified 0–100 scale (starts at the +5 signup bonus):
  //   score = 5 + approvedMilestones × 5 + completedDeals × 10 − disputes × 3
  // Mirrors ProfileService.computeCreatorScore; kept here so application listings
  // can enrich without a cross-service dependency.
  private async creatorReputation(creatorId: string): Promise<number> {
    const creatorJobs = await this.jobs.findMany({ selected_creator_id: creatorId });
    const completedDeals = creatorJobs.filter((j: any) => j.status === 'completed').length;
    let approvedMs = 0;
    let disputes = 0;
    for (const cj of creatorJobs) {
      const ms = await this.milestones.findMany({ job_id: cj.id });
      for (const m of ms) {
        if (m.status === 'approved') approvedMs++;
        if (m.status === 'disputed') disputes++;
      }
    }
    const profile = await this.profiles.findByUserId(creatorId).catch(() => null);
    const socialBonus = Math.min(20, Object.keys((profile as any)?.connected_socials || {}).length * 5);
    return Math.max(0, Math.min(100, 5 + approvedMs * 5 + completedDeals * 10 - disputes * 3 + socialBonus));
  }

  // Deterministic eligibility screening for an applicant against a job's criteria.
  // Returns qualified + human-readable reasons (shown on the brand's applicant
  // cards). Follower/verified/age checks use OAuth-connected accounts only.
  async qualifyApplicant(job: any, creatorId: string): Promise<{ qualified: boolean; reasons: string[] }> {
    const elig = job?.eligibility || {};
    const reasons: string[] = [];
    let qualified = true;

    const profile = await this.profiles.findByUserId(creatorId).catch(() => null);
    const connected: Record<string, any> = (profile as any)?.connected_socials || {};
    const accounts = Object.values(connected);
    const rep = await this.creatorReputation(creatorId);

    const minRep = Number(elig.min_reputation || 0);
    if (rep < minRep) { qualified = false; reasons.push(`Reputation ${rep} below required ${minRep}`); }
    else if (minRep > 0) reasons.push(`Reputation ${rep} ≥ ${minRep}`);

    for (const p of (Array.isArray(elig.required_platforms) ? elig.required_platforms : [])) {
      if (connected[p]) reasons.push(`${p} connected`);
      else if (p === 'instagram' || p === 'tiktok') { qualified = false; reasons.push(`${p} can't be verified yet`); }
      else { qualified = false; reasons.push(`${p} not connected`); }
    }

    const minFollowers = Number(elig.min_followers || 0);
    if (minFollowers > 0) {
      const maxF = accounts.reduce((m: number, a: any) => Math.max(m, Number(a?.followers || 0)), 0);
      if (maxF >= minFollowers) reasons.push(`${maxF.toLocaleString()} followers ≥ ${minFollowers}`);
      else { qualified = false; reasons.push(`Followers ${maxF.toLocaleString()} below ${minFollowers.toLocaleString()}`); }
    }

    if (elig.require_verified) {
      if (accounts.some((a: any) => a?.verified)) reasons.push('Verified account');
      else { qualified = false; reasons.push('A verified account is required'); }
    }

    const minAge = Number(elig.min_account_age_months || 0);
    if (minAge > 0) {
      const oldest = accounts.reduce((m: number, a: any) => {
        const d = a?.joined_at ? new Date(a.joined_at).getTime() : Infinity;
        return Math.min(m, d);
      }, Infinity);
      const months = oldest === Infinity ? 0 : (Date.now() - oldest) / (1000 * 60 * 60 * 24 * 30);
      if (months >= minAge) reasons.push(`Account ≥ ${minAge} months old`);
      else { qualified = false; reasons.push(`Account younger than ${minAge} months`); }
    }

    return { qualified, reasons };
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
      funding_status: 'funded',
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
    if (!isValidHttpUrl(deliverable_url)) {
      throw new ValidationError('deliverable_url must be a valid http(s) link');
    }
    // Deliverable must be on the job's target platform (e.g. no TikTok link on
    // an Instagram job). 'other' platform jobs accept any valid URL.
    const job = await this.jobs.findById(milestone.job_id);
    if (job && job.target_platform !== 'other' && !urlMatchesPlatform(job.target_platform, deliverable_url)) {
      throw new ValidationError(`Deliverable must be a ${job.target_platform} link`);
    }
    return this.milestones.update(milestoneId, {
      status: 'submitted',
      deliverable_url,
      deliverable_note: data.deliverable_note || null,
    });
  }

  // Deal-level submission: the creator submits ONE deliverable link for the
  // whole deal; every still-open milestone is marked submitted with that link
  // and run through the autonomous settlement loop (AI judges each stage's goal
  // independently). `settle` is the SettlementService, injected by the route so
  // the service layering stays clean.
  async submitDealDeliverable(jobId: string, _creatorId: string, data: any, settle?: any) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    const deliverable_url = String(data.deliverable_url || '').trim();
    if (!deliverable_url) throw new ValidationError('deliverable_url is required');
    if (!isValidHttpUrl(deliverable_url)) {
      throw new ValidationError('deliverable_url must be a valid http(s) link');
    }
    if (job.target_platform !== 'other' && !urlMatchesPlatform(job.target_platform, deliverable_url)) {
      throw new ValidationError(`Deliverable must be a ${job.target_platform} link`);
    }

    const milestones = await this.milestones.findMany({ job_id: jobId });
    const open = milestones.filter((m: any) => m.status === 'pending' || m.status === 'disputed');
    if (open.length === 0) throw new ValidationError('No milestones are awaiting submission');

    const results: any[] = [];
    for (const ms of open) {
      await this.milestones.update(ms.id, {
        status: 'submitted',
        deliverable_url,
        deliverable_note: data.deliverable_note || null,
      });
      // Per-stage AI verify → release. Fire-and-forget-safe: a failure on one
      // stage never blocks the others or the response.
      let result: any = { settled: false, stage: 'skipped' };
      if (settle) {
        result = await Promise.resolve(settle.settleMilestone(ms.id)).catch((e: any) => ({
          settled: false, stage: 'error', reason: e?.message || String(e),
        }));
      }
      results.push({ milestone_id: ms.id, ...result });
    }
    return { job_id: jobId, deliverable_url, submitted: open.length, results };
  }

  // Re-run AI verification on a single milestone that was submitted but not yet
  // detected/approved (e.g. the AI missed it). Optionally replaces the link.
  async recheckMilestone(milestoneId: string, data: any = {}, settle?: any) {
    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status === 'approved') {
      throw new ValidationError('Milestone is already approved');
    }
    if (milestone.status !== 'submitted') {
      throw new ValidationError(`Milestone must be submitted before a re-check (status: ${milestone.status})`);
    }

    const newUrl = data.deliverable_url ? String(data.deliverable_url).trim() : '';
    if (newUrl) {
      if (!isValidHttpUrl(newUrl)) throw new ValidationError('deliverable_url must be a valid http(s) link');
      const job = await this.jobs.findById(milestone.job_id);
      if (job && job.target_platform !== 'other' && !urlMatchesPlatform(job.target_platform, newUrl)) {
        throw new ValidationError(`Deliverable must be a ${job.target_platform} link`);
      }
      await this.milestones.update(milestoneId, { deliverable_url: newUrl });
    }

    if (!settle) return { milestone_id: milestoneId, settled: false, stage: 'skipped' };
    const result = await Promise.resolve(settle.settleMilestone(milestoneId)).catch((e: any) => ({
      settled: false, stage: 'error', reason: e?.message || String(e),
    }));
    return { milestone_id: milestoneId, ...result };
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
    const apps = (await this.applications.findMany({ creator_id: creatorId }))
      .filter((a: any) => a.status !== 'withdrawn');
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

  // Creator withdraws their own pending application (soft delete).
  async withdrawApplication(applicationId: string, creatorId: string) {
    const application = await this.applications.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    if (application.creator_id !== creatorId) throw new ValidationError('Not your application');
    if (application.status !== 'pending') {
      throw new ValidationError(`Cannot withdraw a ${application.status} application`);
    }
    return this.applications.update(applicationId, { status: 'withdrawn' });
  }

  // All applications across the org's own jobs, enriched with job + applicant
  // context — powers the brand's approvals inbox.
  async getIncomingApplications(orgUserId: string) {
    const jobs = await this.jobs.findMany({ organization_id: orgUserId });
    const grouped = await Promise.all(jobs.map(async (job: any) => {
      const apps = await this.applications.findMany({ job_id: job.id });
      return Promise.all(
        apps
          .filter((a: any) => a.status !== 'withdrawn')
          .map(async (app: any) => {
            const profile = await this.profiles.findByUserId(app.creator_id).catch(() => null);
            const { qualified, reasons } = await this.qualifyApplicant(job, app.creator_id);
            return {
              ...app,
              job_id: job.id,
              job_title: job.title,
              job_target_platform: job.target_platform,
              job_total_budget: job.total_budget,
              creator_name: (profile as any)?.name || app.creator_id,
              creator_reputation: await this.creatorReputation(app.creator_id),
              qualified,
              qualification_reasons: reasons,
            };
          }),
      );
    }));
    return grouped.flat();
  }

  async disputeMilestone(milestoneId: string, data: any) {
    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'submitted') {
      throw new ValidationError(`Cannot dispute milestone from status: ${milestone.status}`);
    }
    const reason = String(data.reason || '').trim();
    if (!reason) throw new ValidationError('reason is required');
    // `was_disputed` is a permanent, immutable record that this milestone was ever
    // disputed — used for brand reputation. dispute_reason may be cleared on resubmit.
    return this.milestones.update(milestoneId, { status: 'disputed', dispute_reason: reason, was_disputed: true });
  }
}
