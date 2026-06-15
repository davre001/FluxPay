---
description: The typed wrapper that handles all backend communication.
---

# API Client

## Overview

All backend communication goes through `lib/api-client.ts`. **Never hardcode `fetch()` calls** — the API client handles:

* URL construction from `NEXT_PUBLIC_API_URL`
* `Authorization: Bearer <idToken>` from `localStorage`
* JSON serialization / deserialization
* Error unwrapping into `Error` objects with `.message` and `.status`

## Usage

```typescript
import { jobAPI, profileAPI } from '@/lib/api-client'

// List open jobs with filters
const { data } = await jobAPI.list({ status: 'open', platform: 'instagram' })

// Apply to a job
await jobAPI.apply(jobId, { cover_note: 'I would love to work on this!' })
```

## Available Modules

| Module              | Methods                                                     |
| ------------------- | ----------------------------------------------------------- |
| `authAPI`           | `createSession()`, `me()`, `setRole()`                      |
| `profileAPI`        | `getMe()`, `updateMe()`, `socialConnect()`, `getPublic()`   |
| `jobAPI`            | `list()`, `create()`, `apply()`, `selectCreator()`, `cancel()` |
| `milestoneAPI`      | `list()`, `submit()`, `approve()`, `dispute()`, `recheck()` |
| `applicationAPI`    | `listMine()`, `withdraw()`, `reject()`, `listIncoming()`    |
| `walletAPI`         | `getBalance()`, `deposit()`, `withdraw()`, `getTransactions()` |
| `permissionAPI`     | `store()`, `getForJob()`                                    |
| `faucetAPI`         | `drip()`                                                    |
| `verificationAPI`   | `verify()`, `settle()`                                      |
| `reputationAPI`     | `lookup()`                                                  |
| `oneshotAPI`        | `status()`                                                  |
| `demoAPI`           | `unlock()`, `ensureDeals()`                                 |

{% hint style="warning" %}
If a method isn't exported from `api-client.ts`, the endpoint doesn't exist on the frontend. Add it there first, then use it.
{% endhint %}
