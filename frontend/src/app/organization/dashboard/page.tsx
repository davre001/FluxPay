'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Users, DollarSign, Star, Plus, ArrowRight, 
  CheckCircle, Zap, Eye, EyeOff, Wallet as WalletIcon, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api-client';
import { useMyJobs } from '@/hooks/useDeals';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

const StatCard = ({ icon: Icon, label, value, color, sub, blur }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="rounded-xl p-5 flex items-center gap-4 transition-all duration-150" 
    style={{ background: '#111111', border: '1px solid #1a1a1a' }}
  >
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p className="text-xs font-semibold text-[#6b7280]">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <h3 className={cn("text-2xl font-bold text-white tracking-tight transition-all duration-300", blur && "blur-md opacity-50 select-none")}>{value}</h3>
        {sub && <span className={cn("text-xs font-semibold text-[#4b5563] transition-all duration-300", blur && "opacity-0")}>{sub}</span>}
      </div>
    </div>
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const MOCK_JOBS = [
  { id: 'mock_1', title: 'Summer TikTok Campaign', status: 'open', target_platform: 'tiktok', post_type: 'video', total_budget: 1500, application_count: 5 },
  { id: 'mock_2', title: 'Tech Gadget Review', status: 'in_progress', target_platform: 'youtube', post_type: 'video', total_budget: 3000, application_count: 12 },
  { id: 'mock_3', title: 'Instagram Reel Unboxing', status: 'open', target_platform: 'instagram', post_type: 'video', total_budget: 800, application_count: 2 },
  { id: 'mock_4', title: 'Sponsored Blog Feature', status: 'in_progress', target_platform: 'other', post_type: 'content_writing', total_budget: 500, application_count: 1 }
];

export default function OrgDashboard() {
  const { user } = useUserStore();
  const { jobs: myJobs } = useMyJobs();
  // Real posted jobs when signed in; demo jobs keep the page populated otherwise.
  const jobs = myJobs.length > 0 ? myJobs : MOCK_JOBS;
  const [profileName, setProfileName] = useState('');
  const [hideStats, setHideStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fluxpay_dashboard_stats');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });
  const [welcomeText, setWelcomeText] = useState('');

  const fullText = `Hey, ${profileName || user?.email?.split('@')[0] || 'Brand'}`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setWelcomeText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => setProfileName(data?.name || '')).catch(() => {});
  }, [user?.id]);

  const activeJobs = jobs.filter((j) => ['open', 'in_progress'].includes(j.status)).length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const totalEscrowed = jobs.reduce((s, j) => s + j.total_budget, 0);
  const totalApplicants = jobs.reduce((s, j) => s + (j.application_count ?? 0), 0);

  const activeJobsList = jobs.filter((j) => ['open', 'in_progress'].includes(j.status));

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Brand Dashboard</p>
              <button 
                onClick={() => {
                  const next = !hideStats;
                  setHideStats(next);
                  localStorage.setItem('fluxpay_dashboard_stats', String(next));
                }} 
                className="text-[#4b5563] hover:text-white transition-colors"
              >
                {hideStats ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
              {welcomeText}<span className="animate-pulse">|</span>{' '}
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 1.5, duration: 2.5 }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-[#6b7280] text-xs font-semibold mt-1">Manage your creator deals and campaigns.</p>
          </div>
          <Link href="/organization/jobs/new" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all" style={{ background: 'white', color: 'black' }}>
            <Plus size={14} /> Post a Deal
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Stats Row ── */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={itemVariants}><StatCard icon={Briefcase}   label="Active Jobs"    value={activeJobs}                color="#3b82f6" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={CheckCircle} label="Completed"      value={completedJobs}             color="#22c55e" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={WalletIcon}  label="Escrowed"       value={`$${totalEscrowed}`}       color="#8b5cf6" sub="USDC" blur={hideStats} /></motion.div>
          <motion.div variants={itemVariants}><StatCard icon={Users}       label="Applicants"     value={totalApplicants}           color="#f59e0b" blur={hideStats} /></motion.div>
        </motion.div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/organization/profile',    icon: Star,       label: 'Brand Profile',   sub: 'Edit logo & info' },
            { href: '/organization/wallet',     icon: DollarSign, label: 'Wallet',          sub: 'Manage escrow funds' },
            { href: '/organization/reputation', icon: Zap,        label: 'Reputation',      sub: 'View your brand score' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href} className="group rounded-xl p-5 flex items-center gap-4 transition-all duration-150" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#1a1a1a' }}>
                <Icon size={16} className="text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-xs text-[#6b7280] truncate mt-0.5">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-[#4b5563] group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Active Jobs ── */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 My Active Deals
              </h2>
              <p className="text-sm text-[#6b7280] mt-1">Track milestone progress and applicants for open jobs.</p>
            </div>
            <Link href="/organization/jobs" className="text-xs font-bold text-[#6b7280] hover:text-white flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {activeJobsList.length === 0 ? (
            <div className="rounded-xl p-10 text-center" style={{ background: '#111111', border: '1px dashed #222222' }}>
              <Briefcase size={32} className="text-[#4b5563] mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No active jobs yet</p>
              <p className="text-xs text-[#6b7280] mt-1">Post a new deal or hire creators to get active campaigns.</p>
              <Link href="/organization/jobs/new" className="mt-4 px-4 py-2 flex items-center justify-center gap-2 w-fit mx-auto text-xs font-semibold bg-white text-black hover:bg-[#f0f0f0] rounded-lg transition-colors">
                <Plus size={14} /> Post a Deal
              </Link>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {activeJobsList.map((job) => (
                <motion.div key={job.id} variants={itemVariants} whileHover={{ y: -4 }}>
                  <div className="rounded-xl flex flex-col justify-between overflow-hidden group hover:border-[#333333] transition-colors" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                            {job.target_platform}
                          </span>
                        </div>
                        <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest text-[#3b82f6]" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base leading-tight mb-2 group-hover:text-[#e5e7eb] transition-colors">{job.title}</h3>
                      <p className="text-xs font-semibold text-[#6b7280] capitalize">{job.post_type?.replace('_', ' ')}</p>
                    </div>

                    <div className="p-5 pt-0 mt-auto">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-lg p-2 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">Budget</p>
                          <p className="font-bold text-[#22c55e] text-xs">${job.total_budget}</p>
                        </div>
                        <div className="rounded-lg p-2 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">Applicants</p>
                          <p className="font-bold text-white text-xs">{job.application_count ?? 0}</p>
                        </div>
                      </div>

                      <Link 
                        href={`/organization/jobs/${job.id}`} 
                        className="w-full flex items-center justify-center py-2 text-xs font-semibold bg-white text-black hover:bg-[#f0f0f0] rounded-lg transition-colors"
                      >
                        Manage Deal
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
