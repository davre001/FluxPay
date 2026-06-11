'use client';

import { useCallback, useState } from 'react';
import { useAccount, useBalance, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Address, parseUnits, formatUnits } from 'viem';
import { getChainConfig, getToken, getTokens } from '@/config/chains';

// --- Interfaces ---
interface UseUSDCApprovalOptions {
  usdcAddress: string;
  spenderAddress: string;
  amount: string;
}

const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ESCROW_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'jobId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'fund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    name: 'getJobBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// --- Hooks ---

export function useWalletInfo() {
  // No chainId passed → wagmi uses the wallet's active chain (multichain).
  const { address, isConnected, chain } = useAccount();
  const { data: ethBalance } = useBalance({ address });

  return {
    address,
    isConnected,
    ethBalance: ethBalance ? formatUnits(ethBalance.value, ethBalance.decimals) : '0',
    nativeSymbol: ethBalance?.symbol ?? chain?.nativeCurrency.symbol ?? 'ETH',
    chainId: chain?.id,
    chainName: chain?.name ?? 'Not connected',
    explorerUrl: chain?.blockExplorers?.default?.url,
    chain: isConnected ? 'connected' : 'disconnected',
  };
}

export function useUSDCApproval({ usdcAddress, spenderAddress, amount }: UseUSDCApprovalOptions) {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);

  const { data: allowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address || '0x', spenderAddress as `0x${string}`],
    query: { enabled: !!address },
  });

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, status } = useWaitForTransactionReceipt({ hash: txHash });

  const approve = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const amountUnits = parseUnits(amount, 6);
      await writeContractAsync({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amountUnits],
      });
    } finally {
      setIsPending(false);
    }
  }, [address, amount, spenderAddress, usdcAddress, writeContractAsync]);

  const isApproved = allowance ? allowance >= parseUnits(amount, 6) : false;

  return { isApproved, allowance, approve, isPending, isWaiting, isSuccess, status, txHash };
}

export function useFundEscrow({ escrowAddress, jobId, amount }: { escrowAddress: string; jobId: string; amount: string }) {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, status } = useWaitForTransactionReceipt({ hash: txHash });

  const fund = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const amountUnits = parseUnits(amount, 6);
      await writeContractAsync({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'fund',
        args: [jobId as `0x${string}`, amountUnits],
      });
    } finally {
      setIsPending(false);
    }
  }, [address, amount, escrowAddress, jobId, writeContractAsync]);

  return { fund, isPending, isWaiting, isSuccess, status, txHash };
}

// Active chain's config: native currency, supported tokens, escrow factory.
export function useChainConfig() {
  const chainId = useChainId();
  return getChainConfig(chainId);
}

// All tokens (native + ERC-20) available on the active chain — for token pickers.
export function useChainTokens() {
  const chainId = useChainId();
  return getTokens(chainId);
}

// Reads the connected wallet's balance of any ERC-20 token by symbol on the
// active chain. For the native gas token, use useWalletInfo().ethBalance.
export function useTokenBalance(symbol: string) {
  const { address } = useAccount();
  const chainId = useChainId();
  const token = getToken(chainId, symbol);
  const isErc20 = !!token && token.address !== 'native';

  const { data, isLoading, refetch } = useReadContract({
    address: isErc20 ? (token.address as `0x${string}`) : undefined,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isErc20 },
  });

  return {
    balance: data !== undefined ? formatUnits(data as bigint, token?.decimals ?? 6) : '0',
    symbol,
    decimals: token?.decimals ?? 6,
    isLoading,
    refetch,
  };
}

// Backward-compatible wrapper — USDC is the default settlement token for escrow.
export function useUSDCBalance() {
  return useTokenBalance('USDC');
}

export function useCreateEscrow() {
  return { create: () => Promise.resolve(''), isPending: false };
}

export function useEscrowFunding() {
  return { fund: () => Promise.resolve(''), isPending: false };
}