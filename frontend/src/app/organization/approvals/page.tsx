'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, User, ExternalLink, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { jobAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
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

const MOCK_APPS = [
  { id: 'app_1', creatorName: 'Alex Rivers', creatorAvatar: 'A', reputation: 85, jobTitle: 'Summer Launch Reel', status: 'pending', coverNote: 'I would love to shoot this reel! I have a background in fashion videography and a dedicated audience of 50k followers who perfectly match your target demographic.', platform: 'instagram', creator_id: 'demo_creator_1' },
  { id: 'app_2', creatorName: 'Samira Tech', creatorAvatar: 'S', reputation: 72, jobTitle: 'Tech Review Video', status: 'pending', coverNote: 'I review tech gadgets every week. I can guarantee a turnaround of 3 days after receiving the product. Let\'s make this happen!', platform: 'youtube', creator_id: 'demo_creator_2' },
  { id: 'app_3', creatorName: 'Jordan Creative', creatorAvatar: 'J', reputation: 45, jobTitle: 'Sponsored Blog Feature', status: 'pending', coverNote: 'I specialize in written tech content. I can integrate your brand naturally into my next article reaching 20k readers.', platform: 'other', creator_id: 'demo_creator_3' }
];

export default function ApprovalsPage() {
  const { user } = useUserStore();
  const { applications: incoming, isLoading } = useIncomingApplications();
  const qc = useQueryClient();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);

  // Normalize real incoming applications into the card shape; mock keeps the
  // inbox populated for a logged-out demo.
  const source = incoming.length > 0
    ? incoming.map((a: any) => ({
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
      }))
    : (user?.id ? [] : MOCK_APPS);
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

  const handleReject = (app: any) => {
    setRemovedIds(prev => new Set([...prev, app.id]));   // local only (no reject endpoint)
    toast.success('Application dismissed.');
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
                          <div className="flex items-center gap-1 mt-0.5 text-[#22c55e] text-xs font-bold">
                            <Zap size={12} fill="currentColor" /> {app.reputation} / 100 Rep
                          </div>
                        </div>
                      </div>
                      
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
