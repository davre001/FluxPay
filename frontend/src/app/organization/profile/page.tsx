'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Globe, Building2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';

const INDUSTRY_OPTIONS = [
  'Technology', 'Fashion & Apparel', 'Food & Beverage', 'Beauty & Wellness',
  'Finance & Fintech', 'Gaming', 'Travel & Hospitality', 'Health & Fitness',
  'E-commerce', 'Education', 'Entertainment', 'Sports', 'Automotive', 'Home & Lifestyle',
];

export default function OrgProfilePage() {
  const { user } = useUserStore();
  const [saving, setSaving] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    profileAPI.getMe().then(({ data }: any) => {
      setBrandName(data?.name || '');
      setDescription(data?.bio || '');
      setWebsiteUrl(data?.website_url || '');
      setPicUrl(data?.profile_picture_url || '');
      setIndustries(Array.isArray(data?.niche_tags) ? data.niche_tags : []);
    }).catch(() => {});
  }, [user?.id]);

  const toggleIndustry = (i: string) =>
    setIndustries((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateMe({
        name: brandName,
        bio: description,
        website_url: websiteUrl || null,
        profile_picture_url: picUrl || null,
        niche_tags: industries,
      });
      toast.success('Brand profile updated!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-theme min-h-screen" style={{ background: 'var(--muted)', fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted-foreground)' }}>Settings</p>
            <h1 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>
              Brand <span style={{ color: 'var(--chart-2)' }}>Profile</span>
            </h1>
          </div>
          <button onClick={handleSave} disabled={saving} className="p-btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── Brand identity card ── */}
        <div className="p-card flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-cover" style={{ border: '2px solid var(--chart-2)' }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--chart-2), var(--chart-4))' }}>
                <Building2 size={28} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xl" style={{ color: 'var(--foreground)' }}>{brandName || 'Your Brand'}</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="p-badge-blue">Brand</span>
              <span className="p-badge-gold">⭐ 4.5 Rep</span>
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="p-badge-neutral flex items-center gap-1">
                  <Globe size={10} /> {websiteUrl.replace(/^https?:\/\//, '').split('/')[0]}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Brand info ── */}
        <div className="p-card space-y-5">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
            <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Brand Info</h2>
          </div>

          {/* Logo upload */}
          <div>
            <label className="p-label">Brand Logo</label>
            <div className="mt-1 flex items-center gap-4">
              {picUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover"
                    style={{ border: '2px solid var(--chart-2)' }} />
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
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Upload logo</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PNG, JPG, SVG or WEBP</p>
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
            <label className="p-label">Brand Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme Corp" className="p-input" />
          </div>

          <div>
            <label className="p-label">About Your Brand</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your brand do and who is your target audience?" rows={4}
              className="p-input resize-none" />
          </div>

          <div>
            <label className="p-label">Website</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourbrand.com" className="p-input pl-9" />
            </div>
          </div>
        </div>

        {/* ── Industries / Verticals ── */}
        <div className="p-card space-y-4">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
            <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Industry Verticals</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Select the categories that best describe your brand. This helps creators find you.
          </p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((ind) => {
              const active = industries.includes(ind);
              return (
                <button
                  key={ind}
                  onClick={() => toggleIndustry(ind)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150"
                  style={active
                    ? { background: 'rgba(37,99,239,0.18)', color: '#91c5ff', border: '1px solid rgba(37,99,239,0.35)' }
                    : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                  }
                >
                  {ind}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Payment wallet ── */}
        <div className="p-card space-y-3">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-1 h-5 rounded-full" style={{ background: 'var(--chart-2)' }} />
            <h2 className="font-black text-base" style={{ color: 'var(--foreground)' }}>Payment Wallet</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            This wallet funds escrow contracts when you post deals. Make sure it holds enough USDC.
          </p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(37,99,239,0.12)', border: '1px solid rgba(37,99,239,0.25)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--chart-2)' }} />
            <span className="text-sm font-mono select-all truncate" style={{ color: '#91c5ff' }}>
              {user?.walletAddress ?? 'No wallet connected'}
            </span>
          </div>
        </div>

        {/* ── Bottom save ── */}
        <button onClick={handleSave} disabled={saving} className="p-btn-primary w-full">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

      </div>
    </div>
  );
}
