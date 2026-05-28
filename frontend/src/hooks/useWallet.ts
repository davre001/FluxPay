'use client';

import { useCallback, useState } from 'react'
import { useAccount, useBalance, useContractWrite, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther } from 'viem'

// USDC Contract ABI (minimal)
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface UseUSDCApprovalOptions {
  usdcAddress: string
  spenderAddress: string
  amount: string
}

export function useUSDCApproval({
  usdcAddress,
  spenderAddress,
  amount,
}: UseUSDCApprovalOptions) {
  const { address } = useAccount()
  const [isPending, setIsPending] = useState(false)

  const { data: allowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address || '0x', spenderAddress as `0x${string}`],
    query: { enabled: !!address },
  })

  const { writeContractAsync, data: txHash } = useContractWrite()

  const { isLoading: isWaiting, isSuccess, status } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const approve = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')

    setIsPending(true)
    try {
      const amountWei = parseEther(amount)
      await writeContractAsync({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [spenderAddress as `0x${string}`, amountWei],
      })
    } finally {
      setIsPending(false)
    }
  }, [address, amount, spenderAddress, usdcAddress, writeContractAsync])

  const isApproved = allowance ? allowance >= BigInt(parseEther(amount)) : false

  return {
    isApproved,
    allowance,
    approve,
    isPending,
    isWaiting,
    isSuccess,
    status,
    txHash,
  }
}

interface UseEscrowFundingOptions {
  escrowAddress: string
  jobId: string
  amount: string
}

// Escrow Contract ABI (minimal)
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
] as const

export function useEscrowFunding({
  escrowAddress,
  jobId,
  amount,
}: UseEscrowFundingOptions) {
  const { address } = useAccount()
  const [isPending, setIsPending] = useState(false)

  const { data: jobBalance } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: ESCROW_ABI,
    functionName: 'getJobBalance',
    args: [jobId as `0x${string}`],
  })

  const { writeContractAsync, data: txHash } = useContractWrite()

  const { isLoading: isWaiting, isSuccess, status } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const fund = useCallback(async () => {
    if (!address) throw new Error('Wallet not connected')

    setIsPending(true)
    try {
      const amountWei = parseEther(amount)
      await writeContractAsync({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: 'fund',
        args: [jobId as `0x${string}`, amountWei],
      })
    } finally {
      setIsPending(false)
    }
  }, [address, amount, escrowAddress, jobId, writeContractAsync])

  return {
    jobBalance,
    fund,
    isPending,
    isWaiting,
    isSuccess,
    status,
    txHash,
  }
}

export function useWalletInfo() {
  const { address, isConnected, chainId } = useAccount()

  const { data: balance } = useBalance({
    address,
  })

  return {
    address,
    isConnected,
    chainId,
    balance: balance?.value || BigInt(0),
    balanceFormatted: balance?.formatted || '0',
    symbol: balance?.symbol || 'ETH',
  }
}
