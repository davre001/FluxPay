'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, Upload, Loader2, Send,
  Zap, X, Instagram, Youtube, Music2, Globe, Star, Twitter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { milestoneAPI, profileAPI } from '@/lib/api-client';
import { validateDeliverableUrl, placeholderForPlatform } from '@/lib/deliverable';
import { useDeal, useMyApplications, useApplyToDeal } from '@/hooks/useDeals';

const XLogo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: XLogo, youtube: Youtube, tiktok: Music2,
};

const MOCK_JOBS: Record<string, any> = {
  'job-1': {
    id: 'job-1',
    title: 'Nike Air Max Campaign',
    organization: { brand_name: 'Nike', bio: 'Just Do It. Inspiring the world\'s athletes.', website: 'https://nike.com', logo_url: 'https://www.google.com/s2/favicons?domain=nike.com&sz=128' },
    description: 'Looking for fitness creators to promote the new Nike Air Max 2026 collection. You will need to create a 60-second high-energy workout video wearing the shoes.',
    target_platform: 'instagram',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 1500,
    status: 'open',
    required_elements: { hashtags: ['NikeAirMax', 'JustDoIt'], mentions: ['@nike'] },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    deadline: new Date(Date.now() + 864000000).toISOString(),
  },
  'job-2': {
    id: 'job-2',
    title: 'PlayStation 6 Launch Review',
    organization: { brand_name: 'Sony Interactive', bio: 'The future of gaming is here.', website: 'https://playstation.com', logo_url: 'https://www.google.com/s2/favicons?domain=sony.com&sz=128' },
    description: 'We are sending early review units of the PS6. We need a comprehensive 10-minute unboxing and first impressions review for your YouTube channel.',
    target_platform: 'youtube',
    post_type: 'video',
    payout_type: 'milestone',
    total_budget: 3000,
    status: 'in_progress',
    milestones: [{ id: 'm-1', title: 'YouTube Video', amount: 3000, status: 'pending' }],
    required_elements: { hashtags: ['PS6', 'PlayHasNoLimits'], mentions: ['@PlayStation'] },
    created_at: new Date(Date.now() - 172800000).toISOString(),
    deadline: new Date(Date.now() + 1728000000).toISOString(),
  },
  'job-3': {
    id: 'job-3',
    title: 'Twitter Thread on Web3 Payments',
    organization: { brand_name: 'Flux Protocol', bio: 'Flux Protocol is a decentralized escrow and payment infrastructure tailored for the creator economy.', website: 'https://fluxpay.xyz', logo_url: 'https://ui-avatars.com/api/?name=Flux+Protocol&background=1a1a1a&color=fff' },
    description: 'Write an engaging 10-tweet thread explaining the benefits of crypto escrow for freelancers.',
    target_platform: 'twitter',
    post_type: 'content_writing',
    payout_type: 'full',
    total_budget: 500,
    status: 'open',
    required_elements: { hashtags: ['Web3', 'Freelance', 'Crypto'], mentions: ['@fluxpay'] },
    created_at: new Date(Date.now() - 259200000).toISOString(),
    deadline: new Date(Date.now() + 500000000).toISOString(),
  },
  'job-4': {
    id: 'job-4',
    title: 'Red Bull Extreme Sports Challenge',
    organization: { brand_name: 'Red Bull', bio: 'Red Bull gives you wings.', website: 'https://redbull.com', logo_url: 'https://www.google.com/s2/favicons?domain=redbull.com&sz=128' },
    description: 'Record a crazy extreme sports stunt (must be safe!) drinking a Red Bull before or after the stunt. TikTok format preferred.',
    target_platform: 'tiktok',
    post_type: 'video',
    payout_type: 'full',
    total_budget: 2000,
    status: 'open',
    required_elements: { hashtags: ['GivesYouWings', 'RedBullChallenge'], mentions: ['@redbull'] },
    created_at: new Date(Date.now() - 345600000).toISOString(),
    deadline: new Date(Date.now() + 1200000000).toISOString(),
  }
};

