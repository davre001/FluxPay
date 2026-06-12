'use client';

import { useEffect, useState } from 'react';
import {
  Save, Loader2, X, User, Upload, Pencil, Check,
  MapPin, Clock, Star, Shield, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

/* ── Social icons ── */
const InstagramIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const TikTokIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food',
  'Travel', 'Lifestyle', 'Finance', 'Music', 'Education', 'Comedy', 'Sports', 'Art',
];

const XLogo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SOCIALS = [
  { key: 'instagram', icon: InstagramIcon, label: 'Instagram', color: '#e1306c', placeholder: 'username (without @)' },
  { key: 'twitter',   icon: XLogo,         label: 'Twitter',   color: '#1da1f2', placeholder: 'handle (without @)' },
  { key: 'youtube',   icon: YoutubeIcon,   label: 'YouTube',   color: '#ff0000', placeholder: 'channel ID or URL' },
  { key: 'tiktok',    icon: TikTokIcon,    label: 'TikTok',    color: '#e2e8f0', placeholder: 'handle (without @)' },
] as const;

/* ── Reusable section header ── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-[#6b7280] mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ── Premium input ── */
function PremiumInput({
  label, value, onChange, placeholder, type = 'text', prefix, textarea, rows = 4, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: React.ReactNode;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  const base =
    'w-full bg-[#111111] border border-[#1f1f1f] rounded-lg text-sm text-white placeholder-[#3d3d3d] focus:outline-none focus:border-[#404040] transition-colors duration-200';
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">{prefix}</span>
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn(base, 'px-4 py-3 resize-none leading-relaxed', prefix && 'pl-9')}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(base, 'px-4 py-3 h-11', prefix && 'pl-9')}
          />
        )}
      </div>
      {hint && <p className="text-[11px] text-[#4b5563] mt-1">{hint}</p>}
    </div>
  );
}

