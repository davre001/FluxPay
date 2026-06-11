'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB } from '@/lib/mock-data';
import { useWalletInfo } from '@/hooks';

const TX_TYPE_BADGE: Record<string, string> = {
  deposit: 'badge-green', withdrawal: 'badge-red',
  escrow_lock: 'badge-yellow', escrow_release: 'badge-purple',
};

const TX_LABEL: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal',
  escrow_lock: 'Escrow Lock', escrow_release: 'Escrow Release',
};

export default function CreatorWalletPage() {
  const { chainName, chainId, explorerUrl } = useWalletInfo();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmt, setDepositAmt] = useState('');
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [txHash, setTxHash] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');

  useEffect(() => {
    setBalance(mockDB.getBalance());
    setTransactions(mockDB.getTransactions());
  }, []);

  const handleDeposit = async () => {
    if (!depositAmt) { toast.error('Enter an amount'); return; }
    setDepositing(true);
    await new Promise((r) => setTimeout(r, 800));
    const amt = Number(depositAmt);
    const newBal = balance + amt;
    mockDB.setBalance(newBal);
    mockDB.addTransaction({ type: 'deposit', amount: amt, tx_hash: txHash || undefined });
    setBalance(newBal);
    setTransactions(mockDB.getTransactions());
    setDepositAmt(''); setTxHash('');
    toast.success('Deposit recorded!');
    setDepositing(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmt) { toast.error('Enter an amount'); return; }
    if (Number(withdrawAmt) > balance) { toast.error('Insufficient balance'); return; }
    setWithdrawing(true);
    await new Promise((r) => setTimeout(r, 800));
    const amt = Number(withdrawAmt);
    const newBal = balance - amt;
    mockDB.setBalance(newBal);
    mockDB.addTransaction({ type: 'withdrawal', amount: amt });
    setBalance(newBal);
    setTransactions(mockDB.getTransactions());
    setWithdrawAmt(''); setWithdrawAddr('');
    toast.success('Withdrawal initiated!');
    setWithdrawing(false);
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
              ${balance.toFixed(2)}
              <span className="text-xl text-slate-400 ml-2">USDC</span>
            </p>
            <p className="text-xs text-slate-500 mt-3">{chainName}{chainId ? ` · Chain ${chainId}` : ''}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
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
              <p className="text-sm text-slate-400">Add USDC to your FluxPay wallet to fund escrow or receive payouts.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (USDC)</label>
                  <input type="number" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} placeholder="0.00" className="input" />
                </div>
                <div>
                  <label className="label">Transaction Hash (optional)</label>
                  <input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..." className="input" />
                </div>
              </div>
              <button onClick={handleDeposit} disabled={depositing} className="btn-success btn-shimmer">
                {depositing ? <Loader2 size={15} className="animate-spin" /> : <ArrowDownToLine size={15} />}
                {depositing ? 'Recording...' : 'Record Deposit'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Withdraw USDC to your connected wallet address.</p>
              <div>
                <label className="label">Amount (USDC)</label>
                <input type="number" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)} placeholder="0.00" className="input" />
                <p className="text-xs text-slate-600 mt-1">Available: ${balance.toFixed(2)} USDC</p>
              </div>
              <div>
                <label className="label">Destination Address</label>
                <input value={withdrawAddr} onChange={(e) => setWithdrawAddr(e.target.value)} placeholder="0x..." className="input" />
              </div>
              <button onClick={handleWithdraw} disabled={withdrawing}
                      className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
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
          {transactions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No transactions yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`badge ${TX_TYPE_BADGE[tx.type] ?? 'badge-slate'}`}>
                      {TX_LABEL[tx.type] ?? tx.type}
                    </span>
                    {tx.tx_hash && explorerUrl && (
                      <a href={`${explorerUrl}/tx/${tx.tx_hash}`} target="_blank" rel="noopener noreferrer"
                         className="text-xs text-slate-600 hover:text-accent-400 transition-colors flex items-center gap-1">
                        {tx.tx_hash.slice(0, 12)}… <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${['deposit', 'escrow_release'].includes(tx.type) ? 'text-emerald-400' : 'text-red-400'}`}>
                      {['deposit', 'escrow_release'].includes(tx.type) ? '+' : '-'}${tx.amount}
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
