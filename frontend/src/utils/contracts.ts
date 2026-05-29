// Contract interactions for on-chain operations
// Implements the 3 main calls: createEscrow, approve USDC, and fund escrow

import { keccak256, toHex, parseUnits, Address } from 'viem'
import { writeContract, readContract } from '@wagmi/core'
import { CONTRACTS, morphHoodi } from '../config/wagmi'

// Import ABIs
import factoryAbi from '../../../contracts/abis/FluxPayEscrowFactory.json'
import escrowAbi from '../../../contracts/abis/FluxPayEscrow.json'
import usdcAbi from '../../../contracts/abis/MockUSDC.json'

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
): Promise<{ hash: string; escrowAddress?: string }> {
  const jobIdBytes32 = jobIdToBytes32(jobId)

  const hash = await writeContract({
    address: CONTRACTS.escrowFactory as Address,
    abi: factoryAbi.abi,
    functionName: 'createEscrow',
    args: [jobIdBytes32, userAddress, BigInt(deadline)],
    chain: morphHoodi,
  } as any)

  return { hash }
}

/**
 * Get the escrow address for a job ID
 */
export async function getEscrowAddress(jobId: string): Promise<Address | null> {
  const jobIdBytes32 = jobIdToBytes32(jobId)

  try {
    const escrowAddress = await readContract({
      address: CONTRACTS.escrowFactory as Address,
      abi: factoryAbi.abi,
      functionName: 'getEscrow',
      args: [jobIdBytes32],
      chain: morphHoodi,
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

  const hash = await writeContract({
    address: CONTRACTS.usdc as Address,
    abi: usdcAbi.abi,
    functionName: 'approve',
    args: [escrowAddress, amountWei],
    chain: morphHoodi,
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

  const hash = await writeContract({
    address: escrowAddress as Address,
    abi: escrowAbi.abi,
    functionName: 'fund',
    args: [amountWei],
    chain: morphHoodi,
  } as any)

  return { hash }
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: Address): Promise<bigint> {
  try {
    const balance = await readContract({
      address: CONTRACTS.usdc as Address,
      abi: usdcAbi.abi,
      functionName: 'balanceOf',
      args: [address],
      chain: morphHoodi,
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
    const allowance = await readContract({
      address: CONTRACTS.usdc as Address,
      abi: usdcAbi.abi,
      functionName: 'allowance',
      args: [owner, spender],
      chain: morphHoodi,
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
