import { ValidationError } from './errors.ts';
import { normalizeAddress, sanitizeString } from './helpers.ts';

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];
export const SUPPORTED_CURRENCIES = ['FPT', 'ETH', 'USDC', 'USD'];
export const JOB_STATUSES = ['open', 'in_progress', 'completed', 'cancelled'];
export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];
export const MILESTONE_STATUSES = ['pending', 'submitted', 'approved', 'disputed'];
export const TARGET_PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'other'];
export const POST_TYPES = ['video', 'image', 'content_writing', 'other'];
export const PAYOUT_TYPES = ['milestone', 'full'];
/** @deprecated use JOB_STATUSES */
export const DEAL_STATUSES = JOB_STATUSES;

export function validatePaymentAmount(amount: any) {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
}

export function validateEmail(email: any) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidEthereumAddress(address: any) {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTransactionHash(hash: any) {
  return typeof hash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function assertPaymentStatus(status: any) {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of: ${PAYMENT_STATUSES.join(', ')}`);
  }
  return status;
}

export function parsePaymentInput(data: any = {}) {
  const amount = Number(data.amount);
  if (!validatePaymentAmount(amount)) {
    throw new ValidationError('Amount must be a positive number');
  }

  const userId = sanitizeString(data.userId);
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('userId is required');
  }

  const currencyInput = sanitizeString(data.currency || 'FPT');
  if (typeof currencyInput !== 'string') {
    throw new ValidationError('currency must be a string');
  }
  const currency = currencyInput.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  const transactionHash = sanitizeString(data.transactionHash);
  if (transactionHash && !isValidTransactionHash(transactionHash)) {
    throw new ValidationError('transactionHash must be a 32-byte hex string');
  }

  const buyerWallet = normalizeAddress(data.buyerWallet);
  if (buyerWallet && !isValidEthereumAddress(buyerWallet)) {
    throw new ValidationError('buyerWallet must be a valid Ethereum address');
  }

  const sellerWallet = normalizeAddress(data.sellerWallet);
  if (sellerWallet && !isValidEthereumAddress(sellerWallet)) {
    throw new ValidationError('sellerWallet must be a valid Ethereum address');
  }

  return {
    amount,
    userId,
    currency,
    description: String(sanitizeString(data.description || '')),
    datasetId: String(sanitizeString(data.datasetId || '')),
    buyerWallet,
    sellerWallet,
    transactionHash,
    network: String(sanitizeString(data.network || '')),
    metadata: data.metadata && typeof data.metadata === 'object' ? data.metadata : {},
  };
}

function parseCurrency(value: any) {
  const currencyInput = sanitizeString(value || 'USDC');
  if (typeof currencyInput !== 'string') {
    throw new ValidationError('currency must be a string');
  }
  const currency = currencyInput.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  return currency;
}

export function assertJobStatus(status: any) {
  if (!JOB_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of: ${JOB_STATUSES.join(', ')}`);
  }
  return status;
}

/** @deprecated use assertJobStatus */
export const assertDealStatus = assertJobStatus;

