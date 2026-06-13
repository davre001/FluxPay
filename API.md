# FluxPay API Reference

This is the **canonical list of backend endpoints**. The frontend must talk to the
backend **only through [`frontend/src/lib/api-client.ts`](../frontend/src/lib/api-client.ts)** —
do not hardcode `fetch()` calls. That wrapper owns the base URL, the
`Authorization: Bearer <idToken>` header, and error parsing, so using it means you
automatically conform to this contract.

> **Rule of thumb:** if a method isn't exported from `api-client.ts`, the endpoint
> doesn't exist. Add it there first, then use it.

```ts
import { jobAPI, profileAPI, walletAPI, permissionAPI, faucetAPI } from '@/lib/api-client'
const { data } = await jobAPI.list({ status: 'open' })
```

## Base URL

| Environment | URL |
|---|---|
| Production | `https://fluxpay-backend-yxpo.onrender.com` |
| Local dev | `http://localhost:8000` |

Configured via `NEXT_PUBLIC_API_URL`. Every path below is prefixed with `/api`
(except `/health`).

## Authentication

Most endpoints require the Web3Auth **idToken** as a bearer token:

```
Authorization: Bearer <idToken>
```

`api-client.ts` attaches this automatically from `localStorage`. The only routes
that do **not** require it are `POST /api/auth/session` and the `payments` slice.

---

## Auth

| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/api/auth/session` | `{ idToken, profileType? }` | no |
| GET | `/api/auth/me` | — | yes |

## Profile

| Method | Path | Body |
|---|---|---|
| GET | `/api/profile/me` | — |
| PUT | `/api/profile/me` | `{ name, bio, website_url, profile_picture_url, niche_tags }` |
| GET | `/api/profile/reputation/:wallet` | — |

## Jobs

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/jobs` | `?status&platform&payout_type&min_budget&max_budget&page&page_size` |
| GET | `/api/jobs/mine` | `?status&page` |
| POST | `/api/jobs` | job fields |
| POST | `/api/jobs/quote` | job fields → `{ id, quote }` |
| GET | `/api/jobs/:id` | — |
| POST | `/api/jobs/:id/apply` | `{ cover_note }` |
| GET | `/api/jobs/:id/applications` | — |
| POST | `/api/jobs/:id/select/:creatorId` | — |
| POST | `/api/jobs/:id/cancel` | — |
| POST | `/api/jobs/:id/confirm-funding` | funding data |
| GET | `/api/jobs/:id/milestones` | — |

> ⚠️ Applying to a job is `jobAPI.apply(jobId, { cover_note })` — **not**
> `applicationAPI.apply(...)`. `applicationAPI` only has `listMine`.

## Milestones

| Method | Path | Body |
|---|---|---|
| POST | `/api/milestones/:id/submit` | `{ deliverable_url, deliverable_note? }` |
| POST | `/api/milestones/:id/approve` | — |
| POST | `/api/milestones/:id/dispute` | `{ reason }` |

## Wallet

| Method | Path | Body / Query |
|---|---|---|
| GET | `/api/wallet/balance` | — |
| POST | `/api/wallet/deposit` | `{ amount, tx_hash }` |
| POST | `/api/wallet/withdraw` | `{ amount, to_address }` |
| GET | `/api/wallet/transactions` | `?page&page_size` |

> **Balances — source of truth.** On-chain is authoritative. The real multi-chain
> wallet view (`/wallet`) reads holdings **on-chain** (wagmi `useBalance` +
> USDC `balanceOf`, with the GoldRush/Alchemy proxy at `/api/balances` for the
> full token list). These `/api/wallet/*` endpoints are an **internal ledger**
> (app-tracked deposits/escrow/payouts) used by the in-app `creator/wallet`
> activity view — they do **not** reflect on-chain truth and shouldn't be used
> as the authoritative USDC balance.

## Applications

| Method | Path | Query |
|---|---|---|
| GET | `/api/applications/mine` | `?status` |

## Reputation

| Method | Path |
|---|---|
| GET | `/api/reputation/:wallet` |

## Faucet (testnet USDC welcome drip)

| Method | Path | Body |
|---|---|---|
| POST | `/api/faucet/drip` | `{ address }` → `{ funded, amount?, txHash?, reason? }` |

Idempotent per address — sends $2 testnet USDC once on first signup.

## Permissions (ERC-7715)

| Method | Path | Body |
|---|---|---|
| POST | `/api/permissions` | `{ jobId, organization_id, creator_id, signer, token_address, amount, chain_id, permissions_context, delegation_manager, account_meta, raw }` |
| GET | `/api/permissions/:jobId` | — (latest active permission for the job) |

Stores the brand's signed spending permission so the agent can release milestone
USDC. See `useGrantMilestonePermission` on the frontend.

## Verification & Settlement (Venice AI + 1Shot)

| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/api/verify` | `{ milestoneId }` | yes |
| POST | `/api/settle` | `{ milestoneId, via?: 'direct' \| 'relayer', minScore? }` | yes |

- `verify` runs AI verification on a milestone's deliverable and returns the score/result.
- `settle` is the autonomous loop: AI verifies, the score sets the amount, and the
  scored USDC is released **with no human approval** — `via: 'relayer'` settles through
  1Shot (mainnets), `via: 'direct'` redeems directly (default; the testnet path).
  Returns `503 { error: { code: 'unavailable' } }` if the settlement service isn't configured.
- Frontend methods: `verificationAPI.verify(milestoneId)` and
  `verificationAPI.settle(milestoneId, { via, minScore })`.

## Payments (legacy dataset slice — no auth)

| Method | Path | Body |
|---|---|---|
| POST | `/api/payments` | payment fields |
| GET | `/api/payments` | `?userId&status&datasetId` |
| GET | `/api/payments/:id` | — |
| GET | `/api/payments/:id/status` | — |
| GET | `/api/payments/history/:userId` | — |
| PATCH | `/api/payments/:id/status` | `{ status }` |

## Health

| Method | Path | Response |
|---|---|---|
| GET | `/health` | `{ status, service, storage }` (`storage` is `postgres` or `memory`) |

---

## Error shape

Failed requests return:

```json
{ "error": { "code": "SOME_CODE", "message": "Human-readable message" } }
```

`api-client.ts` unwraps this into `error.message`, so in components just read
`e?.message`.
