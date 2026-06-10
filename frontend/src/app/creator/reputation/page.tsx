'use client';

import { useState } from 'react';
import { Search, Star, TrendingUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';
import { mockDB } from '@/lib/mock-data';

const MOCK_SCORE = 240; // Silver-tier demo score

function ScoreRing({ score }: { score: number }) {
  const max = 500;
  const pct = Math.min(100, (score / max) * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const tier = score >= 400 ? { label: 'Diamond', color: '#06b6d4' }
             : score >= 250 ? { label: 'Gold',    color: '#f59e0b' }
             : score >= 100 ? { label: 'Silver',  color: '#94a3b8' }
             :                { label: 'Bronze',  color: '#b45309' };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none"
                  stroke={tier.color} strokeWidth="10"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${tier.color}88)`, transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-white">{score}</p>
          <p className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400 mt-2">Reputation Score</p>
    </div>
  );
}

export default function CreatorReputationPage() {
  const { user } = useUserStore();
  const [showScore, setShowScore] = useState(false);
  const [lookup, setLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const applications = user?.id ? mockDB.getMyApplications(user.id) : [];
  const accepted = applications.filter((a) => a.status === 'accepted').length;

  const handleLookup = async () => {
    if (!lookup) { toast.error('Enter a wallet address'); return; }
    setLookupLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    // Simulate a result
    const mockResult = {
      wallet_address: lookup,
      score: Math.floor(Math.random() * 400) + 50,
      profile_type: Math.random() > 0.5 ? 'creator' : 'organization',
      name: 'Anonymous User',
    };
    setLookupResult(mockResult);
    setLookupLoading(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">On-Chain</p>
          <h1 className="text-3xl font-black text-white">Reputation <span className="gradient-text">Score</span></h1>
          <p className="text-slate-400 text-sm mt-2">Scores are stored on-chain and reflect your deal history</p>
        </div>

        {/* My score */}
        <div className="card text-center space-y-6">
          <h2 className="font-black text-white text-left">My Score</h2>
          {showScore ? (
            <>
              <ScoreRing score={MOCK_SCORE} />
              <div className="grid grid-cols-3 gap-4 text-center mt-4">
                {[
                  { label: 'Deals Done',  val: applications.length },
                  { label: 'Accepted',    val: accepted },
                  { label: 'Avg. Rating', val: '4.8 ★' },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="text-lg font-black text-white">{val}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-left">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score breakdown</p>
                {[
                  { label: 'Deals completed on time', pts: '+120', ok: true },
                  { label: 'Positive brand reviews', pts: '+90', ok: true },
                  { label: 'Disputes raised', pts: '-10', ok: false },
                  { label: 'Wallet verified', pts: '+40', ok: true },
                ].map(({ label, pts, ok }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      {ok
                        ? <CheckCircle size={14} className="text-emerald-400" />
                        : <AlertCircle size={14} className="text-red-400" />}
                      <span className="text-sm text-slate-300">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{pts}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8">
              <Star size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-4">View your on-chain reputation score</p>
              <button onClick={() => setShowScore(true)} className="btn-primary btn-shimmer">
                <TrendingUp size={15} /> View My Score
              </button>
            </div>
          )}
        </div>

        {/* Score tiers */}
        <div className="card space-y-4">
          <h2 className="font-black text-white">Score Tiers</h2>
          <div className="space-y-2">
            {[
              { tier: 'Bronze',  range: '0–99',   color: '#b45309', desc: 'New to the platform. Build trust through completed deals.' },
              { tier: 'Silver',  range: '100–249', color: '#94a3b8', desc: 'Established creator. Preferred by mid-tier brands.' },
              { tier: 'Gold',    range: '250–399', color: '#f59e0b', desc: 'Trusted creator. Access to premium brand deals.' },
              { tier: 'Diamond', range: '400+',   color: '#06b6d4', desc: 'Elite creator. Highest payout deals available.' },
            ].map(({ tier, range, color, desc }) => (
              <div key={tier} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: color, boxShadow: `0 0 8px ${color}88` }} />
                <div>
                  <p className="text-sm font-bold text-white">{tier} <span className="text-slate-500 font-normal">({range} pts)</span></p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lookup */}
        <div className="card space-y-4">
          <h2 className="font-black text-white">Look Up Any Wallet</h2>
          <p className="text-sm text-slate-400">Check the reputation score of any creator or brand by wallet address.</p>
          <div className="flex gap-3">
            <input value={lookup} onChange={(e) => setLookup(e.target.value)}
                   placeholder="0x..." className="input flex-1" />
            <button onClick={handleLookup} disabled={lookupLoading} className="btn-primary btn-shimmer whitespace-nowrap">
              {lookupLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Look Up
            </button>
          </div>

          {lookupResult && (
            <div className="rounded-xl p-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="text-xs text-slate-500 mb-1 font-mono truncate">{lookupResult.wallet_address}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-white">{lookupResult.score} pts</p>
                  <p className="text-sm text-slate-400 capitalize">{lookupResult.profile_type}</p>
                </div>
                <ScoreRing score={lookupResult.score} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
