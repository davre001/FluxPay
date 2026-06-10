'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, Briefcase, ArrowRight, FileText, Clock,
  CheckCircle, AlertCircle, X, ExternalLink,
} from 'lucide-react';
import { mockDB, MockJob, MockApplication } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-cyan',
  accepted: 'badge-green',
  rejected: 'badge-red',
};

export default function CreatorApplicationsPage() {
  const { user } = useUserStore();
  const [applications, setApplications] = useState<MockApplication[]>([]);
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    setApplications(mockDB.getMyApplications(user.id));
    setJobs(mockDB.getJobs());
  }, [user?.id]);

  const filtered = applications.filter((app) => {
    const job = jobs.find((j) => j.id === app.job_id);
    if (!job) return false;

    // Search filter
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="mb-8 fade-in">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">My Status</p>
        <h1 className="text-3xl font-black text-white">Submitted <span className="gradient-text">Applications</span></h1>
        <p className="text-slate-400 text-sm mt-1">{applications.length} total applications sent</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or brand..."
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          {['all', 'pending', 'accepted', 'rejected'].map((s) => (
            <option key={s} value={s} style={{ background: '#0f172a' }}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">
            {applications.length === 0 ? 'No applications submitted yet' : 'No applications match filters'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            Browse open jobs and pitch to brands to kick off deals
          </p>
          <Link href="/creator/jobs" className="btn-primary mt-5 inline-flex">
            Browse Jobs <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filtered.map((app) => {
            const job = jobs.find((j) => j.id === app.job_id);
            if (!job) return null;

            return (
              <div
                key={app.id}
                className="card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-600/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[app.status] ?? 'badge-slate'}`}>
                      {app.status}
                    </span>
                    <span className="badge badge-slate capitalize">{job.target_platform}</span>
                    <span className="text-xs text-slate-500">
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-black text-white text-lg leading-snug">{job.title}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    {job.organization?.brand_name ?? 'Brand'}
                  </p>
                  
                  {app.cover_note && (
                    <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 max-w-2xl">
                      <p className="text-xs text-slate-500 font-semibold mb-1">Your pitch note:</p>
                      <p className="text-sm text-slate-400 italic font-medium">"{app.cover_note}"</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-3 flex-shrink-0 min-w-[150px]">
                  <div className="text-left sm:text-right md:text-left lg:text-right px-2">
                    <p className="text-lg font-black text-emerald-400">${job.total_budget}</p>
                    <p className="text-xs text-slate-500 font-semibold">Budget · USDC</p>
                  </div>

                  {app.status === 'accepted' ? (
                    <Link
                      href={`/creator/deals/${job.id}`}
                      className="btn-primary text-xs py-2.5 px-4 flex-1 text-center"
                    >
                      Go to Deal <ArrowRight size={13} />
                    </Link>
                  ) : (
                    <Link
                      href={`/creator/deals/${job.id}`}
                      className="btn-secondary text-xs py-2.5 px-4 flex-1 text-center"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
