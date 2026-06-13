// ─── DTO contract ─────────────────────────────────────────────────────────────
// Frontend mirror of the backend record shapes in backend/src/models/*. These are
// what the API actually returns; api-client.ts is typed against them so a misuse
// surfaces as a compile error. Keep in sync with the backend models (the
// backend-typecheck hook keeps the backend side honest). When a field is added
// there, add it here.

export type TargetPlatform = 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'other';
export type PostType = 'video' | 'image' | 'content_writing' | 'other';
export type PayoutType = 'milestone' | 'full';
export type DealStatus = 'open' | 'in_progress' | 'completed' | 'draft' | 'cancelled' | 'expired';
export type FundingStatus = 'unfunded' | 'funded' | 'partially_released' | 'released';
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'disputed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ProfileType = 'creator' | 'organization';

export interface OrganizationRef {
  brand_name: string;
  bio?: string;
  website?: string;
  reputation?: number;
  logo_url?: string;
}

export interface RequiredElements {
  hashtags: string[];
  mentions: string[];
  link_in_bio?: boolean;
  brand_tag?: boolean;
  custom?: string | null;
}

export interface Eligibility {
  min_reputation?: number;
  required_platforms?: string[];
  min_followers?: number | null;
  region?: string | null;
  invite_only?: boolean;
}

// AI verification result attached to a milestone after autonomous settlement.
export interface AiVerification {
  score: number;
  reasoning?: string;
}

export interface Milestone {
  id: string;
  job_id: string;
  title: string;
  description: string;
  amount: number;
  status: MilestoneStatus;
  deliverable_url?: string | null;
  deliverable_note?: string | null;
  due_date?: string | null;
  dispute_reason?: string | null;
  ai_verification?: AiVerification;
  created_at: string;
  updated_at: string;
}

// A job/deal. `milestones` and `application_count` are present on the enriched
// responses (detail + list go through enrichJob on the backend).
export interface Deal {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: string | null;
  skills: string[];
  target_platform: TargetPlatform;
  post_type: PostType;
  required_elements: RequiredElements;
  payout_type: PayoutType;
  total_budget: number;
  deadline: string | null;
  auto_cancel_on_deadline?: boolean;
  eligibility?: Eligibility;
  status: DealStatus;
  funding_status: FundingStatus;
  seeded?: boolean;
  selected_creator_id: string | null;
  organization: OrganizationRef;
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
  application_count?: number;
}

// An application to a deal. The job_* / organization fields are denormalized onto
// the creator's own applications by the backend (getMyApplications).
export interface Application {
  id: string;
  job_id: string;
  creator_id: string;
  cover_note: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at?: string;
  job_title?: string;
  job_total_budget?: number;
  job_target_platform?: TargetPlatform | string;
  organization?: OrganizationRef;
  creator_name?: string; // applicant display name (incoming-applications inbox)
}

export interface AuthUser {
  id: string;
  email: string;
  profileType: ProfileType | null;
  walletAddress: string;
}

export interface Profile {
  user_id?: string;
  type?: ProfileType;
  name?: string;
  bio?: string;
  website_url?: string;
  profile_picture_url?: string;
  niche_tags?: string[];
  wallet_address?: string;
  [key: string]: unknown;
}

export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | string;
  amount: number;
  tx_hash?: string;
  created_at: string;
}

export interface JobQuote {
  id: string;
  quote: { total_usdc: number };
}

export interface FaucetDripResult {
  funded: boolean;
  reason?: string;
  txHash?: string;
  amount?: string;
}

// ERC-7715 spending permission stored per job. The on-chain context fields are
// passed straight through, so this stays permissive.
export interface PermissionRecord {
  id: string;
  job_id: string;
  status: string;
  [key: string]: unknown;
}
