'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, X, User, ExternalLink, Zap, ShieldCheck } from 'lucide-react';
import { jobAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const MOCK_APPS = [
  { id: 'app_1', creatorName: 'Alex Rivers', creatorAvatar: 'A', reputation: 98, jobTitle: 'Summer Launch Reel', status: 'pending', coverNote: 'I would love to shoot this reel! I have a background in fashion videography and a dedicated audience of 50k followers who perfectly match your target demographic.', platform: 'instagram' },
  { id: 'app_2', creatorName: 'Samira Tech', creatorAvatar: 'S', reputation: 120, jobTitle: 'Tech Review Video', status: 'pending', coverNote: 'I review tech gadgets every week. I can guarantee a turnaround of 3 days after receiving the product. Let\'s make this happen!', platform: 'youtube' },
  { id: 'app_3', creatorName: 'Jordan Creative', creatorAvatar: 'J', reputation: 85, jobTitle: 'Sponsored Blog Feature', status: 'pending', coverNote: 'I specialize in written tech content. I can integrate your brand naturally into my next article reaching 20k readers.', platform: 'other' }
];

export default function ApprovalsPage() {
  const { user } = useUserStore();
  const [jobs, setJobs] = useState<any[]>([]);
  // In a real app we would fetch real applications here.
  // For design/demonstration purposes, we'll populate some mock offers for the brand to review.
  const [applications, setApplications] = useState<any[]>(MOCK_APPS);

  useEffect(() => {
    if (!user?.id) return;
    jobAPI.listMine().then(({ data }) => {
      setJobs(data as any[]);
    }).catch(() => {});
  }, [user?.id]);

  const handleApprove = (id: string) => {
    setApplications(apps => apps.filter(app => app.id !== id));
  };

  const handleReject = (id: string) => {
    setApplications(apps => apps.filter(app => app.id !== id));
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
          {applications.length === 0 ? (
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
                            <Zap size={12} fill="currentColor" /> {app.reputation} Rep Score
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
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#22c55e] text-black hover:bg-[#1ea852] transition-colors"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#ef4444] hover:border-[#ef4444] border border-[#333333] transition-colors"
                      >
                        <X size={16} /> Decline
                      </button>
                      <Link href="#" className="hidden md:flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-[#6b7280] hover:text-white transition-colors">
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
