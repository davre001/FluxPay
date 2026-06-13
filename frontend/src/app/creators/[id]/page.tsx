'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, User, Globe, MapPin, Tag, ArrowLeft,
  ExternalLink, CheckCircle2,
} from 'lucide-react';
import { profileAPI } from '@/lib/api-client';

// ── ScoreRing (self-contained for this page) ───────────────────────────────
function ScoreRing({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const targetOffset = circ - (pct / 100) * circ;

  const [offset, setOffset] = useState(circ);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 100);
    const duration = 800;
    const startTime = performance.now();
    const animateNumber = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.floor(score * ease));
      if (progress < 1) requestAnimationFrame(animateNumber);
      else setDisplayScore(score);
    };
    requestAnimationFrame(animateNumber);
    return () => clearTimeout(t);
  }, [targetOffset, score]);

  const tier = score >= 80 ? { label: 'Diamond', color: '#60a5fa' }
             : score >= 60 ? { label: 'Gold',    color: '#f59e0b' }
             : score >= 30 ? { label: 'Silver',  color: '#d1d5db' }
             :               { label: 'Bronze',  color: '#d97706' };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#1a1a1a" strokeWidth="7" />
          <circle cx="50" cy="50" r={r} fill="none"
                  stroke={tier.color} strokeWidth="7"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-white leading-none">{displayScore}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: tier.color }}>{tier.label}</p>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-semibold mt-2">/ {max} Rep</p>
    </div>
  );
}

// ── Social link pill ────────────────────────────────────────────────────────
function SocialPill({ platform, handle }: { platform: string; handle: string }) {
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${handle}`,
    twitter: `https://twitter.com/${handle}`,
    youtube: `https://youtube.com/@${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
  };
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'Twitter / X',
    youtube: 'YouTube',
    tiktok: 'TikTok',
  };

  return (
    <a
      href={urls[platform] || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#d1d5db] hover:text-white transition-colors"
      style={{ background: '#1a1a1a', border: '1px solid #252525' }}
    >
      {labels[platform] || platform}
      <ExternalLink size={10} />
    </a>
  );
}

export default function CreatorProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    profileAPI.getPublic(userId)
      .then(({ data }: any) => {
        setProfile(data);
        setError(null);
      })
      .catch((e: any) => {
        setError(e?.message || 'Profile not found');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <Loader2 size={32} className="text-[#333] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0a0a' }}>
        <User size={48} className="text-[#333]" />
        <p className="text-sm font-semibold text-[#6b7280]">{error || 'Profile not found'}</p>
        <Link href="/explore" className="text-xs font-bold text-white px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors" style={{ border: '1px solid #252525' }}>
          <ArrowLeft size={12} className="inline mr-1" /> Back to Explore
        </Link>
      </div>
    );
  }

  const socials = ['instagram', 'twitter', 'youtube', 'tiktok'].filter(s => profile[s]);
  const reputation = profile.reputation || { score: 0, profile_type: null };
  const isCreator = reputation.profile_type === 'creator';
  const completedDeals = profile.completed_deals || [];

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid #161616' }}>
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} /> Back
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Creator Profile</p>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">{profile.name || userId}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Profile Card ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar + Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center text-white font-black text-2xl shadow-lg">
                  {profile.profile_picture_url
                    ? <img src={profile.profile_picture_url} alt="" className="w-full h-full rounded-full object-cover" />
                    : (profile.name?.[0] || '?').toUpperCase()
                  }
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{profile.name || userId}</h2>
                  {profile.profile_type && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                      {profile.profile_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-[#d1d5db] leading-relaxed mb-5">{profile.bio}</p>
              )}

              {/* Website */}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60a5fa] hover:text-white transition-colors mb-4">
                  <Globe size={12} /> {profile.website_url.replace(/^https?:\/\//, '')}
                </a>
              )}

              {/* Niche tags */}
              {profile.niche_tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.niche_tags.map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#a3e635]"
                          style={{ background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.15)' }}>
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Socials */}
              {socials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {socials.map(s => (
                    <SocialPill key={s} platform={s} handle={profile[s]} />
                  ))}
                </div>
              )}
            </div>

            {/* Score ring */}
            <div className="flex-shrink-0 self-center sm:self-start">
              <ScoreRing score={reputation.score} max={100} />
            </div>
          </div>
        </div>

        {/* ── Completed Deals ── */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-base font-bold text-white tracking-tight mb-5">Completed Deals</h2>
          {completedDeals.length === 0 ? (
            <div className="text-center py-8">
              <MapPin size={28} className="text-[#333] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#6b7280]">No completed deals yet</p>
              <p className="text-xs text-[#4b5563] mt-1">Completed deals will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedDeals.map((deal: any) => (
                <div key={deal.job_id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid #161616' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#22c55e] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{deal.title}</p>
                      <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mt-0.5">{deal.platform}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#22c55e]">${deal.total_budget}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
