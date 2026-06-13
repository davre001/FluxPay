# FluxPay

Web3 creator/brand marketplace. Core flow: brands post **jobs** → **milestones** → a brand
signs an **ERC-7715 spending permission** → an **autonomous agent releases milestone USDC** to
creators. Runs on **8 mainnet chains** (1Shot-supported) plus **Base Sepolia** for testing.

## Monorepo layout

Two workspaces, two deploy targets — they are NOT both on Vercel:

| Workspace   | Stack                                                                              | Run (dev)              | Deploys to        |
|-------------|-----------------------------------------------------------------------------------|------------------------|-------------------|
| `frontend/` | Next.js 14 App Router, Tailwind, wagmi/viem, Web3Auth, MetaMask Delegation Toolkit, TanStack Query, framer-motion, three.js | `npm run dev`          | **Vercel** (`frontend/vercel.json`) |
| `backend/`  | TypeScript ESM via `tsx`, `viem`, `@neondatabase/serverless`                       | `npm run dev`          | **Render** (`render.yaml`) |

Backend: `npm run typecheck` (`tsc --noEmit`) before relying on a build — Render builds from
source. Frontend: `npm run lint` (`next lint`).

## Load-bearing conventions

- **Frontend ↔ backend goes only through `frontend/src/lib/api-client.ts`** — it owns the base
  URL, the `Authorization: Bearer <idToken>` header, and error parsing. If a method isn't
  exported there, the frontend doesn't call that endpoint.
- **`API.md`** (repo root) is the canonical endpoint list. Route handlers live in
  `backend/src/routes/`. Every route is under `/api` except `/health`.
- **Error shape** is `{ error: { code, message } }`.
- Backend split: `config/ database/ middleware/ models/ routes/ services/ utils/`. Keep the
  route → service → model layering; reuse existing viem clients and config rather than adding new ones.

## Persistence (Neon Postgres)

- JSONB repository pattern: each entity is a JSONB `data` blob + a few promoted columns the repos
  filter/sort on. New fields on a record need **no migration**. Schema is
  `backend/src/database/schema.ts`.
- Statements run **one-by-one over the Neon HTTP driver** (no multi-statement support) — keep each
  `SCHEMA_STATEMENTS` entry a single self-contained DDL statement.
- Connection string env var is **`DATABASE_URL`**. Watch for the `POSTGREL_URL` typo gotcha that
  has bitten this project before — verify the exact var name when wiring persistence.

## On-chain rules (money code is high-stakes)

- **Multi-chain.** `backend/src/config/chains.ts` is the single source of truth. Eight mainnets —
  Ethereum (1), Base (8453), Arbitrum (42161), Optimism (10), Polygon (137), BNB Chain (56),
  Linea (59144), Scroll (534352) — plus Base Sepolia (84532) for testing. Each chain has its **own
  USDC address**; never hardcode one.
- **Network selection:** `NETWORK_MODE=mainnet` (default) `| testnet`; `ACTIVE_CHAIN_ID` overrides
  the specific chain. Default mainnet chain is Base; default testnet chain is Base Sepolia. Resolve
  chain/token via `getChain(id)` / `activeChain` — don't assume which chain is live.
- **Settlement:** mainnets settle via **1Shot** (USDC addresses come from 1Shot's `getCapabilities`);
  **1Shot does NOT support testnets**, so Base Sepolia uses **direct redeem** only. These are two
  distinct code paths — check which one applies before reasoning about a release.
- **Decimals are not universally 6.** USDC is 6 decimals on most chains but **18 on BNB Chain**
  (Binance-Peg). Read the token's decimals per chain — never assume 6.
- Faucet drips a one-time **$2 testnet USDC on signup** (`POST /api/faucet/drip`, idempotent per address).
- **ERC-7715** spending permissions: granted on the frontend via `useGrantMilestonePermission`,
  stored via `POST /api/permissions`, redeemed (ERC-7710) server-side so the agent releases milestone USDC.
  `GET /api/permissions/:jobId` returns the latest active permission.
- Constraint: **all gas must be paid in USDC** (paymaster) — confirm the gas path in code
  before assuming how signing/paymasters work.
- Flag anything that could over-spend, mis-route funds, use the wrong chain ID, or mis-handle decimals.

## Secrets

`.env` (repo root) holds secrets and is gitignored — **never commit it or edit it via tooling**.
A PreToolUse hook blocks edits to `.env` files; copy from `.env.example` instead.

## Subagents available

- **fluxpay-navigator** — fast read-only "where is X?" locator.
- **fluxpay-web3** — on-chain/settlement specialist for payment/escrow/permission/wallet code.
- **fluxpay-security-reviewer** — security audit of payment/permission/auth paths.
