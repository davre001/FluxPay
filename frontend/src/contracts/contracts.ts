// Contract ABIs and addresses for FluxPay

import USDC_ABI from './abis/MockUSDC.json'
import ESCROW_FACTORY_ABI from './abis/FluxPayEscrowFactory.json'
import ESCROW_ABI from './abis/FluxPayEscrow.json'

export const CONTRACT_ADDRESSES = {
  usdc: '0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1',
  escrowFactory: '0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856',
} as const

export const CONTRACTS = {
  usdc: {
    address: CONTRACT_ADDRESSES.usdc,
    abi: USDC_ABI,
  },
  escrowFactory: {
    address: CONTRACT_ADDRESSES.escrowFactory,
    abi: ESCROW_FACTORY_ABI,
  },
  escrow: {
    abi: ESCROW_ABI,
  },
} as const

export type ContractName = keyof typeof CONTRACTS
