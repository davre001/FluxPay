import { InMemoryProfileRepository } from '../models/profile.ts';
import { InMemoryUserRepository } from '../models/user.ts';
import { NotFoundError } from '../utils/errors.ts';
import { parseProfileInput } from '../utils/validators.ts';

export class ProfileService {
  private profiles: InMemoryProfileRepository;
  private users: InMemoryUserRepository;

  constructor(
    profiles = new InMemoryProfileRepository(),
    users = new InMemoryUserRepository()
  ) {
    this.profiles = profiles;
    this.users = users;
  }

  async getMyProfile(userId: string) {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) throw new NotFoundError('Profile not found — update your profile first');
    return profile;
  }

  async updateMyProfile(userId: string, data: any) {
    const input = parseProfileInput(data);
    return this.profiles.upsert(userId, input);
  }

  async getReputation(walletAddress: string) {
    const user = [...this.users.users.values()].find(
      (u: any) => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    return {
      wallet_address: walletAddress,
      score: 0,
      profile_type: user?.profileType || null,
      name: user?.email || walletAddress,
    };
  }
}
