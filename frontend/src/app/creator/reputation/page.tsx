'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Loader2, CheckCircle2, XCircle, Activity, Gift } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { reputationAPI } from '@/lib/api-client';

function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const targetOffset = circ - (pct / 100) * circ;

  const [offset, setOffset] = useState(circ);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 100);
    
    const duration = 1000;
    const startTime = performance.now();
    
    const animateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayScore(Math.floor(score * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplayScore(score);
      }
    };
    
    requestAnimationFrame(animateNumber);
    return () => clearTimeout(t);
  }, [targetOffset, score, circ]);

  const tier = score >= 80 ? { label: 'Diamond', color: '#60a5fa' }
             : score >= 60 ? { label: 'Gold',    color: '#f59e0b' }
             : score >= 30 ? { label: 'Silver',  color: '#d1d5db' }
             :               { label: 'Bronze',  color: '#d97706' };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} fill="none"
                  stroke={tier.color} strokeWidth="8"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-white leading-none">{displayScore}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: tier.color }}>{tier.label}</p>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold mt-3">/ {max} Reputation</p>
    </div>
  );
}



export default function CreatorReputationPage() {
  const { user } = useUserStore();
  const [myScore, setMyScore] = useState<number | null>(null);
  const [myData, setMyData] = useState<any>(null);
  const [loadingMy, setLoadingMy] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const isCreator = user?.profileType === 'creator';
  const isBrand = user?.profileType === 'organization';

  const fetchMyScore = async () => {
    if (!user?.walletAddress) return;
    setLoadingMy(true);
    try {
      const { data } = await reputationAPI.lookup(user.walletAddress);
      setMyScore((data as any).score ?? 0);
      setMyData(data);
    } catch {
      setMyScore(0);
    }
    setLoadingMy(false);
    setShowScore(true);
  };

  const tierLabel = (s: number) =>
    s >= 80 ? 'Diamond' : s >= 60 ? 'Gold' : s >= 30 ? 'Silver' : 'Bronze';

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">On-Chain</p>
          <h1 className="text-lg font-bold text-white leading-none mt-0.5">Reputation</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── My Score Card ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-[#6b7280]" />
            <h2 className="text-base font-bold text-white tracking-tight">My Reputation</h2>
          </div>

          {showScore && myScore !== null ? (
            <div className="space-y-8">
              <div className="flex justify-center">
                <ScoreRing score={myScore} max={100} />
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Score', val: `${myScore} / 100` },
                  { label: 'Role', val: isBrand ? 'Brand' : 'Creator' },
                  { label: 'Tier', val: tierLabel(myScore) },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl py-4 px-2" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                    <p className="text-lg font-black text-white">{val}</p>
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-left pt-2">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">How you earn reputation</p>
                {isCreator ? (
                  // Creator breakdown
                  <>
                    {[
                      { label: 'Signup bonus', pts: '+5', ok: true },
                      { label: 'Approved milestone', pts: '+5', ok: true },
                      { label: 'Completed deal', pts: '+10', ok: true },
                      { label: 'Disputed milestone', pts: '−3', ok: false },
                    ].map(({ label, pts, ok }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0">
                        <div className="flex items-center gap-2.5">
                          {ok
                            ? <CheckCircle2 size={14} className="text-[#22c55e]" />
                            : <XCircle size={14} className="text-[#ef4444]" />}
                          <span className="text-sm font-medium text-[#d1d5db]">{label}</span>
                        </div>
                        <span className={`text-sm font-bold ${ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{pts}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  // Brand breakdown
                  <>
                    {[
                      { label: 'Signup bonus', pts: '+5', ok: true },
                      { label: 'Completed campaign', pts: '+10', ok: true },
                      { label: 'Approved milestone', pts: '+3', ok: true },
                      { label: 'Cancelled job', pts: '−8', ok: false },
                      { label: 'Lost dispute', pts: '−5', ok: false },
                    ].map(({ label, pts, ok }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-0">
                        <div className="flex items-center gap-2.5">
                          {ok
                            ? <CheckCircle2 size={14} className="text-[#22c55e]" />
                            : <XCircle size={14} className="text-[#ef4444]" />}
                          <span className="text-sm font-medium text-[#d1d5db]">{label}</span>
                        </div>
                        <span className={`text-sm font-bold ${ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{pts}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Star size={36} className="text-[#4b5563] mx-auto mb-4" />
              <p className="text-sm font-semibold text-white">Your reputation is computed from your deal history</p>
              <p className="text-xs text-[#6b7280] mt-1 mb-6">Every new account starts with a +5 signup bonus.</p>
              <button 
                onClick={fetchMyScore} 
                disabled={loadingMy}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
              >
                {loadingMy ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />} View My Reputation
              </button>
            </div>
          )}
        </div>

        {/* ── Score Tiers ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-5">Reputation Tiers</h2>
          <div className="space-y-3">
            {[
              { tier: 'Diamond', range: '80–100',  color: '#60a5fa', desc: 'Elite. Top-tier deals and maximum trust from the community.' },
              { tier: 'Gold',    range: '60–79',   color: '#f59e0b', desc: 'Trusted. Access to premium deals and preferred matching.' },
              { tier: 'Silver',  range: '30–59',   color: '#d1d5db', desc: 'Established. Solid track record, growing visibility.' },
              { tier: 'Bronze',  range: '0–29',    color: '#d97706', desc: 'Getting started. Build trust through completed deals.' },
            ].map(({ tier, range, color, desc }) => (
              <div key={tier} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ background: color, boxShadow: `0 0 10px ${color}88` }} />
                <div>
                  <p className="text-sm font-bold text-white leading-none">
                    {tier} <span className="text-xs text-[#6b7280] font-semibold ml-1">({range} pts)</span>
                  </p>
                  <p className="text-[11px] text-[#9ca3af] mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-4">How Reputation Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Gift size={16} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                <strong className="text-white">Signup bonus:</strong> Every new account starts with <span className="text-[#22c55e] font-bold">+5 reputation</span> just for joining FluxPay.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-[#22c55e] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                <strong className="text-white">Earn more:</strong> Complete deals and get milestones approved to climb the ranks. Both creators and brands use the same 0–100 scale.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <XCircle size={16} className="text-[#ef4444] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#d1d5db] leading-relaxed">
                <strong className="text-white">Lose points:</strong> Disputes, cancellations, and bad behavior reduce your score. Keep it clean to maintain your tier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
