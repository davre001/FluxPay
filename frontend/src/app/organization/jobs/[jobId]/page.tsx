'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, CheckCircle, AlertCircle, Bot, Star,
  Instagram, Twitter, Youtube, Music2, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobAPI, milestoneAPI } from '@/lib/api-client';

const MILESTONE_STATUS_STYLE: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending',   badge: 'badge-slate' },
  submitted: { label: 'Submitted', badge: 'badge-yellow' },
  approved:  { label: 'Approved',  badge: 'badge-green' },
  disputed:  { label: 'Disputed',  badge: 'badge-red' },
  released:  { label: 'Released',  badge: 'badge-purple' },
};

const SOCIAL_ICONS: Record<string, any> = { instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2 };

function MilestoneRow({ milestone, onApprove, onDispute, approving, disputing }: any) {
  const [open, setOpen] = useState(milestone.status === 'submitted');
  const s = MILESTONE_STATUS_STYLE[milestone.status] ?? MILESTONE_STATUS_STYLE.pending;

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

          {/* AI verdict */}
          {milestone.ai_verdict && (
            <div className={`rounded-xl p-4 flex gap-3 ${milestone.ai_verdict === 'pass' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <Bot size={16} className={milestone.ai_verdict === 'pass' ? 'text-emerald-400 mt-0.5' : 'text-red-400 mt-0.5'} />
              <div>
                <p className={`text-sm font-bold ${milestone.ai_verdict === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>
                  AI: {milestone.ai_verdict === 'pass' ? 'Pass' : 'Fail'}
                  {milestone.ai_confidence != null && ` (${Math.round(milestone.ai_confidence * 100)}% confidence)`}
                </p>
                {milestone.ai_reason && <p className="text-xs text-slate-400 mt-1">{milestone.ai_reason}</p>}
              </div>
            </div>
          )}

          {/* Deliverable */}
          {milestone.deliverable_url && (
            <a href={milestone.deliverable_url} target="_blank" rel="noopener noreferrer"
               className="text-sm text-accent-400 hover:text-accent-300 underline transition-colors">
              View deliverable →
            </a>
          )}

          {/* Actions — only for submitted milestones */}
          {milestone.status === 'submitted' && (
            <div className="flex gap-3">
              <button onClick={() => onApprove(milestone.id)} disabled={approving === milestone.id}
                      className="btn-success text-sm py-2.5">
                {approving === milestone.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Approve & Release
              </button>
              <button onClick={() => onDispute(milestone.id)} disabled={disputing === milestone.id}
                      className="btn-danger">
                {disputing === milestone.id ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
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
  const [job, setJob] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'applicants' | 'milestones'>('applicants');
  const [selecting, setSelecting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [disputing, setDisputing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      jobAPI.detail(jobId),
      milestoneAPI.list(jobId),
      jobAPI.getApplications(jobId),
    ]).then(([jRes, mRes, aRes]) => {
      setJob(jRes.data);
      setMilestones(mRes.data ?? []);
      setApplications(aRes.data?.items ?? aRes.data ?? []);
    }).catch(() => toast.error('Failed to load job'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [jobId]);

  const handleSelect = async (creatorId: string) => {
    setSelecting(creatorId);
    try {
      await jobAPI.selectCreator(jobId, creatorId);
      toast.success('Creator selected! Deal has started.');
      setTab('milestones');
      load();
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed to select creator'); }
    finally { setSelecting(null); }
  };

  const handleApprove = async (milestoneId: string) => {
    setApproving(milestoneId);
    try {
      await milestoneAPI.approve(milestoneId);
      toast.success('Milestone approved! Funds released.');
      load();
    } catch { toast.error('Approval failed'); }
    finally { setApproving(null); }
  };

  const handleDispute = async (milestoneId: string) => {
    setDisputing(milestoneId);
    try {
      await milestoneAPI.dispute(milestoneId, { reason: 'Disputed by organization' });
      toast.success('Dispute raised. Admin will review.');
      load();
    } catch { toast.error('Failed to raise dispute'); }
    finally { setDisputing(null); }
  };

  const approved = milestones.filter((m) => ['approved', 'released'].includes(m.status)).length;
  const progress = milestones.length > 0 ? (approved / milestones.length) * 100 : 0;

  if (loading) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <Loader2 size={32} className="animate-spin text-brand-400" />
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
              <span className="badge badge-slate capitalize">{job?.target_platform}</span>
              <span className="badge badge-slate capitalize">{job?.post_type?.replace('_',' ')}</span>
              <span className={`badge ${job?.status === 'open' ? 'badge-green' : job?.status === 'in_progress' ? 'badge-cyan' : 'badge-slate'}`}>
                {job?.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{job?.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-emerald-400">${job?.total_budget}</p>
            <p className="text-xs text-slate-500">Total budget</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm mt-3 leading-relaxed">{job?.description}</p>

        {/* Progress (only for in_progress) */}
        {job?.status === 'in_progress' && milestones.length > 0 && (
          <div className="mt-5">
            <div className="flex justify-between mb-2">
              <p className="text-xs font-bold text-slate-500">Deal Progress</p>
              <p className="text-xs font-bold text-brand-400">{approved}/{milestones.length} milestones</p>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {/* Selected creator */}
        {job?.selected_creator && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl"
               style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
            <CheckCircle size={16} className="text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">
              Deal with <span className="text-white">{job.selected_creator.name || 'Creator'}</span>
            </p>
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

      {/* Applicants tab */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No applications yet. Share your deal link to attract creators.</p>
            </div>
          ) : (
            applications.map((app) => {
              const creator = app.creator ?? {};
              return (
                <div key={app.id} className="card flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {creator.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.profile_picture_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-700 to-accent-700 flex items-center justify-center text-white font-black text-lg">
                        {(creator.name?.[0] ?? 'C').toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-white">{creator.name || 'Creator'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge badge-yellow text-xs">⭐ {creator.reputation_score ?? 0} Rep</span>
                          {(creator.niche_tags ?? []).slice(0, 3).map((t: string) => (
                            <span key={t} className="badge badge-purple text-xs">{t}</span>
                          ))}
                        </div>
                      </div>
                      {job?.status === 'open' && (
                        <button onClick={() => handleSelect(creator.id)} disabled={!!selecting}
                                className="btn-success text-sm py-2 flex-shrink-0">
                          {selecting === creator.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          Select
                        </button>
                      )}
                    </div>

                    {/* Socials */}
                    <div className="flex gap-3 mt-2">
                      {(['instagram', 'twitter', 'youtube', 'tiktok'] as const).map((s) => {
                        if (!creator[s]) return null;
                        const Icon = SOCIAL_ICONS[s];
                        return (
                          <span key={s} className="flex items-center gap-1 text-xs text-slate-500">
                            <Icon size={12} /> @{creator[s]}
                          </span>
                        );
                      })}
                    </div>

                    {/* Cover note */}
                    {app.cover_note && (
                      <p className="text-sm text-slate-400 mt-2 italic">"{app.cover_note}"</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Milestones tab */}
      {tab === 'milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-slate-400 text-sm">No milestones defined for this job.</p>
            </div>
          ) : (
            milestones.map((m) => (
              <MilestoneRow key={m.id} milestone={m}
                onApprove={handleApprove} onDispute={handleDispute}
                approving={approving} disputing={disputing} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
