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

// Auth API calls
export const authAPI = {
  register: (data: { email: string; password: string; role: string }) =>
    apiClient.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', data),
}

// Template API calls (data products)
export const templateAPI = {
  list: (category?: string, featured?: boolean) =>
    apiClient.get('/api/templates', { params: { category, featured } }),
  detail: (templateId: string) => apiClient.get(`/api/templates/${templateId}`),
  launch: (templateId: string, data: any) =>
    apiClient.post(`/api/templates/${templateId}/launch`, data),
  submitRequest: (data: any) => apiClient.post('/api/templates/requests', data),
}

// Job API calls
export const jobAPI = {
  quote: (data: any) => apiClient.post('/api/jobs/quote', data),
  list: (page?: number, page_size?: number) =>
    apiClient.get('/api/jobs', { params: { page, page_size } }),
  detail: (jobId: string) => apiClient.get(`/api/jobs/${jobId}`),
  results: (jobId: string) => apiClient.get(`/api/jobs/${jobId}/results`),
  confirmFunding: (jobId: string, data: any) =>
    apiClient.post(`/api/jobs/${jobId}/funding-confirmation`, data),
  cancel: (jobId: string) => apiClient.post(`/api/jobs/${jobId}/cancel`),
}

// Results API calls
export const resultsAPI = {
  summary: (jobId: string) => apiClient.get(`/api/results/jobs/${jobId}/summary`),
  exportJSON: (jobId: string) => apiClient.get(`/api/results/jobs/${jobId}/export/json`),
  exportCSV: (jobId: string) => apiClient.get(`/api/results/jobs/${jobId}/export/csv`),
}

// Schedules API calls (recurring jobs)
export const scheduleAPI = {
  create: (data: any) => apiClient.post('/api/schedules', data),
  list: () => apiClient.get('/api/schedules'),
  pause: (scheduleId: string) => apiClient.post(`/api/schedules/${scheduleId}/pause`),
  resume: (scheduleId: string) => apiClient.post(`/api/schedules/${scheduleId}/resume`),
}

// Worker API calls
export const workerAPI = {
  list: () => apiClient.get('/api/workers'),
  detail: (workerId: string) => apiClient.get(`/api/workers/${workerId}`),
}

// Admin API calls
export const adminAPI = {
  jobs: () => apiClient.get('/api/admin/jobs'),
  cancelJob: (jobId: string) => apiClient.post(`/api/admin/jobs/${jobId}/cancel`),
  retryTask: (taskId: string) => apiClient.post(`/api/admin/tasks/${taskId}/retry`),
}

export default apiClient
