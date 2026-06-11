'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, Plus, Trash2, Zap, Calendar,
  CheckCircle, Loader2, Instagram, Twitter, Youtube, Music2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Milestone { title: string; description: string; amount: string; deadline: string }
const EMPTY_MILESTONE: Milestone = { title: '', description: '', amount: '', deadline: '' }

const PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'other'];
const POST_TYPES = ['video', 'image', 'content_writing', 'other'];
const STEPS = ['Deal Info', 'Payout', 'Deadline', 'Eligibility', 'Review'];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2,
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`step-dot flex-shrink-0 ${i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'inactive'}`}>
            {i + 1 < current ? '✓' : i + 1}
          </div>
          <div className="flex-1 h-px last:hidden" style={{ background: i + 1 < current ? '#059669' : 'rgba(71,85,105,0.3)' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PostJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Deal Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [postType, setPostType] = useState('image');
  const [hashtags, setHashtags] = useState('');
  const [mentions, setMentions] = useState('');
  const [linkInBio, setLinkInBio] = useState(false);
  const [brandTag, setBrandTag] = useState(false);
  const [customReq, setCustomReq] = useState('');

  // Step 2 — Payout
  const [payoutType, setPayoutType] = useState<'milestone' | 'full'>('milestone');
  const [milestones, setMilestones] = useState<Milestone[]>([{ ...EMPTY_MILESTONE }]);
  const [fullAmount, setFullAmount] = useState('');

  // Step 3 — Deadline
  const [overallDeadline, setOverallDeadline] = useState('');
  const [autoCancel, setAutoCancel] = useState(false);

  // Step 4 — Eligibility
  const [minReputation, setMinReputation] = useState('');
  const [requiredPlatforms, setRequiredPlatforms] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState('');
  const [region, setRegion] = useState('');
  const [inviteOnly, setInviteOnly] = useState(false);

  const totalBudget = useMemo(() => {
    if (payoutType === 'full') return parseFloat(fullAmount) || 0;
    return milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  }, [payoutType, milestones, fullAmount]);

  const addMilestone = () => setMilestones((p) => [...p, { ...EMPTY_MILESTONE }]);
  const removeMilestone = (i: number) => setMilestones((p) => p.filter((_, j) => j !== i));
  const updateMilestone = (i: number, k: keyof Milestone, v: string) =>
    setMilestones((p) => p.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const togglePlatform = (p: string) =>
    setRequiredPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!title.trim()) { toast.error('Enter a deal title'); return false; }
      if (!description.trim()) { toast.error('Enter a description'); return false; }
      return true;
    }
    if (step === 2) {
      if (payoutType === 'full' && !fullAmount) { toast.error('Enter the full payout amount'); return false; }
      if (payoutType === 'milestone') {
        const bad = milestones.find((m) => !m.title || !m.amount);
        if (bad) { toast.error('Fill title and amount for every milestone'); return false; }
      }
      return true;
    }
    if (step === 3) {
      if (!overallDeadline) { toast.error('Set an overall deadline'); return false; }
      return true;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 5)); };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        target_platform: platform,
        post_type: postType,
        required_elements: {
          hashtags: hashtags.split(',').map((h) => h.trim()).filter(Boolean),
          mentions: mentions.split(',').map((m) => m.trim()).filter(Boolean),
          link_in_bio: linkInBio,
          brand_tag: brandTag,
          custom: customReq || null,
        },
        payout_type: payoutType,
        total_budget: totalBudget,
        milestones: payoutType === 'milestone' ? milestones.map((m) => ({
          title: m.title, description: m.description,
          amount: parseFloat(m.amount), deadline: m.deadline || null,
        })) : [{ title: 'Full Delivery', description: description, amount: totalBudget, deadline: overallDeadline || null }],
        deadline: overallDeadline,
        auto_cancel_on_deadline: autoCancel,
        eligibility: {
          min_reputation: parseInt(minReputation) || 0,
          required_platforms: requiredPlatforms,
          min_followers: parseInt(minFollowers) || null,
          region: region || null,
          invite_only: inviteOnly,
        },
      };
      const res = await jobAPI.create(payload);
      toast.success('Deal posted! Escrow funding initiated...');
      router.push(`/organization/jobs/${(res.data as { id: string }).id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Step {step} of {STEPS.length}</p>
          <h1 className="text-3xl font-black text-white">{STEPS[step - 1]}</h1>
        </div>

        <StepBar current={step} total={STEPS.length} />

        <div className="card">
          {/* ── Step 1: Deal Info ── */}
          {step === 1 && (
            <div className="space-y-5 fade-in">
              <div>
                <label className="label">Deal Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                       placeholder="e.g. Summer Collection Instagram Reel" className="input" />
              </div>
              <div>
                <label className="label">Deal Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe exactly what you want the creator to produce..." rows={4} className="input resize-none" />
              </div>

              {/* Platform */}
              <div>
                <label className="label">Target Platform</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = PLATFORM_ICON[p];
                    return (
                      <button key={p} onClick={() => setPlatform(p)}
                              className={`py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-1.5 ${platform === p ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                              style={{ border: platform === p ? '1px solid transparent' : '1px solid rgba(71,85,105,0.4)' }}>
                        {Icon && <Icon size={16} />}
                        <span className="capitalize text-xs">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Post type */}
              <div>
                <label className="label">Post Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POST_TYPES.map((t) => (
                    <button key={t} onClick={() => setPostType(t)}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${postType === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            style={{ border: postType === t ? '1px solid transparent' : '1px solid rgba(71,85,105,0.4)' }}>
                      {t.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required elements */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="label">Required Elements</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Hashtags (comma-separated)</label>
                    <input value={hashtags} onChange={(e) => setHashtags(e.target.value)}
                           placeholder="ad, yourbrand, summer24" className="input" />
                  </div>
                  <div>
                    <label className="label">Mentions (comma-separated)</label>
                    <input value={mentions} onChange={(e) => setMentions(e.target.value)}
                           placeholder="yourbrand, partnerhandle" className="input" />
                  </div>
                </div>
                <div className="flex gap-4">
                  {[
                    { val: linkInBio, set: setLinkInBio, label: 'Link in Bio / Post' },
                    { val: brandTag,  set: setBrandTag,  label: 'Brand Tag Required' },
                  ].map(({ val, set, label }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer group">
                      <div onClick={() => set(!val)}
                           className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${val ? 'bg-brand-600' : 'bg-surface-700 border border-slate-600'}`}>
                        {val && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className="text-sm text-slate-400 group-hover:text-slate-200">{label}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="label">Custom Requirement</label>
                  <input value={customReq} onChange={(e) => setCustomReq(e.target.value)}
                         placeholder="e.g. Must show the product unboxing in first 5 seconds" className="input" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Payout ── */}
          {step === 2 && (
            <div className="space-y-6 fade-in">
              {/* Payout type */}
              <div>
                <label className="label">Payout Structure</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'milestone' as const, title: 'Milestone-Based', desc: 'Release funds per milestone on AI approval' },
                    { type: 'full' as const,      title: 'Full on Delivery', desc: 'Single lump sum on final deliverable approval' },
                  ].map(({ type, title, desc }) => (
                    <button key={type} onClick={() => setPayoutType(type)}
                            className="p-4 rounded-xl text-left transition-all"
                            style={{
                              background: payoutType === type ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${payoutType === type ? 'rgba(124,58,237,0.5)' : 'rgba(71,85,105,0.4)'}`,
                              boxShadow: payoutType === type ? '0 0 16px rgba(124,58,237,0.15)' : 'none',
                            }}>
                      <p className={`font-bold text-sm ${payoutType === type ? 'text-white' : 'text-slate-400'}`}>{title}</p>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone builder */}
              {payoutType === 'milestone' && (
                <div className="space-y-3">
                  <label className="label">Milestones</label>
                  {milestones.map((m, i) => (
                    <div key={i} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Milestone {i + 1}</span>
                        {milestones.length > 1 && (
                          <button onClick={() => removeMilestone(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Title</label>
                          <input value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                                 placeholder="e.g. Draft Content" className="input text-sm" />
                        </div>
                        <div>
                          <label className="label">Amount (USDC)</label>
                          <input type="number" value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                                 placeholder="0.00" className="input text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="label">Description</label>
                        <input value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                               placeholder="What should the creator deliver?" className="input text-sm" />
                      </div>
                      <div>
                        <label className="label">Milestone Deadline</label>
                        <input type="date" value={m.deadline} onChange={(e) => updateMilestone(i, 'deadline', e.target.value)}
                               className="input text-sm" style={{ colorScheme: 'dark' }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={addMilestone} className="btn-secondary text-sm py-2.5 w-full">
                    <Plus size={14} /> Add Milestone
                  </button>
                </div>
              )}

              {/* Full payout */}
              {payoutType === 'full' && (
                <div>
                  <label className="label">Total Payout Amount (USDC)</label>
                  <input type="number" value={fullAmount} onChange={(e) => setFullAmount(e.target.value)}
                         placeholder="0.00" className="input" />
                </div>
              )}

              {/* Budget summary */}
              {totalBudget > 0 && (
                <div className="rounded-xl p-4 flex items-center justify-between"
                     style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Total Budget to Escrow</p>
                    <p className="text-xs text-slate-600 mt-0.5">Funds lock into smart contract on posting</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-400">${totalBudget.toFixed(2)} <span className="text-sm text-slate-500">USDC</span></p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Deadline ── */}
          {step === 3 && (
            <div className="space-y-5 fade-in">
              <div>
                <label className="label">Overall Deal Deadline *</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="date" value={overallDeadline} onChange={(e) => setOverallDeadline(e.target.value)}
                         className="input pl-10" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div onClick={() => setAutoCancel(!autoCancel)}
                     className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-all ${autoCancel ? 'bg-brand-600' : 'bg-surface-700 border border-slate-600'}`}>
                  {autoCancel && <CheckCircle size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300 group-hover:text-white">Auto-cancel on deadline miss</p>
                  <p className="text-xs text-slate-500 mt-0.5">If the deadline passes with no deliverable, the deal cancels automatically and funds are returned.</p>
                </div>
              </label>
            </div>
          )}

          {/* ── Step 4: Eligibility ── */}
          {step === 4 && (
            <div className="space-y-5 fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Min. Reputation Score</label>
                  <input type="number" value={minReputation} onChange={(e) => setMinReputation(e.target.value)}
                         placeholder="0 (any)" className="input" />
                </div>
                <div>
                  <label className="label">Min. Followers (optional)</label>
                  <input type="number" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)}
                         placeholder="e.g. 10000" className="input" />
                </div>
              </div>

              <div>
                <label className="label">Required Platforms (creator must have linked)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PLATFORMS.filter((p) => p !== 'other').map((p) => (
                    <button key={p} onClick={() => togglePlatform(p)}
                            className={`px-3 py-1.5 rounded-full text-sm font-bold capitalize transition-all ${requiredPlatforms.includes(p) ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400'}`}
                            style={{ border: requiredPlatforms.includes(p) ? '1px solid transparent' : '1px solid rgba(71,85,105,0.4)' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Region / Location Preference (optional)</label>
                <input value={region} onChange={(e) => setRegion(e.target.value)}
                       placeholder="e.g. United States, UK, Global" className="input" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div onClick={() => setInviteOnly(!inviteOnly)}
                     className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition-all ${inviteOnly ? 'bg-brand-600' : 'bg-surface-700 border border-slate-600'}`}>
                  {inviteOnly && <CheckCircle size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300 group-hover:text-white">Invite-only deal</p>
                  <p className="text-xs text-slate-500 mt-0.5">Only creators you invite can apply for this deal.</p>
                </div>
              </label>
            </div>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <div className="space-y-5 fade-in">
              <p className="text-sm text-slate-400">Review your deal before posting. Funds will be locked in escrow on submission.</p>

              {[
                { label: 'Deal Title', value: title },
                { label: 'Platform', value: `${platform} · ${postType.replace('_',' ')}` },
                { label: 'Payout Type', value: payoutType === 'milestone' ? `Milestone-based (${milestones.length} steps)` : 'Full on delivery' },
                { label: 'Overall Deadline', value: overallDeadline ? new Date(overallDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '–' },
                { label: 'Min. Reputation', value: minReputation ? `${minReputation} pts` : 'None required' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-3 border-b border-white/5 last:border-0">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="text-sm font-bold text-white text-right capitalize">{value}</p>
                </div>
              ))}

              {/* Milestones preview */}
              {payoutType === 'milestone' && milestones.length > 0 && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  {milestones.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-400">{i + 1}. {m.title}</span>
                      <span className="font-bold text-emerald-400">${m.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Escrow lock notice */}
              <div className="rounded-xl p-5 flex gap-3"
                   style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Zap size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm">Escrow Lock: ${totalBudget.toFixed(2)} USDC</p>
                  <p className="text-xs text-slate-400 mt-1">
                    This amount will be locked in a smart contract on-chain.
                    Funds release per milestone after AI approval. Unused funds are refundable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 mt-6 border-t border-white/5">
            <button onClick={prev} disabled={step === 1}
                    className="btn-secondary disabled:opacity-40">
              <ArrowLeft size={16} /> Previous
            </button>
            {step < 5 ? (
              <button onClick={next} className="btn-primary btn-shimmer">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                      className="btn-primary btn-shimmer">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {submitting ? 'Posting...' : 'Post Deal & Lock Escrow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
