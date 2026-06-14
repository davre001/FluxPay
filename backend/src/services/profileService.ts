import { InMemoryProfileRepository } from '../models/profile.ts';
import { InMemoryUserRepository } from '../models/user.ts';
import { InMemoryJobRepository } from '../models/job.ts';
import { InMemoryMilestoneRepository } from '../models/milestone.ts';
import { NotFoundError } from '../utils/errors.ts';
import { parseProfileInput } from '../utils/validators.ts';
import { SocialOAuthService } from './socialOAuthService.ts';

// Every new user gets a small signup bonus to their reputation.
const SIGNUP_BONUS = 5;

export class ProfileService {
  private profiles: InMemoryProfileRepository;
  private users: InMemoryUserRepository;
  private jobs: InMemoryJobRepository;
  private milestones: InMemoryMilestoneRepository;
  private oauth: SocialOAuthService;

  constructor(
    profiles = new InMemoryProfileRepository(),
    users = new InMemoryUserRepository(),
    jobs = new InMemoryJobRepository(),
    milestones = new InMemoryMilestoneRepository(),
    oauth = new SocialOAuthService()
  ) {
    this.profiles = profiles;
    this.users = users;
    this.jobs = jobs;
    this.milestones = milestones;
    this.oauth = oauth;
  }

  // ── Social connect (OAuth) ────────────────────────────────────────────────

  async getSocialConnectUrl(userId: string, platform: string) {
    return this.oauth.buildAuthorizeUrl(platform, userId);
  }

  // Exchange the OAuth code, snapshot the account, and store it on the profile.
  // Also sets the plain social handle field so the existing socials UI shows it.
  async connectSocial(userId: string, platform: string, code: string, state: string) {
    const record = await this.oauth.completeConnect(platform, code, state, userId);
    const profile = await this.profiles.findByUserId(userId);
    const connected = { ...((profile as any)?.connected_socials || {}), [platform]: record };
    const updated = await this.profiles.upsert(userId, {
      connected_socials: connected,
      [platform]: record.handle,
    });
    return { platform, ...record, profile: updated };
  }

  async disconnectSocial(userId: string, platform: string) {
    const profile = await this.profiles.findByUserId(userId);
    const connected = { ...((profile as any)?.connected_socials || {}) };
    delete connected[platform];
    return this.profiles.upsert(userId, { connected_socials: connected });
  }

