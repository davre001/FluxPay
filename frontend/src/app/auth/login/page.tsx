'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3AuthConnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';
import { useOnWeb3AuthConnected } from '@/hooks/useOnWeb3AuthConnected';
import { establishSession } from '@/lib/establishSession';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();
  const { connect } = useWeb3AuthConnect();

  // Runs once connected (handles redirect + popup flows).
  useOnWeb3AuthConnected(async ({ address, idToken, email }) => {
    const resolved = await establishSession({ idToken, walletAddress: address, email });

    // No role yet → wallet hasn't completed signup.
    if (!resolved.profileType) {
      toast('Let\'s finish setting up your account', { icon: '👋' });
      router.push('/auth/signup');
      return;
    }

    setAuth(
      { id: resolved.id, email: resolved.email || '', profileType: resolved.profileType, walletAddress: resolved.walletAddress },
      idToken,
    );
    toast.success('Welcome back!');
    router.push(resolved.profileType === 'organization' ? '/organization/dashboard' : '/creator/dashboard');
  });

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Opens the MetaMask Embedded Wallets modal (social / email / MetaMask).
      await connect();
      // Navigation is handled reactively by useOnWeb3AuthConnected above.
    } catch (err: any) {
      toast.error(err?.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
          style={{ background: '#0a0a0a', fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Decorative Orbs (softened to match the premium theme) */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-900/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-xl text-[#fafafa]">Flux<span className="gradient-text">Pay</span></span>
          </Link>
          <h1 className="text-3xl font-black text-[#fafafa]">Welcome back</h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in with your smart wallet</p>
        </div>

        <div className="p-8" style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: '0.5rem' }}>
          <button 
            onClick={handleSignIn} 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold transition-all"
            style={{ background: '#fafafa', color: '#0a0a0a', borderRadius: '0.5rem' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#e5e5e5'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#fafafa'; }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {loading ? 'Opening wallet…' : 'Sign in with Smart Wallet'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
            Continue with Google, X, email, or MetaMask — no password needed.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
