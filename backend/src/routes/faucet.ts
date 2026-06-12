import { FaucetService } from '../services/faucetService.ts';

export function createFaucetRoutes(service = new FaucetService()) {
  return {
    // POST /api/faucet/drip — sends the one-time welcome USDC to `address`.
    // Idempotent per address; safe to call on every signup.
    async drip(_user: any, body: any) {
      const result = await service.drip(body?.address || '');
      return { statusCode: 200, body: result };
    },
  };
}
