'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, CheckCircle, AlertCircle, Trash2,
  Loader2, ChevronDown, ChevronUp, X, ShieldCheck, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { jobAPI, milestoneAPI, permissionAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { useGrantMilestonePermission } from '@/hooks/useGrantMilestonePermission';
import { useDeal, useJobApplications } from '@/hooks/useDeals';
import { adjustDemoBalance } from '@/stores/demoBalance';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const MOCK_JOBS = [
  { id: 'mock_1', title: 'Summer TikTok Campaign', status: 'open', target_platform: 'tiktok', post_type: 'video', total_budget: 1500, application_count: 5, description: 'We are looking for a creator to make a 30-second TikTok showing off our new summer collection at the beach.' },
  { id: 'mock_2', title: 'Tech Gadget Review', status: 'in_progress', target_platform: 'youtube', post_type: 'video', total_budget: 3000, application_count: 12, description: 'Deep dive tech review video featuring our new wireless headphones. Must cover battery life and sound quality.', milestones: [{ id: 'm1', title: 'Script Approval', amount: 500, status: 'approved', ai_verification: { score: 0.95, reasoning: "Video prominently features the wireless headphones. Battery life mentioned at 2:15, sound quality review at 4:30. Highly positive sentiment and all required tags present." } }, { id: 'm2', title: 'Final Video', amount: 2500, status: 'submitted' }] },
  { id: 'mock_3', title: 'Instagram Reel Unboxing', status: 'open', target_platform: 'instagram', post_type: 'video', total_budget: 800, application_count: 2, description: 'A quick and energetic unboxing of our monthly subscription box.' },
  { id: 'mock_4', title: 'Sponsored Blog Feature', status: 'in_progress', target_platform: 'other', post_type: 'content_writing', total_budget: 500, application_count: 1, description: 'Write a dedicated SEO-friendly blog post reviewing our software tool.' },
  { id: 'mock_5', title: 'Spring Promo Twitter Thread', status: 'completed', target_platform: 'twitter', post_type: 'content_writing', total_budget: 300, application_count: 8, description: 'A 5-part twitter thread explaining the benefits of our spring promo.' },
  { id: 'mock_6', title: 'Holiday Special Post', status: 'cancelled', target_platform: 'instagram', post_type: 'image', total_budget: 1000, application_count: 0, description: 'Static feed post featuring our holiday discount code.' }
];

function MilestoneRow({ milestone, onAction }: { milestone: any; onAction: () => void; }) {
  const [open, setOpen] = useState(milestone.status === 'submitted');
  const [acting, setActing] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');

  const approve = async () => {
    setActing('approve');
    if (milestone.id.startsWith('m')) {
      setTimeout(() => { toast.success('Mock milestone approved!'); setActing(null); onAction(); }, 800);
      return;
    }
    try {
      const { data } = await milestoneAPI.approve(milestone.id);
      const released = (data as any)?.scored_amount;
      const payout = (data as any)?.payout;
      const paid = payout?.ok;
      if (paid && released != null) {
        toast.success(`Approved — $${Number(released).toFixed(2)} USDC released.`);
        adjustDemoBalance(useUserStore.getState().user?.id, -Number(released)); // brand pays → ticks down
        if (payout?.oneshot?.feeToken) toast.success(`⚡ Gas sponsored by 1Shot — paid in ${payout.oneshot.feeToken.symbol}`);
      }
      else if (paid === false) toast.success('Approved, but payout pending. Check the deal permission.');
      else toast.success('Milestone approved! Funds released.');
      onAction();
    } catch (e: any) { toast.error(e?.message || 'Failed to approve'); }
    setActing(null);
  };

  const dispute = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setActing('dispute');
    setDisputeOpen(false);
    if (milestone.id.startsWith('m')) {
      setTimeout(() => { toast.success('Mock dispute raised.'); setActing(null); setReason(''); onAction(); }, 800);
      return;
    }
    try {
      await milestoneAPI.dispute(milestone.id, { reason: trimmed });
      toast.success('Dispute raised. Admin will review.');
      setReason('');
      onAction();
    } catch (e: any) { toast.error(e?.message || 'Failed to dispute'); }
    setActing(null);
  };

  const payoutAmount = milestone.ai_verification?.score
    ? (Number(milestone.amount) * Number(milestone.ai_verification.score)).toFixed(2)
    : milestone.amount;


  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1a1a1a', background: '#0a0a0a' }}>
      <button className="w-full flex items-center justify-between p-5 text-left hover:bg-[#111111] transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
            milestone.status === 'approved' ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]' :
            milestone.status === 'submitted' ? 'text-[#eab308] bg-[rgba(234,179,8,0.1)] border border-[rgba(234,179,8,0.2)]' :
            milestone.status === 'disputed' ? 'text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]' :
            'text-[#6b7280] bg-[#1a1a1a] border border-[#252525]'
          }`}>
            {milestone.status}
          </span>
          <div>
            <p className="font-bold text-white text-sm">{milestone.title}</p>
            <p className="text-xs font-semibold text-[#6b7280] mt-0.5">${milestone.amount} USDC</p>
          </div>
        </div>
        {open ? <ChevronUp size={15} className="text-[#6b7280]" /> : <ChevronDown size={15} className="text-[#6b7280]" />}
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-2 border-t border-[#1a1a1a] space-y-4">
              <p className="text-sm text-[#d1d5db] font-medium leading-relaxed">{milestone.description || 'No description provided.'}</p>

              {milestone.deliverable_url && (
                <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-bold text-[#3b82f6] hover:text-[#60a5fa] underline transition-colors">
                  View deliverable →
                </a>
              )}

              {milestone.status === 'submitted' && (
                <div className="flex flex-col gap-3 pt-2">
                  {milestone.ai_verification ? (
                    // AI has reviewed but did not auto-release — show the analysis
                    // of what the creator submitted vs the brief.
                    <div className="rounded-xl p-5 border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.05)]">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-[#60a5fa] flex items-center gap-2">
                          <Zap size={16} fill="currentColor" /> AI Submission Analysis
                        </h4>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-[#111111] border border-[#222222] text-[#e5e7eb]">
                          Score: {Math.round(milestone.ai_verification.score * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-[#d1d5db] leading-relaxed italic">
                        "{milestone.ai_verification.reasoning}"
                      </p>
                      {Array.isArray(milestone.ai_verification.missing) && milestone.ai_verification.missing.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#eab308] mb-2">Missing requirements</p>
                          <ul className="space-y-1.5">
                            {milestone.ai_verification.missing.map((m: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                                <AlertCircle size={14} className="text-[#eab308] mt-0.5 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 bg-[#111111] border border-[#222222] flex items-center gap-3">
                      <Loader2 size={18} className="animate-spin text-[#3b82f6]" />
                      <p className="text-sm font-semibold text-[#d1d5db]">AI Verification in progress. Payout will be released autonomously once complete.</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button onClick={approve} disabled={!!acting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#22c55e] text-black hover:bg-[#16a34a] transition-colors">
                      {acting === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Approve & Release
                    </button>
                    <button onClick={() => setDisputeOpen(true)} disabled={!!acting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#ef4444] hover:border-[#ef4444] transition-colors border border-[#333333]">
                      {acting === 'dispute' ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                      Halt & Dispute
                    </button>
                  </div>
                </div>
              )}

              {milestone.status === 'approved' && milestone.ai_verification && (
                <div className="mt-4 rounded-xl p-5 border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[#22c55e] flex items-center gap-2">
                      <Zap size={16} fill="currentColor" /> AI Verified & Settled
                    </h4>
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[#111111] border border-[#222222] text-[#e5e7eb]">
                      Score: {Math.round(milestone.ai_verification.score * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-[#d1d5db] leading-relaxed mb-4 italic">
                    "{milestone.ai_verification.reasoning}"
                  </p>
                  {Array.isArray(milestone.ai_verification.missing) && milestone.ai_verification.missing.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#eab308] mb-2">Noted gaps</p>
                      <ul className="space-y-1.5">
                        {milestone.ai_verification.missing.map((m: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                            <AlertCircle size={14} className="text-[#eab308] mt-0.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-[#6b7280]">Released Amount:</span>
                    <span className="font-black text-white">${payoutAmount} USDC</span>
                  </div>
                  {milestone.settlement?.oneshot?.feeToken && (
                    <div className="mt-3 pt-3 border-t border-[rgba(34,197,94,0.15)] flex items-center gap-2 text-xs font-semibold text-[#f59e0b]">
                      <Zap size={13} fill="currentColor" />
                      Gas sponsored by 1Shot — paid in {milestone.settlement.oneshot.feeToken.symbol}
                      {milestone.settlement.simulated && <span className="text-[#6b7280] font-medium">(mainnet rail, simulated on testnet)</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {disputeOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!acting) setDisputeOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 border border-[#222222]"
              style={{ background: '#0a0a0a' }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-[#ef4444]" /> Halt & Dispute
                </h3>
                <button onClick={() => setDisputeOpen(false)} className="text-[#6b7280] hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-[#6b7280] mb-4">Pause the autonomous payout and tell us what's wrong with <span className="font-semibold text-[#d1d5db]">{milestone.title}</span>.</p>
              <textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue with this deliverable…"
                rows={4}
                className="w-full rounded-xl bg-[#111111] border border-[#252525] px-4 py-3 text-sm text-white placeholder:text-[#4b5563] resize-none focus:outline-none focus:border-[#ef4444] transition-colors"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setDisputeOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#d1d5db] hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={dispute}
                  disabled={!reason.trim() || !!acting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {acting === 'dispute' ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                  Raise Dispute
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrgJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isMock = jobId.startsWith('mock_');

  const { deal: fetchedJob } = useDeal(isMock ? undefined : jobId);
  const { applications: fetchedApps } = useJobApplications(isMock ? undefined : jobId);
  const job = isMock ? (MOCK_JOBS.find(j => j.id === jobId) ?? null) : fetchedJob;
  // Applicants are always real — mock jobs simply have none until creators apply.
  const applications = fetchedApps;

  const [tab, setTab] = useState<'applicants' | 'milestones'>('applicants');
  const [selecting, setSelecting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { grant } = useGrantMilestonePermission();
  const user = useUserStore((s) => s.user);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['deal', jobId] });
    qc.invalidateQueries({ queryKey: ['job-applications', jobId] });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete/withdraw this deal?')) return;
    setDeleting(true);
    
    if (jobId.startsWith('mock_')) {
      setTimeout(() => {
        toast.success('Deal deleted successfully.');
        router.push('/organization/jobs');
      }, 1000);
      return;
    }
    
    try {
      await jobAPI.cancel(jobId);
      toast.success('Deal cancelled successfully.');
      router.push('/organization/jobs');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to cancel deal');
      setDeleting(false);
    }
  };

  const handleSelect = async (creatorId: string) => {
    setSelecting(creatorId);
    
    if (jobId.startsWith('mock_')) {
      setTimeout(() => {
        toast.success('Creator selected! Deal has started.');
        setSelecting(null);
        setTab('milestones');
      }, 1000);
      return;
    }

    try {
      const isFirstApproval = (job?.approved_creator_ids?.length ?? 0) === 0;
      await jobAPI.selectCreator(jobId, creatorId);
      toast.success('Creator approved!');

      // The brand's ERC-7715 permission funds the whole pool (per-creator cut ×
      // slots) and is granted once, on the first approval. Later approvals reuse it.
      if (isFirstApproval) {
        try {
          // total_budget IS the pool — grant the permission for the whole pool.
          const poolUsdc = Number(job?.total_budget ?? 0);
          const isDemoPersona = user?.id === 'demo-brand' || user?.id === 'demo-creator';
          if (poolUsdc > 0 && isDemoPersona) {
            // Demo personas have no signable wallet — store a placeholder
            // permission so the simulated 1Shot settlement resolves. No funds.
            await permissionAPI.store({
              jobId, organizationId: job?.organization_id, creatorId,
              token_address: '0x0000000000000000000000000000000000000000',
              chain_id: 84532, amount: poolUsdc,
              permissions_context: '0xDEMO',
              delegation_manager: '0x000000000000000000000000000000000000C0DE',
            });
            toast.success(`Auto-release armed for $${poolUsdc} USDC ⚡`);
          } else if (poolUsdc > 0) {
            await grant({ jobId, organizationId: job?.organization_id, creatorId, budgetUsdc: poolUsdc });
            toast.success(`Approved auto-release of up to $${poolUsdc} USDC 🔐`);
          }
        } catch (permErr: any) {
          toast.error(permErr?.message || 'Permission not granted — you can retry from the deal page');
        }
      }

      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve creator');
    }
    setSelecting(null);
  };

  const slots = Number(job?.creator_slots ?? 1);
  const approvedIds: string[] = job?.approved_creator_ids ?? [];
  const slotsRemaining = slots - approvedIds.length;
  // total_budget IS the pool; each hired creator earns pool / slots.
  const pool = Number(job?.total_budget ?? 0);
  const perCreator = pool / slots;
  const creatorMilestones: any[] = job?.creator_milestones ?? [];
  // creator_id → display name, from the applicant list.
  const nameFor = (cid: string) =>
    applications.find((a: any) => a.creator_id === cid)?.creator_name || cid;

  const milestones = job?.milestones ?? [];
  // Progress tracks the actual per-creator instances once anyone is approved
  // (templates never get worked); falls back to the template count beforehand.
  const progressMs = creatorMilestones.length > 0 ? creatorMilestones : milestones;
  const approved = progressMs.filter((m: any) => m.status === 'approved').length;
  const progress = progressMs.length > 0 ? (approved / progressMs.length) * 100 : 0;

  if (!job) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="text-center">
        <Loader2 size={32} className="text-[#333333] mx-auto mb-3 animate-spin" />
        <p className="text-[#6b7280] font-bold text-sm">Loading deal details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/organization/jobs" className="inline-flex items-center gap-2 text-[#6b7280] hover:text-white text-sm mb-4 transition-colors font-semibold">
              <ArrowLeft size={15} /> Back to jobs
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                {job.target_platform}
              </span>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                job.status === 'open' ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]' :
                job.status === 'in_progress' ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]' :
                'text-[#6b7280] bg-[#1a1a1a] border border-[#252525]'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mt-1 tracking-tight">{job.title}</h1>
            <p className="text-[#6b7280] text-sm font-semibold mt-1">Manage deliverables and applicants.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#1a1a1a] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors border border-[#333333]"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'Deleting...' : 'Delete Deal'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Deal Info Card */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <p className="text-[#d1d5db] text-sm font-medium leading-relaxed">{job.description}</p>
              
              {(job.required_elements?.hashtags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {job.required_elements.hashtags.map((h: string) => (
                    <span key={h} className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#e5e7eb]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                      #{h}
                    </span>
                  ))}
                </div>
              )}

              {job.deadline && (
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280]">Deadline</p>
                  <p className="text-xs font-bold text-white">{new Date(job.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start md:items-end flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] mb-1">Total Escrowed</p>
              <p className="text-4xl font-black text-[#22c55e] tracking-tight">${pool} <span className="text-base font-bold text-[#4b5563]">USDC</span></p>
              {slots > 1 && (
                <p className="text-xs font-semibold text-[#6b7280] mt-1">
                  ${perCreator.toLocaleString(undefined, { maximumFractionDigits: 2 })}/creator · {approvedIds.length} of {slots} slots filled
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          {job.status === 'in_progress' && milestones.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280]">Deal Progress</p>
                <p className="text-xs font-bold text-[#3b82f6] bg-[rgba(59,130,246,0.1)] px-2 py-1 rounded border border-[rgba(59,130,246,0.2)]">
                  {approved} / {progressMs.length} Approved
                </p>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1a1a1a] overflow-hidden border border-[#252525]">
                <motion.div 
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full" 
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs & Content */}
        <div className="mb-6 flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          {[
            { key: 'applicants', label: `Applicants (${applications.length})` },
            { key: 'milestones', label: `Milestones (${milestones.length})` },
          ].map(({ key, label }) => (
            <button 
              key={key} onClick={() => setTab(key as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === key ? 'bg-[#222222] text-white shadow-sm' : 'text-[#6b7280] hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          
          {/* Applicants Tab */}
          {tab === 'applicants' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="rounded-2xl p-16 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
                  <Users size={40} className="text-[#333333] mx-auto mb-4" />
                  <p className="text-base font-bold text-white mb-1">No applications yet.</p>
                  <p className="text-sm font-semibold text-[#6b7280]">Your deal is live — creators can apply from the Browse Jobs page.</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    <div className="flex flex-col md:flex-row gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-black font-black text-xl flex-shrink-0">
                        {((app.creator_name || app.creator_id)?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-black text-white text-lg">{app.creator_name || app.creator_id}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#22c55e] uppercase tracking-widest bg-[rgba(34,197,94,0.1)] px-2 py-0.5 rounded border border-[rgba(34,197,94,0.2)]">
                                <Zap size={10} fill="currentColor" /> {app.creator_reputation ?? 0} / 100 Rep
                              </span>
                              {app.qualified !== undefined && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${app.qualified ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]'}`}>
                                  {app.qualified ? 'Qualified' : 'Not qualified'}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-[#6b7280]">Applied {new Date(app.applied_at ?? app.created_at).toLocaleDateString()}</span>
                            </div>
                            {app.qualification_reasons?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {app.qualification_reasons.map((r: string, i: number) => (
                                  <span key={i} className="text-[10px] font-semibold text-[#9ca3af] px-2 py-0.5 rounded" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>{r}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {app.status === 'accepted' && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex-shrink-0">
                              <CheckCircle size={13} /> Approved
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-[#6b7280] bg-[#1a1a1a] border border-[#252525] flex-shrink-0">
                              Not selected
                            </span>
                          )}
                          {(job.status === 'open' || job.status === 'in_progress') && app.status === 'pending' && slotsRemaining > 0 && (
                            <button
                              onClick={() => handleSelect(app.creator_id)} disabled={!!selecting}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#22c55e] text-black hover:bg-[#1ea852] transition-colors flex-shrink-0"
                            >
                              {selecting === app.creator_id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                              {slots > 1 ? `Approve (${slotsRemaining} left)` : 'Hire Creator'}
                            </button>
                          )}
                        </div>
                        {app.cover_note && (
                          <div className="mt-4 bg-[#0a0a0a] rounded-xl p-4 border border-[#1a1a1a]">
                            <p className="text-sm text-[#d1d5db] italic">"{app.cover_note}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Milestones Tab */}
          {tab === 'milestones' && (
            <div className="space-y-4">
              {milestones.length === 0 ? (
                <div className="rounded-2xl p-16 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
                  <ShieldCheck size={40} className="text-[#333333] mx-auto mb-4" />
                  <p className="text-base font-bold text-white mb-1">No milestones defined.</p>
                  <p className="text-sm font-semibold text-[#6b7280]">This deal uses a single payout on completion.</p>
                </div>
              ) : approvedIds.length === 0 ? (
                // No creators approved yet — show the deal's milestone definition.
                <>
                  <p className="text-sm font-semibold text-[#6b7280] mb-2">Milestone plan (applies to each hired creator). Approve an applicant to start tracking their progress.</p>
                  {milestones.map((m: any) => (
                    <MilestoneRow key={m.id} milestone={m} onAction={refresh} />
                  ))}
                </>
              ) : (
                // One section per approved creator with their own instances.
                approvedIds.map((cid) => {
                  const theirs = creatorMilestones.filter((m: any) => m.creator_id === cid);
                  const done = theirs.filter((m: any) => m.status === 'approved').length;
                  return (
                    <div key={cid} className="rounded-2xl p-5 space-y-3" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black font-black text-sm flex-shrink-0">
                            {(nameFor(cid)?.[0] ?? '?').toUpperCase()}
                          </div>
                          <p className="font-bold text-white text-sm">{nameFor(cid)}</p>
                        </div>
                        <span className="text-xs font-bold text-[#3b82f6] bg-[rgba(59,130,246,0.1)] px-2 py-1 rounded border border-[rgba(59,130,246,0.2)]">
                          {done} / {theirs.length} Approved
                        </span>
                      </div>
                      {theirs.map((m: any) => (
                        <MilestoneRow key={m.id} milestone={m} onAction={refresh} />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
