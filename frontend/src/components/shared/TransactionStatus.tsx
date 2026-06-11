'use client';

import React from 'react'
import { CheckCircle, Clock, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react'
import { useAccount } from 'wagmi'
import { formatters } from '@/utils/helpers'

export type TransactionStatus = 'pending' | 'success' | 'error' | 'waiting'

interface TransactionStatusProps {
  status: TransactionStatus
  txHash?: string
  message?: string
  amount?: number
  from?: string
  to?: string
}

export function TransactionStatus({
  status,
  txHash,
  message,
  amount,
  from,
  to,
}: TransactionStatusProps) {
  const { chain } = useAccount()
  const explorerUrl = chain?.blockExplorers?.default?.url

  const statusConfig = {
    pending: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-blue-600" />,
      title: 'Processing Transaction',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    waiting: {
      icon: <Clock className="h-8 w-8 text-yellow-600" />,
      title: 'Waiting for Confirmation',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    success: {
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      title: 'Transaction Successful',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    error: {
      icon: <AlertCircle className="h-8 w-8 text-red-600" />,
      title: 'Transaction Failed',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`rounded-lg border-2 p-6 text-center ${config.bg} ${config.color}`}>
      <div className="flex justify-center">{config.icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{config.title}</h3>
      {message && <p className="mt-2 text-sm opacity-75">{message}</p>}

      {amount && (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-medium">Amount</p>
          <p className="text-2xl font-bold">{formatters.currency(amount)}</p>
        </div>
      )}

      {(from || to) && (
        <div className="mt-4 space-y-2 text-sm">
          {from && (
            <div className="flex items-center justify-center gap-2">
              <span className="opacity-75">From:</span>
              <code className="font-mono text-xs">{formatters.truncateAddress(from)}</code>
            </div>
          )}
          {to && (
            <div className="flex items-center justify-center gap-2">
              <span className="opacity-75">To:</span>
              <code className="font-mono text-xs">{formatters.truncateAddress(to)}</code>
            </div>
          )}
        </div>
      )}

      {txHash && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="break-all rounded bg-white/50 p-3 font-mono text-xs opacity-75">
            {txHash}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(txHash)}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-white/50 px-3 py-2 text-sm hover:bg-white/75"
            >
              <Copy className="h-4 w-4" />
              Copy Hash
            </button>
            {explorerUrl && (
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded bg-white/50 px-3 py-2 text-sm hover:bg-white/75"
              >
                <ExternalLink className="h-4 w-4" />
                View on Explorer
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ApprovalStepProps {
  status: 'pending' | 'approved' | 'rejected'
  title: string
  description?: string
  onRetry?: () => void
}

export function ApprovalStep({ status, title, description, onRetry }: ApprovalStepProps) {
  const icons = {
    pending: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
    approved: <CheckCircle className="h-5 w-5 text-green-600" />,
    rejected: <AlertCircle className="h-5 w-5 text-red-600" />,
  }

  const bgColors = {
    pending: 'bg-blue-50',
    approved: 'bg-green-50',
    rejected: 'bg-red-50',
  }

  return (
    <div className={`rounded-lg border p-4 ${bgColors[status]}`}>
      <div className="flex items-start gap-3">
        {icons[status]}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {status === 'rejected' && onRetry && (
          <button
            onClick={onRetry}
            className="whitespace-nowrap rounded bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

interface PaymentBreakdownProps {
  workerReward: number
  verificationCost: number
  platformFee: number
  total: number
  currency?: string
}

export function PaymentBreakdown({
  workerReward,
  verificationCost,
  platformFee,
  total,
  currency = 'USD',
}: PaymentBreakdownProps) {
  const items = [
    { label: 'Worker Reward', value: workerReward },
    { label: 'Verification Cost', value: verificationCost },
    { label: 'Platform Fee', value: platformFee },
  ]

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-sm">
          <span className="text-gray-600">{item.label}</span>
          <span className="font-medium text-gray-900">
            {formatters.currency(item.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-200 pt-3 flex justify-between font-medium">
        <span className="text-gray-900">Total</span>
        <span className="text-lg text-blue-600">{formatters.currency(total)}</span>
      </div>
    </div>
  )
}

interface EscrowStatusProps {
  totalBudget: number
  paidOut: number
  remaining: number
  contractAddress?: string
}

export function EscrowStatus({
  totalBudget,
  paidOut,
  remaining,
  contractAddress,
}: EscrowStatusProps) {
  const percentage = (paidOut / totalBudget) * 100

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900">Escrow Status</h4>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Funded</span>
          <span className="font-medium text-gray-900">{formatters.currency(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Paid Out</span>
          <span className="font-medium text-green-600">{formatters.currency(paidOut)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className="font-medium text-blue-600">{formatters.currency(remaining)}</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {contractAddress && (
        <div className="mt-3 text-xs text-gray-500">
          <p className="mb-1">Contract Address:</p>
          <div className="flex items-center gap-2 break-all rounded bg-gray-50 p-2 font-mono">
            <code>{formatters.truncateAddress(contractAddress, 8)}</code>
            <button
              onClick={() => navigator.clipboard.writeText(contractAddress)}
              className="hover:text-gray-700"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
