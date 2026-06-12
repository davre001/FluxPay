'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2, Clock, ExternalLink, ArrowRightLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI } from '@/lib/api-client';
import { useWalletInfo } from '@/hooks';
import { cn } from '@/lib/utils';

const TX_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  deposit: { label: 'Deposit', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  withdrawal: { label: 'Withdrawal', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  escrow_lock: { label: 'Escrow Lock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  escrow_release: { label: 'Escrow Release', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
};

export default function CreatorWalletPage() {
  const { explorerUrl } = useWalletInfo();
  const [balance, setBalance] = useState(1500);
  const [chainName, setChainName] = useState('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'tx-mock-1',
      type: 'deposit',
      amount: 1500,
      status: 'completed',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      tx_hash: '0xabc123def456'
    }
  ]);
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [txHash, setTxHash] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [showBalance, setShowBalance] = useState(true);

  const loadData = async () => {
    try {
      const [{ data: bal }, { data: txs }] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(),
      ]);
      setBalance((bal as any).balance || 1500);
      setChainName((bal as any).chain_name || '');
      setChainId((bal as any).chain_id || null);
      setTransactions((txs as any[])?.length ? txs as any[] : transactions);
    } catch {
      setBalance(1500);
      // keep mock transactions if API fails
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDeposit = async () => {
    if (!depositAmt) { toast.error('Enter an amount'); return; }
    setDepositing(true);
    try {
      await walletAPI.deposit({ amount: Number(depositAmt), tx_hash: txHash || '0x0' });
      setDepositAmt(''); setTxHash('');
      toast.success('Deposit recorded!');
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Deposit failed');
    }
    setDepositing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) { toast.error('Enter an amount'); return; }
    if (!withdrawAddr) { toast.error('Enter a destination address'); return; }
    setWithdrawing(true);
    try {
      await walletAPI.withdraw({ amount: Number(withdrawAmt), to_address: withdrawAddr });
      setWithdrawAmt(''); setWithdrawAddr('');
      toast.success('Withdrawal initiated!');
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Withdrawal failed');
    }
    setWithdrawing(false);
  };

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
        <div className="rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                <Wallet size={14} className="text-[#9ca3af]" />
              </div>
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Available Balance</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-5xl font-black text-white leading-none transition-all duration-300", !showBalance && "blur-md opacity-50 select-none")}>
                ${balance.toFixed(2)}
              </p>
              <p className="text-xl font-bold text-[#4b5563]">USDC</p>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="ml-2 text-[#6b7280] hover:text-[#d1d5db] transition-colors"
                title={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs font-semibold text-[#6b7280] mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
              {chainName || 'Connected'}{chainId ? ` · Chain ID: ${chainId}` : ''}
            </p>
          </div>
          <div className="flex-shrink-0">
             <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
               <DollarSignIcon />
             </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          
          {/* Tab Switcher */}
          <div className="flex p-1 rounded-xl mb-6 w-full sm:w-fit" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
            {(['deposit', 'withdraw'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                  tab === t
                    ? 'bg-white text-black'
                    : 'text-[#6b7280] hover:text-[#d1d5db]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Form Content */}
          {tab === 'deposit' ? (
            <div className="space-y-5">
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                Add USDC to your wallet to fund escrow or receive payouts securely.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Amount (USDC)</label>
                  <input 
                    type="number" 
                    value={depositAmt} 
                    onChange={(e) => setDepositAmt(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] px-4 py-3" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Tx Hash (Optional)</label>
                  <input 
                    value={txHash} 
                    onChange={(e) => setTxHash(e.target.value)} 
                    placeholder="0x..." 
                    className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] px-4 py-3" 
                  />
                </div>
              </div>
              <button 
                onClick={handleDeposit} 
                disabled={depositing} 
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
              >
                {depositing ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownToLine size={15} />}
                {depositing ? 'Recording...' : 'Record Deposit'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                Withdraw USDC to your connected web3 address.
              </p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Amount (USDC)</label>
                  <span className="text-[10px] font-semibold text-[#9ca3af]">
                    Available: {showBalance ? `$${balance.toFixed(2)}` : '****'}
                  </span>
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
                onClick={handleWithdraw} 
                disabled={withdrawing}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
              >
                {withdrawing ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpFromLine size={15} />}
                {withdrawing ? 'Withdrawing...' : 'Withdraw USDC'}
              </button>
            </div>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-6">
            <ArrowRightLeft size={16} className="text-[#6b7280]" /> Transaction History
          </h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-10" style={{ border: '1px dashed #222222', borderRadius: '12px' }}>
              <p className="text-sm font-semibold text-[#6b7280]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
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
                        {tx.tx_hash && explorerUrl && (
                          <a href={`${explorerUrl}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                             className="text-[11px] font-mono text-[#6b7280] hover:text-[#d1d5db] transition-colors flex items-center gap-1">
                            {tx.tx_hash.slice(0, 12)}… <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold leading-none mb-1" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
                        {isPositive ? '+' : '-'}${tx.amount}
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
