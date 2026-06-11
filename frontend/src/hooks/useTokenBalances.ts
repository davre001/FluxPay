'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useChainId } from 'wagmi';

export interface WalletToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logo: string | null;
  balance: string; // human-readable
  balanceRaw: string;
  usdValue: number | null;
  isNative: boolean;
}

// Shared fetcher hitting the server-side /api/balances proxy (GoldRush/Covalent).
// `chain` is a numeric EVM chainId or a Covalent chain name like 'solana-mainnet'.
async function fetchBalances(chain: string | number, address: string): Promise<WalletToken[]> {
  const res = await fetch(`/api/balances?chainId=${chain}&address=${address}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to load balances');
  }
  const json = await res.json();
  return (json.tokens ?? []) as WalletToken[];
}

function summarize(query: ReturnType<typeof useQuery<WalletToken[]>>) {
  const tokens = query.data ?? [];
  const totalUsd = tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);
  return {
    tokens,
    totalUsd,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// EVM token balances for the active wagmi chain.
export function useTokenBalances() {
  const { address } = useAccount();
  const chainId = useChainId();

  const query = useQuery({
    queryKey: ['token-balances', chainId, address],
    enabled: Boolean(address && chainId),
    staleTime: 30_000,
    queryFn: () => fetchBalances(chainId, address as string),
  });

  return summarize(query);
}

// Solana token balances stub.
// SolanaProvider and @solana/* packages have been removed (shimmed) so the
// real useSolanaWallet hook is unavailable.  Return safe empty defaults so
// consumers don't break.
export function useSolanaBalances() {
  return {
    tokens: [] as WalletToken[],
    totalUsd: 0,
    isLoading: false,
    isError: false,
    error: null as Error | null,
    refetch: () => Promise.resolve(),
    address: undefined as string | undefined,
  };
}

