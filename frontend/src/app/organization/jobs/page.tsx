'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowRight, Briefcase, Users, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMyJobs } from '@/hooks/useDeals';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const MOCK_JOBS = [
  { id: 'mock_1', title: 'Summer TikTok Campaign', status: 'open', target_platform: 'tiktok', post_type: 'video', total_budget: 1500, application_count: 5 },
  { id: 'mock_2', title: 'Tech Gadget Review', status: 'in_progress', target_platform: 'youtube', post_type: 'video', total_budget: 3000, application_count: 12 },
  { id: 'mock_3', title: 'Instagram Reel Unboxing', status: 'open', target_platform: 'instagram', post_type: 'video', total_budget: 800, application_count: 2 },
  { id: 'mock_4', title: 'Sponsored Blog Feature', status: 'in_progress', target_platform: 'other', post_type: 'content_writing', total_budget: 500, application_count: 1 },
  { id: 'mock_5', title: 'Spring Promo Twitter Thread', status: 'completed', target_platform: 'twitter', post_type: 'content_writing', total_budget: 300, application_count: 8 },
  { id: 'mock_6', title: 'Holiday Special Post', status: 'cancelled', target_platform: 'instagram', post_type: 'image', total_budget: 1000, application_count: 0 }
];

export default function OrgJobsListPage() {
  const { jobs: myJobs } = useMyJobs();
  // Real posted jobs when signed in; demo jobs keep the page populated otherwise.
  const jobs = myJobs.length > 0 ? myJobs : MOCK_JOBS;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  const filteredJobs = jobs.filter((j) => {
    // Tab filter
    const isActive = ['open', 'in_progress'].includes(j.status);
    if (activeTab === 'active' && !isActive) return false;
    if (activeTab === 'inactive' && isActive) return false;
    
    // Search filter
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">My Deals</p>
            </div>
            <h1 className="text-3xl font-black text-white mt-1 tracking-tight">All Jobs</h1>
            <p className="text-[#6b7280] text-sm font-semibold mt-1">Manage and track the progress of your brand deals.</p>
          </div>
          <Link href="/organization/jobs/new" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all bg-white text-black hover:bg-[#f0f0f0] flex-shrink-0">
            <Plus size={16} /> Post a Deal
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* ── Tabs & Search ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          <div className="flex items-center gap-1 p-1 rounded-xl w-full md:w-auto" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-[#222222] text-white shadow-sm' : 'text-[#6b7280] hover:text-white'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inactive' ? 'bg-[#222222] text-white shadow-sm' : 'text-[#6b7280] hover:text-white'}`}
            >
              Inactive
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input 
              value={search} onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search deals..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all text-white" 
              style={{ background: '#111111', border: '1px solid #1a1a1a' }}
            />
          </div>
        </div>

        {/* ── Job Grid ── */}
        <AnimatePresence mode="wait">
          {filteredJobs.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-16 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}
            >
              <LayoutList size={40} className="text-[#333333] mx-auto mb-4" />
              <p className="text-base font-bold text-white mb-1">
                {search ? 'No jobs match your search.' : `No ${activeTab} jobs found.`}
              </p>
              <p className="text-sm font-semibold text-[#6b7280]">
                {activeTab === 'active' && !search ? 'Post a new deal to get started.' : 'Try adjusting your filters.'}
              </p>
              {activeTab === 'active' && !search && (
                <Link href="/organization/jobs/new" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#222222] transition-colors border border-[#333333]">
                  <Plus size={16} /> Post Deal
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              variants={containerVariants} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredJobs.map((job) => (
                <motion.div key={job.id} variants={itemVariants} layoutId={job.id} whileHover={{ y: -4 }}>
                  <div className="rounded-2xl flex flex-col justify-between overflow-hidden group hover:border-[#333333] transition-colors h-full" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    
                    <div className="p-6 flex-1 border-b border-[#161616]">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                          {job.target_platform}
                        </span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                          job.status === 'open' ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]' :
                          job.status === 'in_progress' ? 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)]' :
                          'text-[#6b7280] bg-[#1a1a1a] border border-[#252525]'
                        }`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-lg leading-tight mb-2 group-hover:text-[#e5e7eb] transition-colors">{job.title}</h3>
                      <p className="text-xs font-semibold text-[#6b7280] capitalize">{job.post_type?.replace('_', ' ')}</p>
                    </div>

                    <div className="p-6 pt-5 mt-auto bg-[#0a0a0a]">
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] mb-1">Budget</p>
                          <p className="font-black text-[#22c55e] text-sm">${job.total_budget} <span className="text-[10px] font-semibold text-[#4b5563]">USDC</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b7280] mb-1">Applicants</p>
                          <p className="font-black text-white text-sm flex items-center gap-1">
                            <Users size={12} className="text-[#6b7280]" />
                            {job.application_count ?? 0}
                          </p>
                        </div>
                      </div>

                      <Link 
                        href={`/organization/jobs/${job.id}`} 
                        className="w-full flex items-center justify-center py-2.5 text-xs font-bold bg-[#111111] text-white hover:bg-[#1a1a1a] rounded-lg transition-colors border border-[#222222]"
                      >
                        Manage Deal
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
