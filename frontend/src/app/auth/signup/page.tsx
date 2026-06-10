'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Star, Shield, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';

type ProfileType = 'creator' | 'organization';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultType = (params.get('type') as ProfileType) || 'creator';

  const [profileType, setProfileType] = useState<ProfileType>(defaultType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const existing = localStorage.getItem(`fp_user_${email}`);
      if (existing) throw new Error('Email already registered');

      const userId = `user_${Date.now()}`;
      const mockToken = `mock_${userId}`;
      localStorage.setItem(
        `fp_user_${email}`,
        JSON.stringify({ id: userId, email, password, profileType })
      );

      setAuth({ id: userId, email, profileType, walletAddress: undefined }, mockToken);
      toast.success('Account created!');
      router.push(profileType === 'creator' ? '/onboarding/creator' : '/onboarding/organization');
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden"
          style={{ background: '#0a0a0f' }}>
      {/* Orbs */}
      <div className="orb orb-purple w-[500px] h-[500px] -top-32 -left-32 animate-glow" />
      <div className="orb orb-cyan   w-[400px] h-[400px] -bottom-20 -right-20 animate-glow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-xl text-white">Flux<span className="gradient-text">Pay</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white">Create your account</h1>
          <p className="text-slate-400 mt-2 text-sm">Choose how you'll use FluxPay</p>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { type: 'creator' as const, icon: Star, label: "I'm a Creator", sub: 'Apply & get paid' },
            { type: 'organization' as const, icon: Shield, label: "I'm a Brand", sub: 'Post deals & hire' },
          ].map(({ type, icon: Icon, label, sub }) => (
            <button
              key={type}
              onClick={() => setProfileType(type)}
              className="p-4 rounded-2xl text-left transition-all duration-200"
              style={{
                background: profileType === type
                  ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${profileType === type ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: profileType === type ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
              }}
            >
              <Icon size={20} className={profileType === type ? 'text-brand-400' : 'text-slate-500'} />
              <p className={`font-bold text-sm mt-2 ${profileType === type ? 'text-white' : 'text-slate-400'}`}>{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters"
                  className="input pr-11"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                className="input"
              />
            </div>

            {/* Password strength */}
            {password && (
              <div className="space-y-1">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500">
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full btn-shimmer mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-900" />}>
      <SignupForm />
    </Suspense>
  );
}
