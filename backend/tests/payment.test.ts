import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestServer, readJson } from './helpers.ts';

describe('Payment service', () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('creates, reads, lists, and updates payments over HTTP', async () => {
    const createResponse = await fetch(`${server.baseUrl}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50,
        currency: 'FPT',
        userId: 'frontend-user',
        description: 'NLP dataset purchase',
      }),
    });
    const created = await readJson(createResponse);

    assert.equal(createResponse.status, 201);
    assert.equal(created.status, 'pending');

    const getResponse = await fetch(`${server.baseUrl}/api/payments/${created.id}`);
    const fetched = await readJson(getResponse);

    assert.equal(getResponse.status, 200);
    assert.equal(fetched.id, created.id);

    const patchResponse = await fetch(`${server.baseUrl}/api/payments/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const updated = await readJson(patchResponse);

    assert.equal(patchResponse.status, 200);
    assert.equal(updated.status, 'completed');

    const historyResponse = await fetch(`${server.baseUrl}/api/payments/history/frontend-user`);
    const history = await readJson(historyResponse);

    assert.equal(historyResponse.status, 200);
    assert.equal(history.length, 1);
    assert.equal(history[0].id, created.id);
  });

  it('returns useful validation errors', async () => {
    const response = await fetch(`${server.baseUrl}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: -10 }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'validation_error');
  });

  it('exposes a health endpoint', async () => {
    const response = await fetch(`${server.baseUrl}/api/health`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'fluxpay-backend');
  });
});
