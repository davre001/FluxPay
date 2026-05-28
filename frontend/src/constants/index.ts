// Application-wide constants

export const JOB_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export const JOB_STATUS_LABELS = {
  [JOB_STATUSES.PENDING]: 'Pending',
  [JOB_STATUSES.ACTIVE]: 'Active',
  [JOB_STATUSES.COMPLETED]: 'Completed',
  [JOB_STATUSES.FAILED]: 'Failed',
  [JOB_STATUSES.CANCELLED]: 'Cancelled',
} as const

export const JOB_STATUS_COLORS = {
  [JOB_STATUSES.PENDING]: 'warning',
  [JOB_STATUSES.ACTIVE]: 'primary',
  [JOB_STATUSES.COMPLETED]: 'success',
  [JOB_STATUSES.FAILED]: 'danger',
  [JOB_STATUSES.CANCELLED]: 'default',
} as const

export const JOB_CATEGORIES = {
  ECOMMERCE: 'ecommerce',
  LEADS: 'leads',
  REALESTATE: 'realestate',
  CUSTOM: 'custom',
} as const

export const JOB_CATEGORY_LABELS = {
  [JOB_CATEGORIES.ECOMMERCE]: 'E-commerce Data',
  [JOB_CATEGORIES.LEADS]: 'Lead Generation',
  [JOB_CATEGORIES.REALESTATE]: 'Real Estate',
  [JOB_CATEGORIES.CUSTOM]: 'Custom Request',
} as const

export const DATA_SOURCES = {
  APPROVED: 'approved',
  URLS: 'urls',
  API: 'api',
  MANUAL: 'manual',
} as const

export const DATA_SOURCE_LABELS = {
  [DATA_SOURCES.APPROVED]: 'Approved Sources',
  [DATA_SOURCES.URLS]: 'URLs',
  [DATA_SOURCES.API]: 'API',
  [DATA_SOURCES.MANUAL]: 'Manual Entry',
} as const

export const FRESHNESS_OPTIONS = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const

export const FRESHNESS_LABELS = {
  [FRESHNESS_OPTIONS.ONCE]: 'Once',
  [FRESHNESS_OPTIONS.DAILY]: 'Daily',
  [FRESHNESS_OPTIONS.WEEKLY]: 'Weekly',
} as const

export const WORKER_TYPES = {
  AUTOMATED: 'automated',
  MANUAL: 'manual',
} as const

export const WORKER_TYPE_LABELS = {
  [WORKER_TYPES.AUTOMATED]: 'Automated Agent',
  [WORKER_TYPES.MANUAL]: 'Manual Worker',
} as const

export const WORKER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const

export const WORKER_STATUS_LABELS = {
  [WORKER_STATUSES.ACTIVE]: 'Active',
  [WORKER_STATUSES.INACTIVE]: 'Inactive',
  [WORKER_STATUSES.SUSPENDED]: 'Suspended',
} as const

export const TRANSACTION_TYPES = {
  FUNDING: 'funding',
  PAYOUT: 'payout',
  REFUND: 'refund',
  FEE: 'fee',
} as const

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.FUNDING]: 'Funding',
  [TRANSACTION_TYPES.PAYOUT]: 'Payout',
  [TRANSACTION_TYPES.REFUND]: 'Refund',
  [TRANSACTION_TYPES.FEE]: 'Platform Fee',
} as const

export const DISPUTE_STATUSES = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  PENDING: 'pending',
} as const

export const DISPUTE_STATUS_LABELS = {
  [DISPUTE_STATUSES.OPEN]: 'Open',
  [DISPUTE_STATUSES.RESOLVED]: 'Resolved',
  [DISPUTE_STATUSES.PENDING]: 'Pending',
} as const

export const API_ENDPOINTS = {
  // Jobs
  JOBS_QUOTE: '/jobs/quote',
  JOBS_CREATE: '/jobs',
  JOBS_LIST: '/jobs',
  JOBS_DETAIL: (id: string) => `/jobs/${id}`,
  JOBS_RESULTS: (id: string) => `/jobs/${id}/results`,
  JOBS_EVENTS: (id: string) => `/jobs/${id}/events`,
  JOBS_FUNDING_CONFIRM: (id: string) => `/jobs/${id}/funding-confirmation`,
  JOBS_CANCEL: (id: string) => `/jobs/${id}/cancel`,

  // Workers
  WORKERS_LIST: '/workers',
  WORKERS_REGISTER: '/workers/register',
  WORKERS_HEARTBEAT: '/workers/heartbeat',

  // Admin
  ADMIN_FLAGGED_JOBS: '/admin/flagged-jobs',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_SOURCES: '/admin/sources',
} as const
