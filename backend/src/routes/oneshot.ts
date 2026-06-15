import { RelayerService } from '../services/relayerService.ts';
import { config } from '../config/index.ts';

// Public, read-only proof that the 1Shot integration is live. Hits 1Shot's free
// read APIs (capabilities + fee quote) — no funds, no auth — to power the
// judge-facing "settlement rail" panel. Mirrors the route → service layering.
export function createOneshotRoutes(relayer = new RelayerService()) {
  return {
    // GET /api/oneshot/status?chainId=8453
    async status(chainId?: number) {
      const status = await relayer.buildStatus(chainId || config.oneshot.chainId);
      return { statusCode: 200, body: status };
    },
  };
}
