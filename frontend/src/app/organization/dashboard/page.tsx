'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Users, DollarSign, Star, Plus, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { mockDB, MockJob } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-slate', open: 'badge-green', in_progress: 'badge-cyan',
  completed: 'badge-purple', expired: 'badge-red', cancelled: 'badge-red',
};

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="card stat-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function OrgDashboard() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState<MockJob[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    setJobs(mockDB.getMyJobs(user.id));
  }, [user?.id]);

  const activeJobs = jobs.filter((j) => ['open', 'in_progress'].includes(j.status)).length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const totalEscrowed = jobs.reduce((s, j) => s + j.total_budget, 0);
  const totalApplicants = jobs.reduce((s, j) => s + (j.application_count ?? 0), 0);

  const activeJobsList = jobs.filter((j) => ['open', 'in_progress'].includes(j.status));

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Brand Dashboard</p>
          <h1 className="text-3xl font-black text-white">
            Hey, <span className="gradient-text">{user?.email?.split('@')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your creator deals and campaigns.</p>
        </div>
        <Link href="/organization/jobs/new" className="btn-primary btn-shimmer self-start sm:self-auto">
          <Plus size={16} /> Post a Deal
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children fade-in">
        <StatCard icon={Briefcase}   label="Active Jobs"    value={activeJobs}      color="bg-gradient-to-br from-brand-600 to-brand-500" />
        <StatCard icon={CheckCircle} label="Completed"      value={completedJobs}   color="bg-gradient-to-br from-emerald-600 to-green-500" />
        <StatCard icon={DollarSign}  label="Total Escrowed" value={`$${totalEscrowed}`} color="bg-gradient-to-br from-accent-600 to-accent-500" />
        <StatCard icon={Users}       label="Applicants"     value={totalApplicants} color="bg-gradient-to-br from-yellow-600 to-amber-500" />
      </div>

      {/* Recent jobs */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Briefcase size={18} className="text-brand-400" /> My Active Jobs
          </h2>
          <Link href="/organization/jobs/active" className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {activeJobsList.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No active jobs yet</p>
            <p className="text-slate-600 text-sm mt-1">Post a new deal or hire creators to get active campaigns</p>
            <Link href="/organization/jobs/new" className="btn-primary mt-5 inline-flex">
              <Plus size={16} /> Post a Deal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Job Title', 'Platform', 'Budget', 'Applicants', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeJobsList.slice(0, 8).map((job) => (
                  <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <p className="font-bold text-white">{job.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{job.post_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-4 px-3"><span className="badge badge-slate capitalize">{job.target_platform}</span></td>
                    <td className="py-4 px-3 font-bold text-emerald-400">${job.total_budget}</td>
                    <td className="py-4 px-3 text-slate-400">{job.application_count ?? 0}</td>
                    <td className="py-4 px-3">
                      <span className={`badge ${STATUS_BADGE[job.status] ?? 'badge-slate'}`}>{job.status}</span>
                    </td>
                    <td className="py-4 px-3">
                      <Link href={`/organization/jobs/${job.id}`}
                            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                        Manage <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/organization/profile',    icon: Star,       label: 'Brand Profile',  sub: 'Edit logo & info',       color: 'from-brand-600 to-brand-500' },
          { href: '/organization/wallet',     icon: DollarSign, label: 'Wallet',         sub: 'Manage escrow funds',    color: 'from-accent-600 to-accent-500' },
          { href: '/organization/reputation', icon: Zap,        label: 'Reputation',     sub: 'View your brand score',  color: 'from-emerald-600 to-green-500' },
        ].map(({ href, icon: Icon, label, sub, color }) => (
          <Link key={href} href={href}
                className="card flex items-center gap-4 group hover:border-brand-600/40 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
            <ArrowRight size={14} className="text-slate-600 ml-auto group-hover:text-brand-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
