---
description: AI verification and autonomous settlement endpoints.
---

# Verification & Settlement

## `POST /api/verify`

Run AI verification on a milestone's deliverable. Returns a structured verdict.

**Auth:** Yes

**Body:**

```json
{ "milestoneId": "milestone-uuid" }
```

**Response:**

```json
{
  "approved": true,
  "score": 0.9,
  "reasoning": "AirMax product visible, @nike tagged, #JustDoIt present",
  "missing": []
}
```

## `POST /api/settle`

The headline endpoint — triggers the full autonomous settlement loop.

**Auth:** Yes

**Body:**

```json
{
  "milestoneId": "milestone-uuid",
  "via": "direct",
  "minScore": 0.5
}
```

This endpoint:

1. Calls Venice to verify the deliverable
2. Gates on `approved` AND `score >= minScore` (default 0.5)
3. Marks the milestone approved
4. Releases `milestone.amount × score` USDC

## `GET /api/oneshot/status`

Read-only proof the 1Shot integration is wired. No auth needed.

**Query:** `?chainId` (optional)
