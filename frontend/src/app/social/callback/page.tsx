'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { profileAPI } from '@/lib/api-client';

// Receives the OAuth redirect (?code&state), reads which platform from
// sessionStorage (set when the user clicked "Connect"), exchanges the code via
// the backend, then returns the user to the page they started from.
function SocialCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working');
  const [message, setMessage] = useState('Connecting your account…');

  useEffect(() => {
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error');
    const platform = typeof window !== 'undefined' ? sessionStorage.getItem('oauth_platform') : null;
    const returnTo = (typeof window !== 'undefined' && sessionStorage.getItem('oauth_return')) || '/creator/profile';

    if (oauthError) { setStatus('error'); setMessage(`Connection cancelled (${oauthError})`); return; }
    if (!code || !state || !platform) { setStatus('error'); setMessage('Missing OAuth response — please retry.'); return; }

    profileAPI.socialCallback(platform, { code, state })
      .then(({ data }: any) => {
        setStatus('ok');
        setMessage(`Connected @${data?.handle} (${(data?.followers ?? 0).toLocaleString()} followers)`);
        sessionStorage.removeItem('oauth_platform');
        sessionStorage.removeItem('oauth_return');
        setTimeout(() => router.replace(`${returnTo}?connected=${platform}`), 1200);
      })
      .catch((e: any) => { setStatus('error'); setMessage(e?.message || 'Failed to connect account'); });
  }, [params, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0a0a' }}>
      {status === 'working' && <Loader2 size={32} className="animate-spin text-[#4b5563]" />}
      {status === 'ok' && <CheckCircle2 size={32} className="text-[#22c55e]" />}
      {status === 'error' && <XCircle size={32} className="text-[#ef4444]" />}
      <p className="text-sm font-semibold text-[#9ca3af] max-w-sm text-center px-6">{message}</p>
      {status === 'error' && (
        <button onClick={() => router.replace('/creator/profile')} className="text-xs font-bold text-white px-4 py-2 rounded-lg" style={{ border: '1px solid #252525' }}>
          Back to Profile
        </button>
      )}
    </div>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a0a' }} />}>
      <SocialCallbackInner />
    </Suspense>
  );
}
