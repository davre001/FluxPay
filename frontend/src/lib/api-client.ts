import type {
  AuthUser, Deal, Milestone, Application, Profile, WalletBalance,
  JobQuote, FaucetDripResult, PermissionRecord,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
}

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<{ data: T }> {
  const url = new URL(path, API_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, String(v))
    })
  }
  const token = getToken()
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err?.error?.message || err?.message || res.statusText || `HTTP ${res.status}`
    const error = Object.assign(new Error(message), { status: res.status, data: err })
    throw error
  }
  const data = await res.json().catch(() => ({}) as T)
  return { data }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
// Re-exported for back-compat; AuthUser is the canonical DTO (see @/types).
export type AuthUserDTO = AuthUser

export const authAPI = {
  // Verify the Web3Auth idToken server-side and upsert the user. Pass
  // profileType on signup to set the role; omit it on login.
  createSession: (data: { idToken: string; profileType?: 'creator' | 'organization' }) =>
    request<{ user: AuthUser }>('POST', '/api/auth/session', data),
  // Returns the verified user for the bearer idToken (Authorization header).
  me: () => request<{ user: AuthUser }>('GET', '/api/auth/me'),
  // Demo-only: switch the caller's active role (Brand ⇄ Creator).
  setRole: (profileType: 'creator' | 'organization') =>
    request<{ user: AuthUser }>('POST', '/api/auth/role', { profileType }),
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
  getMe: () => request<Profile>('GET', '/api/profile/me'),
  updateMe: (data: Record<string, unknown>) => request<Profile>('PUT', '/api/profile/me', data),
  getReputation: (walletAddress: string) => request('GET', `/api/profile/reputation/${walletAddress}`),
  getPublic: (userId: string) => request('GET', `/api/profile/${userId}`),
  // Social OAuth connect — start returns { authorize_url, state }; callback exchanges.
  socialConnect: (platform: string) => request<{ authorize_url: string; state: string }>('GET', `/api/profile/socials/${platform}/connect`),
  socialCallback: (platform: string, data: { code: string; state: string }) =>
    request('POST', `/api/profile/socials/${platform}/callback`, data),
  socialDisconnect: (platform: string) => request('DELETE', `/api/profile/socials/${platform}`),
}

