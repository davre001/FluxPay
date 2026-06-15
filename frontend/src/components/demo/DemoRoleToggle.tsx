'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUserStore } from '@/stores/userStore';
import { authAPI } from '@/lib/api-client';

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Visible Brand ⇄ Creator switch — DEMO BUILD ONLY (gated by NEXT_PUBLIC_DEMO_MODE),
// so judges can hop between both dashboards on one account. Absent in production.
export default function DemoRoleToggle() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setAuth = useUserStore((s) => s.setAuth);
  const token = useUserStore((s) => s.token);
  const [busy, setBusy] = useState(false);

  if (!DEMO || !user) return null;

  const isBrand = user.profileType === 'organization';
  const next = isBrand ? 'creator' : 'organization';

  const switchRole = async () => {
    setBusy(true);
    try {
      const { data } = await authAPI.setRole(next);
      setAuth(
        { id: data.user.id, email: data.user.email || user.email, profileType: data.user.profileType, walletAddress: data.user.walletAddress || user.walletAddress },
        token || '',
      );
      router.push(next === 'organization' ? '/organization/dashboard' : '/creator/dashboard');
      toast.success(`Viewing as ${next === 'organization' ? 'Brand' : 'Creator'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not switch');
    }
    setBusy(false);
  };

  return (
    <button
      onClick={switchRole}
      disabled={busy}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-[#d1d5db] hover:text-white transition-colors"
      style={{ background: '#111111', border: '1px solid #1f1f1f' }}
      title="Demo: switch dashboard"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} className="text-[#a855f7]" />}
      Switch to {isBrand ? 'Creator' : 'Brand'}
    </button>
  );
}
