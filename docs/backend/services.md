---
description: All 15 backend services and their responsibilities.
---

# Services

| Service                  | File                          | Responsibilities                                                  |
| ------------------------ | ----------------------------- | ----------------------------------------------------------------- |
| `AuthService`            | `authService.ts`              | JWT verification (JWKS/PEM), user upsert, session management      |
| `JobService`             | `jobService.ts`               | Job CRUD, application handling, milestone management               |
| `PaymentService`         | `paymentService.ts`           | Payment recording, status updates, history                         |
| `ProfileService`         | `profileService.ts`           | Profile CRUD, reputation computation, social OAuth                 |
| `WalletService`          | `walletService.ts`            | Balance tracking, deposit/withdraw, transactions                   |
| `PermissionService`      | `permissionService.ts`        | ERC-7715 permission storage and retrieval                          |
| `PayoutService`          | `payoutService.ts`            | USDC payout orchestration — permission → wallet → amount → release |
| `RedeemService`          | `redeemService.ts`            | ERC-7710 delegation redemption via agent wallet                    |
| `RelayerService`         | `relayerService.ts`           | 1Shot JSON-RPC client for USDC-gas relayed payouts                 |
| `VeniceService`          | `veniceService.ts`            | Venice AI HTTP client (OpenAI-compatible)                          |
| `VerificationService`    | `verificationService.ts`      | Builds brief from job, sends to Venice, parses verdict             |
| `SettlementService`      | `settlementService.ts`        | Autonomous loop: verify → score → approve → release               |
| `FaucetService`          | `faucetService.ts`            | One-time testnet USDC drip per address                             |
| `RedelegationService`    | `redelegationService.ts`      | A2A delegation chaining (parent → child)                           |
| `DealService`            | `dealService.ts`              | Deal management                                                    |
