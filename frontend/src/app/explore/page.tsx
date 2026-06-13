'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, ArrowRight, Zap, Instagram, Twitter, Youtube, Music2, Star, CheckCircle, User
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';

const PLATFORMS = ['all', 'instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'other'];
const POST_TYPES = ['all', 'video', 'image', 'content_writing', 'other'];

const PLATFORM_ICON: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, youtube: Youtube, tiktok: Music2,
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: '#e1306c', twitter: '#1da1f2', youtube: '#ff0000',
  tiktok: '#69c9d0', other: '#8b5cf6',
};

const MOCK_CREATORS = [
  // Fashion (3 creators)
  { id: 'c1', name: 'Sarah Style', bio: 'High-end fashion, beauty, and daily vlogs showing authentic lifestyle content.', platforms: ['instagram', 'tiktok'], niches: ['Fashion', 'Beauty', 'Lifestyle'], rating: 5.0, completed_deals: 34 },
  { id: 'c2', name: 'VogueVibes', bio: 'Streetwear fashion models and trend analysis for Gen Z.', platforms: ['instagram', 'youtube'], niches: ['Fashion', 'Streetwear'], rating: 4.8, completed_deals: 19 },
  { id: 'c3', name: 'Elena Wears', bio: 'Sustainable fashion advocate reviewing eco-friendly apparel brands.', platforms: ['tiktok', 'twitter'], niches: ['Fashion', 'Sustainability'], rating: 5.0, completed_deals: 42 },

  // Tech Startup (4 creators)
  { id: 'c4', name: 'DevMike', bio: 'Software engineer sharing coding tutorials, startup life, and developer tools.', platforms: ['twitter', 'youtube'], niches: ['Tech Startup', 'Education', 'Programming'], rating: 5.0, completed_deals: 8 },
  { id: 'c5', name: 'Startup Chronicles', bio: 'Reviewing the latest tech startups, SaaS tools, and entrepreneurship tips.', platforms: ['youtube', 'twitter'], niches: ['Tech Startup', 'Business'], rating: 4.9, completed_deals: 27 },
  { id: 'c6', name: 'InnovateDaily', bio: 'Short-form content about new tech startups and AI tools.', platforms: ['tiktok', 'instagram'], niches: ['Tech Startup', 'AI'], rating: 4.7, completed_deals: 14 },
  { id: 'c7', name: 'FoundersHub', bio: 'Interviews and deep-dives into early stage tech startups.', platforms: ['youtube'], niches: ['Tech Startup', 'Finance'], rating: 5.0, completed_deals: 51 },

  // E-commerce (2 creators)
  { id: 'c8', name: 'ShopWithChloe', bio: 'Unboxing e-commerce products, Amazon finds, and lifestyle deals.', platforms: ['tiktok', 'instagram'], niches: ['E-commerce', 'Lifestyle'], rating: 5.0, completed_deals: 63 },
  { id: 'c9', name: 'RetailTherapy', bio: 'Honest reviews of D2C e-commerce brands and dropshipping products.', platforms: ['youtube'], niches: ['E-commerce', 'Reviews'], rating: 4.8, completed_deals: 22 },

  // SaaS (3 creators)
  { id: 'c10', name: 'SaaS Master', bio: 'B2B content creator reviewing productivity and SaaS applications.', platforms: ['youtube', 'twitter'], niches: ['SaaS', 'Productivity'], rating: 5.0, completed_deals: 31 },
  { id: 'c11', name: 'Workflow Wiz', bio: 'Helping businesses automate their workflows using top SaaS products.', platforms: ['twitter', 'instagram'], niches: ['SaaS', 'Automation'], rating: 4.9, completed_deals: 16 },
  { id: 'c12', name: 'Cloud Native', bio: 'Deep dives into enterprise SaaS, cloud architecture, and dev ops.', platforms: ['youtube', 'twitter'], niches: ['SaaS', 'Cloud'], rating: 4.8, completed_deals: 11 },
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const role = searchParams.get('role') || 'creator'; // 'creator' looks for jobs, 'brand' looks for creators

  const { deals: jobs } = useDeals({ status: 'open' });
  const [creators] = useState<any[]>(MOCK_CREATORS);
  const [search, setSearch] = useState(initialQuery);
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');

  // Update URL on search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set('q', search.trim());
    } else {
      params.delete('q');
    }
    // Keep the role query param intact
    params.set('role', role);
    router.replace(`/explore?${params.toString()}`);
  }, [search, router, role]);

  const filteredJobs = jobs.filter((j) => {
    if (platform !== 'all' && j.target_platform !== platform) return false;
    if (postType !== 'all' && j.post_type !== postType) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !(j.organization?.brand_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredCreators = creators.filter((c) => {
    if (platform !== 'all' && !c.platforms.includes(platform)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !c.niches.some((n: string) => n.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const isBrand = role === 'brand';
  const displayedItems = isBrand ? filteredCreators : filteredJobs;

  return (
    <div className="max-w-7xl mx-auto mt-24 px-6 md:px-10 pb-20">
      {/* Header */}
      <div className="mb-8 fade-in text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          {isBrand ? 'Top Creators' : 'Opportunities'}
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white">
          Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] to-[#4ade80]">{isBrand ? 'Creators' : 'Deals'}</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl mx-auto">
          {isBrand 
            ? 'Discover top verified creators ready to collaborate with your brand on-chain.' 
            : 'Discover top brand deals and collaborations secured on-chain. Sign up to apply and start earning.'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 mb-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBrand ? "Search by creator name or niche..." : "Search by job title or brand..."} 
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
            {!isBrand && (
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
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-6 font-semibold text-center">{displayedItems.length} {isBrand ? 'creator' : 'deal'}{displayedItems.length !== 1 ? 's' : ''} found</p>

      {/* Cards List */}
      {displayedItems.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] rounded-2xl border border-dashed border-[#333]">
          <Zap size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No {isBrand ? 'creators' : 'deals'} match your search</p>
          <button onClick={() => { setSearch(''); setPlatform('all'); setPostType('all'); }}
                  className="mt-4 px-6 py-2 rounded-xl text-sm font-bold bg-[#1a1a1a] text-white hover:bg-[#222]">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isBrand ? (
            /* Render Creator Cards */
            displayedItems.map((creator) => (
              <div key={creator.id} className="flex flex-col bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#333] transition-colors relative group">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#a3e635] to-[#4ade80] flex items-center justify-center text-black font-black text-lg flex-shrink-0">
                        {creator.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-base leading-none">{creator.name}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <CheckCircle size={12} className="text-[#a3e635]" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Verified Creator</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">{creator.bio}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {creator.niches.map((niche: string) => (
                      <span key={niche} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#1a1a1a] border border-[#333] text-slate-300">
                        {niche}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 py-4 border-t border-[#1f1f1f]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-white font-black text-sm">
                        <Star size={14} className="text-amber-400 fill-amber-400" /> {creator.rating}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Reputation</span>
                    </div>
                    <div className="h-6 w-px bg-[#333]"></div>
                    <div className="flex flex-col">
                      <div className="text-white font-black text-sm">{creator.completed_deals}</div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Deals Done</span>
                    </div>
                    <div className="ml-auto flex gap-1.5">
                      {creator.platforms.map((plat: string) => {
                        const Icon = PLATFORM_ICON[plat] ?? Zap;
                        return <Icon key={plat} size={16} style={{ color: PLATFORM_COLOR[plat] }} />;
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-0 mt-auto">
                  <Link 
                    href="/auth/signup?type=organization" 
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#a3e635] text-black hover:bg-[#bbf7d0] transition-colors"
                  >
                    Hire Creator <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            /* Render Job Cards */
            displayedItems.map((job) => {
              const PlatformIcon = PLATFORM_ICON[job.target_platform] ?? Zap;
              const platColor = PLATFORM_COLOR[job.target_platform] ?? '#8b5cf6';
              
              return (
                <div key={job.id} className="flex flex-col bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#333] transition-colors">
                  <div className="p-6 flex-1">
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
            })
          )}
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
