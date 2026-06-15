import { config } from '../config/index.ts';

// 3 starter deals a brand owns on first demo login — varying amounts that sum to
// $400 (the demo wallet balance), so the brand can fund/approve them illustratively.
const DEMO_BRAND_DEALS = [
  {
    title: 'Instagram Reel — Product Launch', target_platform: 'instagram', post_type: 'video',
    payout_type: 'milestone', total_budget: 200, skills: ['Reels', 'Editing'],
    description: 'Create a 30s launch reel. Milestones: concept approval, then publish with tags.',
    milestones: [
      { title: 'Concept + moodboard', description: 'Share the storyboard for approval', amount: 80 },
      { title: 'Publish reel', description: 'Publish with the required tags', amount: 120 },
    ],
  },
  {
    title: 'TikTok Clip — Brand Shoutout', target_platform: 'tiktok', post_type: 'video',
    payout_type: 'milestone', total_budget: 100, skills: ['TikTok', 'Short-form'],
    description: 'A punchy 15s shoutout clip published to your TikTok.',
    milestones: [{ title: 'Publish clip', description: 'Post the clip with the brand handle', amount: 100 }],
  },
  {
    title: 'X Thread — Feature Highlight', target_platform: 'twitter', post_type: 'content_writing',
    payout_type: 'milestone', total_budget: 100, skills: ['Copywriting', 'Threads'],
    description: 'A 5-tweet thread highlighting the product, with a referral link.',
    milestones: [{ title: 'Publish thread', description: 'Post the thread with the link', amount: 100 }],
  },
];

export function createDemoRoutes(jobService: any = null) {
  return {
    // POST /api/demo/unlock { code } — validate the presenter passphrase against
    // the server-only secret. Never reveals it.
    async unlock(body: any) {
      const code = String(body?.code || '');
      const secret = config.demo.unlockCode;
      const ok = secret ? code === secret : true;
      return { statusCode: 200, body: { ok } };
    },

    // POST /api/demo/ensure-deals — idempotently give the calling brand 3 starter
    // deals on first login so the dashboard isn't empty. Demo-only.
    async ensureBrandDeals(user: any) {
      if (!config.demo.enabled || !jobService) return { statusCode: 200, body: { created: 0 } };
      const existing = await jobService.listMyJobs(user.id).catch(() => []);
      if (existing.length > 0) return { statusCode: 200, body: { created: 0, reason: 'already_has_deals' } };
      for (const d of DEMO_BRAND_DEALS) {
        await jobService.createJob(user.id, d).catch(() => null);
      }
      return { statusCode: 201, body: { created: DEMO_BRAND_DEALS.length } };
    },
  };
}
