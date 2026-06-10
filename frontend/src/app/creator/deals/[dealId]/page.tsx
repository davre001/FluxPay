'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Upload,
  ExternalLink, Loader2, ChevronDown, ChevronUp, Zap, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB, MockJob, MockMilestone } from '@/lib/mock-data';

const MILESTONE_STATUS: Record<string, { label: string; badge: string; icon: any }> = {
  pending:   { label: 'Pending',   badge: 'badge-slate',  icon: Clock },
  submitted: { label: 'Submitted', badge: 'badge-yellow', icon: Loader2 },
  approved:  { label: 'Approved',  badge: 'badge-green',  icon: CheckCircle },
  disputed:  { label: 'Disputed',  badge: 'badge-red',    icon: AlertCircle },
};

function MilestoneCard({ milestone, jobId, onRefresh }: {
  milestone: MockMilestone;
  jobId: string;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(milestone.status === 'pending');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const s = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.pending;
  const Icon = s.icon;

  const handleSubmit = async () => {
    if (!url) { toast.error('Enter a deliverable URL'); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    mockDB.updateMilestone(jobId, milestone.id, {
      status: 'submitted',
      deliverable_url: url,
      deliverable_note: note,
    });
    toast.success('Deliverable submitted! Waiting for brand review.');
    onRefresh();
    setSubmitting(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.6)' }}>
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${milestone.status === 'approved' ? 'bg-emerald-500/20' : 'bg-brand-600/20'}`}>
            <Icon size={16} className={milestone.status === 'approved' ? 'text-emerald-400' : milestone.status === 'submitted' ? 'text-yellow-400' : 'text-brand-400'} />
          </div>
          <div>
            <p className="font-bold text-white">{milestone.title}</p>
            <p className="text-xs text-slate-500">
              ${milestone.amount} USDC
              {milestone.due_date && ` · Due ${new Date(milestone.due_date).toLocaleDateString()}`}
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

          {/* Previous deliverable */}
          {milestone.deliverable_url && (
            <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors">
              <ExternalLink size={14} /> View submitted deliverable
            </a>
          )}

          {/* Deliverable note */}
          {milestone.deliverable_note && (
            <p className="text-sm text-slate-500 italic">Note: "{milestone.deliverable_note}"</p>
          )}

          {/* Submit form — only for pending milestones */}
          {milestone.status === 'pending' && (
            <div className="space-y-3">
              <label className="label">Submit Deliverable URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                     placeholder="https://instagram.com/p/..." className="input" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="Optional note to the brand..." rows={2} className="input resize-none" />
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-shimmer text-sm py-2.5">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          )}

          {milestone.status === 'submitted' && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <Clock size={14} /> Waiting for brand to approve...
            </div>
          )}

          {milestone.status === 'approved' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle size={14} /> Approved! Payment released.
            </div>
          )}

          {milestone.status === 'disputed' && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} /> Disputed — admin review in progress.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorDealPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [deal, setDeal] = useState<MockJob | null>(null);

  const reload = () => {
    const j = mockDB.getJobById(dealId);
    setDeal(j ?? null);
  };

  useEffect(() => { reload(); }, [dealId]);

  if (!deal) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <X size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Deal not found.</p>
        <Link href="/creator/jobs" className="btn-secondary mt-4 inline-flex">← Browse Jobs</Link>
      </div>
    </div>
  );

  const milestones = deal.milestones ?? [];
  const approved = milestones.filter((m) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? (approved / milestones.length) * 100 : 0;
  const earned = milestones.filter((m) => m.status === 'approved').reduce((s, m) => s + m.amount, 0);

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-6" style={{ background: '#0a0a0f' }}>
      <Link href="/creator/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Jobs
      </Link>

      {/* Deal header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-slate capitalize">{deal.target_platform}</span>
              <span className="badge badge-slate capitalize">{deal.post_type?.replace('_', ' ')}</span>
              <span className={`badge ${deal.status === 'open' ? 'badge-green' : 'badge-cyan'}`}>{deal.status}</span>
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

        {/* Required hashtags/mentions */}
        {((deal.required_elements?.hashtags?.length ?? 0) > 0 || (deal.required_elements?.mentions?.length ?? 0) > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {deal.required_elements!.hashtags?.map((h) => (
              <span key={h} className="badge badge-purple">#{h}</span>
            ))}
            {deal.required_elements!.mentions?.map((m) => (
              <span key={m} className="badge badge-cyan">{m}</span>
            ))}
          </div>
        )}

        {/* Deadline */}
        {deal.deadline && (
          <p className="text-xs text-slate-500 mt-3">
            Deadline: <span className="text-slate-300">{new Date(deal.deadline).toLocaleDateString()}</span>
          </p>
        )}

        {/* Progress bar */}
        {milestones.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-400">Deal Progress</p>
              <p className="text-xs font-bold text-brand-400">{approved}/{milestones.length} milestones</p>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

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
            <p className="text-slate-500 text-sm">No milestones — this is a full-payment deal.</p>
            <p className="text-slate-600 text-xs mt-2">You'll get paid ${deal.total_budget} USDC on completion.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} jobId={dealId} onRefresh={reload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
