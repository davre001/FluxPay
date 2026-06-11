'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, X, User, Upload, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

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

const SOCIALS = [
  { key: 'instagram', icon: InstagramIcon, label: 'Instagram', color: '#e1306c', placeholder: 'handle (without @)' },
  { key: 'twitter',   icon: X,             label: 'Twitter / X', color: '#000000', placeholder: 'handle (without @)' },
  { key: 'youtube',   icon: YoutubeIcon,   label: 'YouTube',   color: '#ff0000', placeholder: 'channel handle' },
  { key: 'tiktok',    icon: TikTokIcon,    label: 'TikTok',    color: '#010101', placeholder: 'handle (without @)' },
] as const;

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

  const socials = { instagram, twitter, youtube, tiktok };
  const socialSetters = { instagram: setInstagram, twitter: setTwitter, youtube: setYoutube, tiktok: setTiktok };

  useEffect(() => {
    if (!user?.id) return;
    const p = mockDB.getProfile(user.id);
    setName(p.name || '');
    setBio(p.bio || '');
    setPicUrl(p.profile_picture_url || '');
    setNiches(p.niche_tags || []);
    setInstagram(p.instagram || '');
    setTwitter(p.twitter || '');
    setYoutube(p.youtube || '');
    setTiktok(p.tiktok || '');
  }, [user?.id]);

  const toggleNiche = (n: string) =>
    setNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    mockDB.saveProfile(user?.id ?? 'anon', {
      name, bio, profile_picture_url: picUrl || null,
      niche_tags: niches, instagram: instagram || null,
      twitter: twitter || null, youtube: youtube || null, tiktok: tiktok || null,
    });
    toast.success('Profile updated!');
    setSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="profile-theme min-h-screen" style={{ background: 'var(--muted)', fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Profile</p>
            <h1 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>
              Creator <span style={{ color: 'var(--chart-2)' }}>Profile</span>
            </h1>
          </div>
          <button
            onClick={() => { setIsEditing(!isEditing); }}
            className="p-btn-secondary flex items-center gap-2"
            style={isEditing ? { borderColor: '#fca5a5', color: '#ef4444', background: '#fef2f2' } : {}}
          >
            {isEditing ? <><X size={14} /> Cancel</> : <><Pencil size={14} /> Edit Profile</>}
          </button>
        </div>

        {/* ── Avatar + identity card ── */}
        <div className="p-card flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" style={{ border: '2px solid var(--chart-2)' }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--chart-2), var(--chart-4))' }}>
                <User size={28} className="text-white" />
              </div>
            )}
            {/* online dot */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xl" style={{ color: 'var(--foreground)' }}>{name || 'Your Name'}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="p-badge-blue">Creator</span>
              <span className="p-badge-gold">⭐ 4.8 Rep</span>
              {niches.slice(0, 2).map((n) => <span key={n} className="p-badge-neutral">{n}</span>)}
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">

            {/* ── Basic info ── */}
            <div className="p-card space-y-5">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Basic Info</h2>
              </div>

              {/* Profile picture */}
              <div>
                <label className="p-label">Profile Picture</label>
                <div className="mt-1 flex items-center gap-4">
                  {picUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover" style={{ border: '2px solid var(--chart-2)' }} />
                      <button
                        type="button"
                        onClick={() => setPicUrl('')}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ background: '#ef4444' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 cursor-pointer rounded-xl transition-colors"
                      style={{ border: '2px dashed var(--border)', background: 'var(--muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--chart-2)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <Upload size={20} style={{ color: 'var(--muted-foreground)' }} className="mb-1.5" />
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Click to upload photo</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PNG, JPG, or WEBP</p>
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
              </div>

              <div>
                <label className="p-label">Display Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your creator name" className="p-input" />
              </div>

              <div>
                <label className="p-label">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell brands what you do..." rows={4} className="p-input resize-none" />
                <p className="text-xs text-right mt-1" style={{ color: 'var(--muted-foreground)' }}>{bio.length}/500</p>
              </div>
            </div>

            {/* ── Content niches ── */}
            <div className="p-card space-y-4">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Content Niches</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {NICHE_OPTIONS.map((n) => {
                  const active = niches.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNiche(n)}
                      className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 flex items-center gap-1.5"
                      style={active
                        ? { background: 'rgba(37,99,239,0.18)', color: '#91c5ff', border: '1px solid rgba(37,99,239,0.35)' }
                        : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                      }
                    >
                      {active && <Check size={11} />}
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Social accounts ── */}
            <div className="p-card space-y-4">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Social Accounts</h2>
              </div>
              {SOCIALS.map(({ key, icon: Icon, label, color, placeholder }) => (
                <div key={key}>
                  <label className="p-label">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Icon size={15} color={color} />
                    </span>
                    <input
                      value={socials[key]}
                      onChange={(e) => socialSetters[key](e.target.value)}
                      placeholder={placeholder}
                      className="p-input pl-9"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Save ── */}
            <button onClick={handleSave} disabled={saving} className="p-btn-primary w-full">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        ) : (
          <div className="space-y-4">

            {/* ── Read-only bio ── */}
            <div className="p-card space-y-3">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>About Me</h2>
              </div>
              {bio
                ? <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{bio}</p>
                : <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>No bio added yet. Click Edit Profile to add one.</p>
              }
            </div>

            {/* ── Read-only niches ── */}
            <div className="p-card space-y-3">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Content Niches</h2>
              </div>
              {niches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {niches.map((n) => (
                    <span key={n} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(37,99,239,0.18)', color: '#91c5ff', border: '1px solid rgba(37,99,239,0.3)' }}>
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>No niches selected yet.</p>
              )}
            </div>

            {/* ── Read-only socials ── */}
            <div className="p-card space-y-3">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Connected Channels</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOCIALS.map(({ key, icon: Icon, label, color }) => {
                  const val = socials[key];
                  const connected = Boolean(val);
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: connected ? `${color}15` : 'var(--border)', border: `1px solid ${connected ? color + '30' : 'var(--border)'}` }}>
                        <Icon size={16} color={connected ? color : 'var(--muted-foreground)'} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
                        <p className="text-sm font-bold truncate" style={{ color: connected ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                          {connected ? `@${val}` : 'Not connected'}
                        </p>
                      </div>
                      {connected && (
                        <span className="ml-auto flex-shrink-0 w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Wallet ── */}
        <div className="p-card space-y-3">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
            <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Connected Wallet</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Your wallet address is used for on-chain payouts and reputation scores.</p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(37,99,239,0.12)', border: '1px solid rgba(37,99,239,0.25)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--chart-2)' }} />
            <span className="text-sm font-mono select-all truncate" style={{ color: '#91c5ff' }}>
              {user?.walletAddress ?? 'No wallet connected'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
