'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, Star, TrendingUp,
  Clock, CheckCircle, ArrowRight, Zap, Search, X, Loader2,
  Instagram, Twitter, Youtube, Music2, MapPin, Briefcase, ChevronRight, Eye, EyeOff, Wallet as WalletIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/stores/userStore';
import { useDeals, useMyApplications, useApplyToDeal } from '@/hooks/useDeals';
import { profileAPI, jobAPI } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'other'];
const POST_TYPES = ['all', 'video', 'image', 'content_writing', 'other'];

const XLogo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: XLogo, youtube: Youtube, tiktok: Music2,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c', twitter: '#1da1f2', youtube: '#ff0000',
  tiktok: '#e2e8f0', other: '#d1d5db',
};


const StatCard = ({ icon: Icon, label, value, color, sub, blur }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="rounded-xl p-5 flex items-center gap-4 transition-all duration-150" 
    style={{ background: '#111111', border: '1px solid #1a1a1a' }}
  >
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p className="text-xs font-semibold text-[#6b7280]">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <h3 className={cn("text-2xl font-bold text-white tracking-tight transition-all duration-300", blur && "blur-md opacity-50 select-none")}>{value}</h3>
        {sub && <span className={cn("text-xs font-semibold text-[#4b5563] transition-all duration-300", blur && "opacity-0")}>{sub}</span>}
      </div>
    </div>
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function CreatorDashboard() {
  const { user } = useUserStore();
  const { deals: openJobs, isLoading } = useDeals({ status: 'open' });
  const { applications: myApps, appliedJobIds: appliedIds } = useMyApplications();
  // Real applications only (empty until the creator applies).
  const myApplications = myApps;
  const applyMutation = useApplyToDeal();
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [hideStats, setHideStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluxpay_dashboard_stats');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });
  const [welcomeText, setWelcomeText] = useState('');
  const [rep, setRep] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.walletAddress) return;
    profileAPI.getReputation(user.walletAddress)
      .then(({ data }: any) => setRep(typeof data?.score === 'number' ? data.score : null))
      .catch(() => {});
  }, [user?.walletAddress]);

  // Real total earned: sum of approved-milestone payouts across the creator's
  // accepted deals (USDC). Starts at $0 — no hardcoded figure.
  const acceptedJobIds = myApps.filter((a: any) => a.status === 'accepted').map((a: any) => a.job_id).filter(Boolean);
  const { data: earned = 0 } = useQuery({
    queryKey: ['creator-earnings', acceptedJobIds.join(',')],
    enabled: acceptedJobIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const deals = await Promise.all(
        acceptedJobIds.map((id: string) => jobAPI.detail(id).then((r: any) => r.data).catch(() => null)),
      );
      let sum = 0;
      for (const d of deals as any[]) {
        for (const m of (d?.milestones ?? [])) if (m?.status === 'approved') sum += Number(m.amount) || 0;
      }
      return sum;
    },
  });

  const fullText = `Welcome back, ${user?.email?.split('@')[0] || 'Creator'}`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setWelcomeText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [fullText]);

  const handleApply = async () => {
    if (!showModal || !user?.id) return;
    try {
      await applyMutation.mutateAsync({ jobId: showModal, coverNote });
      toast.success('Application submitted!');
      setShowModal(null);
      setCoverNote('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply');
    }
  };

  const active = myApplications.filter((a: any) => a.status === 'accepted').length;

  const filteredJobs = openJobs.filter((j) => {
    if (platform !== 'all' && j.target_platform !== platform) return false;
    if (postType !== 'all' && j.post_type !== postType) return false;
    if (minBudget && j.total_budget < Number(minBudget)) return false;
    if (maxBudget && j.total_budget > Number(maxBudget)) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !(j.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Creator Dashboard</p>
              <button 
                onClick={() => {
                  const next = !hideStats;
                  setHideStats(next);
                  localStorage.setItem('fluxpay_dashboard_stats', String(next));
                }} 
                className="text-[#4b5563] hover:text-white transition-colors"
              >
                {hideStats ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
              {welcomeText}<span className="animate-pulse">|</span>{' '}
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 1.5, duration: 2.5 }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-[#6b7280] text-xs font-semibold mt-1">Here's your earnings & activity overview.</p>
          </div>
          <a href="#browse-section" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all" style={{ background: 'white', color: 'black' }}>
            Find Jobs <ArrowRight size={14} />
          </a>
        </div>
      </div>



      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Stats Row ── */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants}><StatCard icon={Clock}       label="Applications"  value={myApplications.length} color="#9ca3af" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={CheckCircle} label="Active Deals"  value={active}                color="#22c55e" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={WalletIcon}  label="Total Earned"  value={`$${Number(earned).toLocaleString()}`} color="#60a5fa" sub="USDC" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={Star}        label="Reputation"    value={rep ?? '—'}          color="#f59e0b" sub="/ 100" blur={hideStats} /></motion.div>
        </motion.div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/creator/profile',    icon: Star,       label: 'Edit Profile',   sub: 'Update your freelancer bio & socials' },
            { href: '/creator/wallet',     icon: DollarSign, label: 'Wallet',         sub: 'Manage USDC & payment history' },
            { href: '/creator/reputation', icon: TrendingUp, label: 'Reputation',     sub: 'View on-chain verified reviews' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href} className="group rounded-xl p-5 flex items-center gap-4 transition-all duration-150" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                <Icon size={16} className="text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-xs text-[#6b7280] truncate mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-[#4b5563] group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Browse Available Jobs ── */}
        <div id="browse-section" className="space-y-6 pt-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
               Open Opportunities
            </h2>
            <p className="text-sm text-[#6b7280] mt-1">Pitch directly to brands and secure on-chain milestones.</p>
          </div>

          {/* Filters */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title or brand..." 
                className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-9" 
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5">
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Post Type</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5">
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'all' ? 'All Types' : t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Min Budget ($)</label>
                <input type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="0" className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Max Budget ($)</label>
                <input type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Any" className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5" />
              </div>
            </div>
          </div>

          {/* Job Cards */}
          {isLoading ? (
            <div className="rounded-xl p-10 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
              <Loader2 size={28} className="text-[#4b5563] mx-auto mb-3 animate-spin" />
              <p className="text-sm font-semibold text-white">Loading open jobs…</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
              <Briefcase size={32} className="text-[#4b5563] mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No open jobs found</p>
              <p className="text-xs text-[#6b7280] mt-1">Try adjusting your search filters.</p>
              <button 
                onClick={() => { setSearch(''); setPlatform('all'); setPostType('all'); setMinBudget(''); setMaxBudget(''); }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-[#1a1a1a] text-white hover:bg-[#252525] rounded-lg transition-colors border border-[#2a2a2a]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredJobs.map((job) => {
                const PlatformIcon = PLATFORM_ICON[job.target_platform] ?? Zap;
                const platColor = PLATFORM_COLOR[job.target_platform] ?? '#d1d5db';
                const hasApplied = appliedIds.has(job.id);
                return (
                  <motion.div key={job.id} variants={itemVariants} whileHover={{ y: -4 }}>
                    <div className="rounded-xl flex flex-col justify-between overflow-hidden group hover:border-[#333333] transition-colors" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    
                    {/* Top Content */}
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {job.organization?.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={job.organization.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-1 flex-shrink-0" style={{ border: '1px solid #252525' }} />
                          ) : (
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                              {(job.organization?.brand_name?.[0] ?? 'B').toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm leading-none">{job.organization?.brand_name ?? 'Brand'}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <PlatformIcon size={10} style={{ color: platColor }} />
                              <span className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">{job.target_platform}</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                          {job.payout_type === 'milestone' ? 'Milestones' : 'Full Pay'}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base leading-tight mb-2 group-hover:text-[#e5e7eb] transition-colors">{job.title}</h3>
                      <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-3">{job.description}</p>
                    </div>

                    {/* Bottom Stats & Actions */}
                    <div className="p-5 pt-0 mt-auto">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-lg p-2 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">Budget</p>
                          <p className="font-bold text-[#22c55e] text-xs">${job.total_budget}</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">Steps</p>
                          <p className="font-bold text-white text-xs">{job.milestones?.length ?? 0}</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">Deadline</p>
                          <p className="font-bold text-[#d1d5db] text-xs truncate">
                            {job.deadline ? new Date(job.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '–'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link 
                          href={`/creator/jobs/${job.id}`} 
                          className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg text-[#d1d5db] hover:text-white transition-colors" 
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                        >
                          Details
                        </Link>
                        {hasApplied ? (
                          <div className="flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-lg text-[#22c55e]" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            ✓ Applied
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setShowModal(job.id); setCoverNote(''); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-white text-black hover:bg-[#f0f0f0] rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Apply Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: '#111111', border: '1px solid #222222' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Apply for Opportunity</h3>
              <button onClick={() => setShowModal(null)} className="text-[#6b7280] hover:text-white transition-colors p-1"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Cover Note (Optional)</label>
                <textarea 
                  value={coverNote} 
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Why are you a great fit for this brand deal?"
                  rows={4} 
                  className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-3 resize-none" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowModal(null)} 
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-[#9ca3af] hover:text-white transition-colors" 
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] rounded-lg transition-colors disabled:opacity-50"
                >
                  {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
