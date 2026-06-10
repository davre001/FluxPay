'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowRight, Loader2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { walletAPI } from '@/lib/api-client';

const TX_TYPE_BADGE: Record<string, string> = {
  deposit:        'badge-green',
  withdrawal:     'badge-red',
  escrow_lock:    'badge-yellow',
  escrow_release: 'badge-purple',
};

const TX_LABEL: Record<string, string> = {
  deposit:        'Deposit',
  withdrawal:     'Withdrawal',
  escrow_lock:    'Escrow Lock',
  escrow_release: 'Escrow Release',
};

export default function CreatorWalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [txHash, setTxHash] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    Promise.all([walletAPI.getBalance(), walletAPI.getTransactions()])
      .then(([bRes, tRes]) => {
        setBalance(bRes.data?.balance ?? 0);
        setTransactions(tRes.data?.items ?? []);
      })
      .catch(() => { setBalance(0); setTransactions([]); })
      .finally(() => setLoading(false));
  }, []);

  const handleDeposit = async () => {
    if (!depositAmt || !txHash) { toast.error('Enter amount and transaction hash'); return; }
    setDepositing(true);
    try {
      await walletAPI.deposit({ amount: Number(depositAmt), tx_hash: txHash });
      toast.success('Deposit recorded!');
      setBalance((b) => (b ?? 0) + Number(depositAmt));
      setDepositAmt(''); setTxHash('');
      const tRes = await walletAPI.getTransactions();
      setTransactions(tRes.data?.items ?? []);
    } catch { toast.error('Deposit failed'); }
    finally { setDepositing(false); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt || !withdrawAddr) { toast.error('Enter amount and address'); return; }
    if (Number(withdrawAmt) > (balance ?? 0)) { toast.error('Insufficient balance'); return; }
    setWithdrawing(true);
    try {
      await walletAPI.withdraw({ amount: Number(withdrawAmt), to_address: withdrawAddr });
      toast.success('Withdrawal initiated!');
      setBalance((b) => (b ?? 0) - Number(withdrawAmt));
      setWithdrawAmt(''); setWithdrawAddr('');
      const tRes = await walletAPI.getTransactions();
      setTransactions(tRes.data?.items ?? []);
    } catch { toast.error('Withdrawal failed'); }
    finally { setWithdrawing(false); }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Finance</p>
          <h1 className="text-3xl font-black text-white">Your <span className="gradient-text">Wallet</span></h1>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="orb orb-purple w-48 h-48 -top-10 -right-10 opacity-40" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
            </div>
            <p className="text-5xl font-black text-white">
              {loading ? '–' : `$${(balance ?? 0).toFixed(2)}`}
              <span className="text-xl text-slate-400 ml-2">USDC</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          {/* Tab */}
          <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
               style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
            {(['deposit', 'withdraw'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                      className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${tab === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'deposit' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Send USDC to your wallet, then record the transaction hash below.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (USDC)</label>
                  <input type="number" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)}
                         placeholder="0.00" className="input" />
                </div>
                <div>
                  <label className="label">Transaction Hash</label>
                  <input value={txHash} onChange={(e) => setTxHash(e.target.value)}
                         placeholder="0x..." className="input" />
                </div>
              </div>
              <button onClick={handleDeposit} disabled={depositing} className="btn-success btn-shimmer">
                {depositing ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownToLine size={15} />}
                {depositing ? 'Recording...' : 'Record Deposit'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Amount (USDC)</label>
                <input type="number" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)}
                       placeholder="0.00" className="input" />
              </div>
              <div>
                <label className="label">Destination Wallet Address</label>
                <input value={withdrawAddr} onChange={(e) => setWithdrawAddr(e.target.value)}
                       placeholder="0x..." className="input" />
              </div>
              <button onClick={handleWithdraw} disabled={withdrawing} className="btn-danger py-3">
                {withdrawing ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpFromLine size={15} />}
                {withdrawing ? 'Withdrawing...' : 'Withdraw USDC'}
              </button>
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div className="card">
          <h2 className="font-black text-white mb-5 flex items-center gap-2">
            <Clock size={17} className="text-slate-500" /> Transaction History
          </h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : transactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No transactions yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${TX_TYPE_BADGE[tx.type] ?? 'badge-slate'}`}>
                      {TX_LABEL[tx.type] ?? tx.type}
                    </span>
                    {tx.tx_hash && (
                      <a href={`https://explorer.morphl2.io/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                         className="text-xs text-slate-600 hover:text-accent-400 transition-colors truncate max-w-[140px]">
                        {tx.tx_hash.slice(0, 10)}…
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${['deposit','escrow_release'].includes(tx.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {['deposit','escrow_release'].includes(tx.type) ? '+' : '-'}${tx.amount}
                    </p>
                    <p className="text-xs text-slate-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
