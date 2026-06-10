'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));

      const raw = localStorage.getItem(`fp_user_${email}`);
      if (!raw) throw new Error('No account found for this email');
      const saved = JSON.parse(raw);
      if (saved.password !== password) throw new Error('Incorrect password');

      const mockToken = `mock_${saved.id}_${Date.now()}`;
      setAuth(
        { id: saved.id, email, profileType: saved.profileType, walletAddress: undefined },
        mockToken
      );
      toast.success('Welcome back!');
      router.push(saved.profileType === 'organization' ? '/organization/dashboard' : '/creator/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
          style={{ background: '#0a0a0f' }}>
      <div className="orb orb-purple w-[500px] h-[500px] -top-40 left-[-100px] animate-glow" />
      <div className="orb orb-cyan w-[400px] h-[400px] bottom-[-100px] right-[-80px] animate-glow" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-xl text-white">Flux<span className="gradient-text">Pay</span></span>
          </Link>
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your FluxPay account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Password</label>
                <Link href="/auth/forgot" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
                  className="input pr-11"
                />
                <button type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-shimmer">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs text-slate-500" style={{ background: 'rgba(15,23,42,0.7)' }}>or continue with</span>
            </div>
          </div>

          {/* Demo quick-access */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Demo Creator', profileType: 'creator' as const, email: 'creator@demo.com', pw: 'demo12345' },
              { label: 'Demo Brand',   profileType: 'organization' as const, email: 'brand@demo.com',   pw: 'demo12345' },
            ].map((d) => (
              <button
                key={d.profileType}
                onClick={() => {
                  // Auto-register demo account if it doesn't exist, then login
                  const key = `fp_user_${d.email}`;
                  if (!localStorage.getItem(key)) {
                    const id = `demo_${d.profileType}`;
                    localStorage.setItem(key, JSON.stringify({ id, email: d.email, password: d.pw, profileType: d.profileType }));
                  }
                  setEmail(d.email);
                  setPassword(d.pw);
                }}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
              >
                {d.label}
              </button>
            ))}
          </div>
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
