import { verifyWeb3AuthToken } from '../utils/web3auth.ts';
import { InMemoryUserRepository } from '../models/user.ts';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors.ts';
import { config } from '../config/index.ts';

const VALID_PROFILE_TYPES = ['creator', 'organization'];

// Presenter-only demo personas. Resolving these bypasses Web3Auth, so it's gated
// strictly behind DEMO_MODE (only the testnet, no-real-funds demo deployment) and
// is reached only via the passphrase-gated presenter control. Judges still sign in
// through the real Web3Auth/MetaMask modal.
const DEMO_PERSONAS = ['demo-brand', 'demo-creator'];

// Derives a stable identity from a verified Web3Auth token payload.
function deriveIdentity(payload) {
  const wallets = Array.isArray(payload.wallets) ? payload.wallets : [];
  const wallet = wallets[0] || {};
  const walletAddress = wallet.address || wallet.public_key || '';

  // Prefer the provider identity (stable across logins); fall back to wallet/sub.
  const key = payload.verifierId
    ? `${payload.verifier || 'web3auth'}:${payload.verifierId}`
    : walletAddress || payload.sub;

  if (!key) {
    throw new UnauthorizedError('Token is missing an identity');
  }
  return { key, email: payload.email || '', walletAddress };
}

export class AuthService {
  private repository: InMemoryUserRepository;

  constructor(repository = new InMemoryUserRepository()) {
    this.repository = repository;
  }

  // Verifies the idToken and upserts the user. `profileType` is accepted only
  // on signup; it sets the role server-side.
  async createSession({ idToken, profileType }: { idToken: string; profileType?: string }) {
    if (!idToken) {
      throw new ValidationError('idToken is required');
    }
    if (profileType && !VALID_PROFILE_TYPES.includes(profileType)) {
      throw new ValidationError('Invalid profileType');
    }

    let payload;
    try {
      payload = await verifyWeb3AuthToken(idToken);
    } catch (e) {
      console.warn('[auth] ✗ session token verification failed:', (e as Error).message);
      throw e;
    }
    const { key, email, walletAddress } = deriveIdentity(payload);
    const user = await this.repository.upsert({ key, email, profileType, walletAddress });
    console.log(`[auth] ✓ session verified — user=${key} role=${user.profileType ?? 'none'} wallet=${walletAddress || 'n/a'}`);
    return { user };
  }

  // Verifies the bearer idToken and returns the stored user (role included).
  async getMe(idToken: string) {
    if (!idToken) {
      throw new UnauthorizedError('Missing authorization token');
    }
    // Demo persona (presenter-only, DEMO_MODE-gated): resolve the seeded brand /
    // creator without Web3Auth so the operator can drive a two-sided demo.
    if (config.demo.enabled && DEMO_PERSONAS.includes(idToken)) {
      const user = await this.repository.findByKey(idToken);
      if (user) return { user };
      throw new UnauthorizedError('Demo persona not seeded');
    }
    let payload;
    try {
      payload = await verifyWeb3AuthToken(idToken);
    } catch (e) {
      console.warn('[auth] ✗ /me token verification failed:', (e as Error).message);
      throw e;
    }
    const { key, email, walletAddress } = deriveIdentity(payload);
    let user = await this.repository.findByKey(key);
    if (!user) {
      // Server restarted and lost in-memory state — auto-recreate the user so
      // the session stays valid. The frontend Zustand store retains the role.
      console.warn(`[auth] user ${key} not in memory — recreating (server restart?)`);
      user = await this.repository.upsert({ key, email, walletAddress });
    }
    console.log(`[auth] ✓ /me verified — user=${key}`);
    return { user };
  }
}
