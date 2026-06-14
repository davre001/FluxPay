import { generateMilestoneId, nowIso } from '../utils/helpers.ts';

export function createMilestoneRecord(input) {
  const timestamp = nowIso();
  return {
    id: generateMilestoneId(),
    job_id: input.job_id,
    // null = a job-level template milestone (the deal's definition). A non-null
    // creator_id marks a per-creator instance that one approved creator works on.
    creator_id: input.creator_id ?? null,
    title: input.title,
    description: input.description || '',
    amount: input.amount,
    // Platform metric + required count this milestone is measured by (e.g. 1000 likes).
    metric: input.metric || null,
    target: input.target ?? null,
    status: 'pending',
    deliverable_url: null,
    deliverable_note: null,
    due_date: input.due_date || input.deadline || null,
    dispute_reason: null,
    // Permanent flag: set true the first time this milestone is disputed and never
    // cleared — brand reputation reads this instead of the mutable dispute_reason.
    was_disputed: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class InMemoryMilestoneRepository {
  milestones: Map<string, any>;

  constructor(initialMilestones: any = []) {
    this.milestones = new Map();
    initialMilestones.forEach((m: any) => this.milestones.set(m.id, { ...m }));
  }

  async create(input: any) {
    const milestone: any = createMilestoneRecord(input);
    this.milestones.set(milestone.id, milestone);
    return { ...milestone };
  }

  async findById(id: any) {
    const milestone = this.milestones.get(id);
    return milestone ? { ...milestone } : null;
  }

  async findMany(filters: any = {}) {
    const matches = [...this.milestones.values()].filter((m: any) => {
      if (filters.job_id && m.job_id !== filters.job_id) return false;
      if (filters.status && m.status !== filters.status) return false;
      // 'creator_id' in filters lets callers ask for templates (null) or one
      // creator's instances explicitly; omitting it returns templates + instances.
      if ('creator_id' in filters && (m.creator_id ?? null) !== filters.creator_id) return false;
      return true;
    });

    return matches
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m: any) => ({ ...m }));
  }

  async update(id: any, changes: any) {
    const milestone = this.milestones.get(id);
    if (!milestone) return null;
    const updated = {
      ...milestone,
      ...changes,
      id: milestone.id,
      created_at: milestone.created_at,
      updated_at: nowIso(),
    };
    this.milestones.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.milestones.clear();
  }
}
