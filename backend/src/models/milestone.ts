import { generateMilestoneId, nowIso } from '../utils/helpers.ts';

export function createMilestoneRecord(input) {
  const timestamp = nowIso();
  return {
    id: generateMilestoneId(),
    job_id: input.job_id,
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