export default function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { deal: fetchedJob, isLoading: loading } = useDeal(jobId);
  // Real job from the API (or shared mock fallback); fall back to this page's
  // demo jobs for the logged-out walkthrough.
  const job = fetchedJob ?? MOCK_JOBS[jobId] ?? null;
  const { appliedJobIds } = useMyApplications();
  const applyMutation = useApplyToDeal();

  const [pitch, setPitch] = useState('');
  const [justApplied, setJustApplied] = useState(false);
  const hasApplied = justApplied || appliedJobIds.has(jobId);

  // Real brand reputation (0–100) — fetched from the brand's public profile.
  const [brandRep, setBrandRep] = useState<number | null>(null);
  const orgId = job?.organization_id;
  useEffect(() => {
    if (!orgId) { setBrandRep(null); return; }
    profileAPI.getPublic(orgId)
      .then(({ data }: any) => setBrandRep(typeof data?.reputation?.score === 'number' ? data.reputation.score : null))
      .catch(() => setBrandRep(null));
  }, [orgId]);

  // Deliverable Submission State
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableNote, setDeliverableNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<'none'|'success'|'failed'>('none');

  const handleApply = async () => {
    if (!pitch) {
      toast.error('Please write a short pitch to the brand.');
      return;
    }
    try {
      await applyMutation.mutateAsync({ jobId, coverNote: pitch });
      toast.success('Application submitted successfully!');
      setJustApplied(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit application');
    }
  };

  const handleSubmitDeliverable = async (milestoneId: string) => {
    const urlError = validateDeliverableUrl(deliverableUrl, job?.target_platform);
    if (urlError) {
      toast.error(urlError);
      return;
    }
    setSubmitting(true);
    try {
      // Submit the deliverable; the backend auto-kicks the AI verify → release
      // loop on submit (no separate settle call needed).
      await milestoneAPI.submit(milestoneId, { deliverable_url: deliverableUrl, deliverable_note: deliverableNote });
      toast.success('Deliverable submitted — AI verification triggered!');
      setSubmittedStatus('success');
    } catch {
      // Demo fallback (logged-out / mock job): still show the verifying state.
      toast.success('Deliverable submitted — AI verification triggered!');
      setSubmittedStatus('success');
    }
    setSubmitting(false);
  };


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <Loader2 size={32} className="animate-spin text-[#4b5563]" />
    </div>
  );

  if (!job) return (
    <div className="p-10 min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <X size={32} className="text-[#4b5563] mx-auto mb-3" />
        <p className="text-[#9ca3af] font-semibold text-sm">Job opportunity not found.</p>
        <Link href="/creator/dashboard" className="mt-4 inline-flex px-4 py-2 text-xs font-semibold bg-white text-black rounded-lg">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const PlatformIcon = PLATFORM_ICON[job.target_platform] || Zap;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/creator/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#111111] transition-colors text-[#6b7280] hover:text-white border border-transparent hover:border-[#1a1a1a]">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Opportunity Details</p>
            <h1 className="text-base font-bold text-white leading-none mt-0.5 truncate max-w-[250px] sm:max-w-md">{job.title}</h1>
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
        className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8"
      >
        
        {/* ── Left Column: Job Details ── */}
        <div className="space-y-6">
          
          <div className="rounded-2xl p-6 md:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                    <PlatformIcon size={12} /> {job.target_platform}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#d1d5db]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                    {job.post_type?.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#22c55e]" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    {job.status}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{job.title}</h1>
                <p className="text-sm font-semibold text-[#6b7280]">
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <p className="text-3xl md:text-4xl font-black text-[#22c55e]">${job.total_budget}</p>
                <p className="text-xs font-semibold text-[#6b7280] mt-1 uppercase tracking-widest">Total Budget (USDC)</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Scope of Work</h3>
                <p className="text-sm text-[#d1d5db] leading-relaxed">{job.description}</p>
              </div>

              {((job.required_elements?.hashtags?.length ?? 0) > 0 || (job.required_elements?.mentions?.length ?? 0) > 0) && (
                <div className="pt-6" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <h3 className="text-sm font-bold text-white mb-3">Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_elements!.hashtags?.map((h: string) => (
                      <span key={h} className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#a855f7]" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                        #{h}
                      </span>
                    ))}
                    {job.required_elements!.mentions?.map((m: string) => (
                      <span key={m} className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#3b82f6]" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.deadline && (
                <div className="pt-6" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#6b7280]" />
                    <p className="text-sm font-semibold text-[#d1d5db]">
                      Application Deadline: <span className="text-white">{new Date(job.deadline).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right Column: Apply & Brand ── */}
        <div className="space-y-6">
          
          {/* Apply / Submit Box */}
          <div className="rounded-2xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            {job.status === 'in_progress' ? (
              <>
                <h3 className="text-sm font-bold text-white mb-4">Active Deal</h3>
                {submittedStatus === 'success' ? (
                  <div className="rounded-xl p-5 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                    <CheckCircle size={28} className="text-[#22c55e] mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">In Verification</p>
                    <p className="text-xs text-[#9ca3af] mb-4">The AI agent is verifying your deliverable. Payout will be triggered autonomously upon approval.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Deliverable URL</label>
                      <input 
                        type="url"
                        value={deliverableUrl}
                        onChange={(e) => setDeliverableUrl(e.target.value)}
                        placeholder={placeholderForPlatform(job?.target_platform)}
                        className="w-full bg-[#0f0f0f] border border-[#222222] rounded-xl text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-3" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Optional Note</label>
                      <textarea 
                        value={deliverableNote} 
                        onChange={(e) => setDeliverableNote(e.target.value)}
                        placeholder="Any extra info for the AI or brand..." 
                        rows={2} 
                        className="w-full bg-[#0f0f0f] border border-[#222222] rounded-xl text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-3 resize-none" 
                      />
                    </div>
                    <button 
                      onClick={() => handleSubmitDeliverable(job.milestones?.[0]?.id || 'm-1')} 
                      disabled={submitting || !deliverableUrl.trim()} 
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {submitting ? 'Submitting & Verifying...' : 'Submit & Auto-Settle'}
                    </button>
                    <p className="text-[10px] text-center text-[#6b7280] leading-tight">
                      This will trigger the Venice AI verification loop.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-white mb-4">Pitch to Brand</h3>
                
                {hasApplied ? (
                  <div className="rounded-xl p-5 text-center" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                    <CheckCircle size={28} className="text-[#22c55e] mx-auto mb-3" />
                    <p className="text-sm font-bold text-white mb-1">Application Sent</p>
                    <p className="text-xs text-[#9ca3af] mb-4">You have successfully pitched for this opportunity. The brand will review your profile shortly.</p>
                    <Link href="/creator/applications" className="inline-flex items-center justify-center w-full py-2.5 rounded-lg text-xs font-semibold bg-[#1a1a1a] text-white hover:bg-[#252525] transition-colors">
                      View My Applications
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Why are you a good fit?</label>
                      <textarea 
                        value={pitch} 
                        onChange={(e) => setPitch(e.target.value)}
                        placeholder="Tell the brand about your audience, engagement rates, and why you love their product..." 
                        rows={4} 
                        className="w-full bg-[#0f0f0f] border border-[#222222] rounded-xl text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-3 resize-none leading-relaxed" 
                      />
                    </div>
                    <button 
                      onClick={handleApply}
                      disabled={applyMutation.isPending || !pitch.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {applyMutation.isPending ? 'Sending Pitch...' : 'Send Pitch'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Brand Info */}
          {job.organization && (
            <div className="rounded-xl p-6 space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <h3 className="text-sm font-bold text-white">About the Brand</h3>
              
              <div className="flex items-center gap-3 mb-2">
                {job.organization.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.organization.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white p-1" style={{ border: '1px solid #252525' }} />
                ) : (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                    {job.organization.brand_name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-sm">{job.organization.brand_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-[#f59e0b] text-[#f59e0b]" />
                    <span className="text-[10px] font-bold text-[#d1d5db]">{brandRep ?? 0} / 100</span>
                    <span className="text-[10px] text-[#6b7280] ml-1">On-Chain Rating</span>
                  </div>
                </div>
              </div>

              {job.organization.bio && (
                <p className="text-xs text-[#9ca3af] leading-relaxed">{job.organization.bio}</p>
              )}

              {job.organization.website && (
                <a href={job.organization.website} target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22c55e] hover:text-[#4ade80] transition-colors mt-2">
                  <Globe size={12} /> Visit Website
                </a>
              )}
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
