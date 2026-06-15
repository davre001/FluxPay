---
description: JWT verification and token handling.
---

# Authentication

The backend verifies Web3Auth `idToken` JWTs on every authenticated request.

## Verification Steps

1. Extract `Authorization: Bearer <idToken>` header
2. Decode the JWT header to find the `kid`
3. **Preferred:** verify against the project's static PEM public key (`WEB3AUTH_VERIFICATION_KEY`)
4. **Fallback:** fetch the JWKS from `JWKS_ENDPOINT` and match the `kid`
5. Validate: signature, expiry, issuer, audience

## Devnet Mode

When `WEB3AUTH_ALLOW_UNVERIFIED=true` (for Sapphire Devnet):

* Skips the signature check
* Still enforces audience, issuer, and expiry

{% hint style="danger" %}
`WEB3AUTH_ALLOW_UNVERIFIED` must be `false` on mainnet, where the JWKS endpoint works correctly.
{% endhint %}

## Configuration

| Env Var                       | Purpose                       | Default                                         |
| ----------------------------- | ----------------------------- | ----------------------------------------------- |
| `WEB3AUTH_CLIENT_ID`          | Token audience check          | —                                               |
| `WEB3AUTH_VERIFICATION_KEY`   | Static PEM public key         | —                                               |
| `JWKS_ENDPOINT`               | JWKS URL                      | `https://api-auth.web3auth.io/.well-known/jwks.json` |
| `WEB3AUTH_ALLOW_UNVERIFIED`   | Skip signature (devnet only)  | `false`                                         |
