import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestServer, readJson, post } from './helpers.ts';

describe('Wallet API', () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('GET /api/wallet/balance returns zero balance initially', async () => {
    const res = await fetch(`${server.baseUrl}/api/wallet/balance`);
    const body = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(body.balance, 0);
    assert.equal(body.chain_name, 'sepolia');
    assert.equal(body.chain_id, 11155111);
  });

  it('deposit increases balance and appears in transactions', async () => {
    const depRes = await post(server.baseUrl, '/api/wallet/deposit', {
      amount: 250,
      tx_hash: '0x' + 'a'.repeat(64),
    });
    const tx = await readJson(depRes);
    assert.equal(depRes.status, 200);
    assert.equal(tx.type, 'deposit');
    assert.equal(tx.amount, 250);

    const balRes = await fetch(`${server.baseUrl}/api/wallet/balance`);
    assert.equal((await readJson(balRes)).balance, 250);

    const txRes = await fetch(`${server.baseUrl}/api/wallet/transactions`);
    const txList = await readJson(txRes);
    assert.equal(txList.length, 1);
    assert.equal(txList[0].type, 'deposit');
  });

  it('withdraw reduces balance and appears in transactions', async () => {
    await post(server.baseUrl, '/api/wallet/deposit', { amount: 100 });
    const wdRes = await post(server.baseUrl, '/api/wallet/withdraw', {
      amount: 40,
      to_address: '0x' + 'c'.repeat(40),
    });
    const tx = await readJson(wdRes);
    assert.equal(wdRes.status, 200);
    assert.equal(tx.type, 'withdrawal');
    assert.equal(tx.amount, 40);

    const balRes = await fetch(`${server.baseUrl}/api/wallet/balance`);
    assert.equal((await readJson(balRes)).balance, 60);
  });

  it('withdraw fails with insufficient balance', async () => {
    const res = await post(server.baseUrl, '/api/wallet/withdraw', {
      amount: 999,
      to_address: '0x' + 'c'.repeat(40),
    });
    assert.equal(res.status, 400);
    assert.equal((await readJson(res)).error.code, 'validation_error');
  });

  it('deposit rejects invalid amount', async () => {
    const res = await post(server.baseUrl, '/api/wallet/deposit', { amount: -5 });
    assert.equal(res.status, 400);
  });

  it('withdraw rejects invalid address', async () => {
    await post(server.baseUrl, '/api/wallet/deposit', { amount: 100 });
    const res = await post(server.baseUrl, '/api/wallet/withdraw', {
      amount: 10,
      to_address: 'not-an-address',
    });
    assert.equal(res.status, 400);
  });
});
