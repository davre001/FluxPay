---
description: Backend architecture, runtime, and service layer.
---

# Backend Overview

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Runtime    | Node.js ≥ 20 (`node:http` — no framework) |
| Language   | TypeScript (ESM, run via `tsx`)         |
| Auth       | Web3Auth JWT verification               |
| Storage    | Neon Postgres (JSONB) / In-memory       |
| On-chain   | viem + `@metamask/delegation-toolkit`   |
| AI         | Venice AI (deliverable verification)    |
| Relayer    | 1Shot (USDC-gas payouts)                |

## Architecture

The backend uses **no framework** — routing is a string-split dispatcher in `app.ts`. Every domain is a vertical slice:

```
model (repository) → service (business logic) → route (HTTP handler) → wired in app.ts
```

### Dependency Injection

`createApp(options)` lets every repository and service be overridden, so tests inject in-memory repos and never touch a database:

```typescript
const server = createApp({
  skipAuth: true,
  jobRepository: new InMemoryJobRepository(),
  // ... other overrides
})
```

## Key Files

| File              | Purpose                         | Size    |
| ----------------- | ------------------------------- | ------- |
| `src/index.ts`    | Entry point — starts server     | 0.9 KB  |
| `src/app.ts`      | HTTP server + DI + dispatch     | 26 KB   |
| `src/config/`     | Env config + chain registry     | 10 KB   |
| `src/models/`     | Repository layer (10 files)     | 36 KB   |
| `src/services/`   | Business logic (15 services)    | 55 KB   |
| `src/routes/`     | HTTP handlers (10 files)        | 10 KB   |
