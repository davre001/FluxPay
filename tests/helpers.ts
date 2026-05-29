import { createApp } from '../src/app.ts';
import { InMemoryPaymentRepository } from '../src/models/payment.ts';

export async function createTestServer() {
  const repository = new InMemoryPaymentRepository();
  const app = createApp({ repository });

  await new Promise((resolve) => app.listen(0, resolve));
  const address = app.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    app,
    repository,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        app.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

export async function readJson(response) {
  return response.json();
}
