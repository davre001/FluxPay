// API service layer for frontend
// Maps all backend endpoints from FRONTEND_HANDOFF.md

import { config } from '../config/settings'

const API_BASE_URL = config.api.baseUrl
const API_TIMEOUT = config.api.timeout

interface RequestOptions {
  headers?: Record<string, string>
  token?: string
}

function getHeaders(options?: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  return { ...headers, ...options?.headers }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  data?: any,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const fetchOptions: RequestInit = {
    method,
    headers: getHeaders(options),
  }

  if (data) {
    fetchOptions.body = JSON.stringify(data)
  }

  const response = await fetchWithTimeout(url, fetchOptions)

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API Error ${response.status}: ${errorBody}`)
  }

  return response.json() as Promise<T>
}

// ============ AUTH ============

export async function register(email: string, password: string, role: string, token?: string) {
  return request(
    'POST',
    '/api/auth/register',
    { email, password, role },
    { token }
  )
}

export async function login(email: string, password: string) {
  return request('POST', '/api/auth/login', { email, password })
}

// ============ TEMPLATES ============

export async function getTemplates(category?: string, featured?: boolean, token?: string) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (featured !== undefined) params.append('featured', String(featured))

  return request(
    'GET',
    `/api/templates${params.toString() ? `?${params.toString()}` : ''}`,
    undefined,
    { token }
  )
}

export async function getTemplate(id: string, token?: string) {
  return request('GET', `/api/templates/${id}`, undefined, { token })
}

export async function launchTemplate(
  id: string,
  requester_wallet: string,
  max_rows?: number,
  budget_usdc?: number,
  freshness?: string,
  token?: string
) {
  return request(
    'POST',
    `/api/templates/${id}/launch`,
    { requester_wallet, max_rows, budget_usdc, freshness },
    { token }
  )
}

export async function submitTemplateRequest(data: any, token?: string) {
  return request(
    'POST',
    '/api/templates/requests',
    data,
    { token }
  )
}

// ============ JOBS ============

export async function getJobQuote(jobForm: any, token?: string) {
  return request(
    'POST',
    '/api/jobs/quote',
    jobForm,
    { token }
  )
}

export async function getJobs(page?: number, page_size?: number, token?: string) {
  const params = new URLSearchParams()
  if (page !== undefined) params.append('page', String(page))
  if (page_size !== undefined) params.append('page_size', String(page_size))

  return request(
    'GET',
    `/api/jobs${params.toString() ? `?${params.toString()}` : ''}`,
    undefined,
    { token }
  )
}

export async function getJob(id: string, token?: string) {
  return request('GET', `/api/jobs/${id}`, undefined, { token })
}

export async function confirmJobFunding(
  id: string,
  tx_hash: string,
  escrow_address: string,
  funded_amount_usdc: number,
  requester_address: string,
  token?: string
) {
  return request(
    'POST',
    `/api/jobs/${id}/funding-confirmation`,
    { tx_hash, escrow_address, funded_amount_usdc, requester_address },
    { token }
  )
}

export async function getJobResults(id: string, token?: string) {
  return request('GET', `/api/jobs/${id}/results`, undefined, { token })
}

// ============ RESULTS ============

export async function getResultsSummary(id: string, token?: string) {
  return request('GET', `/api/results/jobs/${id}/summary`, undefined, { token })
}

export async function getResultsJSON(id: string, token?: string) {
  return request('GET', `/api/results/jobs/${id}/export/json`, undefined, { token })
}

export async function getResultsCSV(id: string, token?: string) {
  return request('GET', `/api/results/jobs/${id}/export/csv`, undefined, { token })
}

// ============ SCHEDULES ============

export async function createSchedule(
  job_config: any,
  freshness: 'daily' | 'weekly',
  template_id?: string,
  token?: string
) {
  return request(
    'POST',
    '/api/schedules',
    { job_config, freshness, template_id },
    { token }
  )
}

export async function getSchedules(token?: string) {
  return request('GET', '/api/schedules', undefined, { token })
}

export async function pauseSchedule(id: string, token?: string) {
  return request('POST', `/api/schedules/${id}/pause`, {}, { token })
}

export async function resumeSchedule(id: string, token?: string) {
  return request('POST', `/api/schedules/${id}/resume`, {}, { token })
}

// ============ WORKERS ============

export async function getWorkers(token?: string) {
  return request('GET', '/api/workers', undefined, { token })
}

export async function getWorker(id: string, token?: string) {
  return request('GET', `/api/workers/${id}`, undefined, { token })
}

// ============ ADMIN ============

export async function getAdminJobs(token?: string) {
  return request('GET', '/api/admin/jobs', undefined, { token })
}

export async function cancelJob(id: string, token?: string) {
  return request('POST', `/api/admin/jobs/${id}/cancel`, {}, { token })
}

export async function retryTask(id: string, token?: string) {
  return request('POST', `/api/admin/tasks/${id}/retry`, {}, { token })
}

// ============ WEBSOCKET ============

export function createJobWebSocket(jobId: string, token?: string): WebSocket {
  const wsUrl = config.api.wsUrl.replace('http', 'ws')
  const ws = new WebSocket(`${wsUrl}/ws/jobs/${jobId}`)

  if (token) {
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    })
  }

  return ws
}

export default {
  register,
  login,
  getTemplates,
  getTemplate,
  launchTemplate,
  submitTemplateRequest,
  getJobQuote,
  getJobs,
  getJob,
  confirmJobFunding,
  getJobResults,
  getResultsSummary,
  getResultsJSON,
  getResultsCSV,
  createSchedule,
  getSchedules,
  pauseSchedule,
  resumeSchedule,
  getWorkers,
  getWorker,
  getAdminJobs,
  cancelJob,
  retryTask,
  createJobWebSocket,
}
