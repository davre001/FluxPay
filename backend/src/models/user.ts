import { nowIso } from '../utils/helpers.ts';

// In-memory user store, keyed by a stable identity derived from the verified
// Web3Auth token (verifier + verifierId, e.g. the login provider + email).
// Role (profileType) lives here — server-side and trustworthy — not in the
// browser. Swap this for a database without touching the service/routes.
export class InMemoryUserRepository {
  constructor(initialUsers = []) {
    this.users = new Map();
    initialUsers.forEach((user) => this.users.set(user.id, { ...user }));
  }

  async upsert({ key, email, profileType, walletAddress }) {
    const existing = this.users.get(key);

    if (existing) {
      const updated = {
        ...existing,
        email: email || existing.email,
        // Only change role when a new one is explicitly supplied (e.g. signup).
        profileType: profileType || existing.profileType,
        walletAddress: walletAddress || existing.walletAddress,
        updatedAt: nowIso(),
      };
      this.users.set(key, updated);
      return { ...updated };
    }

    const user = {
      id: key,
      email: email || '',
      profileType: profileType || null,
      walletAddress: walletAddress || '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.users.set(key, user);
    return { ...user };
  }

  async findByKey(key) {
    const user = this.users.get(key);
    return user ? { ...user } : null;
  }
}
