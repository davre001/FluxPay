'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowRight, Briefcase, Users, Zap } from 'lucide-react';
import { mockDB, MockJob } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-green',
  in_progress: 'badge-cyan',
};

export default function OrgActiveJobsPage() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    // Filter active jobs initially
    const myJobs = mockDB.getMyJobs(user.id);
    const active = myJobs.filter((j) => ['open', 'in_progress'].includes(j.status));
    setJobs(active);
  }, [user?.id]);

  const filtered = jobs.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">My Campaigns</p>
          <h1 className="text-3xl font-black text-white">Active <span className="gradient-text">Jobs</span></h1>
          <p className="text-slate-400 text-sm mt-1">{jobs.length} active campaigns running</p>
        </div>
        <Link href="/organization/jobs/new" className="btn-primary btn-shimmer">
          <Plus size={16} /> Post a Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active jobs..."
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-48"
        >
          {['all', 'open', 'in_progress'].map((s) => (
            <option key={s} value={s} style={{ background: '#0f172a' }}>
              {s === 'all' ? 'All Active Statuses' : s === 'open' ? 'Open (Hiring)' : 'In Progress'}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">
            {jobs.length === 0 ? 'No active jobs' : 'No active jobs match filters'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {jobs.length === 0 
              ? 'Post a new brand deal to find creators and start your campaigns.' 
              : 'Try clearing filters or check the All Jobs tab.'}
          </p>
          <Link href="/organization/jobs/new" className="btn-primary mt-5 inline-flex">
            <Plus size={15} /> Post a Deal
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => {
            const applications = mockDB.getApplicationsForJob(job.id);
            return (
              <div
                key={job.id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-600/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[job.status] ?? 'badge-slate'}`}>
                      {job.status === 'open' ? 'hiring' : job.status}
                    </span>
                    <span className="badge badge-slate capitalize">{job.target_platform}</span>
                    <span className="badge badge-slate capitalize">{job.post_type?.replace('_', ' ')}</span>
                  </div>
                  <h3 className="font-black text-white text-lg leading-snug">{job.title}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap font-medium">
                    <span className="text-emerald-400 font-bold">${job.total_budget} USDC</span>
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" /> {applications.length} applicant{applications.length !== 1 ? 's' : ''}
                    </span>
                    {job.deadline && (
                      <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/organization/jobs/${job.id}`}
                    className="btn-secondary text-sm py-2.5 px-5"
                  >
                    Manage <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
