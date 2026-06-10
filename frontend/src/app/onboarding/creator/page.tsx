'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Instagram, Twitter, Youtube, Music2, ArrowRight, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { profileAPI } from '@/lib/api-client';

const NICHE_OPTIONS = [
  'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food',
  'Travel', 'Lifestyle', 'Finance', 'Music', 'Education', 'Comedy', 'Sports', 'Art',
];

export default function CreatorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [picUrl, setPicUrl] = useState('');

  const toggleNiche = (n: string) =>
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await profileAPI.updateMe({
        name,
        bio,
        niche_tags: selectedNiches,
        instagram: instagram || null,
        twitter: twitter || null,
        youtube: youtube || null,
        tiktok: tiktok || null,
        profile_picture_url: picUrl || null,
      });
      toast.success('Profile created!');
      router.push('/creator/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['About You', 'Content Niches', 'Social Accounts'];
  const progress = (step / steps.length) * 100;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
          style={{ background: '#0a0a0f' }}>
      <div className="orb orb-purple w-96 h-96 -top-20 -left-20 animate-glow" />
      <div className="orb orb-cyan w-80 h-80 -bottom-20 -right-20 animate-glow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Star size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Set up your creator profile</h1>
          <p className="text-slate-400 text-sm mt-2">Step {step} of {steps.length} — {steps[step - 1]}</p>
        </div>

        {/* Progress */}
        <div className="progress-bar mb-8">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`step-dot ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'inactive'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-12 h-px" style={{ background: i + 1 < step ? '#059669' : 'rgba(71,85,105,0.4)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-8">
          {/* ── Step 1: About ── */}
          {step === 1 && (
            <div className="space-y-5 fade-in">
              <div>
                <label className="label">Profile Picture URL</label>
                <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)}
                       placeholder="https://..." className="input" />
                {picUrl && (
                  <div className="mt-3 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={picUrl} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-brand-600" />
                  </div>
                )}
              </div>
              <div>
                <label className="label">Display Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                       placeholder="Your creator name" className="input" required />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell brands what you do..." rows={4}
                          className="input resize-none" />
                <p className="text-xs text-slate-600 mt-1 text-right">{bio.length}/500</p>
              </div>
              <button onClick={() => { if (!name) { toast.error('Enter your name'); return; } setStep(2); }}
                      className="btn-primary w-full btn-shimmer">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Niches ── */}
          {step === 2 && (
            <div className="space-y-6 fade-in">
              <div>
                <label className="label">Content Niches (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {NICHE_OPTIONS.map((n) => (
                    <button key={n} onClick={() => toggleNiche(n)}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                              selectedNiches.includes(n)
                                ? 'bg-brand-600 text-white shadow-glow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            style={{ border: selectedNiches.includes(n) ? '1px solid transparent' : '1px solid rgba(71,85,105,0.4)' }}>
                      {n}
                    </button>
                  ))}
                </div>
                {selectedNiches.length > 0 && (
                  <p className="text-xs text-brand-400 mt-3">{selectedNiches.length} selected</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 btn-shimmer">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Socials ── */}
          {step === 3 && (
            <div className="space-y-5 fade-in">
              <p className="text-sm text-slate-400">Enter your handles without the @ symbol.</p>
              {[
                { icon: Instagram, label: 'Instagram',    color: '#e1306c', val: instagram, set: setInstagram, ph: 'yourhandle' },
                { icon: Twitter,   label: 'Twitter / X',  color: '#1da1f2', val: twitter,   set: setTwitter,   ph: 'yourhandle' },
                { icon: Youtube,   label: 'YouTube',      color: '#ff0000', val: youtube,   set: setYoutube,   ph: 'channelname' },
                { icon: Music2,    label: 'TikTok',       color: '#69c9d0', val: tiktok,    set: setTiktok,    ph: 'yourhandle' },
              ].map(({ icon: Icon, label, color, val, set, ph }) => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color }} />
                    <input value={val} onChange={(e) => set(e.target.value)}
                           placeholder={ph} className="input pl-10" />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 btn-shimmer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
