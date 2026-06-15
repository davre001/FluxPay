---
description: Custom React hooks for wallet, API, forms, and permissions.
---

# Hooks

| Hook                              | File                               | Purpose                                    |
| --------------------------------- | ---------------------------------- | ------------------------------------------ |
| `useApi`                          | `hooks/useApi.ts`                  | TanStack Query wrappers for all endpoints  |
| `useWallet`                       | `hooks/useWallet.ts`               | Web3Auth wallet — connect, balance, address |
| `useForm`                         | `hooks/useForm.ts`                 | Form state, validation, submission          |
| `useGrantMilestonePermission`     | `hooks/useGrantMilestonePermission.ts` | ERC-7715 permission granting flow      |
| `useOnWeb3AuthConnected`          | `hooks/useOnWeb3AuthConnected.ts`  | Post-login session setup                    |
| `useTokenBalances`                | `hooks/useTokenBalances.ts`        | Multi-token balance polling                 |
| `useToast`                        | `hooks/useToast.ts`                | Toast notification management               |
