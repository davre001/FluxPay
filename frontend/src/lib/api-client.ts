import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: {
    email: string
    password: string
    role: 'worker' | 'requester'
  }) => apiClient.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export const profileAPI = {
  getMe: () => apiClient.get('/api/profile/me'),
  updateMe: (data: Record<string, unknown>) => apiClient.put('/api/profile/me', data),
  getReputation: (walletAddress: string) =>
    apiClient.get(`/api/profile/reputation/${walletAddress}`),
}

// ─── Jobs (Deals) ─────────────────────────────────────────────────────────────
export const jobAPI = {
  // Public / creator browsing
  list: (params?: {
    status?: string
    platform?: string
    payout_type?: string
    min_budget?: number
    max_budget?: number
    page?: number
    page_size?: number
  }) => apiClient.get('/api/jobs', { params }),

  detail: (jobId: string) => apiClient.get(`/api/jobs/${jobId}`),

  // Creator: apply to a job
  apply: (jobId: string, data: { cover_note: string }) =>
    apiClient.post(`/api/jobs/${jobId}/apply`, data),

  // Organization: create, list own, manage applicants
  create: (data: Record<string, unknown>) => apiClient.post('/api/jobs', data),

  listMine: (params?: { status?: string; page?: number }) =>
    apiClient.get('/api/jobs/mine', { params }),

  getApplications: (jobId: string) =>
    apiClient.get(`/api/jobs/${jobId}/applications`),

  selectCreator: (jobId: string, creatorId: string) =>
    apiClient.post(`/api/jobs/${jobId}/select/${creatorId}`),

  cancel: (jobId: string) => apiClient.post(`/api/jobs/${jobId}/cancel`),
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestoneAPI = {
  list: (jobId: string) => apiClient.get(`/api/jobs/${jobId}/milestones`),

  // Creator: submit deliverable
  submit: (milestoneId: string, data: { deliverable_url: string; deliverable_note?: string }) =>
    apiClient.post(`/api/milestones/${milestoneId}/submit`, data),

  // Organization: approve
  approve: (milestoneId: string) =>
    apiClient.post(`/api/milestones/${milestoneId}/approve`),

  // Either party: dispute
  dispute: (milestoneId: string, data: { reason: string }) =>
    apiClient.post(`/api/milestones/${milestoneId}/dispute`),
}

// ─── Wallet / Transactions ────────────────────────────────────────────────────
export const walletAPI = {
  getBalance: () => apiClient.get('/api/wallet/balance'),
  deposit: (data: { amount: number; tx_hash: string }) =>
    apiClient.post('/api/wallet/deposit', data),
  withdraw: (data: { amount: number; to_address: string }) =>
    apiClient.post('/api/wallet/withdraw', data),
  getTransactions: (params?: { page?: number; page_size?: number }) =>
    apiClient.get('/api/wallet/transactions', { params }),
}

// ─── Reputation ───────────────────────────────────────────────────────────────
export const reputationAPI = {
  lookup: (walletAddress: string) =>
    apiClient.get(`/api/reputation/${walletAddress}`),
}

export default apiClient
