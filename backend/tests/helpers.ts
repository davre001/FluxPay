import { createApp } from '../src/app.ts';
import { InMemoryPaymentRepository } from '../src/models/payment.ts';

export const ORG_USER = {
  id: 'test-org-1',
  email: 'org@test.com',
  profileType: 'organization',
  walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};

export const CREATOR_USER = {
  id: 'test-creator-1',
  email: 'creator@test.com',
  profileType: 'creator',
  walletAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
};

export async function createTestServer(overrides: any = {}) {
  const repository = overrides.repository || new InMemoryPaymentRepository();
  const app = createApp({
    repository,
    skipAuth: true,
    mockUser: overrides.mockUser || ORG_USER,
    ...overrides,
  });

  await new Promise<void>((resolve) => app.listen(0, () => resolve()));
  const address = app.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    app,
    repository,
    locals: (app as any).locals,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        app.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

export async function readJson(response: any) {
  return response.json();
}

export function post(baseUrl: string, path: string, body: any = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function put(baseUrl: string, path: string, body: any = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patch(baseUrl: string, path: string, body: any = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
