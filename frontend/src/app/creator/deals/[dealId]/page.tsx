'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Bot, Upload,
  ExternalLink, Loader2, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI, milestoneAPI } from '@/lib/api-client';

const MILESTONE_STATUS: Record<string, { label: string; badge: string; icon: any }> = {
  pending:   { label: 'Pending',   badge: 'badge-slate',  icon: Clock },
  submitted: { label: 'Submitted', badge: 'badge-yellow', icon: Loader2 },
  approved:  { label: 'Approved',  badge: 'badge-green',  icon: CheckCircle },
  disputed:  { label: 'Disputed',  badge: 'badge-red',    icon: AlertCircle },
  released:  { label: 'Released',  badge: 'badge-purple', icon: CheckCircle },
};

function MilestoneCard({ milestone, jobId, onRefresh }: any) {
  const [open, setOpen] = useState(milestone.status === 'pending' || milestone.status === 'submitted');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const s = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.pending;
  const Icon = s.icon;

  const handleSubmit = async () => {
    if (!url) { toast.error('Enter a deliverable URL'); return; }
    setSubmitting(true);
    try {
      await milestoneAPI.submit(milestone.id, { deliverable_url: url, deliverable_note: note });
      toast.success('Deliverable submitted! AI is reviewing...');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleDispute = async () => {
    if (!disputeReason) { toast.error('Enter a reason'); return; }
    setDisputing(true);
    try {
      await milestoneAPI.dispute(milestone.id, { reason: disputeReason });
      toast.success('Dispute raised. Admin will review.');
      onRefresh();
    } catch { toast.error('Failed to raise dispute'); }
    finally { setDisputing(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.6)' }}>
      {/* Header */}
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${milestone.status === 'approved' ? 'bg-emerald-500/20' : 'bg-brand-600/20'}`}>
            <Icon size={16} className={milestone.status === 'approved' ? 'text-emerald-400' : milestone.status === 'submitted' ? 'text-yellow-400 animate-spin' : 'text-brand-400'} />
          </div>
          <div>
            <p className="font-bold text-white">{milestone.title}</p>
            <p className="text-xs text-slate-500">
              ${milestone.amount} USDC
              {milestone.deadline && ` · Due ${new Date(milestone.deadline).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${s.badge}`}>{s.label}</span>
          {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5">
          <p className="text-sm text-slate-400 pt-4">{milestone.description}</p>

          {/* AI Verdict */}
          {milestone.ai_verdict && (
            <div className={`rounded-xl p-4 flex gap-3 ${milestone.ai_verdict === 'pass' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <Bot size={18} className={milestone.ai_verdict === 'pass' ? 'text-emerald-400 flex-shrink-0 mt-0.5' : 'text-red-400 flex-shrink-0 mt-0.5'} />
              <div>
                <p className={`text-sm font-bold ${milestone.ai_verdict === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                  AI Verdict: {milestone.ai_verdict === 'pass' ? '✓ Approved' : '✗ Rejected'}
                  {milestone.ai_confidence != null && ` (${Math.round(milestone.ai_confidence * 100)}% confidence)`}
                </p>
                {milestone.ai_reason && <p className="text-xs text-slate-400 mt-1">{milestone.ai_reason}</p>}
              </div>
            </div>
          )}

          {/* Previous deliverable */}
          {milestone.deliverable_url && (
            <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors">
              <ExternalLink size={14} /> View submitted deliverable
            </a>
          )}

          {/* Submit form */}
          {(milestone.status === 'pending' || (milestone.status === 'submitted' && milestone.ai_verdict === 'fail' && milestone.resubmission_count < 1)) && (
            <div className="space-y-3">
              <label className="label">
                {milestone.resubmission_count > 0 ? 'Resubmit Deliverable URL' : 'Submit Deliverable URL'}
              </label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                     placeholder="https://instagram.com/p/..." className="input" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note to reviewer..." rows={2} className="input resize-none" />
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-shimmer text-sm py-2.5">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {submitting ? 'Submitting...' : 'Submit for AI Review'}
              </button>
              {milestone.resubmission_count >= 1 && milestone.ai_verdict === 'fail' && (
                <p className="text-xs text-slate-500">⚠ Max resubmissions used. Dispute will be raised if rejected again.</p>
              )}
            </div>
          )}

          {/* Dispute */}
          {milestone.status === 'disputed' && !milestone.ai_verdict && (
            <div className="space-y-3">
              <label className="label">Dispute Reason</label>
              <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Explain why this should be reconsidered..." rows={3} className="input resize-none" />
              <button onClick={handleDispute} disabled={disputing} className="btn-danger text-sm py-2">
                {disputing ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                Raise Dispute
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorDealPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [deal, setDeal] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([jobAPI.detail(dealId), milestoneAPI.list(dealId)])
      .then(([dRes, mRes]) => {
        setDeal(dRes.data);
        setMilestones(mRes.data ?? []);
      })
      .catch(() => toast.error('Failed to load deal'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [dealId]);

  const approved = milestones.filter((m) => m.status === 'approved' || m.status === 'released').length;
  const progress = milestones.length > 0 ? (approved / milestones.length) * 100 : 0;
  const earned = milestones
    .filter((m) => m.status === 'released')
    .reduce((s: number, m: any) => s + m.amount, 0);

  if (loading) {
    return (
      <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
        <p className="text-slate-400">Deal not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-6" style={{ background: '#0a0a0f' }}>
      {/* Back */}
      <Link href="/creator/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      {/* Deal header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-slate capitalize">{deal.target_platform}</span>
              <span className="badge badge-slate capitalize">{deal.post_type?.replace('_',' ')}</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{deal.title}</h1>
            <p className="text-slate-400 text-sm">{deal.organization?.brand_name ?? 'Brand'}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-emerald-400">${deal.total_budget}</p>
            <p className="text-xs text-slate-500 mt-1">Total budget · USDC</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm mt-4 leading-relaxed">{deal.description}</p>

        {/* Required elements */}
        {(deal.required_elements?.hashtags?.length > 0 || deal.required_elements?.mentions?.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {deal.required_elements.hashtags?.map((h: string) => (
              <span key={h} className="badge badge-purple">#{h}</span>
            ))}
            {deal.required_elements.mentions?.map((m: string) => (
              <span key={m} className="badge badge-cyan">@{m}</span>
            ))}
            {deal.required_elements.link_in_bio && <span className="badge badge-yellow">Link in Bio</span>}
            {deal.required_elements.brand_tag && <span className="badge badge-yellow">Brand Tag</span>}
          </div>
        )}

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-400">Deal Progress</p>
            <p className="text-xs font-bold text-brand-400">{approved}/{milestones.length} milestones</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Earned */}
        {earned > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl"
               style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
            <Zap size={14} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">${earned} USDC released to you</span>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div>
        <h2 className="text-lg font-black text-white mb-4">Milestones</h2>
        {milestones.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-slate-500">No milestones defined yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} jobId={dealId} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
