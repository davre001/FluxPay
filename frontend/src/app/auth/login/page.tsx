'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWeb3AuthConnect } from '@web3auth/modal/react';
import { useUserStore } from '@/stores/userStore';
import { useOnWeb3AuthConnected } from '@/hooks/useOnWeb3AuthConnected';
import { establishSession } from '@/lib/establishSession';
import dynamic from 'next/dynamic';

const SignInPage = dynamic(
  () => import('@/components/ui/sign-in-flow-1').then((mod) => mod.SignInPage),
  { ssr: false }
);

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useUserStore();
  const { connect } = useWeb3AuthConnect();

  useOnWeb3AuthConnected(async ({ address, idToken, email }) => {
    const resolved = await establishSession({ idToken, walletAddress: address, email });

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
      await connect();
    } catch (err: any) {
      toast.error(err?.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <SignInPage 
      isSignup={false}
      onConnect={handleSignIn}
      isLoading={loading}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
