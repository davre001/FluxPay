'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, FileText, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { applicationAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: Clock },
  accepted: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', icon: CheckCircle2 },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: XCircle },
};

const MOCK_APPS = [
  {
    id: 'app-1',
    job_id: 'job-5',
    status: 'accepted',
    job_title: 'Ongoing Brand Ambassador - Q3',
    job_target_platform: 'instagram',
    job_total_budget: 5000,
    organization: { brand_name: 'Adidas', logo_url: 'https://www.google.com/s2/favicons?domain=adidas.com&sz=128' },
    applied_at: new Date(Date.now() - 864000000).toISOString(),
    cover_note: 'I love Adidas and have a highly engaged fitness audience!',
  },
  {
    id: 'app-2',
    job_id: 'job-3',
    status: 'pending',
    job_title: 'Twitter Thread on Web3 Payments',
    job_target_platform: 'twitter',
    job_total_budget: 500,
    organization: { brand_name: 'Flux Protocol', logo_url: 'https://ui-avatars.com/api/?name=Flux+Protocol&background=1a1a1a&color=fff' },
    applied_at: new Date().toISOString(),
    cover_note: 'I write technical threads about crypto daily!',
  }
];

export default function CreatorApplicationsPage() {
  const { user } = useUserStore();
  const [applications, setApplications] = useState<any[]>(MOCK_APPS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    toast.success("Application withdrawn.");
    setConfirmDelete(null);
  };
  const requestDelete = (id: string) => {
    setConfirmDelete(id);
  };

  useEffect(() => {
    if (!user?.id) return;
    // applicationAPI.listMine().then(({ data }) => {
    //   if (data && (data as any[]).length > 0) setApplications(data as any[]);
    // }).catch(() => {});
  }, [user?.id]);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.job_title.toLowerCase().includes(search.toLowerCase()) ||
      (app.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">My Status</p>
            <h1 className="text-lg font-bold text-white leading-none mt-0.5">Submitted Applications</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#111111', border: '1px solid #1a1a1a', color: '#d1d5db' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
              {applications.length} Total Sent
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
              placeholder="Search by job title or brand..."
              className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white focus:outline-none focus:border-[#404040] transition-colors duration-200 px-3 py-2.5"
          >
            {['all', 'pending', 'accepted', 'rejected'].map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* ── Applications List ── */}
        {filtered.length === 0 ? (
          <div className="rounded-xl p-10 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
            <FileText size={32} className="text-[#4b5563] mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">
              {applications.length === 0 ? 'No applications submitted yet' : 'No applications match filters'}
            </p>
            <p className="text-xs text-[#6b7280] mt-1 max-w-sm mx-auto">
              Browse open jobs and pitch to brands to kick off deals.
            </p>
            {applications.length === 0 && (
              <Link href="/creator/dashboard" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150">
                Browse Jobs <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <motion.div 
            initial="hidden" animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-4"
          >
            <AnimatePresence>
            {filtered.map((app) => {
              const statusConf = STATUS_CONFIG[app.status] || { color: '#9ca3af', bg: '#1a1a1a', border: '#252525', icon: FileText };
              const StatusIcon = statusConf.icon;

              return (
                <motion.div
                  key={app.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0, transition: { type: 'spring' } },
                  }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.01 }}
                  className="rounded-xl p-5 flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6 group hover:border-[#333333] transition-colors"
                  style={{ background: '#111111', border: '1px solid #1a1a1a' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest" style={{ color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}` }}>
                        <StatusIcon size={10} /> {app.status}
                      </span>
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] capitalize" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                        {app.job_target_platform}
                      </span>
                      <span className="text-[10px] text-[#6b7280] font-semibold uppercase tracking-wider ml-1">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-white text-base leading-snug mb-1 group-hover:text-[#e5e7eb] transition-colors">{app.job_title}</h3>
                    <div className="flex items-center gap-2">
                      {app.organization?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={app.organization.logo_url} alt="Logo" className="w-5 h-5 rounded object-contain bg-white p-[2px]" />
                      ) : (
                        <div className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[10px]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                          {(app.organization?.brand_name?.[0] ?? 'B').toUpperCase()}
                        </div>
                      )}
                      <p className="text-xs font-semibold text-[#6b7280]">
                        {app.organization?.brand_name ?? 'Brand'}
                      </p>
                    </div>

                    {app.cover_note && (
                      <div className="mt-4 p-3.5 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563] mb-1.5">Your Pitch Note</p>
                        <p className="text-xs text-[#9ca3af] leading-relaxed italic">"{app.cover_note}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center gap-4 flex-shrink-0 min-w-[150px] mt-2 md:mt-0">
                    <div className="text-left sm:text-right md:text-left lg:text-right px-2">
                      <p className="text-base font-bold text-[#22c55e] leading-tight">${app.job_total_budget}</p>
                      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold mt-0.5">Budget</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => requestDelete(app.id)}
                          className="p-2 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef444415] hover:border-[#ef444450] transition-colors"
                          title="Withdraw Application"
                        >
                          <Trash2 size={16} />
                        </button>
                      {app.status === 'accepted' ? (
                        <Link
                          href={`/creator/deals/${app.job_id}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150 flex-1 text-center"
                        >
                          Go to Deal <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <Link
                          href={`/creator/deals/${app.job_id}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#d1d5db] hover:text-white rounded-lg transition-all duration-150 flex-1 text-center"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}
            >
              <h3 className="text-lg font-bold text-white mb-2">Withdraw Application</h3>
              <p className="text-sm text-[#9ca3af] mb-6 leading-relaxed">
                Are you sure you want to withdraw this application? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors" style={{ background: '#1a1a1a', border: '1px solid #252525' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
