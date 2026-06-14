'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, User, ExternalLink, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { jobAPI, applicationAPI } from '@/lib/api-client';
import { useIncomingApplications } from '@/hooks/useDeals';
import { useQueryClient } from '@tanstack/react-query';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function ApprovalsPage() {
  const { applications: incoming, isLoading } = useIncomingApplications();
  const qc = useQueryClient();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);

  // Normalize real incoming applications into the card shape (real reputation, 0–100).
  const source = incoming.map((a: any) => ({
    id: a.id,
    job_id: a.job_id,
    creator_id: a.creator_id,
    creatorName: a.creator_name || a.creator_id,
    creatorAvatar: String(a.creator_name || a.creator_id || '?')[0].toUpperCase(),
    reputation: a.creator_reputation ?? 0,
    jobTitle: a.job_title || 'Deal',
    status: a.status,
    coverNote: a.cover_note,
    platform: a.job_target_platform || 'other',
    qualified: a.qualified,
    reasons: a.qualification_reasons || [],
  }));
  const applications = source.filter((a: any) => !removedIds.has(a.id));

  // Hire the applicant (real). The ERC-7715 release grant is done on the deal page.
  const handleApprove = async (app: any) => {
    setActing(app.id);
    try {
      if (app.job_id && app.creator_id) {
        await jobAPI.selectCreator(app.job_id, app.creator_id);
        qc.invalidateQueries({ queryKey: ['incoming-applications'] });
      }
      toast.success('Creator hired — grant the release permission on the deal page.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to hire creator');
    }
    setRemovedIds(prev => new Set([...prev, app.id]));
    setActing(null);
  };

  const handleReject = async (app: any) => {
    setActing(app.id);
    setRemovedIds(prev => new Set([...prev, app.id]));   // optimistic
    try {
      await applicationAPI.reject(app.id);
      qc.invalidateQueries({ queryKey: ['incoming-applications'] });
      toast.success('Application declined.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to decline');
      setRemovedIds(prev => { const next = new Set(prev); next.delete(app.id); return next; }); // roll back
    }
    setActing(null);
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Review Offers</p>
          </div>
          <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Approvals</h1>
          <p className="text-[#6b7280] text-sm font-semibold mt-1">Review creator applications and approve them for your deals.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-16 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
              <Loader2 size={36} className="text-[#333333] mx-auto mb-4 animate-spin" />
              <p className="text-sm font-semibold text-[#6b7280]">Loading applications…</p>
            </motion.div>
          ) : applications.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-16 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}
            >
              <ShieldCheck size={40} className="text-[#333333] mx-auto mb-4" />
              <p className="text-base font-bold text-white mb-1">All caught up!</p>
              <p className="text-sm font-semibold text-[#6b7280]">
                You have no pending creator applications to review right now.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants} initial="hidden" animate="show"
              className="space-y-6"
            >
              {applications.map((app) => (
                <motion.div key={app.id} variants={itemVariants} className="rounded-2xl p-6 md:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  
                  {/* Header: Job context */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#161616]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] mb-1">Applying for deal</p>
                      <Link href="#" className="font-bold text-white text-sm hover:text-[#3b82f6] transition-colors flex items-center gap-1.5">
                        {app.jobTitle} <ExternalLink size={12} />
                      </Link>
                    </div>
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                      {app.platform}
                    </span>
                  </div>

                  {/* Creator Info */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black font-black text-lg">
                          {app.creatorAvatar}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white">{app.creatorName}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-[#22c55e] text-xs font-bold">
                              <Zap size={12} fill="currentColor" /> {app.reputation} / 100 Rep
                            </span>
                            {app.qualified !== undefined && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${app.qualified ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]'}`}>
                                {app.qualified ? 'Qualified' : 'Not qualified'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {app.reasons?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {app.reasons.map((r: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold text-[#9ca3af] px-2 py-0.5 rounded" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>{r}</span>
                          ))}
                        </div>
                      )}

                      <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#161616] relative">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] mb-2">Cover Note</p>
                        <p className="text-sm text-[#d1d5db] leading-relaxed">"{app.coverNote}"</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-3 justify-end md:w-40 border-t md:border-t-0 md:border-l border-[#1a1a1a] pt-4 md:pt-0 md:pl-6">
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={acting === app.id}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#22c55e] text-black hover:bg-[#1ea852] transition-colors disabled:opacity-50"
                      >
                        {acting === app.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#ef4444] hover:border-[#ef4444] border border-[#333333] transition-colors"
                      >
                        <X size={16} /> Decline
                      </button>
                      <Link href={`/creators/${app.creator_id || app.id}`} className="hidden md:flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-[#6b7280] hover:text-white transition-colors">
                        <User size={16} /> Profile
                      </Link>
                    </div>
                  </div>

                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
