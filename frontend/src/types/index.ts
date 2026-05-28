// Job Types
export interface Job {
  id: string
  name: string
  category: string
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  progress: number
  budget: number
  totalSpent: number
  createdAt: string
  updatedAt: string
  tasks: TaskStats
  escrow: EscrowInfo
}

export interface TaskStats {
  total: number
  completed: number
  failed: number
  pending: number
}

export interface EscrowInfo {
  address: string
  token: string
  fundedAmount: number
  paidOut: number
  remaining: number
  txHash?: string
}

// Job Quote
export interface JobQuote {
  taskCount: number
  workerReward: number
  verificationCost: number
  platformFee: number
  totalCost: number
}

// Job Creation
export interface CreateJobRequest {
  category: string
  location: string
  source: string
  description: string
  freshness: 'once' | 'daily' | 'weekly'
  budget: number
  maxRows: number
  compliance: boolean
}

// Worker Types
export interface Worker {
  id: string
  name: string
  type: 'automated' | 'manual'
  tasksCompleted: number
  accuracy: number
  earnings: number
  status: 'active' | 'inactive'
  reputation: number
  specialty: string
}

// Result Types
export interface DataResult {
  id: string
  jobId: string
  workerId: string
  verifierId: string
  data: Record<string, any>
  confidence: number
  source: string
  collectedAt: string
  verified: boolean
}

// Dataset Types
export interface Dataset {
  id: string
  jobId: string
  name: string
  totalRows: number
  createdAt: string
  collections: number
  results: DataResult[]
}

// Wallet Types
export interface WalletInfo {
  address: string
  network: string
  chainId: number
  ethBalance: number
  usdcBalance: number
  inEscrow: number
}

// Transaction Types
export interface Transaction {
  id: string
  type: 'funding' | 'payout' | 'refund'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  txHash: string
  createdAt: string
  updatedAt: string
}

// Dispute Types
export interface Dispute {
  id: string
  jobId: string
  requesterId: string
  workerId: string
  amount: number
  reason: string
  status: 'pending' | 'resolved'
  resolution?: string
  filedAt: string
}

// Admin Types
export interface FlaggedJob {
  id: string
  jobId: string
  reason: string
  status: 'flagged' | 'under_review' | 'resolved' | 'blocked'
  createdAt: string
}

export interface DataSource {
  id: string
  name: string
  type: string
  status: 'approved' | 'blocked' | 'pending'
  rateLimit: string
  lastChecked: string
  configuration: Record<string, any>
}

// Payment Types (Legacy)
export interface Payment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

export interface PaymentFormData {
  amount: number
  email: string
  currency: string
}
