---
description: Start the frontend and backend dev servers.
---

# Running the Project

Once both servers are up, the app's landing page is served at the frontend URL:

![FluxPay landing — Creator-Brand Deals, secured on-chain](/images/landing-hero.png)

## Frontend (Next.js dev server)

```bash
cd frontend
npm run dev
```

Available at `http://localhost:3000` (or 3001 if 3000 is taken).

## Backend (Node.js API)

```bash
cd backend
npm run dev
```

Available at `http://localhost:8000` by default. Set `PORT` in your `.env` to use a different port.

## Type-Checking

```bash
# Frontend
cd frontend && npx tsc --noEmit

# Backend
cd backend && npm run typecheck
```

## Running Tests

```bash
cd backend
node --import tsx --test tests/*.test.ts
```

{% hint style="info" %}
Tests use in-memory repositories — no database setup needed. They inject mocks via `createApp({ skipAuth: true })`.
{% endhint %}

## Verifying the Setup

Once both servers are running, check the backend health:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "fluxpay-backend",
  "storage": "memory"
}
```

The `storage` field will show `"postgres"` when `DATABASE_URL` is configured.
