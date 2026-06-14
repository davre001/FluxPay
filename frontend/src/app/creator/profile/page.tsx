'use client';

import { useEffect, useState } from 'react';
import {
  Save, Loader2, X, User, Upload, Pencil, Check,
  MapPin, Clock, Star, Shield, TrendingUp, Globe,
  Eye, Trash2, Camera, ArrowRight
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
  { key: 'instagram', icon: InstagramIcon, label: 'Instagram', color: '#e1306c', placeholder: 'your_username' },
  { key: 'twitter',   icon: XLogo,         label: 'Twitter',   color: '#1da1f2', placeholder: 'your_handle' },
  { key: 'youtube',   icon: YoutubeIcon,   label: 'YouTube',   color: '#ff0000', placeholder: 'channel name or URL' },
  { key: 'tiktok',    icon: TikTokIcon,    label: 'TikTok',    color: '#e2e8f0', placeholder: 'your_handle' },
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
  label, value, onChange, placeholder, type = 'text', prefix, textarea, rows = 4, hint, isEditing = true
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
  isEditing?: boolean;
}) {
  const base =
    'w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg text-sm text-white placeholder-[#3d3d3d] focus:outline-none focus:border-[#404040] transition-colors duration-200';
  
  if (!isEditing) {
    return (
      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
          {label}
        </label>
        <div className="text-sm text-white py-2 flex items-center">
          {prefix && <span className="mr-2 text-[#6b7280]">{prefix}</span>}
          {value || <span className="text-[#4b5563] italic">Not provided</span>}
        </div>
      </div>
    );
  }

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
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [niches, setNiches] = useState<string[]>([]);
  const [rep, setRep] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [connected, setConnected] = useState<Record<string, any>>({});
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [showPicMenu, setShowPicMenu] = useState(false);
  const [showPicModal, setShowPicModal] = useState(false);

  const socials: Record<string, string> = { instagram, twitter, youtube, tiktok };
  const socialSetters: Record<string, (v: string) => void> = { instagram: setInstagram, twitter: setTwitter, youtube: setYoutube, tiktok: setTiktok };

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => {
      setName(data?.name || '');
      setEmail(data?.email || user?.email || '');
      setBio(data?.bio || '');
      setWebsiteUrl(data?.website_url || '');
      setLocation(data?.location || '');
      setPicUrl(data?.profile_picture_url || '');
      setNiches(data?.niche_tags || []);
      setInstagram(data?.instagram || '');
      setTwitter(data?.twitter || data?.x || '');
      setYoutube(data?.youtube || '');
      setTiktok(data?.tiktok || '');
      setConnected(data?.connected_socials || {});
    }).catch(() => {});
    // Real reputation + completed-deal count by user id (no walletAddress needed).
    profileAPI.getPublic(user.id)
      .then(({ data }: any) => {
        setRep(typeof data?.reputation?.score === 'number' ? data.reputation.score : null);
        setCompletedCount(Array.isArray(data?.completed_deals) ? data.completed_deals.length : 0);
      })
      .catch(() => {});
  }, [user?.id, user?.email]);

  // Kick off OAuth: get the authorize URL, remember the platform, redirect out.
  const connectSocial = async (platform: string) => {
    try {
      const { data }: any = await profileAPI.socialConnect(platform);
      sessionStorage.setItem('oauth_platform', platform);
      sessionStorage.setItem('oauth_return', '/creator/profile');
      window.location.href = data.authorize_url;
    } catch (e: any) {
      toast.error(e?.message || `${platform} connect is not configured`);
    }
  };

  const disconnectSocial = async (platform: string) => {
    try {
      await profileAPI.socialDisconnect(platform);
      setConnected((prev) => { const next = { ...prev }; delete next[platform]; return next; });
      toast.success(`Disconnected ${platform}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to disconnect');
    }
  };

  const toggleNiche = (n: string) =>
    setNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleSave = async () => {
    if (!name) { toast.error('Name is required'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email address'); return; }
    setSaving(true);
    try {
      await profileAPI.updateMe({
        name, email, bio,
        website_url: websiteUrl || null, location: location || null,
        profile_picture_url: picUrl || null,
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

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPicUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
    setShowPicMenu(false);
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
              <div className="relative inline-flex justify-center">
                <button 
                  onClick={() => isEditing && setShowPicMenu(!showPicMenu)}
                  className={cn("relative group focus:outline-none", !isEditing && "cursor-default")}
                >
                  {picUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={picUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover transition-opacity group-hover:opacity-70"
                      style={{ border: '2px solid #2a2a2a' }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-opacity group-hover:opacity-70"
                      style={{ background: '#1a1a1a', border: '2px solid #222222' }}
                    >
                      <User size={30} className="text-[#4b5563]" />
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <Camera size={20} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </button>

                {/* Profile Pic Dropdown Menu */}
                {showPicMenu && (
                  <div className="absolute top-[85px] left-1/2 -translate-x-1/2 z-50 w-48 rounded-lg shadow-xl py-1" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>
                    {picUrl && (
                      <button onClick={() => { setShowPicModal(true); setShowPicMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525] flex items-center gap-2">
                        <Eye size={14} /> View Picture
                      </button>
                    )}
                    <label className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525] flex items-center gap-2 cursor-pointer">
                      <Upload size={14} /> {picUrl ? 'Change Picture' : 'Add Picture'}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
                    </label>
                    {picUrl && (
                      <button onClick={() => { setPicUrl(''); setShowPicMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#252525] flex items-center gap-2">
                        <Trash2 size={14} /> Remove Picture
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <p className="font-bold text-lg text-white leading-tight">{name || 'Your Name'}</p>
                </div>
                <p className="text-xs text-[#4b5563] truncate">{email || user?.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl p-5 space-y-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4b5563]">Performance</p>
              <div className="space-y-3">
                {[
                  { icon: Star, label: 'Reputation', value: `${rep ?? '—'} / 100`, color: '#f59e0b' },
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
              <p className="text-[10px] text-[#4b5563]">View the Reputation page for your full score breakdown.</p>
            </div>
          </div>

          {/* ── Right Main Content ── */}
          <div className="space-y-5">
            {/* Connected Accounts (OAuth-verified) — always visible */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader title="Connected Accounts" subtitle="Verify ownership to earn +5 reputation each and qualify for follower-gated deals" />
              <div className="space-y-3">
                {[
                  { key: 'youtube', label: 'YouTube', Icon: YoutubeIcon, color: '#ff0000', oauth: true },
                  { key: 'twitter', label: 'X (Twitter)', Icon: XLogo, color: '#e2e8f0', oauth: true },
                  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon, color: '#e1306c', oauth: false },
                  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon, color: '#e2e8f0', oauth: false },
                ].map(({ key, label, Icon, color, oauth }) => {
                  const acct = connected[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg" style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon size={16} color={color} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{label}</p>
                          {acct ? (
                            <p className="text-[11px] text-[#6b7280] truncate">@{acct.handle} · {(acct.followers ?? 0).toLocaleString()} followers{acct.verified ? ' · Verified' : ''}</p>
                          ) : (
                            <p className="text-[11px] text-[#4b5563]">{oauth ? 'Not connected' : 'Coming soon'}</p>
                          )}
                        </div>
                      </div>
                      {acct ? (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22c55e] uppercase tracking-widest"><Check size={11} /> Verified</span>
                          <button onClick={() => disconnectSocial(key)} className="text-[11px] font-semibold text-[#6b7280] hover:text-[#ef4444]">Disconnect</button>
                        </div>
                      ) : oauth ? (
                        <button onClick={() => connectSocial(key)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-[#f0f0f0] flex-shrink-0">Connect</button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4b5563]" style={{ background: '#1a1a1a', border: '1px solid #252525' }}>Soon</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {isEditing ? (
              <>
                {/* Edit: Profile Details */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader title="Profile Details" subtitle="Your public-facing profile information" />
              <div className="space-y-5">
                <PremiumInput
                  label="Display Name"
                  value={name}
                  onChange={setName}
                  placeholder="Your professional name"
                  isEditing={isEditing}
                />
                <PremiumInput
                  label="Email Address"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  isEditing={isEditing}
                />
                <PremiumInput
                  label="Professional Bio"
                  value={bio}
                  onChange={setBio}
                  placeholder="Describe your expertise..."
                  textarea
                  rows={5}
                  hint={isEditing ? `${bio.length} / 500 characters` : undefined}
                  isEditing={isEditing}
                />
                <PremiumInput
                  label="Website"
                  value={websiteUrl}
                  onChange={setWebsiteUrl}
                  placeholder="https://yourportfolio.com"
                  prefix={<Globe size={14} className="text-[#4b5563]" />}
                  isEditing={isEditing}
                />
                <PremiumInput
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. Lagos, Nigeria"
                  prefix={<MapPin size={14} className="text-[#4b5563]" />}
                  isEditing={isEditing}
                />
              </div>
            </div>

            {/* Niches */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader title="Content Niches" subtitle="Select the categories that best describe your content" />
              <div className="flex flex-wrap gap-2">
                {NICHE_OPTIONS.map((ind) => {
                  const active = niches.includes(ind);
                  if (!isEditing && !active) return null;
                  return (
                    <button
                      key={ind}
                      onClick={() => isEditing && toggleNiche(ind)}
                      disabled={!isEditing}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150',
                        active
                          ? 'bg-white text-black border-white'
                          : 'text-[#9ca3af] border-[#1f1f1f] bg-[#0f0f0f]',
                        isEditing && !active && 'hover:border-[#333333] hover:text-white',
                        !isEditing && 'opacity-90 cursor-default'
                      )}
                    >
                      {active && <Check size={11} />}
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Socials */}
            <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <SectionHeader title="Social Channels" subtitle="Enter your social media handles" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SOCIALS.map(({ key, icon: Icon, label, color, placeholder }) => {
                  const value = socials[key];
                  if (!isEditing && !value) return null;
                  return (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
                        {label}
                      </label>
                      {!isEditing ? (
                        <div className="text-sm text-white py-2 flex items-center">
                          <Icon size={16} color={color} />
                          <span className="ml-3 font-medium">@{value}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 flex justify-center z-10">
                            <Icon size={16} color={color} />
                          </div>
                          <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] font-medium">@</div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => socialSetters[key](e.target.value.replace(/^@/, ''))}
                            placeholder={placeholder}
                            className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg text-sm text-white placeholder-[#3d3d3d] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-3 pl-[3.5rem]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button (when editing) */}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-[#f0f0f0] transition-all duration-150 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            )}
          </>
        ) : (
          <>
                {/* View: Profile Details */}
                <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                  <SectionHeader title="Profile Details" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <PremiumInput label="Display Name" value={name} onChange={() => {}} isEditing={false} />
                    <PremiumInput label="Email Address" value={email} onChange={() => {}} isEditing={false} />
                    <PremiumInput label="Website" value={websiteUrl} onChange={() => {}} prefix={<Globe size={14} className="text-[#4b5563]" />} isEditing={false} />
                    <PremiumInput label="Location" value={location} onChange={() => {}} prefix={<MapPin size={14} className="text-[#4b5563]" />} isEditing={false} />
                  </div>
                </div>

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
                    <p className="text-3xl font-black text-white">{completedCount ?? '—'}</p>
                    <p className="text-xs text-[#4b5563] mt-1.5 leading-relaxed">Deals fully delivered and released via smart-contract escrow.</p>
                  </div>
                  <div className="rounded-xl p-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#161616' }}>
                        <Star size={13} className="text-[#f59e0b] fill-[#f59e0b]" />
                      </div>
                      <p className="text-xs font-semibold text-[#9ca3af]">Reputation Score</p>
                    </div>
                    <p className="text-3xl font-black text-white">{rep ?? '—'} <span className="text-lg text-[#4b5563] font-bold">/ 100</span></p>
                    <p className="text-xs text-[#4b5563] mt-1.5 leading-relaxed">View the Reputation page for your full score and tier breakdown.</p>
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

      {/* Picture Viewer Modal */}
      {showPicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPicModal(false)}>
          <div className="relative max-w-2xl w-full p-4 flex flex-col items-center">
            <button className="absolute top-0 right-0 p-2 text-white hover:text-gray-300" onClick={() => setShowPicModal(false)}>
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picUrl} alt="Creator Avatar" className="w-full max-h-[80vh] object-contain rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
