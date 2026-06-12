'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, CheckCircle, AlertCircle, Star,
  Instagram, Twitter, Youtube, Music2, Loader2, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI, milestoneAPI } from '@/lib/api-client';
import { useGrantMilestonePermission } from '@/hooks/useGrantMilestonePermission';

const MILESTONE_STATUS_STYLE: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending',   badge: 'badge-slate' },
  submitted: { label: 'Submitted', badge: 'badge-yellow' },
  approved:  { label: 'Approved',  badge: 'badge-green' },
  disputed:  { label: 'Disputed',  badge: 'badge-red' },
};

function MilestoneRow({ milestone, onAction }: {
  milestone: any;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(milestone.status === 'submitted');
  const [acting, setActing] = useState<string | null>(null);
  const s = MILESTONE_STATUS_STYLE[milestone.status] ?? MILESTONE_STATUS_STYLE.pending;

  const approve = async () => {
    setActing('approve');
    try {
      await milestoneAPI.approve(milestone.id);
      toast.success('Milestone approved! Funds released.');
      onAction();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve');
    }
    setActing(null);
  };

  const dispute = async () => {
    const reason = window.prompt('Dispute reason:');
    if (!reason) return;
    setActing('dispute');
    try {
      await milestoneAPI.dispute(milestone.id, { reason });
      toast.success('Dispute raised. Admin will review.');
      onAction();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to dispute');
    }
    setActing(null);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.6)' }}>
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <span className={`badge ${s.badge}`}>{s.label}</span>
          <div>
            <p className="font-bold text-white text-sm">{milestone.title}</p>
            <p className="text-xs text-slate-500">${milestone.amount} USDC</p>
          </div>
        </div>
        {open ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5 space-y-4 pt-4">
          <p className="text-sm text-slate-400">{milestone.description}</p>

          {milestone.deliverable_url && (
            <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer"
               className="text-sm text-accent-400 hover:text-accent-300 underline transition-colors">
              View deliverable →
            </a>
          )}

          {milestone.status === 'submitted' && (
            <div className="flex gap-3">
              <button onClick={approve} disabled={!!acting} className="btn-success text-sm py-2.5">
                {acting === 'approve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve & Release
              </button>
              <button onClick={dispute} disabled={!!acting}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                {acting === 'dispute' ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                Dispute
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [tab, setTab] = useState<'applicants' | 'milestones'>('applicants');
  const [selecting, setSelecting] = useState<string | null>(null);
  const { grant } = useGrantMilestonePermission();

  const reload = async () => {
    try {
      const [{ data: j }, { data: apps }] = await Promise.all([
        jobAPI.detail(jobId),
        jobAPI.getApplications(jobId),
      ]);
      setJob(j as any);
      setApplications(apps as any[]);
    } catch {}
  };

  useEffect(() => { reload(); }, [jobId]);

  const handleSelect = async (creatorId: string) => {
    setSelecting(creatorId);
    try {
      await jobAPI.selectCreator(jobId, creatorId);
      toast.success('Creator selected! Deal has started.');

      // Grant the ERC-7715 spending permission so the FluxPay agent can release
      // milestone USDC automatically on approval — one signature, no per-payout
      // approvals. Non-fatal: the deal is already started if this is declined.
      try {
        const budget = Number(job?.total_budget ?? 0);
        if (budget > 0) {
          await grant({
            jobId,
            organizationId: job?.organization_id,
            creatorId,
            budgetUsdc: budget,
          });
          toast.success(`Approved auto-release of up to $${budget} USDC 🔐`);
        }
      } catch (permErr: any) {
        toast.error(permErr?.message || 'Permission not granted — you can retry from the deal page');
      }

      await reload();
      setTab('milestones');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to select creator');
    }
    setSelecting(null);
  };

  const milestones = job?.milestones ?? [];
  const approved = milestones.filter((m: any) => m.status === 'approved').length;
  const progress = milestones.length > 0 ? (approved / milestones.length) * 100 : 0;

  if (!job) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="text-center">
        <X size={32} className="text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Job not found</p>
        <Link href="/organization/jobs" className="btn-secondary mt-4 inline-flex">← Back to Jobs</Link>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-6" style={{ background: '#0a0a0f' }}>
      <Link href="/organization/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Back to Jobs
      </Link>

      {/* Job header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="badge badge-slate capitalize">{job.target_platform}</span>
              <span className="badge badge-slate capitalize">{job.post_type?.replace('_', ' ')}</span>
              <span className={`badge ${job.status === 'open' ? 'badge-green' : job.status === 'in_progress' ? 'badge-cyan' : 'badge-slate'}`}>
                {job.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{job.title}</h1>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-emerald-400">${job.total_budget}</p>
            <p className="text-xs text-slate-500">Total budget</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-3 leading-relaxed">{job.description}</p>

        {/* Hashtags */}
        {(job.required_elements?.hashtags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {job.required_elements.hashtags.map((h: string) => (
              <span key={h} className="badge badge-purple">#{h}</span>
            ))}
          </div>
        )}

        {/* Deadline */}
        {job.deadline && (
          <p className="text-xs text-slate-500 mt-3">
            Deadline: <span className="text-slate-300">{new Date(job.deadline).toLocaleDateString()}</span>
          </p>
        )}

        {/* Progress */}
        {job.status === 'in_progress' && milestones.length > 0 && (
          <div className="mt-5">
            <div className="flex justify-between mb-2">
              <p className="text-xs font-bold text-slate-500">Deal Progress</p>
              <p className="text-xs font-bold text-brand-400">{approved}/{milestones.length} milestones</p>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
           style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)' }}>
        {[
          { key: 'applicants', label: `Applicants (${applications.length})` },
          { key: 'milestones', label: `Milestones (${milestones.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${tab === key ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Applicants */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No applications yet.</p>
              <p className="text-slate-600 text-sm mt-1">Your deal is live — creators can apply from the Browse Jobs page.</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="card flex flex-col sm:flex-row gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-700 to-accent-700 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {(app.creator_id?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-white font-mono text-sm">{app.creator_id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${app.status === 'accepted' ? 'badge-green' : app.status === 'rejected' ? 'badge-red' : 'badge-slate'}`}>
                          {app.status}
                        </span>
                        <span className="text-xs text-slate-500">Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {job.status === 'open' && app.status === 'pending' && (
                      <button onClick={() => handleSelect(app.creator_id)}
                              disabled={!!selecting}
                              className="btn-success text-sm py-2 flex-shrink-0">
                        {selecting === app.creator_id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Select
                      </button>
                    )}
                  </div>
                  {app.cover_note && (
                    <p className="text-sm text-slate-400 mt-2 italic">"{app.cover_note}"</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-slate-400 text-sm">No milestones defined for this job.</p>
            </div>
          ) : (
            milestones.map((m: any) => (
              <MilestoneRow key={m.id} milestone={m} onAction={reload} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
