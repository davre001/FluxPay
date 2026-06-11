'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3AuthConnect, useAuthTokenInfo, useWeb3AuthUser } from '@web3auth/modal/react';

// Fires `handler` exactly once when the user becomes connected via Web3Auth.
// This is reactive on purpose: social logins (Google etc.) often use a redirect
// flow that reloads the page, so the `connect()` promise can't be relied on to
// drive post-login navigation. Watching the connection state works for both
// redirect and popup flows, and also restores sessions on a fresh page load.
export function useOnWeb3AuthConnected(
  handler: (ctx: { address: string; idToken: string; email: string }) => void | Promise<void>,
) {
  const { isConnected } = useWeb3AuthConnect();
  const { address } = useAccount();
  const { getAuthTokenInfo } = useAuthTokenInfo();
  const { getUserInfo } = useWeb3AuthUser();
  const handledRef = useRef(false);
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // always call the latest handler

  useEffect(() => {
    if (!isConnected || !address || handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        // Prefer the Identity Token from getUserInfo() (signed by the project's
        // dashboard JWKS, meant for backend verification); fall back to the
        // session token from getAuthTokenInfo().
        const info = await getUserInfo().catch(() => null);
        const idToken = (info as { idToken?: string } | null)?.idToken || (await getAuthTokenInfo());
        await handlerRef.current({ address, idToken, email: info?.email || '' });
      } catch (err) {
        handledRef.current = false; // allow a retry if it failed
        throw err;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);
}
