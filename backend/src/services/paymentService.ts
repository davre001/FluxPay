import { InMemoryPaymentRepository } from '../models/payment.ts';
import { NotFoundError } from '../utils/errors.ts';
import { assertPaymentStatus, parsePaymentInput } from '../utils/validators.ts';

export class PaymentService {
  private repository: InMemoryPaymentRepository;

  constructor(repository = new InMemoryPaymentRepository()) {
    this.repository = repository;
  }

  async processPayment(paymentData: any) {
    const input = parsePaymentInput(paymentData);
    return this.repository.create(input);
  }

  async getPayment(paymentId: string) {
    const payment = await this.repository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      transactionHash: payment.transactionHash,
      updatedAt: payment.updatedAt,
    };
  }

  async listPayments(filters: { status?: string; userId?: string; datasetId?: string } = {}) {
    if (filters.status) {
      assertPaymentStatus(filters.status);
    }
    return this.repository.findMany(filters);
  }

  async getPaymentHistory(userId: string) {
    return this.repository.findMany({ userId });
  }

  async updatePaymentStatus(paymentId: string, status: string) {
    const nextStatus = assertPaymentStatus(status);
    const payment = await this.repository.updateStatus(paymentId, nextStatus);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }
}

export const paymentService = new PaymentService();

export function processPayment(paymentData: any) {
  return paymentService.processPayment(paymentData);
}

export function getPaymentHistory(userId: string) {
  return paymentService.getPaymentHistory(userId);
}

export function updatePaymentStatus(paymentId: string, status: string) {
  return paymentService.updatePaymentStatus(paymentId, status);
}
