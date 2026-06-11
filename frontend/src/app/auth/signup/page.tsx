'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Star, Shield, Loader2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3AuthConnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';
import { useOnWeb3AuthConnected } from '@/hooks/useOnWeb3AuthConnected';
import { establishSession } from '@/lib/establishSession';

type ProfileType = 'creator' | 'organization';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultType = (params.get('type') as ProfileType) || 'creator';

  const [profileType, setProfileType] = useState<ProfileType>(defaultType);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();
  const { connect } = useWeb3AuthConnect();

  // Runs once the user is connected — works whether the modal used a popup or a
  // redirect (which reloads the page). The chosen role is read from sessionStorage
  // so it survives a redirect.
  useOnWeb3AuthConnected(async ({ address, idToken, email }) => {
    const role = (sessionStorage.getItem('fp_signup_role') as ProfileType) || profileType;
    const resolved = await establishSession({ idToken, walletAddress: address, profileType: role, email });
    setAuth(
      {
        id: resolved.id,
        email: resolved.email,
        profileType: resolved.profileType ?? role,
        walletAddress: resolved.walletAddress,
      },
      idToken,
    );
    sessionStorage.removeItem('fp_signup_role');
    toast.success('Smart wallet ready!');
    router.push(role === 'creator' ? '/onboarding/creator' : '/onboarding/organization');
  });

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Remember the role across a possible OAuth redirect, then open the modal.
      sessionStorage.setItem('fp_signup_role', profileType);
      await connect();
      // Navigation is handled reactively by useOnWeb3AuthConnected above.
    } catch (err: any) {
      toast.error(err?.message || 'Connection failed');
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

        {/* Connect card */}
        <div className="glass rounded-2xl p-8">
          <button onClick={handleConnect} disabled={loading} className="btn-primary w-full btn-shimmer">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {loading ? 'Opening wallet…' : 'Continue with Smart Wallet'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">
            Sign up with Google, X, email, or MetaMask. Your smart wallet is created automatically — no seed phrase, no password.
          </p>
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
