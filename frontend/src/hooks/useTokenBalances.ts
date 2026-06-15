'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, useChainId } from 'wagmi';
import { useSolanaWallet } from '@web3auth/modal/react/solana';
import { useDemoBalance, demoBalance } from '@/stores/demoBalance';
import { useUserStore } from '@/stores/userStore';

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

// Demo mode shows an illustrative USDC balance so the no-real-funds walkthrough
// is coherent without depending on faucet/agent funds. It ticks down/up with
// settlements (see the demoBalance store). Purely cosmetic.
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function withDemoBalance(tokens: WalletToken[], usdc: number): WalletToken[] {
  const token: WalletToken = {
    symbol: 'USDC', name: 'USD Coin', address: '0x0000000000000000000000000000000000000000',
    decimals: 6, logo: null, balance: String(usdc), balanceRaw: String(Math.round(usdc * 1e6)),
    usdValue: usdc, isNative: false,
  };
  return [token, ...tokens.filter((t) => t.symbol.toUpperCase() !== 'USDC')];
}

// EVM token balances for the active wagmi chain.
export function useTokenBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  // Subscribe to the demo ledger (per role + identity): brand starts funded,
  // creator starts at $0. Re-renders as deals settle.
  const user = useUserStore((s) => s.user);
  const demoUsdc = useDemoBalance((s) => demoBalance(s.deltas, user?.id, user?.profileType));

  const query = useQuery({
    queryKey: ['token-balances', chainId, address],
    enabled: Boolean(address && chainId),
    staleTime: 30_000,
    queryFn: () => fetchBalances(chainId, address as string),
  });

  const base = summarize(query);
  if (!DEMO) return base;
  // Illustrative balance — render immediately, independent of the live fetch.
  const tokens = withDemoBalance(base.tokens, demoUsdc);
  return { ...base, tokens, totalUsd: tokens.reduce((s, t) => s + (t.usdValue ?? 0), 0), isLoading: false, isError: false };
}

// Solana token balances for the embedded wallet's Solana account.
// `accounts` is populated by Web3Auth's SolanaProvider after a social/email login;
// an external EVM-only wallet (e.g. MetaMask) won't have a Solana account.
export function useSolanaBalances() {
  const { accounts } = useSolanaWallet();
  const address = accounts?.[0];

  const query = useQuery({
    queryKey: ['token-balances', 'solana-mainnet', address],
    enabled: Boolean(address),
    staleTime: 30_000,
    queryFn: () => fetchBalances('solana-mainnet', address as string),
  });

  return { ...summarize(query), address };
}


