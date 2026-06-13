import { isDbEnabled, query } from '../database/client.ts';

// Bump this to force a clean reseed of the demo data (jobs, milestones,
// applications) on the next deploy. When the DB's stored version differs from
// this value, those three tables are cleared and rebuilt from the seed below;
// other tables (users, profiles, wallets, permissions) are left untouched.
// With no DATABASE_URL (in-memory) data resets every restart, so it's unused there.
const SEED_VERSION = '2026-06-13-rich-deals';

// Master switch. Set SEED_DEMO_DATA=false (e.g. in Render) once you're running on
// real data: the seeder then never clears or inserts demo deals again, so every
// deal you create from the app persists. Default on, for the demo.
const SEED_DEMO_DATA = (process.env.SEED_DEMO_DATA ?? 'true').toLowerCase() !== 'false';

async function getAppliedSeedVersion(): Promise<string | null> {
  const rows = await query<{ value: string }>(`SELECT value FROM seed_meta WHERE key = 'seed_version'`);
  return rows[0]?.value ?? null;
}

async function markSeedVersion(version: string): Promise<void> {
  await query(
    `INSERT INTO seed_meta (key, value, updated_at) VALUES ('seed_version', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [version],
  );
}

// Days-from-now → ISO, for human-readable "Nd left" deadlines.
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

type SeedMilestone = { title: string; description: string; amount: number; status?: 'pending' | 'submitted' | 'approved' | 'disputed' };
type SeedDeal = {
  title: string;
  brand_name: string;
  category: string;
  target_platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'other';
  post_type: 'video' | 'image' | 'content_writing' | 'other';
  total_budget: number;
  payout_type: 'milestone' | 'full';
  status: 'open' | 'in_progress' | 'completed';
  funding_status: 'unfunded' | 'funded' | 'partially_released' | 'released';
  deadlineDays: number;
  skills: string[];
  milestones: SeedMilestone[];
  description?: string;
};

// ~20 deals grouped by category, each with skills, milestones and a realistic
// status/funding mix (open·unfunded/funded, in_progress·partially_released, completed·released).
const DEALS: SeedDeal[] = [
  // ── Fashion ──
  { title: 'Instagram Reel — Summer Collection Drop', brand_name: 'Luma Fashion', category: 'Fashion', target_platform: 'instagram', post_type: 'video', total_budget: 1200, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 14,
    skills: ['Short-form video', 'Styling', 'Storytelling'],
    milestones: [ { title: 'Concept + moodboard', description: 'Submit storyboard for approval', amount: 200 }, { title: 'Draft reel', description: 'Unlisted draft for review', amount: 300 }, { title: 'Publish reel', description: 'Publish with required tags', amount: 700 } ] },
  { title: 'TikTok Haul — Streetwear Fits', brand_name: 'DripHouse', category: 'Fashion', target_platform: 'tiktok', post_type: 'video', total_budget: 950, payout_type: 'milestone', status: 'in_progress', funding_status: 'partially_released', deadlineDays: 9,
    skills: ['Short-form video', 'Trend editing', 'On-camera presenting'],
    milestones: [ { title: 'Outfit selection', description: 'Confirm 3 looks', amount: 150, status: 'approved' }, { title: 'Film haul', description: 'Record + edit', amount: 400, status: 'submitted' }, { title: 'Publish', description: 'Post with hashtags', amount: 400 } ] },

  // ── Beauty ──
  { title: 'YouTube — Vitamin C Serum Routine', brand_name: 'Glow Lab', category: 'Beauty', target_platform: 'youtube', post_type: 'video', total_budget: 1800, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 12,
    skills: ['Tutorial creation', 'Lighting', 'Voiceover'],
    milestones: [ { title: 'Script + shot list', description: 'Approve script', amount: 300 }, { title: 'Publish short', description: 'Published with description link', amount: 1500 } ] },
  { title: 'Instagram Story — Everyday Makeup Look', brand_name: 'Velvet Cosmetics', category: 'Beauty', target_platform: 'instagram', post_type: 'image', total_budget: 600, payout_type: 'full', status: 'open', funding_status: 'unfunded', deadlineDays: 18,
    skills: ['Photography', 'Makeup artistry'],
    milestones: [ { title: 'Shoot + edit', description: 'Deliver 5 story frames', amount: 600 } ] },

  // ── Tech ──
  { title: 'YouTube Review — Wireless Earbuds X7', brand_name: 'SoundCore Tech', category: 'Tech', target_platform: 'youtube', post_type: 'video', total_budget: 3500, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 21,
    skills: ['Product review', 'Video editing', 'Audio'],
    milestones: [ { title: 'Unboxing confirmed', description: 'Confirm receipt', amount: 0 }, { title: 'Draft video', description: 'Unlisted link for review', amount: 500 }, { title: 'Publish', description: 'Final video + pinned comment', amount: 3000 } ] },
  { title: 'X Thread — Best Dev Tools of 2026', brand_name: 'CodeStack', category: 'Tech', target_platform: 'twitter', post_type: 'content_writing', total_budget: 500, payout_type: 'full', status: 'completed', funding_status: 'released', deadlineDays: 2,
    skills: ['Thread writing', 'Copywriting'],
    milestones: [ { title: 'Publish 10-tweet thread', description: 'With referral link', amount: 500, status: 'approved' } ] },
  { title: 'SaaS Walkthrough — Project Tool', brand_name: 'FlowDesk', category: 'Tech', target_platform: 'youtube', post_type: 'video', total_budget: 2500, payout_type: 'milestone', status: 'in_progress', funding_status: 'funded', deadlineDays: 16,
    skills: ['Tutorial creation', 'Screen recording', 'Scriptwriting'],
    milestones: [ { title: 'Outline', description: 'Approve flow', amount: 400, status: 'approved' }, { title: 'Record demo', description: 'Submit draft', amount: 900, status: 'submitted' }, { title: 'Publish', description: 'Public video', amount: 1200 } ] },

  // ── Gaming ──
  { title: 'Gameplay Walkthrough — New Season', brand_name: 'PixelForge', category: 'Gaming', target_platform: 'youtube', post_type: 'video', total_budget: 3000, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 8,
    skills: ['Live streaming', 'Video editing', 'Commentary'],
    milestones: [ { title: 'Capture footage', description: 'Record 2h session', amount: 600 }, { title: 'Edit highlights', description: '20-min cut', amount: 900 }, { title: 'Publish', description: 'Upload + thumbnail', amount: 1000 }, { title: 'Community post', description: 'Pin discussion', amount: 500 } ] },
  { title: 'TikTok Clips — Gaming Highlights', brand_name: 'Neon Arcade', category: 'Gaming', target_platform: 'tiktok', post_type: 'video', total_budget: 700, payout_type: 'milestone', status: 'open', funding_status: 'unfunded', deadlineDays: 11,
    skills: ['Short-form video', 'Highlight editing'],
    milestones: [ { title: 'Clip selection', description: 'Pick 3 moments', amount: 200 }, { title: 'Edit + caption', description: 'Deliver clips', amount: 200 }, { title: 'Publish', description: 'Post series', amount: 300 } ] },

  // ── Crypto / Web3 ──
  { title: 'Tutorial — Set Up a Web3 Wallet', brand_name: 'ChainBase', category: 'Crypto', target_platform: 'youtube', post_type: 'video', total_budget: 4500, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 14,
    skills: ['Tutorial creation', 'Scriptwriting', 'Voiceover'],
    milestones: [ { title: 'Script approval', description: 'Beginner-friendly script', amount: 700 }, { title: 'Record + edit', description: 'Submit draft', amount: 1800 }, { title: 'Publish', description: 'Public + chapters', amount: 2000 } ] },
  { title: 'X Thread — DeFi Savings Explainer', brand_name: 'YieldVault', category: 'Crypto', target_platform: 'twitter', post_type: 'content_writing', total_budget: 600, payout_type: 'milestone', status: 'in_progress', funding_status: 'partially_released', deadlineDays: 7,
    skills: ['Thread writing', 'Research'],
    milestones: [ { title: 'Outline', description: 'Approve angle', amount: 150, status: 'approved' }, { title: 'Publish thread', description: '10 tweets + link', amount: 450 } ] },
  { title: 'Twitter Space Co-host — On-chain Payments', brand_name: 'FluxPay', category: 'Crypto', target_platform: 'other', post_type: 'other', total_budget: 1000, payout_type: 'full', status: 'open', funding_status: 'funded', deadlineDays: 5,
    skills: ['Public speaking', 'Moderation'],
    milestones: [ { title: 'Prep talking points', description: 'Share outline', amount: 200 }, { title: 'Host the Space', description: '60-min live session', amount: 800 } ] },

  // ── Fitness ──
  { title: 'Fitness Reel — 30-Day Challenge', brand_name: 'FitNation', category: 'Fitness', target_platform: 'instagram', post_type: 'video', total_budget: 1600, payout_type: 'milestone', status: 'in_progress', funding_status: 'partially_released', deadlineDays: 20,
    skills: ['Short-form video', 'Fitness coaching'],
    milestones: [ { title: 'Week 1 post', description: 'Kickoff reel', amount: 400, status: 'approved' }, { title: 'Week 2 post', description: 'Progress reel', amount: 400, status: 'approved' }, { title: 'Week 3 post', description: 'Progress reel', amount: 400, status: 'submitted' }, { title: 'Finale post', description: 'Results reel', amount: 400 } ] },
  { title: 'TikTok — Home Workout Series', brand_name: 'MoveDaily', category: 'Fitness', target_platform: 'tiktok', post_type: 'video', total_budget: 900, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 13,
    skills: ['Short-form video', 'Choreography'],
    milestones: [ { title: 'Plan 3 workouts', description: 'Confirm routines', amount: 200 }, { title: 'Film series', description: 'Edit 3 clips', amount: 400 }, { title: 'Publish', description: 'Post series', amount: 300 } ] },

  // ── Food ──
  { title: 'TikTok Recipe — 60s Healthy Snacks', brand_name: 'FreshBite', category: 'Food', target_platform: 'tiktok', post_type: 'video', total_budget: 800, payout_type: 'full', status: 'open', funding_status: 'unfunded', deadlineDays: 10,
    skills: ['Short-form video', 'Food styling'],
    milestones: [ { title: 'Recipe + film', description: 'Under-60s recipe', amount: 800 } ] },
  { title: 'YouTube — Pour-over Coffee Guide', brand_name: 'RoastHouse', category: 'Food', target_platform: 'youtube', post_type: 'video', total_budget: 1400, payout_type: 'milestone', status: 'completed', funding_status: 'released', deadlineDays: 1,
    skills: ['Tutorial creation', 'Cinematography'],
    milestones: [ { title: 'Script', description: 'Approve guide', amount: 300, status: 'approved' }, { title: 'Film + edit', description: 'Submit draft', amount: 500, status: 'approved' }, { title: 'Publish', description: 'Public video', amount: 600, status: 'approved' } ] },

  // ── Finance ──
  { title: 'Explainer — Budgeting for Gen Z', brand_name: 'MintWallet', category: 'Finance', target_platform: 'youtube', post_type: 'video', total_budget: 2200, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 17,
    skills: ['Scriptwriting', 'Motion graphics'],
    milestones: [ { title: 'Script + storyboard', description: 'Approve', amount: 400 }, { title: 'Animate + record', description: 'Submit draft', amount: 900 }, { title: 'Publish', description: 'Public video', amount: 900 } ] },

  // ── Music ──
  { title: 'Reel — Feature Our New Single', brand_name: 'WaveSound', category: 'Music', target_platform: 'instagram', post_type: 'video', total_budget: 750, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 9,
    skills: ['Short-form video', 'Audio sync'],
    milestones: [ { title: 'Concept', description: 'Pick the hook', amount: 250 }, { title: 'Publish reel', description: 'Use the track', amount: 500 } ] },

  // ── Travel ──
  { title: 'Vlog — City Guide Feature', brand_name: 'Wanderly', category: 'Travel', target_platform: 'youtube', post_type: 'video', total_budget: 2800, payout_type: 'milestone', status: 'in_progress', funding_status: 'funded', deadlineDays: 25,
    skills: ['Vlogging', 'Video editing', 'Drone'],
    milestones: [ { title: 'Shot list', description: 'Approve locations', amount: 500, status: 'approved' }, { title: 'Film b-roll', description: 'Submit footage', amount: 1000, status: 'submitted' }, { title: 'Edit', description: 'Final cut', amount: 800 }, { title: 'Publish', description: 'Upload', amount: 500 } ] },

  // ── Lifestyle / E-commerce ──
  { title: 'TikTok Unboxing — Smart Home Kit', brand_name: 'NestGadgets', category: 'Lifestyle', target_platform: 'tiktok', post_type: 'video', total_budget: 1100, payout_type: 'milestone', status: 'open', funding_status: 'funded', deadlineDays: 12,
    skills: ['Unboxing', 'Short-form video'],
    milestones: [ { title: 'Unbox + script', description: 'Confirm angle', amount: 300 }, { title: 'Film + edit', description: 'Submit draft', amount: 400 }, { title: 'Publish', description: 'Post + link in bio', amount: 400 } ] },
];

export async function seedInitialData(locals: any) {
  if (!SEED_DEMO_DATA) return;       // demo seeding off — leave all data untouched
  if (DEALS.length === 0) return;    // nothing to seed — never wipe existing data

  const { jobRepository, milestoneRepository, applicationRepository, profileRepository, userRepository } = locals;

  // Decide whether to (re)seed.
  if (isDbEnabled()) {
    // Persistent DB: gate on the seed version. Same version → already current, skip.
    // Different/absent → clear the seed-owned tables and rebuild cleanly.
    if ((await getAppliedSeedVersion()) === SEED_VERSION) return;
    await applicationRepository.clear();
    await milestoneRepository.clear();
    await jobRepository.clear();
  } else {
    // In-memory: reseeds on every restart; just avoid duplicating within a run.
    const existingJobs = await jobRepository.findMany();
    if (existingJobs.length > 0) return;
  }

  // Ensure default mock user exists
  await userRepository.upsert({ key: 'test-user', email: 'creator@example.com', profileType: 'creator' });
  await profileRepository.upsert('test-user', {
    type: 'creator',
    name: 'Test Creator',
    bio: 'Just a mock creator profile.',
  });

  const createdInProgress: any[] = [];

  for (const d of DEALS) {
    const job = await jobRepository.create({
      title: d.title,
      organization_id: `org-${d.brand_name.toLowerCase().replace(/\s+/g, '-')}`,
      organization: { brand_name: d.brand_name },
      description: d.description || `Looking for a creator for "${d.title}". ${d.skills.join(', ')} — collaborate with ${d.brand_name} and get paid in USDC as milestones are approved.`,
      category: d.category,
      skills: d.skills,
      target_platform: d.target_platform,
      post_type: d.post_type,
      payout_type: d.payout_type,
      total_budget: d.total_budget,
      deadline: inDays(d.deadlineDays),
      status: d.status,
      funding_status: d.funding_status,
      seeded: true,
    });

    // Milestones live in their own repo; createMilestoneRecord forces 'pending',
    // so set non-pending statuses with a follow-up update.
    for (const ms of d.milestones) {
      const created = await milestoneRepository.create({
        job_id: job.id,
        title: ms.title,
        description: ms.description,
        amount: ms.amount,
      });
      if (ms.status && ms.status !== 'pending') {
        await milestoneRepository.update(created.id, { status: ms.status });
      }
    }

    if (d.status === 'in_progress') createdInProgress.push(job);
  }

  // Make the first in-progress deal an active deal for the mock creator, so the
  // creator dashboard "My Deals" isn't empty (selected creator + accepted application).
  const activeJob = createdInProgress[0];
  if (activeJob) {
    const application = await applicationRepository.create({
      job_id: activeJob.id,
      creator_id: 'test-user',
      cover_note: `I'd love to work on "${activeJob.title}" — my audience is a great fit.`,
    });
    await applicationRepository.update(application.id, { status: 'accepted' });
    await jobRepository.update(activeJob.id, { selected_creator_id: 'test-user' });
  }

  // Record the applied version so unchanged future deploys skip reseeding.
  if (isDbEnabled()) await markSeedVersion(SEED_VERSION);
}