export default function CreatorProfilePage() {
  const { user } = useUserStore();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [niches, setNiches] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  const socials: Record<string, string> = { instagram, twitter, youtube, tiktok };
  const socialSetters: Record<string, (v: string) => void> = { instagram: setInstagram, twitter: setTwitter, youtube: setYoutube, tiktok: setTiktok };

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => {
      setName(data?.name || '');
      setBio(data?.bio || '');
      setPicUrl(data?.profile_picture_url || '');
      setNiches(data?.niche_tags || []);
      setInstagram(data?.instagram || '');
      setTwitter(data?.twitter || data?.x || '');
      setYoutube(data?.youtube || '');
      setTiktok(data?.tiktok || '');
    }).catch(() => {});
  }, [user?.id]);

  const toggleNiche = (n: string) =>
    setNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateMe({
        name, bio, profile_picture_url: picUrl || null,
        niche_tags: niches, instagram: instagram || null,
        twitter: twitter || null, youtube: youtube || null, tiktok: tiktok || null,
      });
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── Top Header Bar ── */}
      <div style={{ borderBottom: '1px solid #161616', background: 'rgba(10,10,10,0.92)' }} className="sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">Creator</p>
            <h1 className="text-lg font-bold text-white leading-none mt-0.5">My Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-black bg-white hover:bg-[#f0f0f0] rounded-lg transition-all duration-150 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-150',
                isEditing
                  ? 'border-[#2a2a2a] text-[#9ca3af] hover:text-white hover:border-[#404040] bg-transparent'
                  : 'border-[#222222] text-[#d1d5db] hover:text-white hover:border-[#404040] bg-[#111111]'
              )}
            >
              {isEditing ? <><X size={14} /> Cancel</> : <><Pencil size={14} /> Edit Profile</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

          {/* ── Left Sidebar ── */}
          <div className="space-y-4">

            {/* Identity Card */}
            <div className="rounded-xl p-6 text-center space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="relative inline-block">
                {picUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={picUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover"
                    style={{ border: '2px solid #2a2a2a' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: '#1a1a1a', border: '2px solid #222222' }}
                  >
                    <User size={30} className="text-[#4b5563]" />
                  </div>
                )}
                <span
                  className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full"
                  style={{ background: '#22c55e', border: '2px solid #111111' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <p className="font-bold text-lg text-white leading-tight">{name || 'Your Name'}</p>
                  <img src="https://img.icons8.com/fluency/48/verified-badge.png" className="w-4 h-4 flex-shrink-0" alt="Verified" />
                </div>
                <p className="text-xs text-[#4b5563] truncate">{user?.email}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold bg-white text-black">
                  Pro Creator
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold text-[#d1d5db]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                  <Star size={10} className="fill-[#f59e0b] text-[#f59e0b]" /> 4.8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin size={11} className="text-[#4b5563]" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Location</p>
                  </div>
                  <p className="text-xs font-semibold text-[#d1d5db]">Remote / Global</p>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Clock size={11} className="text-[#4b5563]" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Response</p>
                  </div>
                  <p className="text-xs font-semibold text-[#d1d5db]">{'< 2 hours'}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl p-5 space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Performance</p>
              <div className="space-y-3">
                {[
                  { icon: TrendingUp, label: 'Escrow Success', value: '100%', color: '#22c55e' },
                  { icon: Star, label: 'Reputation Score', value: '4.8 / 5', color: '#f59e0b' },
                  { icon: Shield, label: 'Verified Status', value: 'Verified', color: '#60a5fa' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #161616' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
                        <Icon size={13} style={{ color }} />
                      </div>
                      <span className="text-xs text-[#9ca3af]">{label}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Channels */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Social Channels</p>
              {SOCIALS.map(({ key, icon: Icon, label, color }) => {
                const val = socials[key];
                const connected = Boolean(val);
                return (
                  <div key={key} className="flex items-center gap-3 py-2.5 rounded-lg px-3" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
                    <Icon size={14} color={connected ? color : '#374151'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">{label}</p>
                      <p className="text-xs font-semibold text-[#d1d5db] truncate">
                        {connected ? `@${val}` : <span className="text-[#374151]">Not connected</span>}
                      </p>
                    </div>
                    {connected && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] flex-shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Wallet */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Smart Wallet</p>
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              </div>
              <p className="text-xs text-[#4b5563] leading-relaxed">USDC escrow payments — automated via smart contracts.</p>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#d1d5db] flex-shrink-0" />
                <span className="text-[11px] font-mono text-[#9ca3af] truncate select-all">
                  {user?.walletAddress ?? 'No wallet connected'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Main Content ── */}
          <div className="space-y-5">
            {isEditing ? (
              <>
                {/* Edit: Profile Details */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Profile Details" subtitle="Your public-facing profile information" />
                  <div className="space-y-5">

                    {/* Avatar upload */}
                    <div>
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
                        Profile Photo
                      </label>
                      {picUrl ? (
                        <div className="flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <div className="relative group">
                            <img src={picUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover" style={{ border: '1px solid #222222' }} />
                            <button
                              type="button"
                              onClick={() => setPicUrl('')}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                          <p className="text-xs text-[#6b7280]">Click × to remove and upload a new photo.</p>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-28 cursor-pointer rounded-xl transition-colors hover:border-[#404040]" style={{ border: '1.5px dashed #222222', background: '#0f0f0f' }}>
                          <Upload size={18} className="text-[#4b5563] mb-2" />
                          <p className="text-sm font-semibold text-[#9ca3af]">Upload Photo</p>
                          <p className="text-[11px] text-[#4b5563] mt-0.5">PNG, JPG or WEBP</p>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setPicUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <PremiumInput
                      label="Display Name"
                      value={name}
                      onChange={setName}
                      placeholder="Your professional name"
                    />

                    <PremiumInput
                      label="Professional Bio"
                      value={bio}
                      onChange={setBio}
                      placeholder="Describe your expertise, audience size, and what content you specialise in…"
                      textarea
                      rows={5}
                      hint={`${bio.length} / 500 characters`}
                    />
                  </div>
                </div>

                {/* Edit: Niches */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Content Niches" subtitle="Select the categories that best describe your content" />
                  <div className="flex flex-wrap gap-2">
                    {NICHE_OPTIONS.map((n) => {
                      const active = niches.includes(n);
                      return (
                        <button
                          key={n}
                          onClick={() => toggleNiche(n)}
                          className={cn(
                            'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                            active
                              ? 'bg-white text-black border-white'
                              : 'text-[#9ca3af] border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333333] hover:text-white'
                          )}
                        >
                          {active && <Check size={11} />}
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Edit: Socials */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Social Channels" subtitle="Connect your social media accounts" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SOCIALS.map(({ key, icon: Icon, label, color, placeholder }) => (
                      <PremiumInput
                        key={key}
                        label={label}
                        value={socials[key]}
                        onChange={(v) => socialSetters[key](v)}
                        placeholder={placeholder}
                        prefix={<Icon size={14} color={color} />}
                      />
                    ))}
                  </div>
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-all duration-150 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </>
            ) : (
              <>
                {/* View: Bio */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Professional Summary" />
                  {bio ? (
                    <p className="text-sm leading-relaxed text-[#9ca3af] whitespace-pre-wrap">{bio}</p>
                  ) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: '#161616' }}>
                        <User size={18} className="text-[#374151]" />
                      </div>
                      <p className="text-sm text-[#4b5563] font-medium">No bio added yet</p>
                      <p className="text-xs text-[#374151] mt-1">Click <strong className="text-[#6b7280]">Edit Profile</strong> to add your professional summary.</p>
                    </div>
                  )}
                </div>

                {/* View: Niches */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Content Niches" />
                  {niches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {niches.map((n) => (
                        <span
                          key={n}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#d1d5db]"
                          style={{ background: '#1a1a1a', border: '1px solid #222222' }}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#374151] italic">No niches selected yet.</p>
                  )}
                </div>

                {/* View: Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#161616' }}>
                        <TrendingUp size={13} className="text-[#22c55e]" />
                      </div>
                      <p className="text-xs font-semibold text-[#9ca3af]">Completed Escrows</p>
                    </div>
                    <p className="text-3xl font-black text-white">100%</p>
                    <p className="text-xs text-[#4b5563] mt-1.5 leading-relaxed">All milestones delivered on-time via smart contracts.</p>
                  </div>
                  <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#161616' }}>
                        <Star size={13} className="text-[#f59e0b] fill-[#f59e0b]" />
                      </div>
                      <p className="text-xs font-semibold text-[#9ca3af]">On-Chain Reputation</p>
                    </div>
                    <p className="text-3xl font-black text-white">4.8 <span className="text-[#f59e0b] text-2xl">★</span></p>
                    <p className="text-xs text-[#4b5563] mt-1.5 leading-relaxed">Silver tier rating backed by verified on-chain deal history.</p>
                  </div>
                </div>

                {/* View: Quick links */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Linked Accounts" subtitle="Your connected social handles" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SOCIALS.map(({ key, icon: Icon, label, color }) => {
                      const val = socials[key];
                      const connected = Boolean(val);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg"
                          style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}
                        >
                          <Icon size={14} color={connected ? color : '#374151'} />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">{label}</p>
                            <p className="text-xs font-semibold text-[#d1d5db] truncate">
                              {connected ? `@${val}` : <span className="text-[#374151] font-normal">Not linked</span>}
                            </p>
                          </div>
                          {connected && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] ml-auto flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
