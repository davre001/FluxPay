'use client';

import { useState, useEffect } from 'react';
import { Search, Star, TrendingUp, Loader2, CheckCircle2, XCircle, SearchIcon, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';
import { reputationAPI } from '@/lib/api-client';

const MOCK_SCORE = 240; // Silver-tier demo score

function ScoreRing({ score }: { score: number }) {
  const max = 500;
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
  }, [targetOffset, score]);

  const tier = score >= 400 ? { label: 'Diamond', color: '#60a5fa' }
             : score >= 250 ? { label: 'Gold',    color: '#f59e0b' }
             : score >= 100 ? { label: 'Silver',  color: '#d1d5db' }
             :                { label: 'Bronze',  color: '#d97706' };

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
      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold mt-3">Reputation Score</p>
    </div>
  );
}

export default function CreatorReputationPage() {
  const { user } = useUserStore();
  const [showScore, setShowScore] = useState(false);
  const [lookup, setLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLookup = async () => {
    if (!lookup) { toast.error('Enter a wallet address'); return; }
    setLookupLoading(true);
    try {
      const { data } = await reputationAPI.lookup(lookup);
      setLookupResult(data);
    } catch (e: any) {
      toast.error(e?.message || 'Lookup failed');
    }
    setLookupLoading(false);
  };

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
            <h2 className="text-base font-bold text-white tracking-tight">My Score</h2>
          </div>

          {showScore ? (
            <div className="space-y-8">
              <div className="flex justify-center">
                <ScoreRing score={MOCK_SCORE} />
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Deals Done',  val: '14' },
                  { label: 'Accepted',    val: '92%' },
                  { label: 'Avg. Rating', val: '4.8 ★' },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl py-4 px-2" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                    <p className="text-lg font-black text-white">{val}</p>
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-left pt-2">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Score breakdown</p>
                {[
                  { label: 'Deals completed on time', pts: '+120', ok: true },
                  { label: 'Positive brand reviews', pts: '+90', ok: true },
                  { label: 'Disputes raised', pts: '-10', ok: false },
                  { label: 'Wallet verified', pts: '+40', ok: true },
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
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Star size={36} className="text-[#4b5563] mx-auto mb-4" />
              <p className="text-sm font-semibold text-white">Scores are stored on-chain</p>
              <p className="text-xs text-[#6b7280] mt-1 mb-6">Unlock your detailed reputation history and metrics.</p>
              <button 
                onClick={() => setShowScore(true)} 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors"
              >
                <TrendingUp size={15} /> View My Score
              </button>
            </div>
          )}
        </div>

        {/* ── Score Tiers ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-5">Score Tiers</h2>
          <div className="space-y-3">
            {[
              { tier: 'Diamond', range: '400+',   color: '#60a5fa', desc: 'Elite creator. Highest payout deals available.' },
              { tier: 'Gold',    range: '250–399', color: '#f59e0b', desc: 'Trusted creator. Access to premium brand deals.' },
              { tier: 'Silver',  range: '100–249', color: '#d1d5db', desc: 'Established creator. Preferred by mid-tier brands.' },
              { tier: 'Bronze',  range: '0–99',   color: '#d97706', desc: 'New to the platform. Build trust through completed deals.' },
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

        {/* ── Lookup Wallet ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="mb-5">
            <h2 className="text-base font-bold text-white tracking-tight">Lookup Any Wallet</h2>
            <p className="text-[11px] text-[#6b7280] mt-1">Check the reputation score of any creator or brand by their address.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input 
                value={lookup} 
                onChange={(e) => setLookup(e.target.value)}
                placeholder="0x..." 
                className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors px-4 py-3 pl-9" 
              />
            </div>
            <button 
              onClick={handleLookup} 
              disabled={lookupLoading} 
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {lookupLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Lookup
            </button>
          </div>

          {lookupResult && (
            <div className="mt-6 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ background: '#0a0a0a', border: '1px solid #222222' }}>
              <div className="text-center sm:text-left">
                <p className="text-3xl font-black text-white">{(lookupResult as any).score}</p>
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mt-1">Reputation Score</p>
                
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <p className="text-xs text-[#d1d5db] font-mono truncate max-w-[200px] mb-1">{(lookupResult as any).wallet_address}</p>
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">
                    {(lookupResult as any).profile_type ?? 'Unknown Profile'}
                  </p>
                  {(lookupResult as any).name && (
                    <p className="text-xs text-[#9ca3af] mt-1 font-medium">{(lookupResult as any).name}</p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 scale-90 sm:scale-100">
                <ScoreRing score={(lookupResult as any).score} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
