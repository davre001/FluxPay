import { config } from '../config/index.ts';

// Validates the presenter-unlock passphrase against the server-only secret
// (config.demo.unlockCode, from a gitignored env var). The secret is NEVER shipped
// to the client, so reading the frontend or backend source can't reveal it —
// only a correct passphrase POSTed here unlocks the hidden presenter control.
export function createDemoRoutes() {
  return {
    // POST /api/demo/unlock { code }
    async unlock(body: any) {
      const code = String(body?.code || '');
      const secret = config.demo.unlockCode;
      // Empty secret = no gate configured (local dev). A configured secret must
      // match exactly. Never echo the secret back.
      const ok = secret ? code === secret : true;
      return { statusCode: 200, body: { ok } };
    },
  };
}
