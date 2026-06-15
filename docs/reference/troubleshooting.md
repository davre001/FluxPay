---
description: Common issues and how to fix them.
---

# Troubleshooting

## Common Issues

| Issue                              | Cause                                    | Fix                                              |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `401 Unauthorized` on every request | Token expired or misconfigured           | Check `WEB3AUTH_CLIENT_ID` matches FE + BE       |
| Backend uses in-memory storage     | `DATABASE_URL` not set                   | Set `DATABASE_URL` in backend `.env`             |
| CORS errors                        | `FRONTEND_URL` mismatch                  | Set exact frontend origin (no trailing slash)    |
| Faucet drip fails                  | Mainnet mode or no faucet key            | Set `NETWORK_MODE=testnet` + `FAUCET_PRIVATE_KEY` |
| 1Shot empty capabilities           | Using testnet                            | 1Shot is mainnet-only; use `via: "direct"`       |
| Smart account not working          | No bundler URL                           | Set `NEXT_PUBLIC_BUNDLER_*` for target chain     |
| Venice verification no-op          | No API key                               | Set `VENICE_API_KEY` in backend env              |

## Diagnostic Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Diagnose Web3Auth token issues
node --import tsx scripts/diagnose-token.mjs

# Run tests (no DB needed)
cd backend && node --import tsx --test tests/*.test.ts

# Type-check both projects
cd frontend && npx tsc --noEmit
cd backend && npm run typecheck
```
