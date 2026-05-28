// Validation utilities for job forms and data
export interface ValidationError {
  field: string
  message: string
}

export const validators = {
  budget: (value: string | number): ValidationError | null => {
    const num = Number(value)
    if (isNaN(num) || num <= 0) {
      return { field: 'budget', message: 'Budget must be greater than 0' }
    }
    if (num > 1000000) {
      return { field: 'budget', message: 'Budget exceeds maximum limit' }
    }
    return null
  },

  maxRows: (value: string | number): ValidationError | null => {
    const num = Number(value)
    if (isNaN(num) || num <= 0) {
      return { field: 'maxRows', message: 'Max rows must be greater than 0' }
    }
    if (num > 1000000) {
      return { field: 'maxRows', message: 'Max rows exceeds limit' }
    }
    return null
  },

  description: (value: string): ValidationError | null => {
    if (!value || value.trim().length === 0) {
      return { field: 'description', message: 'Description is required' }
    }
    if (value.length < 10) {
      return { field: 'description', message: 'Description must be at least 10 characters' }
    }
    if (value.length > 5000) {
      return { field: 'description', message: 'Description must not exceed 5000 characters' }
    }
    return null
  },

  email: (value: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: 'email', message: 'Invalid email address' }
    }
    return null
  },

  walletAddress: (value: string): ValidationError | null => {
    if (!value.match(/^0x[a-fA-F0-9]{40}$/)) {
      return { field: 'walletAddress', message: 'Invalid wallet address' }
    }
    return null
  },

  validateForm: (data: any, schema: any): ValidationError[] => {
    const errors: ValidationError[] = []
    for (const [key, validator] of Object.entries(schema)) {
      if (typeof validator === 'function') {
        const error = (validator as Function)(data[key])
        if (error) errors.push(error)
      }
    }
    return errors
  },
}

// Formatters
export const formatters = {
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  },

  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  },

  percentage: (value: number, decimals = 0): string => {
    return `${value.toFixed(decimals)}%`
  },

  date: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  datetime: (date: string | Date): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  timeAgo: (date: string | Date): string => {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return formatters.date(date)
  },

  truncateAddress: (address: string, chars = 6): string => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`
  },

  truncateText: (text: string, limit = 100): string => {
    return text.length > limit ? `${text.slice(0, limit)}...` : text
  },

  toJSON: (data: any): string => {
    return JSON.stringify(data, null, 2)
  },

  toCSV: (data: any[], headers?: string[]): string => {
    if (!data || data.length === 0) return ''

    const h = headers || Object.keys(data[0])
    const csv = [h.join(',')]

    for (const row of data) {
      const values = h.map((key) => {
        const value = row[key]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      })
      csv.push(values.join(','))
    }

    return csv.join('\n')
  },
}

// Calculation helpers
export const calculations = {
  jobCost: (
    workerReward: number,
    verificationCost: number,
    platformFeePercent: number = 20
  ): { total: number; platformFee: number } => {
    const subtotal = workerReward + verificationCost
    const platformFee = (subtotal * platformFeePercent) / 100
    return {
      total: subtotal + platformFee,
      platformFee,
    }
  },

  workerPayout: (
    baseReward: number,
    difficultyMultiplier: number = 1,
    qualityScore: number = 1,
    freshnessScore: number = 1
  ): number => {
    return baseReward * difficultyMultiplier * qualityScore * freshnessScore
  },

  taskSplit: (totalBudget: number, taskCount: number): number => {
    return totalBudget / taskCount
  },

  progressPercentage: (completed: number, total: number): number => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  },

  averageAccuracy: (accuracyScores: number[]): number => {
    if (accuracyScores.length === 0) return 0
    const sum = accuracyScores.reduce((a, b) => a + b, 0)
    return sum / accuracyScores.length
  },
}

// Legacy exports for backward compatibility
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return formatters.currency(amount)
}

export function formatDate(date: Date): string {
  return formatters.date(date)
}
