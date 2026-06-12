// Demo chain + token constants for the smart-account / permission flow.
// Multichain stays configured in web3authContext.ts; this is the single chain
// the live escrow/permission demo runs on.

export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Circle's official testnet USDC on Base Sepolia (6 decimals).
export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
export const USDC_DECIMALS = 6;

// The backend "agent" address that redeems granted permissions to pay creators.
// Set NEXT_PUBLIC_AGENT_ADDRESS to your backend faucet/agent wallet address.
export const AGENT_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_ADDRESS || '') as string;
