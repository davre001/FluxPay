'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Globe, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

export default function OrgProfilePage() {
  const { user } = useUserStore();
  const [saving, setSaving] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [picUrl, setPicUrl] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const p = mockDB.getProfile(user.id);
    setBrandName(p.brand_name || '');
    setDescription(p.description || '');
    setWebsiteUrl(p.website_url || '');
    setPicUrl(p.profile_picture_url || '');
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    mockDB.saveProfile(user?.id ?? 'anon', {
      brand_name: brandName,
      description,
      website_url: websiteUrl || null,
      profile_picture_url: picUrl || null,
    });
    toast.success('Brand profile updated!');
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: '#0a0a0f' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="fade-in">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Settings</p>
          <h1 className="text-3xl font-black text-white">Brand <span className="gradient-text">Profile</span></h1>
        </div>

        {/* Header card */}
        <div className="card flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {picUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-500" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-700 to-brand-700 flex items-center justify-center">
                <Building2 size={28} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-black text-white text-xl">{brandName || 'Your Brand'}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-cyan">Brand</span>
              <span className="badge badge-yellow">⭐ 4.5 Rep</span>
            </div>
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="font-black text-white">Brand Info</h2>
          <div>
            <label className="label">Logo URL</label>
            <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)} placeholder="https://..." className="input" />
          </div>
          <div>
            <label className="label">Brand Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Corp" className="input" />
          </div>
          <div>
            <label className="label">About Your Brand</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does your brand do?" rows={4} className="input resize-none" />
          </div>
          <div>
            <label className="label">Website</label>
            <div className="relative">
              <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                     placeholder="https://yourbrand.com" className="input pl-10" />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-black text-white">Payment Wallet</h2>
          <p className="text-sm text-slate-400">Connect the wallet that will fund escrow contracts.</p>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span className="text-sm text-slate-400">{user?.walletAddress ?? 'No wallet connected'}</span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full btn-shimmer">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
