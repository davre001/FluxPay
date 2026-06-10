'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { mockDB } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const PLATFORMS = ['instagram', 'youtube', 'tiktok', 'twitter', 'other'];
const POST_TYPES = ['video', 'image', 'content_writing', 'other'];

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [postType, setPostType] = useState('video');
  const [budget, setBudget] = useState('');
  const [payoutType, setPayoutType] = useState<'milestone' | 'full'>('full');
  const [deadline, setDeadline] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; description: string; amount: string }[]>([]);

  const addHashtag = () => {
    const h = hashInput.replace('#', '').trim();
    if (h && !hashtags.includes(h)) setHashtags([...hashtags, h]);
    setHashInput('');
  };

  const addMilestone = () =>
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);

  const updateMilestone = (i: number, field: string, val: string) =>
    setMilestones(milestones.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const removeMilestone = (i: number) =>
    setMilestones(milestones.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget) {
      toast.error('Fill in all required fields');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const profile = mockDB.getProfile(user?.id ?? 'anon');
    const brandName = profile.brand_name || user?.email?.split('@')[0] || 'My Brand';

    mockDB.createJob({
      title,
      description,
      target_platform: platform,
      post_type: postType,
      total_budget: Number(budget),
      payout_type: payoutType,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      organization: { brand_name: brandName },
      milestones: milestones.map((m, i) => ({
        id: `ms_new_${Date.now()}_${i}`,
        title: m.title,
        description: m.description,
        amount: Number(m.amount),
        status: 'pending' as const,
      })),
      required_elements: { hashtags, mentions: [] },
    }, user?.id ?? 'anon');

    toast.success('Deal posted!');
    router.push('/organization/jobs');
    setLoading(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in">
          <Link href="/organization/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">New Campaign</p>
          <h1 className="text-3xl font-black text-white">Post a <span className="gradient-text">Deal</span></h1>
          <p className="text-slate-400 text-sm mt-1">Create a brand deal and find the perfect creator.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="card space-y-5">
            <h2 className="font-black text-white flex items-center gap-2">
              <Briefcase size={17} className="text-brand-400" /> Deal Details
            </h2>

            <div>
              <label className="label">Job Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                     placeholder="e.g. Instagram Reel — Summer Launch" className="input" required />
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what you need the creator to do. Be specific about deliverables, tone, and any restrictions."
                        rows={5} className="input resize-none" required />
              <p className="text-xs text-slate-600 mt-1 text-right">{description.length} chars</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Platform *</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input">
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} style={{ background: '#0f172a' }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Content Type *</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)} className="input">
                  {POST_TYPES.map((t) => (
                    <option key={t} value={t} style={{ background: '#0f172a' }}>
                      {t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget & payout */}
          <div className="card space-y-5">
            <h2 className="font-black text-white">💰 Budget & Payout</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Budget (USDC) *</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                       placeholder="0" className="input" required />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Payout Type</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {(['full', 'milestone'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setPayoutType(type)}
                          className="p-3 rounded-xl text-left transition-all"
                          style={{
                            background: payoutType === type ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${payoutType === type ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          }}>
                    <p className={`font-bold text-sm ${payoutType === type ? 'text-white' : 'text-slate-400'}`}>
                      {type === 'full' ? '💵 Full Payment' : '🎯 Milestone-based'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {type === 'full' ? 'Pay on completion' : 'Pay per deliverable'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Milestones (optional) */}
          {payoutType === 'milestone' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-white">🎯 Milestones</h2>
                <button type="button" onClick={addMilestone} className="btn-secondary text-sm py-1.5 px-3">
                  <Plus size={14} /> Add
                </button>
              </div>
              {milestones.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Add milestones to break payment into stages.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-400">Milestone {i + 1}</span>
                        <button type="button" onClick={() => removeMilestone(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <input value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                             placeholder="Milestone title" className="input text-sm" />
                      <input value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                             placeholder="What should the creator deliver?" className="input text-sm" />
                      <div>
                        <label className="label text-xs">Payout for this milestone (USDC)</label>
                        <input type="number" value={m.amount} onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                               placeholder="0" className="input text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Required elements */}
          <div className="card space-y-4">
            <h2 className="font-black text-white"># Required Hashtags</h2>
            <div className="flex gap-2">
              <input value={hashInput} onChange={(e) => setHashInput(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); }}}
                     placeholder="Type a hashtag and press Enter" className="input flex-1" />
              <button type="button" onClick={addHashtag} className="btn-secondary px-4">Add</button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <span key={h} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                    #{h}
                    <button type="button" onClick={() => setHashtags(hashtags.filter((x) => x !== h))} className="ml-1 hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link href="/organization/dashboard" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 btn-shimmer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {loading ? 'Posting...' : 'Post Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
