---
description: Testnet faucet, reputation, and demo endpoints.
---

# Faucet & Utilities

## Faucet

### `POST /api/faucet/drip`

One-time $2 testnet USDC drip on first signup. Idempotent per address.

**Auth:** Yes

**Body:**

```json
{ "address": "0x..." }
```

**Response:**

```json
{
  "funded": true,
  "amount": "2.00",
  "txHash": "0x..."
}
```

{% hint style="info" %}
Auto-disabled on mainnet — you can't hand out free real USDC.
{% endhint %}

## Reputation

### `GET /api/reputation/:wallet`

Returns the on-chain reputation score for a wallet address.

**Auth:** Yes

## Demo

### `POST /api/demo/unlock`

Validates a passphrase against the server-only secret.

**Auth:** No

### `POST /api/demo/ensure-deals`

Idempotently seeds 3 starter deals for the calling brand.

**Auth:** Yes
