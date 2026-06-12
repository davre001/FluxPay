'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Briefcase, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { applicationAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';

const MOCK_APPS = [
  {
    id: 'app-1',
    job_id: 'job-5',
    status: 'accepted',
    job_title: 'Ongoing Brand Ambassador - Q3',
    job_target_platform: 'instagram',
    job_total_budget: 5000,
    organization: { brand_name: 'Adidas' },
  }
];

export default function CreatorActiveDealsPage() {
  const { user } = useUserStore();
  const [activeDeals, setActiveDeals] = useState<any[]>(MOCK_APPS);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    applicationAPI.listMine({ status: 'accepted' }).then(({ data }) => {
      if (data && (data as any[]).length > 0) setActiveDeals(data as any[]);
    }).catch(() => {});
  }, [user?.id]);

  const filtered = activeDeals.filter((deal) => {
    if (platformFilter !== 'all' && deal.job_target_platform !== platformFilter) return false;
    if (search && !deal.job_title.toLowerCase().includes(search.toLowerCase()) &&
        !(deal.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">My Workspace</p>
            <h1 className="text-lg font-bold text-white leading-none mt-0.5">Active Deals</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#111111', border: '1px solid #1a1a1a', color: '#d1d5db' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
              {activeDeals.length} In Progress
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* ── Filters ── */}
        <div className="rounded-xl p-5 mb-6 flex flex-col sm:flex-row gap-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals by title or brand..."
              className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-9"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full sm:w-48 bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5"
          >
            {['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'].map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* ── Deals List ── */}
        {filtered.length === 0 ? (
          <div className="rounded-xl p-10 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
            <Briefcase size={32} className="text-[#4b5563] mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">
              {activeDeals.length === 0 ? 'No active deals yet' : 'No active deals match filters'}
            </p>
            <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
              {activeDeals.length === 0
                ? 'Hurry up! Pitch to open jobs on the Dashboard page to secure brand campaigns.'
                : 'Try resetting the search or platform filters.'}
            </p>
            {activeDeals.length === 0 && (
              <Link href="/creator/dashboard" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150">
                Browse Open Jobs <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((deal) => (
              <div
                key={deal.id}
                className="rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-[#333333] transition-colors"
                style={{ background: '#111111', border: '1px solid #1a1a1a' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#22c55e]" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                      <CheckCircle2 size={10} /> Hired
                    </span>
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] capitalize" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                      {deal.job_target_platform}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base leading-snug mb-1 group-hover:text-[#e5e7eb] transition-colors">{deal.job_title}</h3>
                  <p className="text-xs font-semibold text-[#6b7280]">
                    {deal.organization?.brand_name ?? 'Brand'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-4 flex-shrink-0 min-w-[150px]">
                  <div className="text-left sm:text-right md:text-left lg:text-right px-2">
                    <p className="text-base font-bold text-[#22c55e] leading-tight">${deal.job_total_budget}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold mt-0.5">Budget</p>
                  </div>

                  <Link
                    href={`/creator/deals/${deal.job_id}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150 flex-1 text-center"
                  >
                    View Milestones <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
