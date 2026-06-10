'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, X, Music2, User, Upload, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

// Inline SVG icons for social platforms removed from lucide-react
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
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between fade-in">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Profile</p>
            <h1 className="text-3xl font-black text-white">Creator <span className="gradient-text">Profile</span></h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2"
            style={{
              background: isEditing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isEditing ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              color: isEditing ? '#f87171' : '#f1f5f9'
            }}
          >
            {isEditing ? 'Cancel' : (
              <>
                <Pencil size={15} /> Edit Profile
              </>
            )}
          </button>
        </div>

        {/* Avatar + name */}
        <div className="card flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-600 shadow-glow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-700 to-accent-700 flex items-center justify-center">
                <User size={28} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-xl">{name || 'Your Name'}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-purple">Creator</span>
              <span className="badge badge-yellow">⭐ 4.8 Rep</span>
            </div>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Basic info editor */}
            <div className="card space-y-5">
              <h2 className="font-black text-white">Basic Info</h2>
              <div>
                <label className="label">Profile Picture</label>
                <div className="mt-2 flex items-center gap-4">
                  {picUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-600" />
                      <button
                        type="button"
                        onClick={() => setPicUrl('')}
                        className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-500 transition-colors shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer hover:border-brand-500 hover:bg-slate-900/50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-300 font-semibold">Click to upload photo</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPicUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Display Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your creator name" className="input" />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell brands what you do..." rows={4} className="input resize-none" />
                <p className="text-xs text-right text-slate-600 mt-1">{bio.length}/500</p>
              </div>
            </div>

            {/* Niches editor */}
            <div className="card space-y-4">
              <h2 className="font-black text-white">Content Niches</h2>
              <div className="flex flex-wrap gap-2">
                {NICHE_OPTIONS.map((n) => (
                  <button key={n} onClick={() => toggleNiche(n)}
                          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${niches.includes(n) ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                          style={{ border: niches.includes(n) ? '1px solid transparent' : '1px solid rgba(71,85,105,0.4)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Socials editor */}
            <div className="card space-y-4">
              <h2 className="font-black text-white">Social Accounts</h2>
              {[
                { icon: InstagramIcon, label: 'Instagram', color: '#e1306c', val: instagram, set: setInstagram },
                { icon: X,             label: 'Twitter/X', color: '#1da1f2', val: twitter,   set: setTwitter },
                { icon: YoutubeIcon,   label: 'YouTube',   color: '#ff0000', val: youtube,   set: setYoutube },
                { icon: TikTokIcon,    label: 'TikTok',    color: '#69c9d0', val: tiktok,    set: setTiktok },
              ].map(({ icon: Icon, label, color, val, set }) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color }} />
                    <input value={val} onChange={(e) => set(e.target.value)}
                           placeholder="handle (without @)" className="input pl-10" />
                  </div>
                </div>
              ))}
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full btn-shimmer">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Read-Only Basic Info */}
            <div className="card space-y-4">
              <h2 className="font-black text-white">About Me</h2>
              {bio ? (
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>
              ) : (
                <p className="text-slate-500 text-sm italic">No bio added yet.</p>
              )}
            </div>

            {/* Read-Only Niches */}
            <div className="card space-y-4">
              <h2 className="font-black text-white">Content Niches</h2>
              {niches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {niches.map((n) => (
                    <span
                      key={n}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700/60"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No niches selected.</p>
              )}
            </div>

            {/* Read-Only Socials */}
            <div className="card space-y-4">
              <h2 className="font-black text-white">Connected Channels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: InstagramIcon, label: 'Instagram', color: '#e1306c', val: instagram },
                  { icon: X,             label: 'Twitter/X', color: '#1da1f2', val: twitter },
                  { icon: YoutubeIcon,   label: 'YouTube',   color: '#ff0000', val: youtube },
                  { icon: TikTokIcon,    label: 'TikTok',    color: '#69c9d0', val: tiktok },
                ].map(({ icon: Icon, label, color, val }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/85 bg-slate-900/20"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950/80">
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-white">
                        {val ? `@${val}` : <span className="text-slate-600 font-normal">Not connected</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet (always shown) */}
        <div className="card space-y-3">
          <h2 className="font-black text-white">Connected Wallet</h2>
          <p className="text-sm text-slate-400">Your wallet address is used for on-chain payouts and reputation.</p>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="text-sm text-slate-400 font-mono text-ellipsis overflow-hidden select-all w-full">{user?.walletAddress ?? 'No wallet connected'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