// ─── Jobs (Deals) ─────────────────────────────────────────────────────────────
export const jobAPI = {
  list: (params?: {
    status?: string; platform?: string; payout_type?: string
    min_budget?: number; max_budget?: number; page?: number; page_size?: number
  }) => request<Deal[]>('GET', '/api/jobs', undefined, params as Record<string, unknown>),

  detail: (jobId: string) => request<Deal>('GET', `/api/jobs/${jobId}`),
  apply: (jobId: string, data: { cover_note: string }) => request<Application>('POST', `/api/jobs/${jobId}/apply`, data),
  create: (data: Record<string, unknown>) => request<Deal>('POST', '/api/jobs', data),
  listMine: (params?: { status?: string; page?: number }) =>
    request<Deal[]>('GET', '/api/jobs/mine', undefined, params as Record<string, unknown>),
  getApplications: (jobId: string) => request<Application[]>('GET', `/api/jobs/${jobId}/applications`),
  selectCreator: (jobId: string, creatorId: string) => request<Deal>('POST', `/api/jobs/${jobId}/select/${creatorId}`),
  cancel: (jobId: string) => request<Deal>('POST', `/api/jobs/${jobId}/cancel`),
  quote: (data: Record<string, unknown>) => request<JobQuote>('POST', '/api/jobs/quote', data),
  confirmFunding: (jobId: string, data: Record<string, unknown>) => request<Deal>('POST', `/api/jobs/${jobId}/confirm-funding`, data),
  // One deal-level deliverable link; the AI checks every milestone against it.
  submitDeliverable: (jobId: string, data: { deliverable_url: string; deliverable_note?: string }) =>
    request('POST', `/api/jobs/${jobId}/submit-deliverable`, data),
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestoneAPI = {
  list: (jobId: string) => request<Milestone[]>('GET', `/api/jobs/${jobId}/milestones`),
  submit: (milestoneId: string, data: { deliverable_url: string; deliverable_note?: string }) =>
    request<Milestone>('POST', `/api/milestones/${milestoneId}/submit`, data),
  approve: (milestoneId: string) => request<Milestone>('POST', `/api/milestones/${milestoneId}/approve`),
  dispute: (milestoneId: string, data: { reason: string }) => request<Milestone>('POST', `/api/milestones/${milestoneId}/dispute`, data),
  // Re-run AI verification on a submitted-but-undetected milestone (optional new link).
  recheck: (milestoneId: string, data?: { deliverable_url?: string }) =>
    request<Milestone>('POST', `/api/milestones/${milestoneId}/recheck`, data ?? {}),
}

// ─── Wallet / Transactions ────────────────────────────────────────────────────
export const walletAPI = {
  getBalance: () => request<WalletBalance>('GET', '/api/wallet/balance'),
  deposit: (data: { amount: number; tx_hash: string }) => request('POST', '/api/wallet/deposit', data),
  withdraw: (data: { amount: number; to_address: string }) => request('POST', '/api/wallet/withdraw', data),
  getTransactions: (params?: { page?: number; page_size?: number }) =>
    request('GET', '/api/wallet/transactions', undefined, params as Record<string, unknown>),
}

// ─── Reputation ───────────────────────────────────────────────────────────────
export const reputationAPI = {
  lookup: (walletAddress: string) => request('GET', `/api/reputation/${walletAddress}`),
}

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationAPI = {
  listMine: (params?: { status?: string }) =>
    request<Application[]>('GET', '/api/applications/mine', undefined, params as Record<string, unknown>),
  // Creator withdraws their own pending application.
  withdraw: (applicationId: string) => request<Application>('POST', `/api/applications/${applicationId}/withdraw`),
  // Brand declines a pending applicant on its own job.
  reject: (applicationId: string) => request<Application>('POST', `/api/applications/${applicationId}/reject`),
  // Brand inbox: applications across the org's own jobs.
  listIncoming: () => request<Application[]>('GET', '/api/applications/incoming'),
}

// ─── Permissions (ERC-7715) ───────────────────────────────────────────────────
export const permissionAPI = {
  // Persist a granted spending permission for a job.
  store: (data: Record<string, unknown>) => request<PermissionRecord>('POST', '/api/permissions', data),
  // The latest active permission for a job.
  getForJob: (jobId: string) => request<PermissionRecord>('GET', `/api/permissions/${jobId}`),
}

// ─── Faucet ───────────────────────────────────────────────────────────────────
export const faucetAPI = {
  // One-time welcome USDC drip. Idempotent server-side (once per address), so
  // it's safe to call on every signup; the backend skips already-funded wallets.
  drip: (address: string) =>
    request<FaucetDripResult>('POST', '/api/faucet/drip', { address }),
}

// ─── Verification & Settlement (Venice AI & 1Shot) ────────────────────────────
export const verificationAPI = {
  // Run AI verification on a milestone's deliverable
  verify: (milestoneId: string) =>
    request('POST', '/api/verify', { milestoneId }),

  // Autonomous loop: AI verifies, score sets amount, USDC released via direct or 1Shot relayer
  settle: (milestoneId: string, options?: { via?: 'direct' | 'relayer', minScore?: number }) =>
    request('POST', '/api/settle', { milestoneId, ...options }),
}

// ─── 1Shot (settlement rail proof) ────────────────────────────────────────────
export const oneshotAPI = {
  // Live, read-only proof the 1Shot integration is wired: supported chains, the
  // USDC fee token, and a real gas-in-USDC fee quote. No auth, no funds.
  status: (chainId?: number) =>
    request('GET', '/api/oneshot/status', undefined, chainId ? { chainId } : undefined),
}

// ─── Demo (presenter unlock) ──────────────────────────────────────────────────
export const demoAPI = {
  // Validates a passphrase against the server-only secret. The secret never
  // reaches the client, so source analysis can't reveal it.
  unlock: (code: string) => request<{ ok: boolean }>('POST', '/api/demo/unlock', { code }),
  // Idempotently seed 3 starter deals for the calling brand (first demo login).
  ensureDeals: () => request<{ created: number }>('POST', '/api/demo/ensure-deals'),
}

export default { authAPI, profileAPI, jobAPI, milestoneAPI, walletAPI, reputationAPI, applicationAPI, faucetAPI, permissionAPI, verificationAPI, oneshotAPI, demoAPI }
