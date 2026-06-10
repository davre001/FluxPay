/**
 * mock-data.ts
 * Central frontend-only mock data layer.
 * Persists to localStorage so data survives page refreshes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MockJob {
  id: string;
  title: string;
  description: string;
  target_platform: string;
  post_type: string;
  total_budget: number;
  payout_type: 'milestone' | 'full';
  status: 'open' | 'in_progress' | 'completed' | 'draft' | 'cancelled' | 'expired';
  deadline: string | null;
  application_count: number;
  organization?: { brand_name: string; logo_url?: string };
  milestones?: MockMilestone[];
  required_elements?: { hashtags: string[]; mentions: string[] };
  owner_id?: string;
}

export interface MockMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'disputed';
  deliverable_url?: string;
  deliverable_note?: string;
  due_date?: string;
}

export interface MockApplication {
  id: string;
  job_id: string;
  creator_id: string;
  creator_email: string;
  cover_note: string;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}

export interface MockTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release';
  amount: number;
  tx_hash?: string;
  created_at: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_JOBS: MockJob[] = [
  {
    id: 'job_001',
    title: 'Instagram Reel — Summer Collection Launch',
    description: 'Create a 30-60s Instagram Reel showcasing our new summer fashion collection. You have creative freedom — we just need authentic energy and the hashtag #SummerByLuma.',
    target_platform: 'instagram',
    post_type: 'video',
    total_budget: 1200,
    payout_type: 'milestone',
    status: 'open',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    application_count: 7,
    organization: { brand_name: 'Luma Fashion' },
    milestones: [
      { id: 'ms_001a', title: 'Draft concept', description: 'Submit a mood board or storyboard', amount: 200, status: 'pending', due_date: new Date(Date.now() + 5 * 86400000).toISOString() },
      { id: 'ms_001b', title: 'Post reel', description: 'Publish reel with required tags', amount: 1000, status: 'pending', due_date: new Date(Date.now() + 14 * 86400000).toISOString() },
    ],
    required_elements: { hashtags: ['SummerByLuma', 'LumaFashion'], mentions: ['@lumafashion'] },
  },
  {
    id: 'job_002',
    title: 'YouTube Review — Pro Wireless Earbuds X7',
    description: 'Honest 5-10 minute unboxing and audio quality review of our flagship X7 earbuds. We want your genuine opinion — we believe in the product.',
    target_platform: 'youtube',
    post_type: 'video',
    total_budget: 3500,
    payout_type: 'milestone',
    status: 'open',
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    application_count: 12,
    organization: { brand_name: 'SoundCore Tech' },
    milestones: [
      { id: 'ms_002a', title: 'Product received confirmation', description: 'Confirm receipt of the product', amount: 0, status: 'pending' },
      { id: 'ms_002b', title: 'Draft video submitted', description: 'Submit unlisted video link for review', amount: 500, status: 'pending' },
      { id: 'ms_002c', title: 'Video published', description: 'Final published video with pinned comment', amount: 3000, status: 'pending' },
    ],
    required_elements: { hashtags: ['SoundCoreX7', 'TechReview'], mentions: [] },
  },
  {
    id: 'job_003',
    title: 'TikTok Series — 3 Videos on Productivity Hacks',
    description: 'Create 3 short TikToks (under 60s each) about productivity using our Notion templates. Fun, relatable tone — not corporate.',
    target_platform: 'tiktok',
    post_type: 'video',
    total_budget: 900,
    payout_type: 'full',
    status: 'open',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    application_count: 4,
    organization: { brand_name: 'NotionPro Templates' },
    milestones: [],
    required_elements: { hashtags: ['NotionHacks', 'ProductivityTips'], mentions: ['@notionpro'] },
  },
  {
    id: 'job_004',
    title: 'Twitter/X Thread — Crypto Savings Explainer',
    description: 'Write a 10-tweet educational thread explaining DeFi savings for beginners. Must be accurate, engaging, and include our referral link at the end.',
    target_platform: 'twitter',
    post_type: 'content_writing',
    total_budget: 600,
    payout_type: 'full',
    status: 'open',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    application_count: 2,
    organization: { brand_name: 'YieldVault Finance' },
    milestones: [],
    required_elements: { hashtags: ['DeFi', 'CryptoSavings'], mentions: ['@yieldvault'] },
  },
  {
    id: 'job_005',
    title: 'Instagram Story Takeover — Fitness Challenge',
    description: '24-hour story takeover for our fitness brand during the launch week of our new app. Document your workout routine using our app.',
    target_platform: 'instagram',
    post_type: 'image',
    total_budget: 800,
    payout_type: 'full',
    status: 'open',
    deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    application_count: 9,
    organization: { brand_name: 'FitNation App' },
    milestones: [],
    required_elements: { hashtags: ['FitNation', 'FitChallenge'], mentions: ['@fitnationapp'] },
  },
  {
    id: 'job_006',
    title: 'YouTube Short — Skincare Routine Feature',
    description: '60-second YouTube Short featuring our new vitamin C serum in your morning skincare routine. Natural lighting, minimal editing preferred.',
    target_platform: 'youtube',
    post_type: 'video',
    total_budget: 1800,
    payout_type: 'milestone',
    status: 'open',
    deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    application_count: 15,
    organization: { brand_name: 'Glow Lab Beauty' },
    milestones: [
      { id: 'ms_006a', title: 'Concept approval', description: 'Submit script and shot list', amount: 300, status: 'pending' },
      { id: 'ms_006b', title: 'Short published', description: 'Published YouTube Short with description link', amount: 1500, status: 'pending' },
    ],
    required_elements: { hashtags: ['GlowLab', 'SkincareRoutine', 'VitaminC'], mentions: [] },
  },
];

const SEED_TRANSACTIONS: MockTransaction[] = [
  { id: 'tx_001', type: 'deposit', amount: 500, tx_hash: '0xabc123...', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'tx_002', type: 'escrow_lock', amount: 200, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'tx_003', type: 'escrow_release', amount: 200, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeeded() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('fp_seeded')) {
    write('fp_jobs', SEED_JOBS);
    write('fp_transactions', SEED_TRANSACTIONS);
    write('fp_applications', [] as MockApplication[]);
    write('fp_balance', 300);
    localStorage.setItem('fp_seeded', '1');
  }
}

// ─── Mock API ─────────────────────────────────────────────────────────────────

export const mockDB = {
  // ── Jobs ──
  getJobs(): MockJob[] {
    ensureSeeded();
    return read<MockJob[]>('fp_jobs', SEED_JOBS);
  },

  getOpenJobs(): MockJob[] {
    return this.getJobs().filter((j) => j.status === 'open');
  },

  getMyJobs(ownerId: string): MockJob[] {
    return this.getJobs().filter((j) => j.owner_id === ownerId);
  },

  getJobById(id: string): MockJob | undefined {
    return this.getJobs().find((j) => j.id === id);
  },

  createJob(data: Partial<MockJob>, ownerId: string): MockJob {
    const jobs = this.getJobs();
    const job: MockJob = {
      id: `job_${Date.now()}`,
      title: data.title ?? 'Untitled Deal',
      description: data.description ?? '',
      target_platform: data.target_platform ?? 'instagram',
      post_type: data.post_type ?? 'video',
      total_budget: data.total_budget ?? 0,
      payout_type: data.payout_type ?? 'full',
      status: 'open',
      deadline: data.deadline ?? null,
      application_count: 0,
      organization: data.organization,
      milestones: data.milestones ?? [],
      required_elements: data.required_elements ?? { hashtags: [], mentions: [] },
      owner_id: ownerId,
    };
    jobs.push(job);
    write('fp_jobs', jobs);
    return job;
  },

  updateJobStatus(jobId: string, status: MockJob['status']): void {
    const jobs = this.getJobs().map((j) => j.id === jobId ? { ...j, status } : j);
    write('fp_jobs', jobs);
  },

  updateMilestone(jobId: string, milestoneId: string, update: Partial<MockMilestone>): void {
    const jobs = this.getJobs().map((j) => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        milestones: (j.milestones ?? []).map((m) =>
          m.id === milestoneId ? { ...m, ...update } : m
        ),
      };
    });
    write('fp_jobs', jobs);
  },

  // ── Applications ──
  getApplications(): MockApplication[] {
    ensureSeeded();
    return read<MockApplication[]>('fp_applications', []);
  },

  getApplicationsForJob(jobId: string): MockApplication[] {
    return this.getApplications().filter((a) => a.job_id === jobId);
  },

  getMyApplications(creatorId: string): MockApplication[] {
    return this.getApplications().filter((a) => a.creator_id === creatorId);
  },

  applyToJob(jobId: string, creatorId: string, creatorEmail: string, coverNote: string): MockApplication {
    const apps = this.getApplications();
    const existing = apps.find((a) => a.job_id === jobId && a.creator_id === creatorId);
    if (existing) throw new Error('Already applied to this job');
    const app: MockApplication = {
      id: `app_${Date.now()}`,
      job_id: jobId,
      creator_id: creatorId,
      creator_email: creatorEmail,
      cover_note: coverNote,
      status: 'pending',
      applied_at: new Date().toISOString(),
    };
    apps.push(app);
    write('fp_applications', apps);
    // increment count on job
    const jobs = this.getJobs().map((j) =>
      j.id === jobId ? { ...j, application_count: (j.application_count ?? 0) + 1 } : j
    );
    write('fp_jobs', jobs);
    return app;
  },

  updateApplicationStatus(appId: string, status: MockApplication['status']): void {
    const apps = this.getApplications().map((a) =>
      a.id === appId ? { ...a, status } : a
    );
    write('fp_applications', apps);
  },

  // ── Wallet ──
  getBalance(): number {
    ensureSeeded();
    return read<number>('fp_balance', 300);
  },

  setBalance(b: number): void {
    write('fp_balance', b);
  },

  getTransactions(): MockTransaction[] {
    ensureSeeded();
    return read<MockTransaction[]>('fp_transactions', SEED_TRANSACTIONS);
  },

  addTransaction(tx: Omit<MockTransaction, 'id' | 'created_at'>): MockTransaction {
    const txs = this.getTransactions();
    const full: MockTransaction = { ...tx, id: `tx_${Date.now()}`, created_at: new Date().toISOString() };
    txs.unshift(full);
    write('fp_transactions', txs);
    return full;
  },

  // ── Profile ──
  getProfile(userId: string): Record<string, any> {
    return read(`fp_profile_${userId}`, {});
  },

  saveProfile(userId: string, data: Record<string, any>): void {
    const existing = this.getProfile(userId);
    write(`fp_profile_${userId}`, { ...existing, ...data });
  },
};
