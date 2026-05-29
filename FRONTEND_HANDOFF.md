# FluxPay — Frontend Handoff

Everything the frontend needs to talk to the FluxPay backend + smart contracts.

---

## 1. Quick facts

| Thing | Value |
|---|---|
| Backend base URL (dev) | `http://127.0.0.1:8000` |
| Interactive API docs | `http://127.0.0.1:8000/docs` |
| Auth | JWT Bearer token (`Authorization: Bearer <token>`) |
| Chain | Morph Hoodi testnet |
| Chain ID | **2910** |
| RPC URL | `https://rpc-hoodi.morphl2.io` |
| Explorer | `https://explorer-hoodi.morphl2.io` |

### Deployed contracts
| Contract | Address |
|---|---|
| USDC (test) | `0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1` |
| EscrowFactory | `0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856` |

### Contract ABIs (import these into the frontend)
Committed and ready to copy — each file is already just `{ "abi": [...] }`:
- `contracts/abis/FluxPayEscrowFactory.json`
- `contracts/abis/FluxPayEscrow.json`
- `contracts/abis/MockUSDC.json`

---

## 2. wagmi / viem chain config

```ts
import { defineChain } from "viem";

export const morphHoodi = defineChain({
  id: 2910,
  name: "Morph Hoodi",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-hoodi.morphl2.io"] } },
  blockExplorers: { default: { name: "Morph Explorer", url: "https://explorer-hoodi.morphl2.io" } },
  testnet: true,
});

export const CONTRACTS = {
  usdc: "0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1",
  escrowFactory: "0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856",
} as const;
```

USDC has **6 decimals** — always `parseUnits(amount, 6)`.

---

## 3. The full user flow (frontend ↔ backend ↔ chain)

```
┌─ Frontend ────────────┐   ┌─ Backend ──────────┐   ┌─ Chain (Hoodi) ──────┐
│ 1. Register / Login    │──▶│ POST /auth/*        │                          │
│ 2. Pick template /     │──▶│ POST /jobs/quote    │                          │
│    fill job form       │   │  → returns quote +  │                          │
│ 3. Show cost, confirm  │   │    job_id           │                          │
│ 4. Connect wallet      │                          │                          │
│ 5. createEscrow()      │──────────────────────────▶│ factory.createEscrow  │
│ 6. approve(USDC)       │──────────────────────────▶│ usdc.approve          │
│ 7. fund(amount)        │──────────────────────────▶│ escrow.fund           │
│ 8. POST funding-confirm│──▶│ /jobs/{id}/funding- │                          │
│    (tx hash + escrow)  │   │  confirmation       │                          │
│                        │   │  → coordinator runs │                          │
│                        │   │    pipeline + pays  │──▶│ executeMicroPayout    │
│ 9. Poll job status /   │──▶│ GET /jobs/{id}      │                          │
│    WebSocket           │   │ WS /ws/jobs/{id}    │                          │
│ 10. Show results       │──▶│ GET /results/.../   │                          │
│     + export           │   │  export/csv|json    │                          │
└────────────────────────┘   └─────────────────────┘   └──────────────────────┘
```

---

## 4. Endpoint reference

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{email, password, role}` | user |
| POST | `/api/auth/login` | `{email, password}` | `{access_token}` |

Send the token on every other request: `Authorization: Bearer <access_token>`.

### Templates (data products — `/jobs/new` page)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/templates` | `?category=&featured=true` — catalog (5 seeded) |
| GET | `/api/templates/{id}` | one template |
| POST | `/api/templates/{id}/launch` | `{requester_wallet, max_rows?, budget_usdc?, freshness?}` → creates a job |
| POST | `/api/templates/requests` | public "submit a data bounty" form `{email, description, ...}` |

### Jobs
| Method | Path | Notes |
|---|---|---|
| POST | `/api/jobs/quote` | full job form → returns job + quote (estimated cost) |
| GET | `/api/jobs` | `?page=&page_size=` — dashboard list |
| GET | `/api/jobs/{id}` | live job detail (status, quote, manifest, escrow) |
| POST | `/api/jobs/{id}/funding-confirmation` | after on-chain fund — see below |
| GET | `/api/jobs/{id}/results` | result batches |

