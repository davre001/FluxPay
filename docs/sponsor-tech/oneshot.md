---
description: Permissionless USDC-gas payout relay for mainnet.
---

# 1Shot Relayer

## Overview

A payout rail where **gas is paid in USDC** instead of ETH, via 1Shot's permissionless relayer (no API key needed).

## How It Works

1. `RelayerService` speaks 1Shot's JSON-RPC protocol
2. Calls: `getCapabilities`, `getFeeData`, `estimate`, `send7710Transaction`, `getStatus`
3. Fee token is **dynamically picked** from `getCapabilities` (never hardcoded)
4. Selected via `POST /api/permissions/redeem { milestoneId, via: "relayer" }`

## Limitations

* **Mainnet only** — 1Shot returns empty capabilities for testnets
* Service detects this and fails gracefully

## Simulate Mode

On testnet, the system assembles the real payload and fetches a real fee quote, but returns a simulated result instead of broadcasting. Auto-enabled in demo/testnet mode.

## Configuration

| Env Var                  | Default                                      |
| ------------------------ | -------------------------------------------- |
| `ONESHOT_RELAYER_URL`    | `https://relayer.1shotapi.com/relayers`      |
| `ONESHOT_CHAIN_ID`       | Active chain (mainnet)                       |
| `ONESHOT_SIMULATE`       | `true` on testnet                            |
