import { generateApplicationId, nowIso } from '../utils/helpers.ts';

export function createApplicationRecord(input) {
  const timestamp = nowIso();
  return {
    id: generateApplicationId(),
    job_id: input.job_id,
    creator_id: input.creator_id,
    cover_note: input.cover_note,
    status: 'pending',
    applied_at: timestamp,
    updated_at: timestamp,
  };
}

export class InMemoryApplicationRepository {
  applications: Map<string, any>;

  constructor(initialApplications: any = []) {
    this.applications = new Map();
    initialApplications.forEach((a: any) => this.applications.set(a.id, { ...a }));
  }

  async create(input: any) {
    const application: any = createApplicationRecord(input);
    this.applications.set(application.id, application);
    return { ...application };
  }

  async findById(id: any) {
    const application = this.applications.get(id);
    return application ? { ...application } : null;
  }

  async findMany(filters: any = {}) {
    const matches = [...this.applications.values()].filter((a: any) => {
      if (filters.job_id && a.job_id !== filters.job_id) return false;
      if (filters.creator_id && a.creator_id !== filters.creator_id) return false;
      if (filters.status && a.status !== filters.status) return false;
      return true;
    });

    return matches
      .sort((a: any, b: any) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .map((a: any) => ({ ...a }));
  }

  async update(id: any, changes: any) {
    const application = this.applications.get(id);
    if (!application) return null;
    const updated = {
      ...application,
      ...changes,
      id: application.id,
      applied_at: application.applied_at,
      updated_at: nowIso(),
    };
    this.applications.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.applications.clear();
  }
}
