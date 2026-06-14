'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Briefcase, Zap, Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { jobAPI } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'other'];

// Per-platform engagement metrics a milestone can be measured by.
const PLATFORM_METRICS: Record<string, string[]> = {
  instagram: ['likes', 'comments', 'views', 'shares', 'saves', 'reach'],
  twitter: ['likes', 'comments', 'retweets', 'impressions', 'bookmarks'],
  youtube: ['views', 'likes', 'comments', 'subscribers', 'watch hours'],
  tiktok: ['views', 'likes', 'comments', 'shares', 'saves'],
  facebook: ['likes', 'comments', 'shares', 'views', 'reactions'],
  other: ['views', 'engagements', 'clicks', 'reach'],
};
const metricsFor = (p: string) => PLATFORM_METRICS[p] ?? PLATFORM_METRICS.other;
const POST_TYPES = ['video', 'image', 'content_writing', 'other'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [platformOther, setPlatformOther] = useState('');
  const [postType, setPostType] = useState('video');
  const [postTypeOther, setPostTypeOther] = useState('');
  const [budget, setBudget] = useState('');
  const [creatorSlots, setCreatorSlots] = useState('1');
  const [payoutType, setPayoutType] = useState<'milestone' | 'full'>('full');
  const [deadline, setDeadline] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [milestones, setMilestones] = useState<{ metric: string; target: string; amount: string }[]>([]);

  // Eligibility / screening
  const [minReputation, setMinReputation] = useState('');
  const [requiredPlatforms, setRequiredPlatforms] = useState<string[]>([]);
  const [autoHire, setAutoHire] = useState(false);
  const toggleRequiredPlatform = (p: string) =>
    setRequiredPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const addHashtag = () => {
    const h = hashInput.replace('#', '').trim();
    if (h && !hashtags.includes(h)) setHashtags([...hashtags, h]);
    setHashInput('');
  };

  const addMilestone = () =>
    setMilestones([...milestones, { metric: metricsFor(platform)[0], target: '', amount: '' }]);

  const updateMilestone = (i: number, field: string, val: string) =>
    setMilestones(milestones.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const removeMilestone = (i: number) =>
    setMilestones(milestones.filter((_, idx) => idx !== i));

  // total_budget is the POOL; each of the hired creators earns an equal cut =
  // pool / slots. Milestones describe ONE creator's journey, so the stage amounts
  // must add up to that per-creator cut (not the whole pool).
  const budgetNum = Number(budget) || 0;
  const slotsNum = Math.max(1, Number(creatorSlots) || 1);
  const perCreator = budgetNum / slotsNum;
  const allocated = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const milestonesBalanced = perCreator > 0 && Math.round(allocated * 100) === Math.round(perCreator * 100);
  const canSubmit = payoutType !== 'milestone' || (milestones.length > 0 && milestonesBalanced);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget) {
      toast.error('Fill in all required fields');
      return;
    }
    if (payoutType === 'milestone') {
      if (milestones.length === 0) {
        toast.error('Add at least one milestone, or switch to Single Payment');
        return;
      }
      if (!milestonesBalanced) {
        toast.error(
          allocated > perCreator
            ? `Milestones total $${allocated.toLocaleString()} — $${(allocated - perCreator).toLocaleString()} over the $${perCreator.toLocaleString()} per-creator cut`
            : `Milestones total $${allocated.toLocaleString()} — $${(perCreator - allocated).toLocaleString()} of the $${perCreator.toLocaleString()} per-creator cut is unallocated`
        );
        return;
      }
    }
    // Same-metric stages must escalate (target + payment) — matches the backend rule.
    const lastByMetric: Record<string, { target: number; amount: number }> = {};
    for (const m of milestones) {
      const metric = (m.metric || '').trim().toLowerCase();
      const target = Number(m.target);
      const amount = Number(m.amount);
      if (!metric || Number.isNaN(target)) continue;
      const prev = lastByMetric[metric];
      if (prev) {
        if (!(target > prev.target)) { toast.error(`Each "${metric}" stage must require a higher count than the previous (${target} ≤ ${prev.target})`); return; }
        if (!Number.isNaN(amount) && !(amount > prev.amount)) { toast.error(`A higher "${metric}" stage must pay more than the previous`); return; }
      }
      lastByMetric[metric] = { target, amount: Number.isNaN(amount) ? (prev?.amount ?? 0) : amount };
    }
    if (platform === 'other' && !platformOther.trim()) {
      toast.error('Enter the name of the social platform');
      return;
    }
    if (postType === 'other' && !postTypeOther.trim()) {
      toast.error('Describe the content to be created');
      return;
    }
    setLoading(true);
    try {
      await jobAPI.create({
        title,
        description,
        target_platform: platform,
        platform_other: platform === 'other' ? platformOther.trim() : undefined,
        post_type: postType,
        post_type_other: postType === 'other' ? postTypeOther.trim() : undefined,
        total_budget: Number(budget),
        creator_slots: Math.max(1, Number(creatorSlots) || 1),
        payout_type: payoutType,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        required_elements: { hashtags, mentions: [] },
        eligibility: {
          min_reputation: Number(minReputation) || 0,
          required_platforms: requiredPlatforms,
        },
        auto_hire: autoHire,
        milestones: milestones.map((m) => ({
          title: m.metric,
          description: `${m.target || '0'} ${m.metric}`,
          metric: m.metric,
          target: Number(m.target) || 0,
          amount: Number(m.amount),
        })),
      });
      toast.success('Deal posted!');
      router.push('/organization/jobs');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to post deal');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    color: '#e5e7eb',
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/organization/dashboard" className="inline-flex items-center gap-2 text-[#6b7280] hover:text-white text-sm mb-4 transition-colors font-semibold">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">New Campaign</p>
          </div>
          <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Post a Deal</h1>
          <p className="text-[#6b7280] text-sm font-semibold mt-1">Create a brand deal and find the perfect creator to execute your vision.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.form 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          onSubmit={handleSubmit} 
          className="space-y-8"
        >
          {/* Deal Details */}
          <motion.div variants={itemVariants} className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Briefcase size={18} color="#3b82f6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Deal Details</h2>
                <p className="text-xs font-semibold text-[#6b7280]">Provide the core information about this campaign.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Job Title *</label>
              <input 
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Instagram Reel — Summer Launch" 
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all" 
                style={inputStyle}
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Description *</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need the creator to do. Be specific about deliverables, tone, and any restrictions."
                rows={5} 
                className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white transition-all" 
                style={inputStyle}
                required 
              />
              <p className="text-[10px] font-semibold text-[#6b7280] mt-1.5 text-right">{description.length} chars</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Platform *</label>
                <select 
                  value={platform} onChange={(e) => setPlatform(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all appearance-none"
                  style={inputStyle}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                {platform === 'other' && (
                  <input
                    value={platformOther}
                    onChange={(e) => setPlatformOther(e.target.value)}
                    placeholder="Name the platform (e.g. Threads, Snapchat)"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all mt-2"
                    style={inputStyle}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Content Type *</label>
                <select 
                  value={postType} onChange={(e) => setPostType(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all appearance-none"
                  style={inputStyle}
                >
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
                {postType === 'other' && (
                  <input
                    value={postTypeOther}
                    onChange={(e) => setPostTypeOther(e.target.value)}
                    placeholder="Describe the content to be created / what's to be done"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all mt-2"
                    style={inputStyle}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Budget & Payout */}
          <motion.div variants={itemVariants} className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <Zap size={18} color="#22c55e" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Budget & Payout</h2>
                <p className="text-xs font-semibold text-[#6b7280]">Set the budget and payment structure.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">
                  Total Budget (USDC) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold">$</span>
                  <input
                    type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Overall Deadline</label>
                <input
                  type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all"
                  style={{...inputStyle, colorScheme: 'dark'}}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] mb-2 uppercase tracking-wide">Number of Creators to Hire</label>
              <input
                type="number" min="1" step="1" value={creatorSlots}
                onChange={(e) => setCreatorSlots(e.target.value)}
                className="w-full md:w-48 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all"
                style={inputStyle}
              />
              <p className="text-xs font-semibold text-[#6b7280] mt-2">
                Your ${budgetNum.toLocaleString()} pool is split across {slotsNum} creator{slotsNum > 1 ? 's' : ''} — each earns{' '}
                <span className="font-bold text-[#22c55e]">${perCreator.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC</span>
                {payoutType === 'milestone' ? ' (your milestones must sum to this).' : ' on completion.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9ca3af] mb-3 uppercase tracking-wide">Payout Structure</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['full', 'milestone'] as const).map((type) => (
                  <button 
                    key={type} type="button" onClick={() => setPayoutType(type)}
                    className="p-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: payoutType === type ? '#1a1a1a' : '#0a0a0a',
                      border: `1px solid ${payoutType === type ? '#333333' : '#161616'}`,
                    }}
                  >
                    <p className={`font-bold text-sm ${payoutType === type ? 'text-white' : 'text-[#6b7280]'}`}>
                      {type === 'full' ? 'Single Payment' : 'Milestone-based'}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-1 font-semibold">
                      {type === 'full' ? 'Pay upon full completion' : 'Pay in stages per deliverable'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Milestones (optional) */}
          {payoutType === 'milestone' && (
            <motion.div variants={itemVariants} className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Star size={18} color="#8b5cf6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Milestones</h2>
                    <p className="text-xs font-semibold text-[#6b7280]">Break down the payments into deliverables.</p>
                  </div>
                </div>
                <button type="button" onClick={addMilestone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1a1a1a] text-white hover:bg-[#222222] transition-colors border border-[#333333]">
                  <Plus size={14} /> Add Stage
                </button>
              </div>

              {milestones.length === 0 ? (
                <p className="text-sm text-[#6b7280] text-center font-semibold py-4">Add milestones to break the payment into stages.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m, i) => (
                    <div key={i} className="p-5 rounded-xl space-y-4" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white bg-[#1a1a1a] px-2 py-1 rounded uppercase tracking-wider border border-[#252525]">Stage {i + 1}</span>
                        <button type="button" onClick={() => removeMilestone(i)} className="text-[#6b7280] hover:text-[#ef4444] transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#6b7280] mb-1.5 uppercase">Metric</label>
                          <select
                            value={m.metric} onChange={(e) => updateMilestone(i, 'metric', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all appearance-none"
                            style={inputStyle}
                          >
                            {metricsFor(platform).map((mt) => (
                              <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#6b7280] mb-1.5 uppercase">Required {m.metric}</label>
                          <input
                            type="number" value={m.target} onChange={(e) => updateMilestone(i, 'target', e.target.value)}
                            placeholder="e.g. 1000"
                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#6b7280] mb-1.5 uppercase">Amount (USDC)</label>
                          <input
                            type="number" value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all"
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {milestones.length > 0 && (
                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Allocated <span className="normal-case text-[#4b5563]">(per creator)</span></span>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${milestonesBalanced ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      ${allocated.toLocaleString()} / ${perCreator.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    {!milestonesBalanced && (
                      <p className="text-[11px] font-semibold text-[#ef4444] mt-0.5">
                        {allocated > perCreator
                          ? `Over the per-creator cut by $${(allocated - perCreator).toLocaleString()}`
                          : `$${(perCreator - allocated).toLocaleString()} of the per-creator cut unallocated`}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Hashtags */}
          <motion.div variants={itemVariants} className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Required Hashtags</h2>
              <p className="text-xs font-semibold text-[#6b7280] mt-1">Specify hashtags the creator must use.</p>
            </div>
            <div className="flex gap-2">
              <input 
                value={hashInput} onChange={(e) => setHashInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); }}}
                placeholder="Type a hashtag and press Enter" 
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all" 
                style={inputStyle}
              />
              <button type="button" onClick={addHashtag} className="px-5 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#222222] transition-colors border border-[#333333]">
                Add
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {hashtags.map((h) => (
                  <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: '#1a1a1a', border: '1px solid #252525', color: '#e5e7eb' }}>
                    #{h}
                    <button type="button" onClick={() => setHashtags(hashtags.filter((x) => x !== h))} className="ml-1 text-[#6b7280] hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Eligibility & Screening */}
          <motion.div variants={itemVariants} className="rounded-2xl p-6 md:p-8 space-y-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Eligibility & Screening</h2>
              <p className="text-xs font-semibold text-[#6b7280] mt-1">Applicants are auto-screened against these criteria and shown as Qualified / Not qualified.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6b7280] mb-1.5 uppercase">Min Reputation (0–100)</label>
                <input type="number" value={minReputation} onChange={(e) => setMinReputation(e.target.value)} placeholder="0"
                       className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white" style={inputStyle} />
              </div>
              <button type="button" onClick={() => setAutoHire(!autoHire)}
                      className={cn('self-end flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all h-[42px]',
                        autoHire ? 'bg-[#22c55e] text-black border-[#22c55e]' : 'text-[#9ca3af] border-[#1f1f1f] bg-[#0f0f0f]')}>
                {autoHire ? <Check size={14} /> : <Zap size={14} />} Auto-hire qualified applicants
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6b7280] mb-2 uppercase">Required Linked Platforms</label>
              <div className="flex flex-wrap gap-2">
                {['youtube', 'twitter', 'instagram', 'tiktok'].map((p) => {
                  const active = requiredPlatforms.includes(p);
                  return (
                    <button key={p} type="button" onClick={() => toggleRequiredPlatform(p)}
                            className={cn('px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize',
                              active ? 'bg-white text-black border-white' : 'text-[#9ca3af] border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333]')}>
                      {p === 'twitter' ? 'X' : p}
                    </button>
                  );
                })}
              </div>
            </div>
            {autoHire && (
              <p className="text-[11px] text-[#6b7280]">The first qualifying applicant is selected automatically — you still fund/grant the permission from the deal page.</p>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div variants={itemVariants} className="pt-4 flex gap-4">
            <Link href="/organization/dashboard" className="px-6 py-3 rounded-xl font-bold text-sm bg-[#1a1a1a] text-white hover:bg-[#222222] transition-colors border border-[#333333] text-center flex-1 sm:flex-none">
              Cancel
            </Link>
            <button
              type="submit" disabled={loading || !canSubmit}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-sm bg-white text-black hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'Posting Deal...' : 'Publish Deal'}
            </button>
          </motion.div>

        </motion.form>
      </div>
    </div>
  );
}