export function assertMilestoneStatus(status: any) {
  if (!MILESTONE_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of: ${MILESTONE_STATUSES.join(', ')}`);
  }
  return status;
}

export function parseJobInput(data: any = {}) {
  const title = sanitizeString(data.title);
  if (!title || typeof title !== 'string') {
    throw new ValidationError('title is required');
  }

  const total_budget = Number(data.total_budget);
  if (!validatePaymentAmount(total_budget)) {
    throw new ValidationError('total_budget must be a positive number');
  }

  const payout_type = data.payout_type || 'full';
  if (!PAYOUT_TYPES.includes(payout_type)) {
    throw new ValidationError(`payout_type must be one of: ${PAYOUT_TYPES.join(', ')}`);
  }

  // How many creators the brand will hire (multi-hire). Defaults to single-winner.
  // The funded pool is total_budget × creator_slots, so this must be a whole number ≥ 1.
  const creator_slots = data.creator_slots == null ? 1 : Number(data.creator_slots);
  if (!Number.isInteger(creator_slots) || creator_slots < 1) {
    throw new ValidationError('creator_slots must be a whole number ≥ 1');
  }

  const target_platform = data.target_platform || 'other';
  if (!TARGET_PLATFORMS.includes(target_platform)) {
    throw new ValidationError(`target_platform must be one of: ${TARGET_PLATFORMS.join(', ')}`);
  }
  // Custom platform name is required when "other" is chosen.
  const platform_other = data.platform_other ? String(sanitizeString(data.platform_other)) : null;
  if (target_platform === 'other' && !platform_other) {
    throw new ValidationError('platform_other is required when target_platform is "other"');
  }

  const milestones = Array.isArray(data.milestones) ? data.milestones : [];

  // total_budget is the POOL; each of the creator_slots hires earns an equal
  // per-creator cut = total_budget / creator_slots. Milestones describe ONE
  // creator's journey, so they must sum to that per-creator cut (not the pool) —
  // otherwise that creator's releases revert or leave funds stranded. Money-path
  // invariant; enforce here.
  if (payout_type === 'milestone') {
    if (milestones.length === 0) {
      throw new ValidationError('Milestone-based payout requires at least one milestone');
    }
    let allocated = 0;
    for (const m of milestones) {
      const amt = Number(m?.amount);
      if (!(amt > 0)) {
        throw new ValidationError('Each milestone amount must be a positive number');
      }
      allocated += amt;
    }
    const perCreator = total_budget / creator_slots;
    // Compare in integer cents to avoid float drift.
    if (Math.round(allocated * 100) !== Math.round(perCreator * 100)) {
      throw new ValidationError(
        `Milestone amounts must sum to the per-creator cut of ${perCreator} USDC ` +
        `(total ${total_budget} ÷ ${creator_slots} creator slot(s)), got ${allocated}`
      );
    }
  }

  // Same-metric stages must escalate: each later milestone measuring the same
  // metric (e.g. likes) needs a HIGHER target and a HIGHER payment than the
  // previous stage for that metric (10 likes → 100 likes → 1000 likes).
  const lastByMetric: Record<string, { target: number; amount: number }> = {};
  for (const m of milestones) {
    const metric = m?.metric ? String(m.metric).trim().toLowerCase() : '';
    const target = Number(m?.target);
    const amount = Number(m?.amount);
    if (!metric || Number.isNaN(target)) continue; // metric/target optional
    const prev = lastByMetric[metric];
    if (prev) {
      if (!(target > prev.target)) {
        throw new ValidationError(`Each "${metric}" milestone must require a higher count than the previous stage (${target} is not greater than ${prev.target})`);
      }
      if (!Number.isNaN(amount) && !(amount > prev.amount)) {
        throw new ValidationError(`A higher "${metric}" milestone must pay more than the previous stage (${amount} is not greater than ${prev.amount})`);
      }
    }
    lastByMetric[metric] = { target, amount: Number.isNaN(amount) ? (prev?.amount ?? 0) : amount };
  }

  return {
    title,
    description: String(sanitizeString(data.description || '')),
    category: data.category ? String(sanitizeString(data.category)) : null,
    skills: Array.isArray(data.skills) ? data.skills.map((s: any) => String(s)).slice(0, 20) : [],
    total_budget,
    creator_slots,
    payout_type,
    target_platform,
    platform_other,
    post_type: data.post_type || 'other',
    post_type_other: data.post_type_other ? String(sanitizeString(data.post_type_other)) : null,
    required_elements: data.required_elements || {
      hashtags: [],
      mentions: [],
      link_in_bio: false,
      brand_tag: false,
      custom: null,
    },
    deadline: data.deadline || null,
    auto_cancel_on_deadline: data.auto_cancel_on_deadline ?? false,
    // Structured eligibility the brand can set. Follower/verified/age criteria
    // only enforce on OAuth-connected platforms (YouTube/X); IG/TikTok can't be
    // checked yet. `auto_hire` lets the system select the first qualified applicant.
    eligibility: {
      min_reputation: Number(data.eligibility?.min_reputation) || 0,
      required_platforms: Array.isArray(data.eligibility?.required_platforms)
        ? data.eligibility.required_platforms.map((p: any) => String(p)) : [],
      min_followers: Number(data.eligibility?.min_followers) || 0,
      require_verified: Boolean(data.eligibility?.require_verified),
      min_account_age_months: Number(data.eligibility?.min_account_age_months) || 0,
    },
    auto_hire: Boolean(data.auto_hire),
    milestones,
  };
}

export function parseApplicationInput(data: any = {}) {
  const cover_note = sanitizeString(data.cover_note);
  if (!cover_note || typeof cover_note !== 'string') {
    throw new ValidationError('cover_note is required');
  }
  return { cover_note };
}

export function parseMilestoneInput(data: any = {}) {
  const title = sanitizeString(data.title);
  if (!title || typeof title !== 'string') {
    throw new ValidationError('title is required');
  }

  const amount = Number(data.amount);
  if (!validatePaymentAmount(amount)) {
    throw new ValidationError('amount must be a positive number');
  }

  return {
    title,
    description: String(sanitizeString(data.description || '')),
    amount,
    // Structured deliverable: a platform metric (likes/retweets/views…) and the
    // target count required for this milestone. Optional for back-compat.
    metric: data.metric ? String(sanitizeString(data.metric)) : null,
    target: data.target != null && !Number.isNaN(Number(data.target)) ? Number(data.target) : null,
    deadline: data.deadline || null,
  };
}

export function parseProfileInput(data: any = {}) {
  return {
    name: String(sanitizeString(data.name || '')),
    email: data.email ? String(sanitizeString(data.email)) : null,
    bio: String(sanitizeString(data.bio || '')),
    website_url: data.website_url || null,
    location: data.location || null,
    profile_picture_url: data.profile_picture_url || null,
    niche_tags: Array.isArray(data.niche_tags) ? data.niche_tags : [],
    instagram: data.instagram || null,
    twitter: data.twitter || null,
    youtube: data.youtube || null,
    tiktok: data.tiktok || null,
  };
}

export function parseWalletDepositInput(data: any = {}) {
  const amount = Number(data.amount);
  if (!validatePaymentAmount(amount)) {
    throw new ValidationError('amount must be a positive number');
  }
  const tx_hash = sanitizeString(data.tx_hash) || null;
  if (tx_hash && !isValidTransactionHash(tx_hash)) {
    throw new ValidationError('tx_hash must be a valid 32-byte hex string');
  }
  return { amount, tx_hash };
}

export function parseWalletWithdrawInput(data: any = {}) {
  const amount = Number(data.amount);
  if (!validatePaymentAmount(amount)) {
    throw new ValidationError('amount must be a positive number');
  }
  const to_address = normalizeAddress(data.to_address);
  if (!to_address || !isValidEthereumAddress(to_address)) {
    throw new ValidationError('to_address must be a valid Ethereum address');
  }
  return { amount, to_address };
}

// ─── Deliverable submission validation ────────────────────────────────────────

// A milestone deliverable must be a well-formed http(s) URL.
export function isValidHttpUrl(value: any): boolean {
  try {
    const u = new URL(String(value));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Allowed deliverable hosts per target platform. `other` has no constraint.
export const PLATFORM_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com'],
  twitter: ['twitter.com', 'x.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  facebook: ['facebook.com', 'fb.watch'],
  other: [],
};

// Does the deliverable URL belong to the job's target platform? `other` (or an
// unknown platform) imposes no host constraint. Matches the domain or any
// subdomain of it (e.g. www.instagram.com, m.youtube.com).
export function urlMatchesPlatform(platform: string, url: string): boolean {
  const domains = PLATFORM_DOMAINS[platform];
  if (!domains || domains.length === 0) return true; // 'other'/unknown — no check
  let host: string;
  try {
    host = new URL(String(url)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return false;
  }
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}
