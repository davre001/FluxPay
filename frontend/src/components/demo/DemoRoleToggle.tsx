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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-colors disabled:opacity-60"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
      title="Demo: switch dashboard"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} className="text-[#a855f7]" />}
      Viewing as <span className="text-[#a855f7]">{isBrand ? 'Brand' : 'Creator'}</span> · Switch to {isBrand ? 'Creator' : 'Brand'}
    </button>
  );
}