  // Count of OAuth-verified socials (drives the +5-per-social reputation bonus).
  private async verifiedSocialCount(userId: string): Promise<number> {
    const profile = await this.profiles.findByUserId(userId).catch(() => null);
    return Object.keys((profile as any)?.connected_socials || {}).length;
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

  // ── Reputation computation ────────────────────────────────────────────────
  //
  // Unified 0–100 scale for BOTH creators and brands.
  // Every user starts with a +5 signup bonus.
  //
  // Creator score:
  //   score = SIGNUP_BONUS + approvedMilestones × 5 + completedDeals × 10 − disputes × 3
  //   score = clamp(0, 100)
  //
  // Brand score:
  //   score = SIGNUP_BONUS + completedDeals × 10 + approvedMilestones × 3 − cancellations × 8 − disputesLost × 5
  //   score = clamp(0, 100)

  async getReputation(walletAddress: string) {
    const user = [...this.users.users.values()].find(
      (u: any) => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!user) {
      return {
        wallet_address: walletAddress,
        score: 0,
        profile_type: null,
        name: walletAddress,
      };
    }

    const profileType = user.profileType || null;
    const score = await this.computeScore(user.id, profileType);

    return {
      wallet_address: walletAddress,
      score,
      profile_type: profileType,
      name: user.email || walletAddress,
    };
  }

  // Unified reputation: 0–100 for both creators and brands.
  private async computeScore(userId: string, profileType: string | null): Promise<number> {
    if (profileType === 'creator') return this.computeCreatorScore(userId);
    if (profileType === 'organization') return this.computeBrandScore(userId);
    return SIGNUP_BONUS; // unknown role — still gets signup bonus
  }

  // Creator: 0–100
  //   +5 signup bonus
  //   +5 per approved milestone
  //   +10 per completed deal
  //   −3 per disputed milestone
  private async computeCreatorScore(userId: string): Promise<number> {
    const creatorJobs = await this.jobs.findMany({ selected_creator_id: userId });

    const completedDeals = creatorJobs.filter((j: any) => j.status === 'completed').length;

    let approvedMilestones = 0;
    let disputes = 0;
    for (const job of creatorJobs) {
      const milestones = await this.milestones.findMany({ job_id: job.id });
      for (const ms of milestones) {
        if (ms.status === 'approved') approvedMilestones++;
        if (ms.status === 'disputed') disputes++;
      }
    }

    const socialBonus = Math.min(20, (await this.verifiedSocialCount(userId)) * 5);
    const raw = SIGNUP_BONUS + (approvedMilestones * 5) + (completedDeals * 10) - (disputes * 3) + socialBonus;
    return Math.max(0, Math.min(100, raw));
  }

  // Brand: 0–100
  //   +5 signup bonus
  //   +10 per completed deal (successful campaign)
  //   +3 per approved milestone (smooth deliverable handoff)
  //   −8 per cancelled job
  //   −5 per dispute lost (disputed milestone that was later re-approved)
  private async computeBrandScore(orgUserId: string): Promise<number> {
    const orgJobs = await this.jobs.findMany({ organization_id: orgUserId });

    const completedDeals = orgJobs.filter((j: any) => j.status === 'completed').length;
    const cancellations = orgJobs.filter((j: any) => j.status === 'cancelled').length;

    let approvedMilestones = 0;
    let disputesLost = 0;
    for (const job of orgJobs) {
      const milestones = await this.milestones.findMany({ job_id: job.id });
      for (const ms of milestones) {
        if (ms.status === 'approved') approvedMilestones++;
        // Dispute lost = milestone that was disputed, then re-submitted and approved.
        // Uses the immutable `was_disputed` flag rather than the mutable dispute_reason text.
        if (ms.status === 'approved' && ms.was_disputed) disputesLost++;
      }
    }

    const socialBonus = Math.min(20, (await this.verifiedSocialCount(orgUserId)) * 5);
    const raw = SIGNUP_BONUS + (completedDeals * 10) + (approvedMilestones * 3) - (cancellations * 8) - (disputesLost * 5) + socialBonus;
    return Math.max(0, Math.min(100, raw));
  }

  // ── Public profile ────────────────────────────────────────────────────────

  async getPublicProfile(userId: string) {
    const profile = await this.profiles.findByUserId(userId);

    // Find the user to get walletAddress + profileType
    const user = [...this.users.users.values()].find((u: any) => u.id === userId) || null;

    if (!profile && !user) {
      throw new NotFoundError('Profile not found');
    }

    // Compute reputation
    const profileType = user?.profileType || null;
    const score = user ? await this.computeScore(userId, profileType) : 0;
    const reputation = { score, profile_type: profileType };

    // Completed deals for this user (works for both creators and brands)
    const completedDeals: any[] = [];
    if (profileType === 'creator') {
      const creatorJobs = await this.jobs.findMany({ selected_creator_id: userId });
      for (const job of creatorJobs) {
        if (job.status === 'completed') {
          completedDeals.push({
            job_id: job.id,
            title: job.title,
            total_budget: job.total_budget,
            platform: job.target_platform,
          });
        }
      }
    } else if (profileType === 'organization') {
      const orgJobs = await this.jobs.findMany({ organization_id: userId });
      for (const job of orgJobs) {
        if (job.status === 'completed') {
          completedDeals.push({
            job_id: job.id,
            title: job.title,
            total_budget: job.total_budget,
            platform: job.target_platform,
          });
        }
      }
    }

    return {
      user_id: userId,
      name: profile?.name || user?.email || userId,
      // NOTE: email is intentionally omitted — this is a public, no-auth endpoint.
      // The owner's email stays available via the authenticated getMyProfile().
      bio: profile?.bio || '',
      profile_picture_url: profile?.profile_picture_url || null,
      niche_tags: profile?.niche_tags || [],
      website_url: profile?.website_url || null,
      instagram: profile?.instagram || null,
      twitter: profile?.twitter || null,
      youtube: profile?.youtube || null,
      tiktok: profile?.tiktok || null,
      profile_type: profileType,
      reputation,
      completed_deals: completedDeals,
    };
  }

  // Compute reputation score for a userId directly (for enrichment), returns
  // the numeric score only (0–100 for everyone).
  async getReputationScoreForUser(userId: string): Promise<number> {
    const user = [...this.users.users.values()].find((u: any) => u.id === userId) || null;
    if (!user) return 0;
    return this.computeScore(userId, user.profileType);
  }
}
