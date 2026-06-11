import { PaymentService } from '../services/paymentService.ts';

export function createPaymentRoutes(service = new PaymentService()) {
  return {
    async create(body) {
      return {
        statusCode: 201,
        body: await service.processPayment(body),
      };
    },

    async list(query) {
      return {
        statusCode: 200,
        body: await service.listPayments({
          userId: query.get('userId') || undefined,
          status: query.get('status') || undefined,
          datasetId: query.get('datasetId') || undefined,
        }),
      };
    },

    async get(paymentId) {
      return {
        statusCode: 200,
        body: await service.getPayment(paymentId),
      };
    },

    async status(paymentId) {
      return {
        statusCode: 200,
        body: await service.getPaymentStatus(paymentId),
      };
    },

    async history(userId) {
      return {
        statusCode: 200,
        body: await service.getPaymentHistory(userId),
      };
    },

    async updateStatus(paymentId, body) {
      return {
        statusCode: 200,
        body: await service.updatePaymentStatus(paymentId, body.status),
      };
    },
  };
}
