---
description: Balance, deposit, withdraw, and transaction history.
---

# Wallet

All endpoints require authentication.

| Method   | Path                         | Body / Query               |
| -------- | ---------------------------- | -------------------------- |
| `GET`    | `/api/wallet/balance`        | —                          |
| `POST`   | `/api/wallet/deposit`        | `{ amount, tx_hash }`      |
| `POST`   | `/api/wallet/withdraw`       | `{ amount, to_address }`   |
| `GET`    | `/api/wallet/transactions`   | `?page&page_size`          |