**Funding confirmation body** (call after `escrow.fund()` succeeds):
```json
{
  "tx_hash": "0x...64hex",
  "escrow_address": "0x...40hex",
  "funded_amount_usdc": 10.0,
  "requester_address": "0x...40hex"
}
```

### Results (`/datasets/[id]` page)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/results/jobs/{id}/summary` | counts, quality, payout total, export links |
| GET | `/api/results/jobs/{id}/export/json` | downloadable JSON |
| GET | `/api/results/jobs/{id}/export/csv` | downloadable CSV |

### Schedules (recurring jobs)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/schedules` | `{job_config, freshness:"daily"|"weekly", template_id?}` |
| GET | `/api/schedules` | list user's schedules |
| POST | `/api/schedules/{id}/pause` · `/resume` | toggle |

### Workers (`/workers` page) & Admin (`/admin` page)
| Method | Path |
|---|---|
| GET | `/api/workers` · `/api/workers/{id}` |
| GET | `/api/admin/jobs` |
| POST | `/api/admin/jobs/{id}/cancel` · `/api/admin/tasks/{id}/retry` |

### Live updates
WebSocket: `ws://127.0.0.1:8000/ws/jobs/{job_id}` — emits `job_planned`, `job_completed` etc. as JSON. Use this on the job detail page instead of polling.

---

## 5. On-chain calls the frontend must make (wagmi)

```ts
import { CONTRACTS, morphHoodi } from "./chains";
import factoryAbi from "./abis/FluxPayEscrowFactory.json";
import escrowAbi from "./abis/FluxPayEscrow.json";
import usdcAbi from "./abis/MockUSDC.json";
import { keccak256, toHex, parseUnits } from "viem";

// jobId from backend (UUID) → bytes32
const jobIdBytes32 = keccak256(toHex(job.id));

// 1. Create escrow
await writeContract({
  address: CONTRACTS.escrowFactory, abi: factoryAbi.abi,
  functionName: "createEscrow",
  args: [jobIdBytes32, userAddress, BigInt(Math.floor(Date.now()/1000) + 86400)],
});
// read it back: factory.getEscrow(jobIdBytes32) → escrowAddress

// 2. Approve USDC
await writeContract({
  address: CONTRACTS.usdc, abi: usdcAbi.abi,
  functionName: "approve",
  args: [escrowAddress, parseUnits(String(total), 6)],
});

// 3. Fund
await writeContract({
  address: escrowAddress, abi: escrowAbi.abi,
  functionName: "fund",
  args: [parseUnits(String(total), 6)],
});

// 4. Tell the backend
await fetch(`${API}/api/jobs/${job.id}/funding-confirmation`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    tx_hash: fundTxHash,
    escrow_address: escrowAddress,
    funded_amount_usdc: total,
    requester_address: userAddress,
  }),
});
// backend coordinator now plans tasks, runs workers, verifies, and pays out on-chain.
```

> **Note:** `markReady`, `executeMicroPayout`, and `completeJob` are called by the **backend coordinator**, NOT the frontend. The frontend only does `createEscrow` + `approve` + `fund`.

### Getting test USDC for a demo wallet
The connected wallet needs test USDC to fund. Mint it (USDC owner = coordinator):
```bash
cast send 0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1 \
  "mint(address,uint256)" <WALLET> 100000000 \
  --rpc-url https://rpc-hoodi.morphl2.io --private-key <COORDINATOR_KEY> \
  --legacy --gas-price 1000000000
```
(100000000 = 100 USDC). Plus test ETH for gas from https://morphfaucet.com.

---

## 6. Running the backend (so the frontend has something to hit)

```powershell
cd c:\Users\USER\FluxPay
.\start.ps1
```
Backend → `http://127.0.0.1:8000`. Set the frontend's API base URL env var to that.

CORS is already allowed for `http://localhost:3000` (the Next.js default). If the frontend runs on a different port, update `FRONTEND_URL` in `.env`.
