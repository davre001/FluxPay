import { generateDealId, nowIso } from '../utils/helpers.ts';

export function createDealRecord(input) {
  const timestamp = nowIso();
  return {
    id: generateDealId(),
    organizationId: input.organizationId,
    title: input.title,
    description: input.description,
    budget: input.budget,
    currency: input.currency,
    status: 'open',
    selectedApplicationId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export class InMemoryDealRepository {
  deals: Map<string, any>;

  constructor(initialDeals: any = []) {
    this.deals = new Map();
    initialDeals.forEach((deal: any) => {
      this.deals.set(deal.id, { ...deal });
    });
  }

  async create(input: any) {
    const deal: any = createDealRecord(input);
    this.deals.set(deal.id, deal);
    return { ...deal };
  }

  async findById(id: any) {
    const deal = this.deals.get(id);
    return deal ? { ...deal } : null;
  }

  async findMany(filters: any = {}) {
    const matches = [...this.deals.values()].filter((deal: any) => {
      if (filters.organizationId && deal.organizationId !== filters.organizationId) return false;
      if (filters.status && deal.status !== filters.status) return false;
      return true;
    });

    return matches
      .sort(
        (left: any, right: any) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      )
      .map((deal: any) => ({ ...deal }));
  }

  async update(id: any, changes: any) {
    const deal = this.deals.get(id);
    if (!deal) {
      return null;
    }

    const updated = {
      ...deal,
      ...changes,
      id: deal.id,
      createdAt: deal.createdAt,
      updatedAt: nowIso(),
    };

    this.deals.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.deals.clear();
  }
}
