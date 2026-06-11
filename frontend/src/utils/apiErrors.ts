import toast from 'react-hot-toast'

export interface ApiErrorResponse {
  message: string
  status: number
  code?: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown>

  constructor(response: ApiErrorResponse) {
    super(response.message)
    this.name = 'ApiError'
    this.status = response.status
    this.code = response.code
    this.details = response.details
  }
}

/**
 * Parse API errors from Axios or other sources
 */
export function parseApiError(error: unknown): ApiErrorResponse {
  if (error instanceof Error) {
    const e = error as Error & { status?: number; data?: { message?: string; code?: string; details?: Record<string, unknown> } }
    return {
      message: e.data?.message || e.message || 'An error occurred',
      status: e.status || 500,
      code: e.data?.code,
      details: e.data?.details,
    }
  }

  return {
    message: 'An unexpected error occurred',
    status: 500,
  }
}

/**
 * Handle API errors and show appropriate toast notification
 */
export function handleApiError(error: unknown, showToast: boolean = true): ApiErrorResponse {
  const apiError = parseApiError(error)

  if (showToast) {
    const message = getErrorMessage(apiError.status, apiError.message)
    toast.error(message)
  }

  return apiError
}

/**
 * Get user-friendly error messages based on status code
 */
function getErrorMessage(status: number, defaultMessage: string): string {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'You are not authenticated. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    503: 'Service is temporarily unavailable.',
  }

  return statusMessages[status] || defaultMessage || 'An error occurred'
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      }
    }
  }

  throw lastError!
}

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_WALLET: 'Please enter a valid wallet address',
  INVALID_AMOUNT: 'Please enter a valid amount',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
}
