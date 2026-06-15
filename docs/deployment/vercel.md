---
description: Deploy the frontend to Vercel.
---

# Frontend → Vercel

## Auto-Deploy

The frontend auto-deploys on push to `main`:

1. Connect the repo to Vercel
2. Set all `NEXT_PUBLIC_*` environment variables in the Vercel dashboard
3. Push to `main` → automatic deployment

## Manual Deploy

```bash
vercel --prod
```

## Vercel Settings

| Setting          | Value           |
| ---------------- | --------------- |
| Framework        | Next.js         |
| Root Directory   | `frontend`      |
| Build Command    | `npm run build` |
| Output Directory | `.next`         |

## Required Environment Variables

* `NEXT_PUBLIC_API_URL`
* `NEXT_PUBLIC_CLIENT_ID`
* `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS`
* `NEXT_PUBLIC_USDC_ADDRESS`
