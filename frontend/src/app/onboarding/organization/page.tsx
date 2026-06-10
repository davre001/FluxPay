'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockDB } from '@/lib/mock-data';
import { useUserStore } from '@/stores/userStore';

export default function OrganizationOnboarding() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [picUrl, setPicUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName) { toast.error('Brand name is required'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    mockDB.saveProfile(user?.id ?? 'anon', {
      brand_name: brandName,
      description,
      website_url: websiteUrl || null,
      profile_picture_url: picUrl || null,
    });
    toast.success('Brand profile created!');
    router.push('/organization/dashboard');
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
          style={{ background: '#0a0a0f' }}>
      <div className="orb orb-cyan w-96 h-96 -top-20 -right-20 animate-glow" />
      <div className="orb orb-purple w-80 h-80 -bottom-20 -left-20 animate-glow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-600 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Set up your brand profile</h1>
          <p className="text-slate-400 text-sm mt-2">Creators will see this when reviewing your deals</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Brand Logo URL</label>
              <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)}
                     placeholder="https://..." className="input" />
              {picUrl && (
                <div className="mt-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-accent-500" />
                </div>
              )}
            </div>

            <div>
              <label className="label">Brand Name *</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                     placeholder="Acme Corp" className="input" required />
            </div>

            <div>
              <label className="label">About Your Brand</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does your brand do? What kind of creators do you work with?"
                        rows={4} className="input resize-none" />
            </div>

            <div>
              <label className="label">Website or Social Page</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                       placeholder="https://yourbrand.com" className="input pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-shimmer mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Saving...' : 'Launch Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
