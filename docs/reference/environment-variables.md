---
description: Complete reference of all environment variables.
---

# Environment Variables

## Backend

| Variable                          | Purpose                                  | Default                                     | Required     |
| --------------------------------- | ---------------------------------------- | ------------------------------------------- | ------------ |
| `PORT`                            | HTTP server port                         | `8000`                                      | No           |
| `NODE_ENV`                        | Environment mode                         | `development`                               | No           |
| `FRONTEND_URL`                    | CORS origin                              | `*`                                         | Production   |
| `DATABASE_URL`                    | Neon Postgres connection                 | _(in-memory)_                               | No           |
| `NETWORK_MODE`                    | `mainnet` or `testnet`                   | `mainnet`                                   | No           |
| `ACTIVE_CHAIN_ID`                 | Pin a specific chain                     | Base (8453)                                 | No           |
| `WEB3AUTH_CLIENT_ID`              | Token audience check                     | —                                           | Production   |
| `WEB3AUTH_VERIFICATION_KEY`       | Static PEM public key                    | —                                           | No           |
| `JWKS_ENDPOINT`                   | JWKS URL                                 | `https://api-auth.web3auth.io/...`          | No           |
| `WEB3AUTH_ALLOW_UNVERIFIED`       | Skip JWT signature (devnet)              | `false`                                     | No           |
| `VENICE_API_KEY`                  | Venice AI key                            | —                                           | For AI       |
| `VENICE_MODEL`                    | Vision model                             | `claude-opus-4-8`                              | No           |
| `GEMINI_API_KEY`                  | Gemini fallback key                      | —                                           | No           |
| `FAUCET_PRIVATE_KEY`              | Testnet faucet wallet                    | —                                           | For faucet   |
| `FAUCET_DRIP_USDC`               | Welcome drip amount                      | `2`                                         | No           |
| `AGENT_PRIVATE_KEY`               | Payout agent wallet                      | —                                           | For payouts  |
| `SETTLEMENT_AGENT_PRIVATE_KEY`    | A2A settlement agent                     | —                                           | For A2A      |
| `ONESHOT_RELAYER_URL`             | 1Shot endpoint                           | `https://relayer.1shotapi.com/relayers`     | No           |
| `ONESHOT_CHAIN_ID`                | Relay chain                              | Active chain                                | No           |
| `ONESHOT_SIMULATE`                | Simulate mode                            | `true` on testnet                           | No           |
| `DEMO_MODE`                       | Enable demo features                     | `true` on testnet                           | No           |
| `DEMO_UNLOCK_CODE`                | Presenter unlock secret                  | —                                           | No           |
| `GOOGLE_CLIENT_ID`                | YouTube OAuth                            | —                                           | For social   |
| `GOOGLE_CLIENT_SECRET`            | YouTube OAuth                            | —                                           | For social   |
| `TWITTER_CLIENT_ID`               | X/Twitter OAuth                          | —                                           | For social   |
| `TWITTER_CLIENT_SECRET`           | X/Twitter OAuth                          | —                                           | For social   |

## Frontend

| Variable                               | Purpose                     | Required |
| -------------------------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_API_URL`                  | Backend API base URL        | Yes      |
| `NEXT_PUBLIC_CLIENT_ID`                | Web3Auth client ID          | Yes      |
| `NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS`   | Escrow factory address      | Yes      |
| `NEXT_PUBLIC_USDC_ADDRESS`             | USDC token address          | Yes      |
| `NEXT_PUBLIC_BUNDLER_*`                | Bundler URLs per chain      | No       |
| `NEXT_PUBLIC_PAYMASTER_*`              | Paymaster URLs per chain    | No       |
