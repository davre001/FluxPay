import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestServer, readJson, put } from './helpers.ts';

describe('Profile API', () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it('creates and updates a profile via PUT /api/profile/me', async () => {
    const res = await put(server.baseUrl, '/api/profile/me', {
      name: 'Acme Corp',
      bio: 'We make things',
      niche_tags: ['tech', 'b2b'],
      instagram: 'acmecorp',
    });
    const profile = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(profile.name, 'Acme Corp');
    assert.equal(profile.bio, 'We make things');
    assert.deepEqual(profile.niche_tags, ['tech', 'b2b']);
    assert.equal(profile.instagram, 'acmecorp');
    assert.equal(profile.user_id, 'test-org-1');

    // Update name only
    const updateRes = await put(server.baseUrl, '/api/profile/me', { name: 'Acme Inc' });
    const updated = await readJson(updateRes);
    assert.equal(updated.name, 'Acme Inc');
  });

  it('GET /api/profile/me returns 404 when profile does not exist', async () => {
    const res = await fetch(`${server.baseUrl}/api/profile/me`);
    const body = await readJson(res);
    assert.equal(res.status, 404);
    assert.equal(body.error.code, 'not_found');
  });

  it('GET /api/profile/me returns the profile after it is created', async () => {
    await put(server.baseUrl, '/api/profile/me', { name: 'My Brand' });
    const res = await fetch(`${server.baseUrl}/api/profile/me`);
    const profile = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(profile.name, 'My Brand');
  });

  it('GET /api/profile/reputation/:wallet returns a reputation object', async () => {
    const wallet = '0x' + 'a'.repeat(40);
    const res = await fetch(`${server.baseUrl}/api/profile/reputation/${wallet}`);
    const body = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(body.wallet_address, wallet);
    assert.equal(typeof body.score, 'number');
  });

  it('GET /api/reputation/:wallet also returns a reputation object', async () => {
    const wallet = '0x' + 'b'.repeat(40);
    const res = await fetch(`${server.baseUrl}/api/reputation/${wallet}`);
    const body = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(body.wallet_address, wallet);
  });
});
