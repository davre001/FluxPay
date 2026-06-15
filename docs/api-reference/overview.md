---
description: Base URL, authentication, and error format for all endpoints.
---

# API Overview

## Base URL

| Environment   | URL                                               |
| ------------- | ------------------------------------------------- |
| Production    | `https://fluxpay-backend-yxpo.onrender.com`       |
| Local dev     | `http://localhost:8000`                            |

All paths are prefixed with `/api` (except `/health`).

## Authentication

Most endpoints require the Web3Auth **idToken** as a bearer token:

```
Authorization: Bearer <idToken>
```

The `api-client.ts` wrapper attaches this automatically from `localStorage`.

## Error Shape

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable message"
  }
}
```

## Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "service": "fluxpay-backend",
  "storage": "postgres"
}
```
