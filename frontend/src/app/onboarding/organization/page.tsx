'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import Footer4Col from '@/components/ui/footer-column';

export default function OrganizationOnboarding() {
  const router = useRouter();
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [picUrl, setPicUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName) { toast.error('Brand name is required'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email address'); return; }
    setLoading(true);
    try {
      await profileAPI.updateMe({
        name: brandName,
        email,
        bio: description,
        profile_picture_url: picUrl || null,
        website_url: websiteUrl || null,
        instagram: instagram || null,
        twitter: twitter || null,
        youtube: youtube || null,
        tiktok: tiktok || null,
      });
      toast.success('Brand profile created!');
      router.push('/organization/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <main className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4" style={{ border: '1px solid #e5e7eb' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" alt="Brand" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">Set up your brand profile</h1>
          <p className="text-[#6b7280] text-sm mt-2">Creators will see this when reviewing your deals</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Brand Logo URL</label>
              <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)}
                     placeholder="https://..." 
                     className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" />
              {picUrl && (
                <div className="mt-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover bg-white p-1" style={{ border: '1px solid #252525' }} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Brand Name *</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                     placeholder="Acme Corp" 
                     className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" required />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Email Address *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="contact@yourbrand.com" 
                     className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" required />
              {user?.email && email === user.email && (
                <p className="text-[10px] text-[#22c55e] mt-1">Auto-filled from your login</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">About Your Brand</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="What does your brand do? What kind of creators do you work with?"
                        rows={4} 
                        className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 resize-none" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Website or Social Page</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                       placeholder="https://yourbrand.com" 
                       className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-10" />
              </div>
            </div>

            {/* Social handles */}
            <div className="space-y-4 pt-2">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">Social Media (Optional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { iconUrl: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128', label: 'Instagram', val: instagram, set: setInstagram, placeholder: 'your_brand' },
                  { iconUrl: 'https://www.google.com/s2/favicons?domain=x.com&sz=128',         label: 'Twitter / X', val: twitter, set: setTwitter, placeholder: 'your_brand' },
                  { iconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',   label: 'YouTube', val: youtube, set: setYoutube, placeholder: 'channel' },
                  { iconUrl: 'https://www.google.com/s2/favicons?domain=tiktok.com&sz=128',    label: 'TikTok', val: tiktok, set: setTiktok, placeholder: 'your_brand' },
                ].map(({ iconUrl, label, val, set, placeholder }) => (
                  <div key={label} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt={label} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain rounded-sm z-10" />
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] font-medium">@</div>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => set(e.target.value.replace(/^@/, ''))}
                      placeholder={placeholder}
                      className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-[3.25rem]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Saving...' : 'Launch Dashboard'}
            </button>
          </form>
        </div>
      </motion.div>
      </main>
      <Footer4Col />
    </div>
  );
}
