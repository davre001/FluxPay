'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Instagram, Twitter, Youtube, Music2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food',
  'Travel', 'Lifestyle', 'Finance', 'Music', 'Education', 'Comedy', 'Sports', 'Art',
];

export default function CreatorProfilePage() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [niches, setNiches] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  useEffect(() => {
    profileAPI.getMe()
      .then((r) => {
        const p = r.data;
        setProfile(p);
        setName(p.name || '');
        setBio(p.bio || '');
        setPicUrl(p.profile_picture_url || '');
        setNiches(p.niche_tags || []);
        setInstagram(p.instagram || '');
        setTwitter(p.twitter || '');
        setYoutube(p.youtube || '');
        setTiktok(p.tiktok || '');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggleNiche = (n: string) =>
    setNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateMe({ name, bio, profile_picture_url: picUrl || null, niche_tags: niches, instagram: instagram || null, twitter: twitter || null, youtube: youtube || null, tiktok: tiktok || null });
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 size={28} className="animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Settings</p>
          <h1 className="text-3xl font-black text-white">Creator <span className="gradient-text">Profile</span></h1>
        </div>

        {/* Avatar + name */}
        <div className="card flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-600" />
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
              {profile?.reputation_score != null && (
                <span className="badge badge-yellow">⭐ {profile.reputation_score} Rep</span>
              )}
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="card space-y-5">
          <h2 className="font-black text-white">Basic Info</h2>
          <div>
            <label className="label">Profile Picture URL</label>
            <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)} placeholder="https://..." className="input" />
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

        {/* Niches */}
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

        {/* Socials */}
        <div className="card space-y-4">
          <h2 className="font-black text-white">Social Accounts</h2>
          {[
            { icon: Instagram, label: 'Instagram', color: '#e1306c', val: instagram, set: setInstagram },
            { icon: Twitter,   label: 'Twitter/X', color: '#1da1f2', val: twitter,   set: setTwitter },
            { icon: Youtube,   label: 'YouTube',   color: '#ff0000', val: youtube,   set: setYoutube },
            { icon: Music2,    label: 'TikTok',    color: '#69c9d0', val: tiktok,    set: setTiktok },
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

        {/* Wallet */}
        <div className="card space-y-3">
          <h2 className="font-black text-white">Connected Wallet</h2>
          <p className="text-sm text-slate-400">Your wallet address is used for on-chain payouts and reputation.</p>
          <ConnectButton />
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full btn-shimmer">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
