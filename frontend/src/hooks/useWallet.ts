'use client';

import { useCallback, useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Address, parseUnits, formatUnits } from 'viem';
import { morphHoodi } from '@/config/wagmi';
import {
  createEscrow,
  approveUSDC,
  fundEscrow,
  getUSDCBalance,
  getEscrowAddress,
} from '@/utils/contracts';

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
  const { address, isConnected, chain } = useAccount();
  const { data: ethBalance } = useBalance({ address, chainId: morphHoodi.id });

  return {
    address,
    isConnected,
    ethBalance: ethBalance?.formatted || '0',
    chain: isConnected && chain?.id === morphHoodi.id ? 'connected' : 'disconnected',
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

export function useUSDCBalance() {
  return { balance: '0', isLoading: false, refetch: () => {} };
}

export function useCreateEscrow() {
  return { create: () => Promise.resolve(''), isPending: false };
}

export function useEscrowFunding() {
  return { fund: () => Promise.resolve(''), isPending: false };
}