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
    const error = Object.assign(new Error(err.message || res.statusText), { status: res.status, data: err })
    throw error
  }
  const data = await res.json().catch(() => ({}) as T)
  return { data }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUserDTO {
  id: string
  email: string
  profileType: 'creator' | 'organization' | null
  walletAddress: string
}

export const authAPI = {
  // Verify the Web3Auth idToken server-side and upsert the user. Pass
  // profileType on signup to set the role; omit it on login.
  createSession: (data: { idToken: string; profileType?: 'creator' | 'organization' }) =>
    request<{ user: AuthUserDTO }>('POST', '/api/auth/session', data),
  // Returns the verified user for the bearer idToken (Authorization header).
  me: () => request<{ user: AuthUserDTO }>('GET', '/api/auth/me'),
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
  getMe: () => request('GET', '/api/profile/me'),
  updateMe: (data: Record<string, unknown>) => request('PUT', '/api/profile/me', data),
  getReputation: (walletAddress: string) => request('GET', `/api/profile/reputation/${walletAddress}`),
}

// ─── Jobs (Deals) ─────────────────────────────────────────────────────────────
export const jobAPI = {
  list: (params?: {
    status?: string; platform?: string; payout_type?: string
    min_budget?: number; max_budget?: number; page?: number; page_size?: number
  }) => request('GET', '/api/jobs', undefined, params as Record<string, unknown>),

  detail: (jobId: string) => request('GET', `/api/jobs/${jobId}`),
  apply: (jobId: string, data: { cover_note: string }) => request('POST', `/api/jobs/${jobId}/apply`, data),
  create: (data: Record<string, unknown>) => request('POST', '/api/jobs', data),
  listMine: (params?: { status?: string; page?: number }) =>
    request('GET', '/api/jobs/mine', undefined, params as Record<string, unknown>),
  getApplications: (jobId: string) => request('GET', `/api/jobs/${jobId}/applications`),
  selectCreator: (jobId: string, creatorId: string) => request('POST', `/api/jobs/${jobId}/select/${creatorId}`),
  cancel: (jobId: string) => request('POST', `/api/jobs/${jobId}/cancel`),
  quote: (data: Record<string, unknown>) => request<{ id: string; quote: { total_usdc: number } }>('POST', '/api/jobs/quote', data),
  confirmFunding: (jobId: string, data: Record<string, unknown>) => request('POST', `/api/jobs/${jobId}/confirm-funding`, data),
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestoneAPI = {
  list: (jobId: string) => request('GET', `/api/jobs/${jobId}/milestones`),
  submit: (milestoneId: string, data: { deliverable_url: string; deliverable_note?: string }) =>
    request('POST', `/api/milestones/${milestoneId}/submit`, data),
  approve: (milestoneId: string) => request('POST', `/api/milestones/${milestoneId}/approve`),
  dispute: (milestoneId: string, data: { reason: string }) => request('POST', `/api/milestones/${milestoneId}/dispute`),
}

// ─── Wallet / Transactions ────────────────────────────────────────────────────
export const walletAPI = {
  getBalance: () => request('GET', '/api/wallet/balance'),
  deposit: (data: { amount: number; tx_hash: string }) => request('POST', '/api/wallet/deposit', data),
  withdraw: (data: { amount: number; to_address: string }) => request('POST', '/api/wallet/withdraw', data),
  getTransactions: (params?: { page?: number; page_size?: number }) =>
    request('GET', '/api/wallet/transactions', undefined, params as Record<string, unknown>),
}

// ─── Reputation ───────────────────────────────────────────────────────────────
export const reputationAPI = {
  lookup: (walletAddress: string) => request('GET', `/api/reputation/${walletAddress}`),
}

export default { authAPI, profileAPI, jobAPI, milestoneAPI, walletAPI, reputationAPI }
