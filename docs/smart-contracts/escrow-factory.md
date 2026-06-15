---
description: Deploys isolated escrow instances for each deal.
---

# FluxPayEscrowFactory

The factory contract creates isolated escrow instances for each deal.

## Behavior

* Brand calls `createEscrow()` with deal parameters
* A new `FluxPayEscrow` contract is deployed
* The escrow address is associated with the deal
* Factory tracks all deployed escrows

## Usage on Frontend

```typescript
import { CONTRACTS } from '@/contracts/contracts'

// Use with wagmi hooks
const { writeContract } = useWriteContract()
writeContract({
  address: CONTRACTS.escrowFactory.address,
  abi: CONTRACTS.escrowFactory.abi,
  functionName: 'createEscrow',
  args: [/* deal parameters */]
})
```
