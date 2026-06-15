# FluxPay Docs (`docs-site/`)

The public documentation site, built with **Nextra 4** (Next.js App Router) and deployed to its own
**Vercel** project — separate from `frontend/` (the app) and `backend/` (Render).

Live content lives in [`content/`](content/) as MDX. It is **generated** from the GitBook-formatted
source in the repo-root [`docs/`](../docs/) folder by [`scripts/convert.mjs`](scripts/convert.mjs).

## Develop

```bash
npm install
npm run dev          # http://localhost:3000  (note: Pagefind search only works after a build)
```

## Build (what Vercel runs)

```bash
npm run build        # next build -> then postbuild indexes search with Pagefind
npm start            # serve the production build locally
```

## Re-syncing content from `docs/`

The MDX in `content/` is derived, not hand-edited. To regenerate after editing the source `docs/`:

```bash
npm run convert      # rewrites content/** and the _meta.ts sidebars from ../docs
```

The converter handles the GitBook → Nextra differences automatically:

- `{% hint style="info|warning|danger|success" %}` → `<Callout type="…">`
- `{% content-ref %}` → `<Cards>` / `<Cards.Card>`
- `README.md` → `index.mdx`, and `.md` links → extensionless routes
- `SUMMARY.md` → `content/_meta.ts` + one `_meta.ts` per section folder
- `docs/superpowers/**` (internal specs) is excluded

> **Edit the source, not the output.** If you change a page directly in `content/`, the next
> `npm run convert` will overwrite it. Make lasting edits in `../docs/**` (or stop generating and
> adopt `content/` as the source of truth — your call once the site is live).

## Deploy (Vercel)

Create a new Vercel project pointing at this repo with **Root Directory = `docs-site/`**. Framework
is auto-detected as Next.js. No env vars required — the site is fully static. Every `git push` to
`main` rebuilds and redeploys. Add a custom domain (e.g. `docs.fluxpay.xyz`) in the dashboard.

## Notes

- **zod is pinned to `4.1.12`** via `overrides` in `package.json`. Nextra 4.6.1's theme calls
  `z.custom()` in a way that zod ≥ 4.4 treats as non-optional, which 500s every page (`expected
  nonoptional, received undefined → at children`). Keep the override until Nextra ships a fix.
