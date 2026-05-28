// Error handling utilities

export interface ApiError {
  status: number
  message: string
  detail?: string
  field?: string
  code?: string
}

export class FluxPayError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly detail?: string

  constructor(message: string, status: number, detail?: string, code?: string) {
    super(message)
    this.name = 'FluxPayError'
    this.status = status
    this.detail = detail
    this.code = code
  }
}

export function parseApiError(error: any): ApiError {
  if (error.response) {
    // Error from API
    const { status, data } = error.response
    return {
      status,
      message: data?.message || data?.detail || 'An error occurred',
      detail: data?.detail,
      field: data?.field,
      code: data?.code,
    }
  } else if (error.request) {
    // No response from server
    return {
      status: 0,
      message: 'No response from server',
      detail: 'Please check your internet connection and try again',
    }
  } else {
    // Other errors
    return {
      status: 0,
      message: error.message || 'An unknown error occurred',
      detail: error.toString(),
    }
  }
}

export function getErrorMessage(error: any): string {
  if (error instanceof FluxPayError) {
    return error.message
  }

  const apiError = parseApiError(error)
  return apiError.message
}

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  NO_RESPONSE: 'No response from server. Please check your connection.',

  // Authentication errors
  UNAUTHORIZED: 'Unauthorized. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // Job errors
  JOB_NOT_FOUND: 'Job not found.',
  JOB_INVALID_STATE: 'Invalid job state for this operation.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please add more funds to your wallet.',
  JOB_ALREADY_RUNNING: 'This job is already running.',

  // Wallet errors
  WALLET_DISCONNECTED: 'Wallet is disconnected. Please connect your wallet.',
  INVALID_ADDRESS: 'Invalid wallet address.',
  INSUFFICIENT_BALANCE: 'Insufficient balance in your wallet.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  APPROVAL_FAILED: 'Token approval failed. Please try again.',

  // Validation errors
  INVALID_INPUT: 'Invalid input. Please check your data.',
  MISSING_REQUIRED_FIELD: 'Missing required field.',
  INVALID_EMAIL: 'Invalid email address.',
  INVALID_URL: 'Invalid URL.',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  TOO_MANY_REQUESTS: 'Too many requests. Please slow down and try again.',

  // Generic
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const

export function handleApiError(error: any, context?: string): string {
  const apiError = parseApiError(error)

  if (context) {
    console.error(`[${context}]`, apiError)
  } else {
    console.error('API Error:', apiError)
  }

  // Map common error statuses to user-friendly messages
  switch (apiError.status) {
    case 400:
      return apiError.detail || ERROR_MESSAGES.INVALID_INPUT
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED
    case 403:
      return ERROR_MESSAGES.FORBIDDEN
    case 404:
      return ERROR_MESSAGES.JOB_NOT_FOUND
    case 429:
      return ERROR_MESSAGES.TOO_MANY_REQUESTS
    case 500:
      return ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    case 503:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE
    default:
      return apiError.message || ERROR_MESSAGES.UNKNOWN_ERROR
  }
}
