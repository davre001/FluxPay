// Contract interactions for on-chain operations
// Implements the 3 main calls: createEscrow, approve USDC, and fund escrow

import { keccak256, toHex, parseUnits, Address } from 'viem'
import { writeContract, readContract } from '@wagmi/core'
import { config } from '../config/wagmi'
import appConfig from '../config/settings'

// Inline ABIs to avoid import resolution issues in build
const factoryAbi = {
  abi: [
    { type: 'constructor', inputs: [{ name: '_coordinator', type: 'address', internalType: 'address' }, { name: '_token', type: 'address', internalType: 'address' }], stateMutability: 'nonpayable' },
    { type: 'function', name: 'createEscrow', inputs: [{ name: 'jobId', type: 'bytes32', internalType: 'bytes32' }, { name: 'requester', type: 'address', internalType: 'address' }, { name: 'deadline', type: 'uint256', internalType: 'uint256' }], outputs: [{ name: 'escrow', type: 'address', internalType: 'address' }], stateMutability: 'nonpayable' },
    { type: 'function', name: 'getEscrow', inputs: [{ name: 'jobId', type: 'bytes32', internalType: 'bytes32' }], outputs: [{ name: '', type: 'address', internalType: 'address' }], stateMutability: 'view' },
  ]
}

const escrowAbi = {
  abi: [
    { type: 'function', name: 'fund', inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { type: 'function', name: 'completeJob', inputs: [], outputs: [], stateMutability: 'nonpayable' },
    { type: 'function', name: 'cancelJob', inputs: [{ name: 'reasonHash', type: 'bytes32', internalType: 'bytes32' }], outputs: [], stateMutability: 'nonpayable' },
  ]
}

const usdcAbi = {
  abi: [
    { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address', internalType: 'address' }, { name: 'amount', type: 'uint256', internalType: 'uint256' }], outputs: [{ name: '', type: 'bool', internalType: 'bool' }], stateMutability: 'nonpayable' },
    { type: 'function', name: 'balanceOf', inputs: [{ name: '', type: 'address', internalType: 'address' }], outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'allowance', inputs: [{ name: '', type: 'address', internalType: 'address' }, { name: '', type: 'address', internalType: 'address' }], outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address', internalType: 'address' }, { name: 'amount', type: 'uint256', internalType: 'uint256' }], outputs: [{ name: '', type: 'bool', internalType: 'bool' }], stateMutability: 'nonpayable' },
    { type: 'function', name: 'transferFrom', inputs: [{ name: 'from', type: 'address', internalType: 'address' }, { name: 'to', type: 'address', internalType: 'address' }, { name: 'amount', type: 'uint256', internalType: 'uint256' }], outputs: [{ name: '', type: 'bool', internalType: 'bool' }], stateMutability: 'nonpayable' },
  ]
}

// Deployed contract addresses (from app settings / env)
const CONTRACTS = {
  usdc: appConfig.contracts.usdc as Address,
  escrowFactory: appConfig.contracts.escrowFactory as Address,
}

/**
 * Convert a UUID job ID to bytes32 for on-chain use
 */
export function jobIdToBytes32(jobId: string): string {
  return keccak256(toHex(jobId))
}

/**
 * Create an escrow contract for a job
 */
export async function createEscrow(
  jobId: string,
  userAddress: Address,
  deadline: number // Unix timestamp
): Promise<{ hash: string }> {
  const jobIdBytes32 = jobIdToBytes32(jobId)

  const hash = await writeContract(config, {
    address: CONTRACTS.escrowFactory,
    abi: factoryAbi.abi,
    functionName: 'createEscrow',
    args: [jobIdBytes32, userAddress, BigInt(deadline)],
  } as any)

  return { hash }
}

/**
 * Get the escrow address for a job ID
 */
export async function getEscrowAddress(jobId: string): Promise<Address | null> {
  const jobIdBytes32 = jobIdToBytes32(jobId)

  try {
    const escrowAddress = await readContract(config, {
      address: CONTRACTS.escrowFactory,
      abi: factoryAbi.abi,
      functionName: 'getEscrow',
      args: [jobIdBytes32],
    } as any)

    return escrowAddress as Address
  } catch (error) {
    console.error('Error fetching escrow address:', error)
    return null
  }
}

/**
 * Approve USDC spending for the escrow contract
 */
export async function approveUSDC(
  escrowAddress: Address,
  amount: number | string // Amount in USDC (will be converted to 6 decimals)
): Promise<{ hash: string }> {
  const amountWei = parseUnits(String(amount), 6)

  const hash = await writeContract(config, {
    address: CONTRACTS.usdc,
    abi: usdcAbi.abi,
    functionName: 'approve',
    args: [escrowAddress, amountWei],
  } as any)

  return { hash }
}

/**
 * Fund the escrow with USDC
 */
export async function fundEscrow(
  escrowAddress: Address,
  amount: number | string // Amount in USDC (will be converted to 6 decimals)
): Promise<{ hash: string }> {
  const amountWei = parseUnits(String(amount), 6)

  const hash = await writeContract(config, {
    address: escrowAddress,
    abi: escrowAbi.abi,
    functionName: 'fund',
    args: [amountWei],
  } as any)

  return { hash }
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: Address): Promise<bigint> {
  try {
    const balance = await readContract(config, {
      address: CONTRACTS.usdc,
      abi: usdcAbi.abi,
      functionName: 'balanceOf',
      args: [address],
    } as any)

    return balance as bigint
  } catch (error) {
    console.error('Error fetching USDC balance:', error)
    return BigInt(0)
  }
}

/**
 * Check USDC allowance for an address
 */
export async function getUSDCAllowance(
  owner: Address,
  spender: Address
): Promise<bigint> {
  try {
    const allowance = await readContract(config, {
      address: CONTRACTS.usdc,
      abi: usdcAbi.abi,
      functionName: 'allowance',
      args: [owner, spender],
    } as any)

    return allowance as bigint
  } catch (error) {
    console.error('Error fetching USDC allowance:', error)
    return BigInt(0)
  }
}

export default {
  jobIdToBytes32,
  createEscrow,
  getEscrowAddress,
  approveUSDC,
  fundEscrow,
  getUSDCBalance,
  getUSDCAllowance,
}
