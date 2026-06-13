'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, ArrowRight, Zap, Instagram, Twitter, Youtube, Music2,
} from 'lucide-react';
import { jobAPI } from '@/lib/api-client';

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'other'];
const POST_TYPES = ['all', 'video', 'image', 'content_writing', 'other'];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c', twitter: '#1da1f2', youtube: '#ff0000',
  tiktok: '#69c9d0', other: '#8b5cf6',
};

const MOCK_JOBS = [
  { id: 'm1', title: 'Summer Fashion Campaign', description: 'Looking for creators to showcase our new summer collection.', target_platform: 'instagram', post_type: 'video', total_budget: 1500, status: 'open', organization: { brand_name: 'StyleBrand' }, milestones: [1,2] },
  { id: 'm2', title: 'Tech Review - New Wireless Earbuds', description: 'Seeking tech reviewers for an honest unboxing and review.', target_platform: 'youtube', post_type: 'video', total_budget: 3000, status: 'open', organization: { brand_name: 'AudioTech' }, milestones: [1,2,3] },
  { id: 'm3', title: 'Viral Dance Challenge', description: 'Join our viral hashtag challenge and create a short dance video.', target_platform: 'tiktok', post_type: 'video', total_budget: 800, status: 'open', organization: { brand_name: 'GrooveApp' }, milestones: [1] },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');

  useEffect(() => {
    // Try to fetch real jobs, fallback to mock data if API fails or returns unauthorized
    jobAPI.list({ status: 'open' })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
        } else {
          setJobs(MOCK_JOBS);
        }
      })
      .catch(() => {
        setJobs(MOCK_JOBS);
      });
  }, []);

  // Update URL on search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set('q', search.trim());
    } else {
      params.delete('q');
    }
    router.replace(`/explore?${params.toString()}`);
  }, [search, router]);

  const filtered = jobs.filter((j) => {
    if (platform !== 'all' && j.target_platform !== platform) return false;
    if (postType !== 'all' && j.post_type !== postType) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !(j.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto mt-24 px-6 md:px-10 pb-20">
      {/* Header */}
      <div className="mb-8 fade-in text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Opportunities</p>
        <h1 className="text-4xl md:text-5xl font-black text-white">Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">Deals</span></h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl mx-auto">Discover top brand deals and collaborations secured on-chain. Sign up to apply and start earning.</p>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or brand..." 
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-white transition-colors" 
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select 
              value={platform} 
              onChange={(e) => setPlatform(e.target.value)} 
              className="bg-[#1a1a1a] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors flex-1 md:w-40"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} style={{ background: '#0a0a0f' }}>
                  {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <select 
              value={postType} 
              onChange={(e) => setPostType(e.target.value)} 
              className="bg-[#1a1a1a] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-colors flex-1 md:w-40"
            >
              {POST_TYPES.map((p) => (
                <option key={p} value={p} style={{ background: '#0a0a0f' }}>
                  {p === 'all' ? 'All Types' : p.replace('_', ' ').charAt(0).toUpperCase() + p.replace('_', ' ').slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-6 font-semibold text-center">{filtered.length} deal{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] rounded-2xl border border-dashed border-[#333]">
          <Zap size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No deals match your search</p>
          <button onClick={() => { setSearch(''); setPlatform('all'); setPostType('all'); }}
                  className="mt-4 px-6 py-2 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#222]">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((job) => {
            const PlatformIcon = PLATFORM_ICON[job.target_platform] ?? Zap;
            const platColor = PLATFORM_COLOR[job.target_platform] ?? '#8b5cf6';
            
            return (
              <div key={job.id} className="flex flex-col bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#333] transition-colors">
                <div className="p-6 flex-1">
                  {/* Brand row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {(job.organization?.brand_name?.[0] ?? 'B').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{job.organization?.brand_name ?? 'Brand'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PlatformIcon size={11} style={{ color: platColor }} />
                        <span className="text-xs text-slate-500 capitalize">{job.target_platform}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-black text-white mb-2 leading-tight text-lg">{job.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-6">{job.description}</p>
                  
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#222]">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Budget</p>
                      <p className="font-black text-[#a3e635] text-sm">${job.total_budget} <span className="text-[10px] text-slate-500">USDC</span></p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#222]">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Type</p>
                      <p className="font-black text-white text-sm capitalize">{job.post_type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-6 pt-0 mt-auto">
                  <Link 
                    href="/auth/signup" 
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-colors"
                  >
                    Sign in to Apply <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
