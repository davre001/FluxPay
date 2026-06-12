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
import { EXTRA_MOCK_JOBS } from '@/lib/mock-jobs';
import { jobAPI, applicationAPI, profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'];
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

const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Instagram Reel for New Sneaker Launch',
    organization: { brand_name: 'Nike', logo_url: 'https://www.google.com/s2/favicons?domain=nike.com&sz=128' },
    description: 'We need a 30-second high-energy Instagram reel showcasing our new AirMax series.',
    target_platform: 'instagram',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 1500,
    milestones: [],
    deadline: new Date(Date.now() + 864000000).toISOString(),
  },
  {
    id: 'job-2',
    title: 'YouTube Tech Review: SuperHeadphones Pro',
    organization: { brand_name: 'Sony', logo_url: 'https://www.google.com/s2/favicons?domain=sony.com&sz=128' },
    description: 'Looking for a detailed unboxing and review of our latest noise-canceling headphones.',
    target_platform: 'youtube',
    post_type: 'video',
    payout_type: 'milestone',
    total_budget: 3500,
    milestones: [1, 2, 3],
    deadline: new Date(Date.now() + 1500000000).toISOString(),
  },
  {
    id: 'job-3',
    title: 'Twitter Thread on Web3 Payments',
    organization: { brand_name: 'Flux Protocol', logo_url: 'https://ui-avatars.com/api/?name=Flux+Protocol&background=1a1a1a&color=fff' },
    description: 'Write an engaging 10-tweet thread explaining the benefits of crypto escrow for freelancers.',
    target_platform: 'twitter',
    post_type: 'content_writing',
    payout_type: 'full',
    total_budget: 500,
    milestones: [],
    deadline: new Date(Date.now() + 500000000).toISOString(),
  },
  {
    id: 'job-4',
    title: 'TikTok Viral Challenge Dance',
    organization: { brand_name: 'Red Bull', logo_url: 'https://www.google.com/s2/favicons?domain=redbull.com&sz=128' },
    description: 'Participate in the #GivesYouWings dance challenge using our official sound.',
    target_platform: 'tiktok',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 1200,
    milestones: [],
    deadline: new Date(Date.now() + 1000000000).toISOString(),
  }
];

