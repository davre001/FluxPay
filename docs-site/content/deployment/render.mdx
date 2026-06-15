---
description: Deploy the backend to Render using render.yaml.
---

# Backend → Render

## Infrastructure as Code

The `render.yaml` at the repo root defines the backend service:

```yaml
services:
  - type: web
    name: fluxpay-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
```

## Setup

1. Connect the repo in the Render dashboard
2. Render picks up `render.yaml` automatically
3. Set these secrets in the Render environment:

| Secret                | Purpose                              |
| --------------------- | ------------------------------------ |
| `FRONTEND_URL`        | Your Vercel URL (for CORS)           |
| `WEB3AUTH_CLIENT_ID`  | Must match frontend                  |
| `DATABASE_URL`        | Neon Postgres (optional)             |
| `VENICE_API_KEY`      | AI verification (optional)           |
| `FAUCET_PRIVATE_KEY`  | Testnet faucet (optional)            |
| `AGENT_PRIVATE_KEY`   | On-chain redemption (optional)       |

## Health Check

Render uses `/health` to verify the service is running:

```json
{
  "status": "ok",
  "service": "fluxpay-backend",
  "storage": "postgres"
}
```
