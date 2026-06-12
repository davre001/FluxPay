'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWeb3AuthConnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';
import { useOnWeb3AuthConnected } from '@/hooks/useOnWeb3AuthConnected';
import { establishSession } from '@/lib/establishSession';
import { faucetAPI } from '@/lib/api-client';
import dynamic from 'next/dynamic';

const SignInPage = dynamic(
  () => import('@/components/ui/sign-in-flow-1').then((mod) => mod.SignInPage),
  { ssr: false }
);

type ProfileType = 'creator' | 'organization';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultType = (params.get('type') as ProfileType) || 'creator';

  const [profileType, setProfileType] = useState<ProfileType>(defaultType);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();
  const { connect } = useWeb3AuthConnect();

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

    // First-signup welcome: drip $2 testnet USDC for gas. Fire-and-forget — the
    // backend is idempotent per address, so re-runs are harmless, and a faucet
    // hiccup must never block onboarding.
    faucetAPI.drip(address)
      .then(({ data }) => {
        if (data?.funded) toast.success(`Welcome gift: $${data.amount} USDC added for gas 🎉`);
      })
      .catch(() => {});

    router.push(role === 'creator' ? '/onboarding/creator' : '/onboarding/organization');
  });

  const handleConnect = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem('fp_signup_role', profileType);
      await connect();
    } catch (err: any) {
      toast.error(err?.message || 'Connection failed');
      setLoading(false);
    }
  };

  return (
    <SignInPage 
      isSignup={true}
      profileType={profileType}
      setProfileType={setProfileType}
      onConnect={handleConnect}
      isLoading={loading}
    />
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignupForm />
    </Suspense>
  );
}
