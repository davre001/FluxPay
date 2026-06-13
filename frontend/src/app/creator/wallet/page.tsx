'use client';

// Wallet page — shows real on-chain balances (wagmi), the connected wallet
// address for receiving funds, and a proper USDC transfer flow for withdrawals.
// The backend ledger (walletAPI) records completed transactions for history.

import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2, Clock,
  ExternalLink, ArrowRightLeft, Eye, EyeOff, Copy, Check,
  QrCode, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI } from '@/lib/api-client';
import { useWalletInfo, useUSDCBalance } from '@/hooks';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { getToken } from '@/config/chains';
import { cn } from '@/lib/utils';

const USDC_TRANSFER_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  deposit: { label: 'Deposit', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  withdrawal: { label: 'Withdrawal', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  escrow_lock: { label: 'Escrow Lock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  escrow_release: { label: 'Payout', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
};

export default function CreatorWalletPage() {
  const { address, isConnected, explorerUrl, chainName, chainId, nativeSymbol, ethBalance } = useWalletInfo();
  const { balance: usdcBalance, refetch: refetchUsdc } = useUSDCBalance();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [tab, setTab] = useState<'receive' | 'send'>('receive');
  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluxpay_wallet_visibility');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleShowBalance = () => {
    const next = !showBalance;
    setShowBalance(next);
    localStorage.setItem('fluxpay_wallet_visibility', String(next));
  };

  // ── On-chain USDC transfer for withdrawals ───────────────────────────────
  const usdcToken = getToken(chainId, 'USDC');
  const { writeContractAsync, data: sendTxHash } = useWriteContract();
  const { isLoading: isTxPending, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: sendTxHash });
  const [sending, setSending] = useState(false);

  // ── Load real transaction history from backend ───────────────────────────
  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data: txs } = await walletAPI.getTransactions();
      setTransactions(Array.isArray(txs) ? txs as any[] : []);
    } catch {
      setTransactions([]);
    }
    setTxLoading(false);
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // When a send tx confirms, record it in the backend and refresh
  useEffect(() => {
    if (isTxConfirmed && sendTxHash) {
      walletAPI.withdraw({ amount: Number(withdrawAmt), to_address: withdrawAddr })
        .then(() => {
          loadTransactions();
          refetchUsdc();
        })
        .catch(() => {});
    }
  }, [isTxConfirmed, sendTxHash]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!withdrawAmt || Number(withdrawAmt) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!withdrawAddr || !withdrawAddr.startsWith('0x')) { toast.error('Enter a valid destination address'); return; }
    if (Number(withdrawAmt) > Number(usdcBalance)) { toast.error('Insufficient USDC balance'); return; }
    if (!usdcToken || usdcToken.address === 'native') { toast.error('USDC not configured for this chain'); return; }

    setSending(true);
    try {
      await writeContractAsync({
        address: usdcToken.address as `0x${string}`,
        abi: USDC_TRANSFER_ABI,
        functionName: 'transfer',
        args: [withdrawAddr as `0x${string}`, parseUnits(withdrawAmt, usdcToken.decimals)],
      });
      toast.success('Transaction submitted! Waiting for confirmation…');
      setWithdrawAmt('');
      setWithdrawAddr('');
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      toast.error(msg);
    }
    setSending(false);
  };

  const displayBalance = Number(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Finance</p>
          <h1 className="text-lg font-bold text-white leading-none mt-0.5">My Wallet</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Balance Card ── */}
        <div className="rounded-2xl p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                  <Wallet size={14} className="text-[#9ca3af]" />
                </div>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">USDC Balance</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-5xl font-black text-white leading-none transition-all duration-300", !showBalance && "blur-md opacity-50 select-none")}>
                  ${displayBalance}
                </p>
                <p className="text-xl font-bold text-[#4b5563]">USDC</p>
                <button 
                  onClick={toggleShowBalance}
                  className="ml-2 text-[#6b7280] hover:text-[#d1d5db] transition-colors"
                  title={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Native + chain info */}
              <div className="flex items-center gap-4 mt-4">
                <p className="text-xs font-semibold text-[#6b7280] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                  {isConnected ? chainName : 'Not connected'}
                  {chainId ? ` · ${chainId}` : ''}
                </p>
                {isConnected && (
                  <p className="text-xs font-mono text-[#4b5563]">
                    {Number(ethBalance).toFixed(4)} {nativeSymbol}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <DollarSignIcon />
              </div>
            </div>
          </div>

          {/* Wallet address bar */}
          {isConnected && address && (
            <div className="mt-6 pt-5 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #1a1a1a' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                  <QrCode size={14} className="text-[#6b7280]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-0.5">Wallet Address</p>
                  <p className="text-sm font-mono text-[#d1d5db] truncate">{address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={copyAddress} className="p-2 rounded-lg transition-colors hover:bg-[#1a1a1a]" title="Copy address">
                  {copied ? <Check size={16} className="text-[#22c55e]" /> : <Copy size={16} className="text-[#6b7280]" />}
                </button>
                {explorerUrl && (
                  <a href={`${explorerUrl}/address/${address}`} target="_blank" rel="noopener noreferrer"
                     className="p-2 rounded-lg transition-colors hover:bg-[#1a1a1a]" title="View on explorer">
                    <ExternalLink size={16} className="text-[#6b7280]" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Receive / Send ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          
          {/* Tab Switcher */}
          <div className="flex p-1 rounded-xl mb-6 w-full sm:w-fit" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
            {(['receive', 'send'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                  tab === t
                    ? 'bg-white text-black'
                    : 'text-[#6b7280] hover:text-[#d1d5db]'
                }`}
              >
                {t === 'receive' ? 'Receive' : 'Send'}
              </button>
            ))}
          </div>

          {/* Receive Tab */}
          {tab === 'receive' ? (
            <div className="space-y-5">
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                Send USDC to your wallet address below to fund your account. Any USDC sent to this address on {chainName || 'the connected chain'} will appear in your balance automatically.
              </p>
              
              {isConnected && address ? (
                <div className="space-y-4">
                  {/* Large address display */}
                  <div className="p-4 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #222222' }}>
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Your Wallet Address</p>
                    <p className="text-sm font-mono text-white break-all leading-relaxed">{address}</p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={copyAddress}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                    {explorerUrl && (
                      <a 
                        href={`${explorerUrl}/address/${address}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#6b7280] hover:text-white transition-colors"
                        style={{ border: '1px solid #252525' }}
                      >
                        <ExternalLink size={15} /> Explorer
                      </a>
                    )}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <AlertCircle size={14} className="text-[#3b82f6] flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#60a5fa] leading-relaxed">
                      Only send <strong>USDC</strong> on <strong>{chainName || 'the connected network'}</strong> to this address. Sending other tokens or using the wrong network may result in loss of funds.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8" style={{ border: '1px dashed #222222', borderRadius: '12px' }}>
                  <Wallet size={28} className="text-[#333] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#6b7280]">Connect your wallet to see your address</p>
                </div>
              )}
            </div>
          ) : (
            /* Send Tab */
            <div className="space-y-5">
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                Send USDC to any address on {chainName || 'the connected chain'}. This is a real on-chain transfer.
              </p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Amount (USDC)</label>
                  <button
                    onClick={() => setWithdrawAmt(usdcBalance)}
                    className="text-[10px] font-semibold text-[#60a5fa] hover:text-white transition-colors"
                  >
                    Max: {showBalance ? `$${displayBalance}` : '****'}
                  </button>
                </div>
                <input 
                  type="number" 
                  value={withdrawAmt} 
                  onChange={(e) => setWithdrawAmt(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] px-4 py-3" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Destination Address</label>
                <input 
                  value={withdrawAddr} 
                  onChange={(e) => setWithdrawAddr(e.target.value)} 
                  placeholder="0x..." 
                  className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] px-4 py-3" 
                />
              </div>
              <button 
                onClick={handleSend} 
                disabled={sending || isTxPending || !isConnected}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                {(sending || isTxPending) ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpFromLine size={15} />}
                {sending ? 'Confirm in wallet…' : isTxPending ? 'Confirming…' : 'Send USDC'}
              </button>
              {!isConnected && (
                <p className="text-[11px] text-[#ef4444] text-center">Connect your wallet to send USDC.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-6">
            <ArrowRightLeft size={16} className="text-[#6b7280]" /> Transaction History
          </h2>
          
          {txLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="text-[#333] animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10" style={{ border: '1px dashed #222222', borderRadius: '12px' }}>
              <Clock size={24} className="text-[#333] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#6b7280]">No transactions yet</p>
              <p className="text-xs text-[#4b5563] mt-1">Your deposit and withdrawal history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const conf = TX_TYPE_CONFIG[tx.type] || { label: tx.type, color: '#9ca3af', bg: '#1a1a1a', border: '#252525' };
                const isPositive = ['deposit', 'escrow_release'].includes(tx.type);

                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[#161616]" style={{ border: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span 
                          className="w-fit px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest" 
                          style={{ color: conf.color, background: conf.bg, border: `1px solid ${conf.border}` }}
                        >
                          {conf.label}
                        </span>
                        {tx.tx_hash && tx.tx_hash !== '0x0' && explorerUrl && (
                          <a href={`${explorerUrl}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                             className="text-[11px] font-mono text-[#6b7280] hover:text-[#d1d5db] transition-colors flex items-center gap-1">
                            {tx.tx_hash.slice(0, 12)}… <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold leading-none mb-1" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
                        {isPositive ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DollarSignIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
