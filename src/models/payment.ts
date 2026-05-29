import { generatePaymentId, nowIso } from '../utils/helpers.ts';

export function createPaymentRecord(input) {
  const timestamp = nowIso();
  return {
    id: generatePaymentId(),
    amount: input.amount,
    currency: input.currency,
    userId: input.userId,
    description: input.description,
    datasetId: input.datasetId,
    buyerWallet: input.buyerWallet,
    sellerWallet: input.sellerWallet,
    transactionHash: input.transactionHash,
    network: input.network,
    metadata: input.metadata || {},
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export class InMemoryPaymentRepository {
  constructor(initialPayments = []) {
    this.payments = new Map();
    initialPayments.forEach((payment) => {
      this.payments.set(payment.id, { ...payment });
    });
  }

  async create(input) {
    const payment = createPaymentRecord(input);
    this.payments.set(payment.id, payment);
    return { ...payment };
  }

  async findById(id) {
    const payment = this.payments.get(id);
    return payment ? { ...payment } : null;
  }

  async findMany(filters = {}) {
    const matches = [...this.payments.values()].filter((payment) => {
      if (filters.userId && payment.userId !== filters.userId) return false;
      if (filters.status && payment.status !== filters.status) return false;
      if (filters.datasetId && payment.datasetId !== filters.datasetId) return false;
      return true;
    });

    return matches
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((payment) => ({ ...payment }));
  }

  async updateStatus(id, status) {
    const payment = this.payments.get(id);
    if (!payment) {
      return null;
    }

    const updated = {
      ...payment,
      status,
      updatedAt: nowIso(),
    };

    this.payments.set(id, updated);
    return { ...updated };
  }

  async clear() {
    this.payments.clear();
  }
}
