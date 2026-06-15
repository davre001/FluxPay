'use client';
import { downscaleImage } from '@/lib/image';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, X, Music2, ArrowRight, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { profileAPI } from '@/lib/api-client';
import { useUserStore } from '@/stores/userStore';
import Footer4Col from '@/components/ui/footer-column';

// Using public CDN icons for social platforms

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food',
  'Travel', 'Lifestyle', 'Finance', 'Music', 'Education', 'Comedy', 'Sports', 'Art',
];

export default function CreatorOnboarding() {
  const router = useRouter();
  const { user } = useUserStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [picUrl, setPicUrl] = useState('');

  const toggleNiche = (n: string) =>
    setSelectedNiches((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await profileAPI.updateMe({
        name, bio, email,
        niche_tags: selectedNiches,
        instagram: instagram || null,
        twitter: twitter || null,
        youtube: youtube || null,
        tiktok: tiktok || null,
        profile_picture_url: picUrl || null,
      });
      toast.success('Profile created!');
      router.push('/creator/dashboard');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['About You', 'Content Niches', 'Social Accounts'];
  const progress = (step / steps.length) * 100;

  return (
    <div className="flex flex-col min-h-screen w-full" style={{ background: '#0a0a0a', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4" style={{ border: '1px solid #e5e7eb' }}>
            <img src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png" alt="Creator" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">Set up your creator profile</h1>
          <p className="text-[#6b7280] text-sm mt-2">Step {step} of {steps.length} — {steps[step - 1]}</p>
        </div>

        {/* Progress */}
        <div className="w-full h-1 bg-[#1a1a1a] rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-white" 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i + 1 < step ? 'bg-[#22c55e] text-white' : i + 1 === step ? 'bg-white text-black' : 'bg-[#1a1a1a] text-[#6b7280]'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-12 h-px" style={{ background: i + 1 < step ? '#22c55e' : '#1a1a1a' }} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <AnimatePresence mode="wait">
            {/* ── Step 1: About ── */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
                className="space-y-5"
              >
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Profile Picture</label>
                <div className="mt-2 flex items-center justify-center">
                  {picUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={picUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover bg-white p-1" style={{ border: '1px solid #252525' }} />
                      <button
                        type="button"
                        onClick={() => setPicUrl('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-500 transition-colors shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border border-[#222222] border-dashed rounded-2xl cursor-pointer hover:border-[#404040] hover:bg-[#161616] transition-all bg-[#0f0f0f]">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={24} className="text-[#6b7280] mb-2" />
                        <p className="text-sm text-[#d1d5db] font-semibold">Click to upload photo</p>
                        <p className="text-xs text-[#4b5563] mt-1">PNG, JPG, or WEBP</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            downscaleImage(file).then(setPicUrl);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Display Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                       placeholder="Your creator name" 
                       className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" required />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Email Address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.com" 
                       className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5" required />
                {user?.email && email === user.email && (
                  <p className="text-[10px] text-[#22c55e] mt-1">Auto-filled from your login</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell brands what you do..." rows={4}
                          className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 resize-none" />
                <p className="text-xs text-[#4b5563] mt-1 text-right">{bio.length}/500</p>
              </div>
              <button onClick={() => { if (!name) { toast.error('Enter your name'); return; } if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Enter a valid email'); return; } setStep(2); }}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Niches ── */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">Content Niches (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {NICHE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => toggleNiche(n)}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                              selectedNiches.includes(n)
                                ? 'bg-white text-black'
                                : 'bg-[#0f0f0f] text-[#9ca3af] hover:text-white border border-[#222222]'
                            }`}
                            style={{ border: selectedNiches.includes(n) ? '1px solid transparent' : '1px solid #222222' }}>
                      {n}
                    </button>
                  ))}
                </div>
                {selectedNiches.length > 0 && (
                  <p className="text-xs text-[#22c55e] mt-3">{selectedNiches.length} selected</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#252525] transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Socials ── */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <p className="text-sm text-[#9ca3af]">Enter your social media handles so brands can find you.</p>
              {[
                { iconUrl: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128', label: 'Instagram',    val: instagram, set: setInstagram, placeholder: 'your_username' },
                { iconUrl: 'https://www.google.com/s2/favicons?domain=x.com&sz=128',         label: 'Twitter / X',  val: twitter,   set: setTwitter,   placeholder: 'your_handle' },
                { iconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',   label: 'YouTube',      val: youtube,   set: setYoutube,   placeholder: 'channel name or URL' },
                { iconUrl: 'https://www.google.com/s2/favicons?domain=tiktok.com&sz=128',    label: 'TikTok',       val: tiktok,    set: setTiktok,    placeholder: 'your_handle' },
              ].map(({ iconUrl, label, val, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">{label}</label>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt={label} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 object-contain rounded-sm z-10" />
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] font-medium">@</div>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => set(e.target.value.replace(/^@/, ''))}
                      placeholder={placeholder}
                      className="w-full bg-[#0f0f0f] border border-[#222222] rounded-lg text-sm text-white placeholder-[#4b5563] focus:outline-none focus:border-[#404040] transition-colors duration-200 px-4 py-2.5 pl-[3.5rem]"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#252525] transition-colors">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-[#f0f0f0] transition-colors flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
      </main>
      <Footer4Col />
    </div>
  );
}
