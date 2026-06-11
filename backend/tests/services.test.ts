import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { InMemoryPaymentRepository } from '../src/models/payment.ts';
import { PaymentService } from '../src/services/paymentService.ts';

describe('API Service', () => {
  let service: any;

  beforeEach(() => {
    service = new PaymentService(new InMemoryPaymentRepository());
  });

  it('processes a marketplace payment as pending', async () => {
    const payment = await service.processPayment({
      amount: 125,
      currency: 'FPT',
      userId: 'buyer-1',
      description: 'Vision dataset purchase',
      datasetId: 'dataset-vision-001',
      transactionHash: `0x${'a'.repeat(64)}`,
      buyerWallet: `0x${'1'.repeat(40)}`,
      sellerWallet: `0x${'2'.repeat(40)}`,
      network: 'sepolia',
    });

    assert.match(payment.id, /^pay_/);
    assert.equal(payment.status, 'pending');
    assert.equal(payment.userId, 'buyer-1');
    assert.equal(payment.currency, 'FPT');
    assert.equal(payment.datasetId, 'dataset-vision-001');
  });

  it('returns history newest first and supports status updates', async () => {
    const first = await service.processPayment({ amount: 10, userId: 'buyer-2' });
    const second = await service.processPayment({ amount: 20, userId: 'buyer-2' });

    const completed = await service.updatePaymentStatus(first.id, 'completed');
    const history = await service.getPaymentHistory('buyer-2');

    assert.equal(completed.status, 'completed');
    assert.deepEqual(history.map((payment: any) => payment.id), [second.id, first.id]);
  });

  it('rejects invalid amounts and transaction hashes', async () => {
    await assert.rejects(
      () => service.processPayment({ amount: 0, userId: 'buyer-3' }),
      /Amount must be a positive number/
    );

    await assert.rejects(
      () => service.processPayment({ amount: 10, userId: 'buyer-3', transactionHash: '0x123' }),
      /transactionHash/
    );
  });
});
