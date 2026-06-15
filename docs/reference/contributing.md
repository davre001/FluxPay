---
description: How to contribute to FluxPay.
---

# Contributing

## Workflow

1. Fork the repository and run `bash scripts/setup-remotes.sh`
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with a clear message
4. Push: `git push` (goes to both upstream and team fork)
5. Open a Pull Request against `main`

## Code Standards

* **TypeScript** for all new code (both frontend and backend)
* Match the existing code style
* No comments unless the "why" is non-obvious
* Use `api-client.ts` for all backend calls — never hardcode `fetch()`
* Use repository interfaces for data access

## Frontend Conventions

* Use App Router conventions (server/client components)
* Zustand for client-only state, TanStack Query for server state
* Style with Tailwind CSS — avoid inline styles

## Backend Conventions

* Follow the vertical slice: model → service → route → `app.ts`
* New entities need both in-memory and Postgres repos
* Services receive repos via constructor injection
* Routes return `{ statusCode, body }`
