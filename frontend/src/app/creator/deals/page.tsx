'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Briefcase, ArrowRight, Zap } from 'lucide-react';
import { applicationAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';

export default function CreatorActiveDealsPage() {
  const { user } = useUserStore();
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    applicationAPI.listMine({ status: 'accepted' }).then(({ data }) => {
      setActiveDeals(data as any[]);
    }).catch(() => {});
  }, [user?.id]);

  const filtered = activeDeals.filter((deal) => {
    if (platformFilter !== 'all' && deal.job_target_platform !== platformFilter) return false;
    if (search && !deal.job_title.toLowerCase().includes(search.toLowerCase()) &&
        !(deal.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="mb-8 fade-in">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Ongoing Campaigns</p>
        <h1 className="text-3xl font-black text-white">Active <span className="gradient-text">Deals</span></h1>
        <p className="text-slate-400 text-sm mt-1">{activeDeals.length} active campaigns in progress</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by title or brand..."
            className="input pl-10"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="input sm:w-48"
        >
          {['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'].map((p) => (
            <option key={p} value={p} style={{ background: '#0f172a' }}>
              {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">
            {activeDeals.length === 0 ? 'No active deals yet' : 'No active deals match filters'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {activeDeals.length === 0
              ? 'Hurry up! Pitch to open jobs on the Dashboard page to secure brand campaigns.'
              : 'Try resetting the search or platform filters.'}
          </p>
          <Link href="/creator/dashboard" className="btn-primary mt-5 inline-flex">
            Browse Open Jobs <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filtered.map((deal) => (
            <div
              key={deal.id}
              className="card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-600/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="badge badge-green">hired</span>
                  <span className="badge badge-slate capitalize">{deal.job_target_platform}</span>
                </div>
                <h3 className="font-black text-white text-lg leading-snug">{deal.job_title}</h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  {deal.organization?.brand_name ?? 'Brand'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-4 flex-shrink-0 min-w-[150px]">
                <div className="text-left sm:text-right md:text-left lg:text-right px-2">
                  <p className="text-lg font-black text-emerald-400">${deal.job_total_budget}</p>
                  <p className="text-xs text-slate-500 font-semibold">Budget · USDC</p>
                </div>

                <Link
                  href={`/creator/deals/${deal.job_id}`}
                  className="btn-primary text-xs py-2.5 px-5 flex-1 text-center"
                >
                  View Milestones <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
