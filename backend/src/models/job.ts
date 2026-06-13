import { generateJobId, nowIso } from '../utils/helpers.ts';

export function createJobRecord(input) {
  const timestamp = nowIso();
  return {
    id: generateJobId(),
    organization_id: input.organization_id,
    title: input.title,
    description: input.description || '',
    category: input.category || null,
    skills: input.skills || [],
    target_platform: input.target_platform || 'other',
    post_type: input.post_type || 'other',
    required_elements: input.required_elements || {
      hashtags: [],
      mentions: [],
      link_in_bio: false,
      brand_tag: false,
      custom: null,
    },
    payout_type: input.payout_type || 'full',
    total_budget: input.total_budget,
    deadline: input.deadline || null,
    auto_cancel_on_deadline: input.auto_cancel_on_deadline ?? false,
    eligibility: input.eligibility || {
      min_reputation: 0,
      required_platforms: [],
      min_followers: null,
      region: null,
      invite_only: false,
    },
    status: input.status || 'open',
    // Escrow/settlement state for the deal: unfunded | funded | partially_released | released.
    funding_status: input.funding_status || 'unfunded',
    // true only for demo/seed deals — lets them be deleted without touching real ones.
    seeded: input.seeded || false,
    selected_creator_id: input.selected_creator_id || null,
    organization: input.organization || { brand_name: input.organization_id },
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class InMemoryJobRepository {
  jobs: Map<string, any>;

  constructor(initialJobs: any = []) {
    this.jobs = new Map();
    initialJobs.forEach((job: any) => this.jobs.set(job.id, { ...job }));
  }

  async create(input: any) {
    const job: any = createJobRecord(input);
    this.jobs.set(job.id, job);
    return { ...job };
  }

  async findById(id: any) {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async findMany(filters: any = {}) {
    const matches = [...this.jobs.values()].filter((job: any) => {
      if (filters.organization_id && job.organization_id !== filters.organization_id) return false;
      if (filters.status && job.status !== filters.status) return false;
      if (filters.platform && job.target_platform !== filters.platform) return false;
      if (filters.payout_type && job.payout_type !== filters.payout_type) return false;
      if (filters.min_budget && job.total_budget < Number(filters.min_budget)) return false;
      if (filters.max_budget && job.total_budget > Number(filters.max_budget)) return false;
      return true;
    });

    return matches
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((job: any) => ({ ...job }));
  }

  async update(id: any, changes: any) {
    const job = this.jobs.get(id);
    if (!job) return null;
    const updated = { ...job, ...changes, id: job.id, created_at: job.created_at, updated_at: nowIso() };
    this.jobs.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.jobs.clear();
  }
}
