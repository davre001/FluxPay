import { nowIso } from '../utils/helpers.ts';

export function createProfileRecord(userId, input) {
  const timestamp = nowIso();
  return {
    user_id: userId,
    name: input.name || '',
    email: input.email || '',
    bio: input.bio || '',
    website_url: input.website_url || null,
    location: input.location || null,
    profile_picture_url: input.profile_picture_url || null,
    niche_tags: Array.isArray(input.niche_tags) ? input.niche_tags : [],
    instagram: input.instagram || null,
    twitter: input.twitter || null,
    youtube: input.youtube || null,
    tiktok: input.tiktok || null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class InMemoryProfileRepository {
  profiles: Map<string, any>;

  constructor(initialProfiles: any = []) {
    this.profiles = new Map();
    initialProfiles.forEach((p: any) => this.profiles.set(p.user_id, { ...p }));
  }

  async upsert(userId: string, input: any) {
    const existing = this.profiles.get(userId);
    if (existing) {
      const updated = {
        ...existing,
        ...input,
        user_id: userId,
        created_at: existing.created_at,
        updated_at: nowIso(),
      };
      this.profiles.set(userId, updated);
      return { ...updated };
    }
    const created = createProfileRecord(userId, input);
    this.profiles.set(userId, created);
    return { ...created };
  }

  async findByUserId(userId: string) {
    const profile = this.profiles.get(userId);
    return profile ? { ...profile } : null;
  }

  async findByWalletAddress(walletAddress: string) {
    const match = [...this.profiles.values()].find(
      (p: any) => p.wallet_address === walletAddress
    );
    return match ? { ...match } : null;
  }

  async clear() {
    this.profiles.clear();
  }
}