const MOCK_APPS = [
  {
    id: 'app-1',
    job_id: 'job-5',
    status: 'accepted',
    job_title: 'Ongoing Brand Ambassador - Q3',
    job_target_platform: 'instagram',
    job_total_budget: 5000,
    organization: { brand_name: 'Adidas', logo_url: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128' },
  },
  {
    id: 'app-2',
    job_id: 'job-3',
    status: 'pending',
    job_title: 'Twitter Thread on Web3 Payments',
    job_target_platform: 'twitter',
    job_total_budget: 500,
    organization: { brand_name: 'Flux Protocol', logo_url: 'https://ui-avatars.com/api/?name=Flux+Protocol&background=1a1a1a&color=fff' },
  }
];


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
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function CreatorDashboard() {
  const { user } = useUserStore();
  const [profileName, setProfileName] = useState('');
  const [myApplications, setMyApplications] = useState<any[]>(MOCK_APPS);
  const [openJobs, setOpenJobs] = useState<any[]>([...MOCK_JOBS, ...EXTRA_MOCK_JOBS]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [hideStats, setHideStats] = useState(false);
  const [welcomeText, setWelcomeText] = useState('');
  
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

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => setProfileName(data?.name || '')).catch(() => {});
    applicationAPI.listMine().then(({ data }) => {
      const apps = data as any[];
      if (apps.length > 0) {
        setMyApplications(apps);
      }
      setAppliedIds(new Set(apps.map((a) => a.job_id)));
    }).catch(() => {});
  }, [user?.id]);

  const handleApply = async () => {
    if (!showModal || !user?.id) return;
    setApplying(true);
    try {
      await jobAPI.apply(showModal, { cover_note: coverNote });
      setAppliedIds((prev) => new Set([...prev, showModal]));
      toast.success('Application submitted!');
      setShowModal(null);
      setCoverNote('');
      applicationAPI.listMine().then(({ data }) => setMyApplications(data as any[])).catch(() => {});
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply');
    }
    setApplying(false);
  };

  const active = myApplications.filter((a) => a.status === 'accepted').length;

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
              <button onClick={() => setHideStats(!hideStats)} className="text-[#4b5563] hover:text-white transition-colors">
                {hideStats ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
              {welcomeText}<span className="animate-pulse">|</span>
            </h1>
            <p className="text-[#6b7280] text-xs font-semibold mt-1">Here's your earnings & activity overview.</p>
          </div>
          <a href="#browse-section" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all" style={{ background: 'white', color: 'black' }}>
            Find Jobs <ArrowRight size={14} />
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock}       label="Applications"  value={myApplications.length} color="#3b82f6" />
          <StatCard icon={CheckCircle} label="Active Deals"  value={active}                color="#10b981" />
          <StatCard icon={WalletIcon}  label="Wallet Balance" value="$1,500"               color="#8b5cf6" blur={hideStats} sub="USDC" />
          <StatCard icon={Star}        label="Reputation"    value="4.8 ★"                 color="#f59e0b" blur={hideStats} sub="Score" />
        </div>

      {/* Browse available jobs section */}
      <div id="browse-section" className="pt-4 border-t border-white/5 space-y-6">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Search size={20} className="text-brand-400" /> Browse Available Jobs
          </h2>
          <p className="text-slate-400 text-sm mt-1">Pitch directly to brands and secure on-chain milestones.</p>
        </div>

        {/* Filters */}
        <div className="card space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search by job title or brand..." className="input pl-10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input">
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} style={{ background: '#0f172a' }}>
                    {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Post Type</label>
              <select value={postType} onChange={(e) => setPostType(e.target.value)} className="input">
                {POST_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: '#0f172a' }}>
                    {t === 'all' ? 'All Types' : t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min Budget ($)</label>
              <input type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="0" className="input" />
            </div>
            <div>
              <label className="label">Max Budget ($)</label>
              <input type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Any" className="input" />
            </div>
          </div>
        </div>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 card">
            <Zap size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No open jobs match your filters</p>
            <button onClick={() => { setSearch(''); setPlatform('all'); setPostType('all'); setMinBudget(''); setMaxBudget(''); }}
                    className="btn-secondary mt-4 text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const PlatformIcon = PLATFORM_ICON[job.target_platform] ?? Zap;
              const platColor = PLATFORM_COLOR[job.target_platform] ?? '#8b5cf6';
              const alreadyApplied = appliedIds.has(job.id);
              return (
                <div key={job.id} className="card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-700 to-accent-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        {(job.organization?.brand_name?.[0] ?? 'B').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{job.organization?.brand_name ?? 'Brand'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PlatformIcon size={11} style={{ color: platColor }} />
                          <span className="text-xs text-slate-500 capitalize">{job.target_platform}</span>
                        </div>
                      </div>
                      <span className={`badge ml-auto ${job.payout_type === 'milestone' ? 'badge-purple' : 'badge-cyan'}`}>
                        {job.payout_type === 'milestone' ? 'Milestone' : 'Full Pay'}
                      </span>
                    </div>

                    <h3 className="font-black text-white mb-2 leading-tight">{job.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-4">{job.description}</p>
                  </div>

                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="font-black text-emerald-400 text-sm">${job.total_budget}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        <p className="text-xs text-slate-500">Steps</p>
                        <p className="font-black text-brand-400 text-sm">{job.milestones?.length ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                        <p className="text-xs text-slate-500">Deadline</p>
                        <p className="font-black text-accent-400 text-xs truncate">
                          {job.deadline ? new Date(job.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '–'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/creator/deals/${job.id}`} className="btn-secondary flex-1 text-sm py-2">
                        Details
                      </Link>
                      {alreadyApplied ? (
                        <div className="btn-secondary flex-1 text-sm py-2 text-emerald-400 border-emerald-500/30 text-center">
                          ✓ Applied
                        </div>
                      ) : (
                        <button onClick={() => { setShowModal(job.id); setCoverNote(''); }}
                                className="btn-primary flex-1 text-sm py-2 btn-shimmer">
                          Apply <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {[
          { href: '/creator/profile',    icon: Star,       label: 'Edit Profile',   sub: 'Update bio & socials',   color: 'from-brand-600 to-brand-500'    },
          { href: '/creator/wallet',     icon: DollarSign, label: 'Wallet',         sub: 'View balance & history', color: 'from-accent-600 to-accent-500'   },
          { href: '/creator/reputation', icon: TrendingUp, label: 'Reputation',     sub: 'Check your score',       color: 'from-emerald-600 to-green-500'   },
        ].map(({ href, icon: Icon, label, sub, color }) => (
          <Link key={href} href={href}
                className="card flex items-center gap-4 group hover:border-brand-600/40 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
            <ArrowRight size={14} className="text-slate-600 ml-auto group-hover:text-brand-400 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Apply modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-lg">Apply for this deal</h3>
              <button onClick={() => setShowModal(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <label className="label">Cover Note (optional)</label>
            <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Why are you a great fit for this brand deal?"
                      rows={4} className="input resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="btn-primary flex-1 btn-shimmer">
                {applying ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {applying ? 'Submitting...' : 'Submit Application'}
>>>>>>> 2aede1c12e5307fac5f6e3c031ae0e7cc3b143f3
              </button>
            </div>
            <h1 className="text-lg font-bold text-white leading-none mt-1 h-6">{welcomeText}</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#browse-section"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150"
            >
              Browse Jobs <ArrowRight size={14} />
            </a>
          </div>
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
          <motion.div variants={itemVariants}><StatCard icon={WalletIcon}  label="Total Earned"  value="$1,500"                color="#60a5fa" sub="USDC" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={Star}        label="Reputation"    value="4.8"                 color="#f59e0b" sub="Score" blur={hideStats} /></motion.div>
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
          {filteredJobs.length === 0 ? (
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
                  disabled={applying} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] rounded-lg transition-colors disabled:opacity-50"
                >
                  {applying ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
