'use client';

import { useState, useEffect, useCallback } from 'react'
import { Wallet, Check, AlertCircle, TrendingUp, TrendingDown, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { useWalletInfo, useUSDCBalance, useTokenBalances, useSolanaBalances } from '@/hooks'
import { ChainSwitcher } from '@/components/shared/ChainSwitcher'
import { HoldingsCard } from '@/components/shared/HoldingsCard'
import { walletAPI } from '@/lib/api-client'
import { jobAPI } from '@/lib/api-client'

export default function WalletPage() {
  const { address, ethBalance, isConnected, nativeSymbol, chainName, chainId, explorerUrl } = useWalletInfo()
  const { balance: usdcBalance, refetch: refetchUsdc } = useUSDCBalance()
  const { tokens, totalUsd, isLoading: tokensLoading, isError: tokensError, refetch: refetchTokens } = useTokenBalances()
  const {
    tokens: solTokens,
    totalUsd: solTotalUsd,
    isLoading: solLoading,
    isError: solError,
    refetch: refetchSol,
    address: solAddress,
  } = useSolanaBalances()

  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [escrowDeals, setEscrowDeals] = useState<any[]>([])
  const [escrowLoading, setEscrowLoading] = useState(true)

  const walletInfo = {
    network: chainName,
    chainId: chainId ? String(chainId) : '—',
    explorerUrl: explorerUrl || '',
  }

  // Load real transaction history
  const loadTransactions = useCallback(async () => {
    setTxLoading(true)
    try {
      const { data: txs } = await walletAPI.getTransactions()
      setTransactions(Array.isArray(txs) ? txs as any[] : [])
    } catch {
      setTransactions([])
    }
    setTxLoading(false)
  }, [])

  // Load real escrow data from funded deals
  const loadEscrowDeals = useCallback(async () => {
    setEscrowLoading(true)
    try {
      const { data: deals } = await jobAPI.listMine()
      const funded = (deals as any[]).filter((d: any) => d.funded || d.funding_status !== 'unfunded')
      setEscrowDeals(funded.map((d: any) => {
        const milestones = d.milestones || []
        const paidOut = milestones
          .filter((m: any) => m.status === 'approved')
          .reduce((sum: number, m: any) => sum + (m.amount || 0), 0)
        return {
          id: d.id,
          jobName: d.title,
          amount: d.total_budget,
          status: d.status === 'completed' ? 'completed' : 'active',
          funded: new Date(d.created_at).toLocaleDateString(),
          paidOut,
          remaining: d.total_budget - paidOut,
        }
      }))
    } catch {
      setEscrowDeals([])
    }
    setEscrowLoading(false)
  }, [])

  useEffect(() => {
    loadTransactions()
    loadEscrowDeals()
  }, [loadTransactions, loadEscrowDeals])

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const totalEscrow = escrowDeals.reduce((sum, d) => sum + d.remaining, 0)

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
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-blue-600" />}
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
              <p className="text-2xl font-bold text-gray-900 mt-2">{Number(ethBalance).toFixed(4)} {nativeSymbol}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">USDC Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${Number(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <Wallet className="text-green-600" size={32} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Escrow</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalEscrow.toFixed(2)}</p>
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
          <button
            onClick={() => refetchUsdc()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Refresh Balances
          </button>
          {walletInfo.explorerUrl && address && (
            <a
              href={`${walletInfo.explorerUrl}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors text-center flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} /> View on Explorer
            </a>
          )}
        </div>
      </div>

      {/* Escrow History */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Escrow History</h2>
        {escrowLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : escrowDeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No escrow deals yet</p>
            <p className="text-xs text-gray-400 mt-1">Funded deals will appear here.</p>
          </div>
        ) : (
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
                {escrowDeals.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{row.jobName}</p>
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
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h2>
        {txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => {
              const isPositive = ['deposit', 'escrow_release'].includes(tx.type)
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isPositive ? <TrendingUp className="text-green-600" size={20} /> : <TrendingDown className="text-red-600" size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{tx.type?.replace(/_/g, ' ') || 'Transaction'}</p>
                      {tx.tx_hash && tx.tx_hash !== '0x0' && explorerUrl ? (
                        <a href={`${explorerUrl}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          {tx.tx_hash.slice(0, 12)}… <ExternalLink size={10} />
                        </a>
                      ) : (
                        <p className="text-xs text-gray-600">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
