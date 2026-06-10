'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, DollarSign, ArrowRight, Zap, X, Loader2,
  Instagram, Twitter, Youtube, Music2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB, MockJob } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'];
const POST_TYPES = ['all', 'video', 'image', 'content_writing', 'other'];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c', twitter: '#1da1f2', youtube: '#ff0000',
  tiktok: '#69c9d0', other: '#8b5cf6',
};

export default function CreatorJobsPage() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState<MockJob[]>([]);
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
    const all = mockDB.getOpenJobs();
    setJobs(all);
    if (user?.id) {
      const myApps = mockDB.getMyApplications(user.id);
      setAppliedIds(new Set(myApps.map((a) => a.job_id)));
    }
  }, [user?.id]);

  const filtered = jobs.filter((j) => {
    if (platform !== 'all' && j.target_platform !== platform) return false;
    if (postType !== 'all' && j.post_type !== postType) return false;
    if (minBudget && j.total_budget < Number(minBudget)) return false;
    if (maxBudget && j.total_budget > Number(maxBudget)) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !(j.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
      setJobs(mockDB.getOpenJobs());
    } catch (e: any) {
      toast.error(e?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="mb-8 fade-in">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Opportunities</p>
        <h1 className="text-3xl font-black text-white">Browse <span className="gradient-text">Jobs</span></h1>
        <p className="text-slate-400 text-sm mt-1">{jobs.length} open brand deals available</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 space-y-4">
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

      <p className="text-xs text-slate-500 mb-4 font-semibold">{filtered.length} job{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Zap size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No jobs match your filters</p>
          <button onClick={() => { setSearch(''); setPlatform('all'); setPostType('all'); setMinBudget(''); setMaxBudget(''); }}
                  className="btn-secondary mt-4 text-sm">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filtered.map((job) => {
            const PlatformIcon = PLATFORM_ICON[job.target_platform] ?? Zap;
            const platColor = PLATFORM_COLOR[job.target_platform] ?? '#8b5cf6';
            const alreadyApplied = appliedIds.has(job.id);
            return (
              <div key={job.id} className="card fade-in flex flex-col">
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
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">{job.description}</p>

                {/* Meta */}
                <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
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
                    <p className="font-black text-accent-400 text-xs">
                      {job.deadline ? new Date(job.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '–'}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="badge badge-slate capitalize">{job.post_type?.replace('_', ' ')}</span>
                  {(job.required_elements?.hashtags ?? []).slice(0, 2).map((h) => (
                    <span key={h} className="badge badge-slate">#{h}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link href={`/creator/deals/${job.id}`} className="btn-secondary flex-1 text-sm py-2">
                    View Details
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
            );
          })}
        </div>
      )}

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
