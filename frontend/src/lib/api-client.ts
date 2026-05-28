import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor for adding auth token if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Job API calls
export const jobAPI = {
  quote: (data: any) => apiClient.post('/jobs/quote', data),
  create: (data: any) => apiClient.post('/jobs', data),
  list: () => apiClient.get('/jobs'),
  detail: (jobId: string) => apiClient.get(`/jobs/${jobId}`),
  results: (jobId: string) => apiClient.get(`/jobs/${jobId}/results`),
  events: (jobId: string) => apiClient.get(`/jobs/${jobId}/events`),
  confirmFunding: (jobId: string, data: any) => apiClient.post(`/jobs/${jobId}/funding-confirmation`, data),
  cancel: (jobId: string) => apiClient.post(`/jobs/${jobId}/cancel`),
}

// Worker API calls
export const workerAPI = {
  list: () => apiClient.get('/workers'),
  register: (data: any) => apiClient.post('/workers/register', data),
  heartbeat: (workerId: string) => apiClient.post('/workers/heartbeat', { workerId }),
}

// Admin API calls
export const adminAPI = {
  flaggedJobs: () => apiClient.get('/admin/jobs/flagged'),
  disputes: () => apiClient.get('/admin/disputes'),
  sources: () => apiClient.get('/admin/sources'),
  cancelJob: (jobId: string, reason: string) => apiClient.post(`/admin/jobs/${jobId}/cancel`, { reason }),
}

export default apiClient
