'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Briefcase, DollarSign, Star, TrendingUp,
  Clock, CheckCircle, ArrowRight, Zap, Search, X, Loader2,
  Instagram, Twitter, Youtube, Music2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB, MockJob } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-green', in_progress: 'badge-cyan', completed: 'badge-purple',
  expired: 'badge-slate', cancelled: 'badge-red',
};

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'];
const POST_TYPES = ['all', 'video', 'image', 'content_writing', 'other'];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c', twitter: '#1da1f2', youtube: '#ff0000',
  tiktok: '#69c9d0', other: '#8b5cf6',
};

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card stat-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useUserStore();
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<MockJob[]>([]);
  const [earnings] = useState(350);

  // Open jobs browsing state
  const [openJobs, setOpenJobs] = useState<MockJob[]>([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    const apps = mockDB.getMyApplications(user.id);
    setMyApplications(apps);
    const jobs = mockDB.getJobs();
    
    const acceptedApps = apps.filter((a) => a.status === 'accepted');
    const activeDeals = acceptedApps.map((a) => jobs.find((j) => j.id === a.job_id)).filter(Boolean) as MockJob[];
    setActiveJobs(activeDeals);

    // Load open jobs for browsing
    setOpenJobs(mockDB.getOpenJobs());
    setAppliedIds(new Set(apps.map((a) => a.job_id)));
  }, [user?.id]);

  const handleApply = async () => {
    if (!showModal || !user?.id) return;
    setApplying(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      mockDB.applyToJob(showModal, user.id, user.email, coverNote);
      setAppliedIds((prev) => new Set([...prev, showModal]));
      toast.success('Application submitted!');
      setShowModal(null);
      setCoverNote('');
      
      // Refresh applications and open jobs
      const apps = mockDB.getMyApplications(user.id);
      setMyApplications(apps);
      setOpenJobs(mockDB.getOpenJobs());
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
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
    <div className="p-6 md:p-10 space-y-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Creator Dashboard</p>
          <h1 className="text-3xl font-black text-white">
            Hey, <span className="gradient-text">{user?.email?.split('@')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening with your deals today.</p>
        </div>
        <a href="#browse-section" className="btn-primary btn-shimmer self-start sm:self-auto">
          Browse Jobs <ArrowRight size={16} />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children fade-in">
        <StatCard icon={Clock}       label="Applications"  value={myApplications.length} color="bg-gradient-to-br from-brand-600 to-brand-500" />
        <StatCard icon={CheckCircle} label="Active Deals"  value={active}                color="bg-gradient-to-br from-emerald-600 to-green-500" />
        <StatCard icon={DollarSign}  label="Total Earned"  value={`$${earnings}`}        color="bg-gradient-to-br from-accent-600 to-accent-500" sub="USDC" />
        <StatCard icon={Star}        label="Reputation"    value="4.8 ★"                 color="bg-gradient-to-br from-yellow-600 to-amber-500" sub="Score" />
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
                    {/* Brand row */}
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
                    {/* Meta */}
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

                    {/* Actions */}
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
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
