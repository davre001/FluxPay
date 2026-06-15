---
description: Three smart contracts that power FluxPay's on-chain escrow.
---

# Smart Contracts Overview

## Contracts

| Contract                  | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `FluxPayEscrowFactory`    | Deploys a new `FluxPayEscrow` per deal              |
| `FluxPayEscrow`           | Holds USDC for one deal; releases per milestone     |
| `MockUSDC`                | ERC-20 test token (testnet only)                    |

## Deployed Addresses (Hoodi Testnet)

| Contract         | Address                                      |
| ---------------- | -------------------------------------------- |
| USDC (MockUSDC)  | `0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1` |
| EscrowFactory    | `0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856` |

## ABI Location

ABIs are stored at `frontend/src/contracts/abis/` and exported from `frontend/src/contracts/contracts.ts`:

```typescript
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts/contracts'

CONTRACT_ADDRESSES.usdc          // 0x2CeF...
CONTRACT_ADDRESSES.escrowFactory // 0x58B9...

CONTRACTS.usdc.abi
CONTRACTS.escrowFactory.abi
CONTRACTS.escrow.abi
```
