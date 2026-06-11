'use client';

import { useState } from 'react'
import { Wallet, Check, AlertCircle, TrendingUp, TrendingDown, Copy, ExternalLink } from 'lucide-react'
import { useWalletInfo, useUSDCBalance, useTokenBalances, useSolanaBalances } from '@/hooks'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { HoldingsCard } from '@/components/shared/HoldingsCard'

export default function WalletPage() {
  const { address, ethBalance, isConnected, nativeSymbol, chainName, chainId, explorerUrl } = useWalletInfo()
  const { balance: usdcBalance } = useUSDCBalance()
  const { tokens, totalUsd, isLoading: tokensLoading, isError: tokensError, refetch: refetchTokens } = useTokenBalances()
  const {
    tokens: solTokens,
    totalUsd: solTotalUsd,
    isLoading: solLoading,
    isError: solError,
    refetch: refetchSol,
    address: solAddress,
  } = useSolanaBalances()

  const walletInfo = {
    network: chainName,
    chainId: chainId ? String(chainId) : '—',
    explorerUrl: explorerUrl || '',
  }

  const escrowHistory = [
    {
      id: 1,
      jobId: 1,
      jobName: 'Lazada Price Tracking',
      amount: 100.00,
      status: 'active',
      funded: '2024-05-20 10:15 AM',
      paidOut: 65.00,
      remaining: 35.00,
    },
    {
      id: 2,
      jobId: 2,
      jobName: 'Shopee Merchant Leads',
      amount: 250.00,
      status: 'completed',
      funded: '2024-05-15 14:30 PM',
      paidOut: 250.00,
      remaining: 0,
    },
    {
      id: 3,
      jobId: 3,
      jobName: 'Real Estate Listings',
      amount: 300.00,
      status: 'active',
      funded: '2024-05-18 09:00 AM',
      paidOut: 180.00,
      remaining: 120.00,
    },
  ]

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your USDC balance and escrow funds</p>
      </div>

      {/* Wallet Connection Status */}
      {isConnected && address && (
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Wallet className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Connected Wallet</p>
                <p className="font-mono text-gray-900 mt-1">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                title="Copy address"
              >
                <Copy size={18} className="text-blue-600" />
              </button>
              {walletInfo.explorerUrl && (
                <a
                  href={`${walletInfo.explorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                  title="View on explorer"
                >
                  <ExternalLink size={18} className="text-blue-600" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Network Information</h2>
          <ChainSwitcher />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Network</p>
            <p className="font-semibold text-gray-900 mt-1">{walletInfo.network}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Chain ID</p>
            <p className="font-mono font-semibold text-gray-900 mt-1">{walletInfo.chainId}</p>
          </div>
        </div>
      </div>

      {/* Balance Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{nativeSymbol} Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{ethBalance} {nativeSymbol}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">USDC Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${usdcBalance}</p>
            </div>
            <Wallet className="text-green-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Escrow</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">$0.00</p>
            </div>
            <TrendingDown className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* EVM Token Holdings (multichain, via GoldRush) */}
      <HoldingsCard
        title="Token Holdings"
        subtitle={chainName}
        tokens={tokens}
        totalUsd={totalUsd}
        isLoading={tokensLoading}
        isError={tokensError}
        show={isConnected}
        notReadyHint="Connect your wallet to see your holdings."
        onRefresh={() => refetchTokens()}
      />

      {/* Solana Holdings — only when the embedded wallet has a Solana account */}
      {solAddress && (
        <HoldingsCard
          title="Solana Holdings"
          subtitle="Solana"
          tokens={solTokens}
          totalUsd={solTotalUsd}
          isLoading={solLoading}
          isError={solError}
          show={Boolean(solAddress)}
          notReadyHint="No Solana account on this wallet."
          onRefresh={() => refetchSol()}
        />
      )}

      {/* Actions */}
      <div className="card space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Approve USDC
          </button>
          <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
            Bridge Funds
          </button>
        </div>
      </div>

      {/* Escrow History */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Escrow History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Job</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Funded</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid Out</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {escrowHistory.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{row.jobName}</p>
                      <p className="text-xs text-gray-500">Job #{row.jobId}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">${row.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                      row.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {row.status === 'completed' ? (
                        <>
                          <Check size={14} /> Completed
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} /> Active
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{row.funded}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">${row.paidOut}</td>
                  <td className="py-3 px-4">
                    <span className={row.remaining === 0 ? 'text-gray-500' : 'text-blue-600 font-medium'}>
                      ${row.remaining}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Escrow Payment</p>
                  <p className="text-xs text-gray-600">Transaction ID: 0x1234...5678</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">-$100.00</p>
                <p className="text-xs text-gray-600">2 days ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
