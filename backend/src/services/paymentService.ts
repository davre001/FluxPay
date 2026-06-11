import { InMemoryPaymentRepository } from '../models/payment.ts';
import { NotFoundError } from '../utils/errors.ts';
import { assertPaymentStatus, parsePaymentInput } from '../utils/validators.ts';

export class PaymentService {
  constructor(repository = new InMemoryPaymentRepository()) {
    this.repository = repository;
  }

  async processPayment(paymentData) {
    const input = parsePaymentInput(paymentData);
    return this.repository.create(input);
  }

  async getPayment(paymentId) {
    const payment = await this.repository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }

  async getPaymentStatus(paymentId) {
    const payment = await this.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      transactionHash: payment.transactionHash,
      updatedAt: payment.updatedAt,
    };
  }

  async listPayments(filters = {}) {
    if (filters.status) {
      assertPaymentStatus(filters.status);
    }
    return this.repository.findMany(filters);
  }

  async getPaymentHistory(userId) {
    return this.repository.findMany({ userId });
  }

  async updatePaymentStatus(paymentId, status) {
    const nextStatus = assertPaymentStatus(status);
    const payment = await this.repository.updateStatus(paymentId, nextStatus);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }
    return payment;
  }
}

export const paymentService = new PaymentService();

export function processPayment(paymentData) {
  return paymentService.processPayment(paymentData);
}

export function getPaymentHistory(userId) {
  return paymentService.getPaymentHistory(userId);
}

export function updatePaymentStatus(paymentId, status) {
  return paymentService.updatePaymentStatus(paymentId, status);
}
