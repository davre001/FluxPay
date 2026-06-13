// Demo chain + token constants for the smart-account / permission flow.
// The token/decimals are sourced from the single chain registry (config/chains.ts)
// so there's one source of truth; this just pins the live escrow/permission demo
// to Base Sepolia (1Shot has no testnet support → direct-redeem path).

import { getToken } from './chains';

export const BASE_SEPOLIA_CHAIN_ID = 84532;

const baseSepoliaUsdc = getToken(BASE_SEPOLIA_CHAIN_ID, 'USDC');

// Circle's official testnet USDC on Base Sepolia, from the chain registry.
export const USDC_BASE_SEPOLIA = (
  baseSepoliaUsdc && baseSepoliaUsdc.address !== 'native'
    ? baseSepoliaUsdc.address
    : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
) as `0x${string}`;
export const USDC_DECIMALS = baseSepoliaUsdc?.decimals ?? 6;

// The backend "agent" address that redeems granted permissions to pay creators.
// Set NEXT_PUBLIC_AGENT_ADDRESS to your backend faucet/agent wallet address.
export const AGENT_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '') as string;
