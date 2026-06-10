'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Briefcase, DollarSign, Star, TrendingUp,
  Clock, CheckCircle, AlertCircle, ArrowRight, Zap,
} from 'lucide-react';
import { jobAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';

const STATUS_BADGE: Record<string, string> = {
  open:        'badge-green',
  in_progress: 'badge-cyan',
  completed:   'badge-purple',
  expired:     'badge-slate',
  cancelled:   'badge-red',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', completed: 'Completed',
  expired: 'Expired', cancelled: 'Cancelled',
};

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card stat-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useUserStore();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobAPI.list({ status: 'in_progress' })
      .then((r) => setDeals(r.data?.items ?? []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  const active = deals.filter((d) => d.status === 'in_progress').length;
  const completed = deals.filter((d) => d.status === 'completed').length;
  const earnings = deals.reduce((s: number, d: any) => s + (d.total_budget || 0), 0);

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Creator Dashboard</p>
          <h1 className="text-3xl font-black text-white">
            Hey, <span className="gradient-text">{user?.email?.split('@')[0]}</span> 👋
          </h1>
        </div>
        <Link href="/creator/jobs" className="btn-primary btn-shimmer self-start sm:self-auto">
          Browse Jobs <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children fade-in">
        <StatCard icon={Clock}        label="Active Deals"    value={loading ? '–' : active}    color="bg-gradient-to-br from-brand-600 to-brand-500" />
        <StatCard icon={CheckCircle}  label="Completed"       value={loading ? '–' : completed} color="bg-gradient-to-br from-emerald-600 to-green-500" />
        <StatCard icon={DollarSign}   label="Total Earned"    value={`$${earnings.toFixed(0)}`} color="bg-gradient-to-br from-accent-600 to-accent-500" sub="USDC" />
        <StatCard icon={Star}         label="Reputation"      value="–"                         color="bg-gradient-to-br from-yellow-600 to-amber-500" sub="Score" />
      </div>

      {/* Active deals */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Briefcase size={18} className="text-brand-400" /> My Active Deals
          </h2>
          <Link href="/creator/jobs" className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
            Browse more <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <Zap size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No active deals yet</p>
            <p className="text-slate-600 text-sm mt-1">Browse open jobs and apply to get started</p>
            <Link href="/creator/jobs" className="btn-primary mt-5 inline-flex">
              Browse Jobs <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Deal', 'Platform', 'Budget', 'Milestones', 'Deadline', 'Status', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-3">
                      <p className="font-bold text-white">{deal.title}</p>
                      <p className="text-xs text-slate-500">{deal.organization?.brand_name || 'Brand'}</p>
                    </td>
                    <td className="py-4 px-3">
                      <span className="badge badge-slate capitalize">{deal.target_platform}</span>
                    </td>
                    <td className="py-4 px-3 font-bold text-emerald-400">${deal.total_budget}</td>
                    <td className="py-4 px-3 text-slate-400">
                      {deal.milestones?.filter((m: any) => m.status === 'approved').length ?? 0}/
                      {deal.milestones?.length ?? 0}
                    </td>
                    <td className="py-4 px-3 text-slate-400 text-xs">
                      {deal.deadline ? new Date(deal.deadline).toLocaleDateString() : '–'}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`badge ${STATUS_BADGE[deal.status] ?? 'badge-slate'}`}>
                        {STATUS_LABEL[deal.status] ?? deal.status}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <Link href={`/creator/deals/${deal.id}`}
                            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                        View <ArrowRight size={11} />
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
          { href: '/creator/profile',    icon: Star,       label: 'Edit Profile',    sub: 'Update bio & socials',   color: 'from-brand-600 to-brand-500'    },
          { href: '/creator/wallet',     icon: DollarSign, label: 'Wallet',          sub: 'View balance & history', color: 'from-accent-600 to-accent-500'   },
          { href: '/creator/reputation', icon: TrendingUp, label: 'Reputation',      sub: 'Check your score',       color: 'from-emerald-600 to-green-500'   },
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
