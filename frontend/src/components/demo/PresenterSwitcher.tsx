'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';
import { useDemoBalance } from '@/stores/demoBalance';
import { faucetAPI, demoAPI, authAPI } from '@/lib/api-client';

const UNLOCK_KEY = 'fp_presenter_ok';

// Hidden operator control — NO visible affordance. The trigger combo only opens a
// passphrase prompt; the actual secret is validated server-side (it never ships
// to the client), so reading the source can't reveal it. Gated behind
// NEXT_PUBLIC_DEMO_MODE so it isn't mounted in a non-demo build.
export default function PresenterSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [code, setCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const wallet = useUserStore((s) => s.user?.walletAddress);
  const setAuth = useUserStore((s) => s.setAuth);
  const resetBalance = useDemoBalance((s) => s.reset);

  // Assume a seeded demo persona (presenter-only). Sets the bearer to the demo
  // token, resolves the seeded user server-side, then routes to its dashboard so
  // the operator can transact as that brand/creator.
  const assume = async (token: 'demo-brand' | 'demo-creator', path: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('auth_token', token);
    try {
      const { data }: any = await authAPI.me();
      setAuth(
        { id: data.user.id, email: data.user.email || '', profileType: data.user.profileType, walletAddress: data.user.walletAddress || '' },
        token,
      );
      setOpen(false);
      router.push(path);
      toast.success(`Acting as ${token === 'demo-brand' ? 'Demo Brand' : 'Demo Creator'}`);
    } catch {
      toast.error('Demo persona unavailable (DEMO_MODE off?)');
    }
  };

  useEffect(() => {
    setUnlocked(typeof window !== 'undefined' && sessionStorage.getItem(UNLOCK_KEY) === '1');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        if (unlocked) setOpen((v) => !v);
        else setPrompt((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false); setPrompt(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked]);

  const submitCode = async () => {
    try {
      const { data }: any = await demoAPI.unlock(code);
      if (data?.ok) {
        sessionStorage.setItem(UNLOCK_KEY, '1');
        setUnlocked(true); setPrompt(false); setOpen(true); setCode('');
      } else {
        toast.error('Nope.');
      }
    } catch { toast.error('Nope.'); }
  };

  const go = (path: string) => { setOpen(false); router.push(path); };

  const drip = async () => {
    if (!wallet) { toast.error('No wallet connected'); return; }
    try {
      const { data }: any = await faucetAPI.drip(wallet);
      toast.success(data?.funded ? `Faucet sent ${data.amount ?? ''} USDC` : `Faucet: ${data?.reason ?? 'already funded'}`);
    } catch (e: any) { toast.error(e?.message || 'Faucet failed'); }
  };

  if (prompt) {
    return (
      <div className="fixed bottom-4 left-4 z-[1000] w-60 rounded-xl p-3 shadow-2xl"
           style={{ background: '#0a0a0a', border: '1px solid #262626', fontFamily: "'Inter', sans-serif" }}>
        <input
          autoFocus type="password" value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitCode(); }}
          placeholder="·········"
          className="w-full rounded-lg bg-[#111111] border border-[#262626] px-3 py-2 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-[#404040]"
        />
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-56 rounded-xl p-2 shadow-2xl"
         style={{ background: '#0a0a0a', border: '1px solid #262626', fontFamily: "'Inter', sans-serif" }}>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4b5563] px-2 pt-1 pb-2">Presenter</p>
      <button onClick={() => assume('demo-brand', '/organization/dashboard')}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#1a1a1a] transition-colors">
        Act as Demo Brand
      </button>
      <button onClick={() => assume('demo-creator', '/creator/dashboard')}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#1a1a1a] transition-colors">
        Act as Demo Creator
      </button>
      <button onClick={() => go('/judges')}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#1a1a1a] transition-colors">
        Judge guide
      </button>
      <button onClick={drip}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#22c55e] hover:bg-[#1a1a1a] transition-colors">
        Re-fund wallet
      </button>
      <button onClick={() => { resetBalance(); toast.success('Demo balance reset'); }}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#1a1a1a] transition-colors">
        Reset balance
      </button>
      <button onClick={() => setOpen(false)}
        className="w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#6b7280] hover:bg-[#1a1a1a] transition-colors">
        Close (Esc)
      </button>
    </div>
  );
}
