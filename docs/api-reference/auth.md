---
description: Session creation and user retrieval.
---

# Auth

## `POST /api/auth/session`

Verifies a Web3Auth idToken, upserts the user, returns their profile. Pass `profileType` on signup.

**Auth:** No

**Body:**

```json
{
  "idToken": "<Web3Auth ID token>",
  "profileType": "creator"
}
```

**Response:**

```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "profileType": "creator",
    "walletAddress": "0x..."
  }
}
```

{% hint style="info" %}
`profileType` is optional after signup — omit it on subsequent logins.
{% endhint %}

## `GET /api/auth/me`

Returns the stored user for the bearer token. Used to restore session on page load.

**Auth:** Yes

**Response:** Same `{ user }` shape as above.

## `POST /api/auth/role`

Switch the caller's active role (Brand ⇄ Creator). Demo convenience.

**Auth:** Yes

**Body:**

```json
{
  "profileType": "organization"
}
```
