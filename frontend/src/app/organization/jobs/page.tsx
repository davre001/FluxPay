'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowRight, Loader2, Briefcase } from 'lucide-react';
import { jobAPI } from '@/lib/api-client';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-slate', open: 'badge-green', in_progress: 'badge-cyan',
  completed: 'badge-purple', expired: 'badge-red', cancelled: 'badge-red',
};

export default function OrgJobsListPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    jobAPI.listMine({ status: statusFilter !== 'all' ? statusFilter : undefined })
      .then((r) => setJobs(r.data?.items ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = jobs.filter((j) =>
    search === '' || j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">My Deals</p>
          <h1 className="text-3xl font-black text-white">Posted <span className="gradient-text">Jobs</span></h1>
        </div>
        <Link href="/jobs/new" className="btn-primary btn-shimmer">
          <Plus size={16} /> Post a Deal
        </Link>
      </div>

      <div className="card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-44">
          {['all', 'draft', 'open', 'in_progress', 'completed', 'expired', 'cancelled'].map((s) => (
            <option key={s} value={s} style={{ background: '#0f172a' }}>{s === 'all' ? 'All Statuses' : s.replace('_',' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3,4].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No jobs found</p>
          <Link href="/jobs/new" className="btn-primary mt-5 inline-flex"><Plus size={15} /> Post your first deal</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <div key={job.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${STATUS_BADGE[job.status] ?? 'badge-slate'}`}>{job.status}</span>
                  <span className="badge badge-slate capitalize">{job.target_platform}</span>
                </div>
                <h3 className="font-black text-white truncate">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {job.application_count ?? 0} applicants · ${job.total_budget} USDC ·{' '}
                  {job.deadline ? `Due ${new Date(job.deadline).toLocaleDateString()}` : 'No deadline'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/organization/jobs/${job.id}`} className="btn-secondary text-sm py-2 px-4">
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
