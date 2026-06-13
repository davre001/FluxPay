import { ValidationError } from './errors.ts';
import { normalizeAddress, sanitizeString } from './helpers.ts';

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];
export const SUPPORTED_CURRENCIES = ['FPT', 'ETH', 'USDC', 'USD'];
export const JOB_STATUSES = ['open', 'in_progress', 'completed', 'cancelled'];
export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected'];
export const MILESTONE_STATUSES = ['pending', 'submitted', 'approved', 'disputed'];
export const TARGET_PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'other'];
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

  const target_platform = data.target_platform || 'other';
  if (!TARGET_PLATFORMS.includes(target_platform)) {
    throw new ValidationError(`target_platform must be one of: ${TARGET_PLATFORMS.join(', ')}`);
  }

  const milestones = Array.isArray(data.milestones) ? data.milestones : [];

  return {
    title,
    description: String(sanitizeString(data.description || '')),
    category: data.category ? String(sanitizeString(data.category)) : null,
    skills: Array.isArray(data.skills) ? data.skills.map((s: any) => String(s)).slice(0, 20) : [],
    total_budget,
    payout_type,
    target_platform,
    post_type: data.post_type || 'other',
    required_elements: data.required_elements || {
      hashtags: [],
      mentions: [],
      link_in_bio: false,
      brand_tag: false,
      custom: null,
    },
    deadline: data.deadline || null,
    auto_cancel_on_deadline: data.auto_cancel_on_deadline ?? false,
    eligibility: data.eligibility || {},
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
    deadline: data.deadline || null,
  };
}

export function parseProfileInput(data: any = {}) {
  return {
    name: String(sanitizeString(data.name || '')),
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
