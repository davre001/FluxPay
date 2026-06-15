'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, CheckCircle, AlertCircle, Upload,
  ExternalLink, ChevronDown, ChevronUp, Loader2, X, FileText, Globe, Star, Zap, Trash2,
  Instagram, Youtube, Music2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { jobAPI, milestoneAPI, profileAPI } from '@/lib/api-client';
import { validateDeliverableUrl, placeholderForPlatform } from '@/lib/deliverable';
import { useDeal } from '@/hooks/useDeals';
import { useUserStore } from '@/stores/userStore';
import { adjustDemoBalance } from '@/stores/demoBalance';

const XLogo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: XLogo, youtube: Youtube, tiktok: Music2,
};

const MILESTONE_STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:   { label: 'Pending',   color: '#9ca3af', bg: '#161616', border: '#252525', icon: Clock },
  submitted: { label: 'In Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: Loader2 },
  approved:  { label: 'Approved',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', icon: CheckCircle },
  disputed:  { label: 'Disputed',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: AlertCircle },
};

const MOCK_DEALS: Record<string, any> = {
  'job-5': {
    id: 'job-5',
    title: 'Ongoing Brand Ambassador - Q3',
    organization: { 
      brand_name: 'Adidas',
      bio: 'Adidas is a global leader in the sporting goods industry, offering a broad portfolio of footwear, apparel, and hardware. We collaborate with top fitness creators worldwide.',
      website: 'https://adidas.com',
      logo_url: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128'
    },
    description: 'Monthly Instagram posts wearing our new summer collection. You will receive 3 boxes of our latest gear, and you need to post one feed post and two stories per month.',
    target_platform: 'instagram',
    post_type: 'image',
    payout_type: 'milestone',
    total_budget: 5000,
    status: 'in_progress',
    milestones: [
      { id: 'm1', title: 'Month 1 Content', description: 'Post 1 feed image and 2 stories for July.', amount: 1500, status: 'approved', due_date: new Date(Date.now() - 1000000000).toISOString() },
      { id: 'm2', title: 'Month 2 Content', description: 'Post 1 feed image and 2 stories for August.', amount: 1500, status: 'submitted', due_date: new Date(Date.now() + 500000000).toISOString(), deliverable_url: 'https://instagram.com/p/123456' },
      { id: 'm3', title: 'Month 3 Content', description: 'Post 1 feed image and 2 stories for September.', amount: 2000, status: 'pending', due_date: new Date(Date.now() + 2500000000).toISOString() },
    ],
    deadline: new Date(Date.now() + 2500000000).toISOString(),
  },
  'job-3': {
    id: 'job-3',
    title: 'Twitter Thread on Web3 Payments',
    organization: { 
      brand_name: 'Flux Protocol',
      bio: 'Flux Protocol is a decentralized escrow and payment infrastructure tailored for the creator economy.',
      website: 'https://fluxpay.xyz',
      logo_url: 'https://www.google.com/s2/favicons?domain=fluxpay.xyz&sz=128'
    },
    description: 'Write an engaging 10-tweet thread explaining the benefits of crypto escrow for freelancers.',
    target_platform: 'twitter',
    post_type: 'content_writing',
    payout_type: 'full',
    total_budget: 500,
    status: 'open',
    milestones: [
      { id: 'm4', title: 'Publish X Thread', description: 'Post the thread and submit the link for review.', amount: 500, status: 'pending', due_date: new Date(Date.now() + 500000000).toISOString() }
    ],
    deadline: new Date(Date.now() + 500000000).toISOString(),
  }
};

function MilestoneCard({ milestone, platform, onRefresh }: { milestone: any; platform?: string; onRefresh: () => void; }) {
  const [open, setOpen] = useState(milestone.status === 'pending' || milestone.status === 'disputed' || milestone.status === 'submitted');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const s = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.pending;
  const Icon = s.icon;

  // Re-run AI verification on this stage. Optionally override the link; blank
  // re-uses whatever link was submitted at the deal level.
  const handleRecheck = async () => {
    const override = url.trim();
    if (override) {
      const urlError = validateDeliverableUrl(override, platform);
      if (urlError) { toast.error(urlError); return; }
    }
    setSubmitting(true);
    try {
      const { data }: any = await milestoneAPI.recheck(milestone.id, override ? { deliverable_url: override } : {});
      if (data?.settled) adjustDemoBalance(Number(data.scored_amount ?? milestone.amount)); // creator paid → ticks up
      toast.success(data?.settled ? 'Detected — milestone approved & released!' : 'Re-checked — not detected yet.');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || 'Re-check failed');
    }
    setSubmitting(false);
  };

  return (
    <motion.div 
      layout
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' } }
      }}
      className="rounded-xl overflow-hidden transition-all duration-200" 
      style={{ background: '#111111', border: '1px solid #1a1a1a' }}
    >
      <button className="w-full flex items-center justify-between p-5 text-left hover:bg-[#161616] transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
            <Icon size={16} style={{ color: s.color }} className={milestone.status === 'submitted' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">{milestone.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-[#22c55e] text-xs">${milestone.amount}</span>
              <span className="text-xs text-[#4b5563]">USDC</span>
              {milestone.due_date && <span className="text-xs text-[#6b7280]">· Due {new Date(milestone.due_date).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
            {s.label}
          </span>
          {open ? <ChevronUp size={16} className="text-[#6b7280]" /> : <ChevronDown size={16} className="text-[#6b7280]" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: '#1a1a1a' }}>
          <div className="pt-4">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Task Description</p>
            <p className="text-sm text-[#d1d5db] leading-relaxed">{milestone.description}</p>
          </div>

          {milestone.deliverable_url && (
            <div className="p-4 rounded-lg space-y-2" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1">Your Submission</p>
              <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 text-sm text-white hover:text-[#d1d5db] transition-colors break-all">
                <ExternalLink size={14} className="text-[#9ca3af]" /> {milestone.deliverable_url}
              </a>
              {milestone.deliverable_note && (
                <p className="text-xs text-[#9ca3af] italic mt-2">"{milestone.deliverable_note}"</p>
              )}
            </div>
          )}

          {/* Full Venice AI verdict for a submitted-but-not-yet-approved stage —
              score, reasoning, and a "what to fix" checklist so the creator sees
              exactly how the AI judged their work. */}
          {milestone.ai_verification && milestone.status !== 'approved' && (
            <div className="p-4 rounded-lg" style={{ background: '#1a1305', border: '1px solid #33250a' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#f59e0b] flex items-center gap-2">
                  <Zap size={14} fill="currentColor" /> AI Review
                </p>
                {typeof milestone.ai_verification.score === 'number' && (
                  <span className="px-2 py-1 rounded text-[11px] font-bold bg-[#111111] border border-[#33250a] text-[#e5e7eb]">
                    Score {Math.round(milestone.ai_verification.score * 100)}%
                  </span>
                )}
              </div>
              {milestone.ai_verification.reasoning && (
                <p className="text-xs text-[#d1d5db] italic leading-relaxed">"{milestone.ai_verification.reasoning}"</p>
              )}
              {Array.isArray(milestone.ai_verification.missing) && milestone.ai_verification.missing.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] mb-1.5">What to fix</p>
                  <ul className="space-y-1">
                    {milestone.ai_verification.missing.map((m: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#d1d5db]">
                        <AlertCircle size={12} className="text-[#f59e0b] mt-0.5 shrink-0" /> <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {milestone.status === 'pending' && (
            <div className="flex items-center gap-2 text-sm font-medium text-[#9ca3af] bg-[#0f0f0f] p-3 rounded-lg border border-[#1a1a1a]">
              <Clock size={14} /> Submit your deliverable link above — the AI checks this stage automatically.
            </div>
          )}

          {milestone.status === 'disputed' && (
            <div className="flex items-center gap-2 text-sm font-medium text-[#ef4444] bg-[#1a0a0a] p-3 rounded-lg border border-[#331111]">
              <AlertCircle size={14} /> Disputed{milestone.dispute_reason ? `: ${milestone.dispute_reason}` : ''}. Re-submit the deal link above to address it.
            </div>
          )}

          {milestone.status === 'submitted' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
                  Re-check link <span className="text-[#4b5563] normal-case">(optional — blank re-uses your submitted link)</span>
                </label>
                <input value={url} onChange={(e) => setUrl(e.target.value)}
                       placeholder={placeholderForPlatform(platform)}
                       className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" />
              </div>
              <button onClick={handleRecheck} disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {submitting ? 'Re-checking…' : 'Re-check with AI'}
              </button>
            </div>
          )}

          {milestone.status === 'approved' && (
            <div className="p-4 rounded-lg bg-[#051a0d] border border-[#0a331a]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#22c55e] flex items-center gap-2">
                  <CheckCircle size={14} /> AI Verified & Paid
                </p>
                {typeof milestone.ai_verification?.score === 'number' && (
                  <span className="px-2 py-1 rounded text-[11px] font-bold bg-[#0a0a0a] border border-[#0a331a] text-[#e5e7eb]">
                    Score {Math.round(milestone.ai_verification.score * 100)}%
                  </span>
                )}
              </div>
              {milestone.ai_verification?.reasoning && (
                <p className="text-xs text-[#d1d5db] italic leading-relaxed mb-2">"{milestone.ai_verification.reasoning}"</p>
              )}
              <p className="text-xs font-semibold text-[#22c55e]">Funds released to your Smart Wallet.</p>
              {milestone.settlement?.oneshot?.feeToken && (
                <p className="mt-2 pt-2 border-t border-[#0a331a] flex items-center gap-1.5 text-xs font-semibold text-[#f59e0b]">
                  <Zap size={12} fill="currentColor" /> Gas sponsored by 1Shot — paid in {milestone.settlement.oneshot.feeToken.symbol}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function CreatorDealPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { deal: fetchedDeal, isLoading: loading } = useDeal(dealId);
  // Real deal from the API (or the shared mock fallback); fall back to this
  // page's richer demo deals for the logged-out walkthrough.
  const deal = fetchedDeal ?? MOCK_DEALS[dealId] ?? null;
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [dealUrl, setDealUrl] = useState('');
  const [dealNote, setDealNote] = useState('');
  const [dealSubmitting, setDealSubmitting] = useState(false);

  // Real brand reputation (0–100) — from the brand's public profile.
  const [brandRep, setBrandRep] = useState<number | null>(null);
  const orgId = deal?.organization_id;
  useEffect(() => {
    if (!orgId) { setBrandRep(null); return; }
    profileAPI.getPublic(orgId)
      .then(({ data }: any) => setBrandRep(typeof data?.reputation?.score === 'number' ? data.reputation.score : null))
      .catch(() => setBrandRep(null));
  }, [orgId]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['deal', dealId] });

  // One link for the whole deal — the AI checks every open milestone against it.
  const handleDealSubmit = async () => {
    const urlError = validateDeliverableUrl(dealUrl, deal?.target_platform);
    if (urlError) { toast.error(urlError); return; }
    setDealSubmitting(true);
    try {
      const { data }: any = await jobAPI.submitDeliverable(dealId as string, { deliverable_url: dealUrl, deliverable_note: dealNote || undefined });
      const settledResults = Array.isArray(data?.results) ? data.results.filter((r: any) => r?.settled) : [];
      const releasedCount = settledResults.length;
      // Creator paid → balance ticks up by the total released across stages.
      const totalReleased = settledResults.reduce((s: number, r: any) => s + Number(r.scored_amount ?? 0), 0);
      if (totalReleased > 0) adjustDemoBalance(totalReleased);
      toast.success(releasedCount > 0
        ? `Submitted — AI approved & released ${releasedCount} milestone${releasedCount > 1 ? 's' : ''}!`
        : 'Submitted — AI is reviewing each milestone.');
      setDealUrl(''); setDealNote('');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Submission failed');
    }
    setDealSubmitting(false);
  };

  const handleWithdraw = async () => {
    try {
      await jobAPI.cancel(dealId as string);
      toast.success("Withdrawn successfully.");
      setShowWithdrawModal(false);
      router.push('/creator/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to withdraw. Redirecting...');
      setShowWithdrawModal(false);
      router.push('/creator/dashboard');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <Loader2 size={32} className="animate-spin text-[#4b5563]" />
    </div>
  );

  if (!deal) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <X size={32} className="text-[#4b5563] mx-auto mb-3" />
        <p className="text-[#9ca3af] font-semibold text-sm">Deal not found.</p>
        <Link href="/creator/dashboard" className="mt-4 inline-flex px-4 py-2 text-xs font-semibold bg-white text-black rounded-lg">← Back to Dashboard</Link>
      </div>
    </div>
  );

  // Show THIS creator's own milestone instances (multi-hire). Falls back to the
  // deal's template definition for mock deals or before the creator is approved.
  const myId = useUserStore((s) => s.user?.id);
  const myInstances = (deal.creator_milestones ?? []).filter((m: any) => m.creator_id === myId);
  const milestones = myInstances.length > 0 ? myInstances : (deal.milestones ?? []);
  const approved = milestones.filter((m: any) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? (approved / milestones.length) * 100 : 0;
  const earned = milestones.filter((m: any) => m.status === 'approved').reduce((s: number, m: any) => s + m.amount, 0);

  const PlatformIcon = PLATFORM_ICON[deal.target_platform] || Zap;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/creator/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#111111] transition-colors text-[#6b7280] hover:text-white border border-transparent hover:border-[#1a1a1a]">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Deal Workspace</p>
              <h1 className="text-base font-bold text-white leading-none mt-0.5 truncate max-w-[250px] sm:max-w-md">{deal.title}</h1>
            </div>
          </div>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef444415] hover:border-[#ef444450] transition-colors"
          >
            <Trash2 size={14} /> Withdraw
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Milestones & Tasks</h2>
            <div className="text-right">
              <span className="text-xs font-semibold text-[#6b7280]">Total Payout: </span>
              <span className="text-sm font-black text-[#22c55e]">${deal.total_budget} USDC</span>
            </div>
          </div>

          {milestones.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#161616' }}>
                    <CheckCircle size={12} className="text-[#22c55e]" />
                  </div>
                  <p className="text-xs font-bold text-white">Deal Progress</p>
                </div>
                <p className="text-xs font-bold text-[#9ca3af]">{approved} of {milestones.length} tasks approved</p>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#161616' }}>
                <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {earned > 0 && (
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <p className="text-xs font-semibold text-[#6b7280]">Funds released</p>
                  <p className="text-sm font-bold text-white">${earned} USDC</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <h2 className="text-sm font-bold text-white mb-2">Milestones</h2>
            <p className="text-xs text-[#6b7280] leading-relaxed">Submit one deliverable link and the AI checks it against every milestone automatically — each met stage is released on its own.</p>
          </div>

          {/* Deal-level single-link submission */}
          {milestones.some((m: any) => m.status === 'pending' || m.status === 'disputed') && (
            <div className="rounded-xl p-5 mb-6 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Deliverable Link</label>
                <input value={dealUrl} onChange={(e) => setDealUrl(e.target.value)}
                       placeholder={placeholderForPlatform(deal.target_platform)}
                       className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Note to Brand (Optional)</label>
                <textarea value={dealNote} onChange={(e) => setDealNote(e.target.value)}
                          placeholder="Optional note to the brand / AI…" rows={2}
                          className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 resize-none" />
              </div>
              <button onClick={handleDealSubmit} disabled={dealSubmitting || !dealUrl.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {dealSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {dealSubmitting ? 'Submitting & verifying…' : 'Submit & Auto-Check Milestones'}
              </button>
            </div>
          )}

          {milestones.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: '#111111', border: '1px dashed #222222' }}>
              <FileText size={24} className="text-[#4b5563] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#9ca3af]">No milestones defined</p>
            </div>
          ) : (
            <motion.div 
              initial="hidden" animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="space-y-4"
            >
              {milestones.map((m: any) => (
                <MilestoneCard key={m.id} milestone={m} platform={deal.target_platform} onRefresh={refresh} />
              ))}
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl p-6 space-y-5" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <h3 className="text-sm font-bold text-white mb-4">Deal Overview</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Status</p>
                <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#22c55e]" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {deal.status.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Platform</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <PlatformIcon size={14} className="text-[#9ca3af]" />
                  <span className="capitalize">{deal.target_platform}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Content Type</p>
                <p className="text-sm font-semibold text-white capitalize">{deal.post_type?.replace('_', ' ')}</p>
              </div>

              {deal.deadline && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Final Deadline</p>
                  <p className="text-sm font-semibold text-white">{new Date(deal.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-2">Scope of Work</p>
              <p className="text-xs text-[#d1d5db] leading-relaxed">{deal.description}</p>
            </div>
          </div>

          {deal.organization && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <h3 className="text-sm font-bold text-white">About the Brand</h3>
              
              <div className="flex items-center gap-3 mb-2">
                {deal.organization.logo_url ? (
                  <img src={deal.organization.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-1" style={{ border: '1px solid #252525' }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                    {deal.organization.brand_name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-sm">{deal.organization.brand_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-[10px] font-bold text-[#d1d5db]">{brandRep ?? 0} / 100</span>
                    <span className="text-[10px] text-[#6b7280] ml-1">On-Chain Rating</span>
                  </div>
                </div>
              </div>

              {deal.organization.bio && (
                <p className="text-xs text-[#9ca3af] leading-relaxed">{deal.organization.bio}</p>
              )}

              {deal.organization.website && (
                <a href={deal.organization.website} target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22c55e] hover:text-[#4ade80] transition-colors mt-2">
                  <Globe size={12} /> Visit Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}
            >
              <h3 className="text-lg font-bold text-white mb-2">Withdraw Deal</h3>
              <p className="text-sm text-[#9ca3af] mb-6 leading-relaxed">
                Are you sure you want to withdraw from this active deal? This will cancel the escrow and terminate the contract.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: '#1a1a1a', border: '1px solid #252525' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
