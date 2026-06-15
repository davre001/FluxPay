---
description: Submit, approve, dispute, and recheck milestones.
---

# Milestones

Deals are split into milestone stages, each with its own metric, requirement, and USDC amount:

![Milestone-based payout — stages with metrics and amounts](/images/milestone-payout.png)

All endpoints require authentication.

| Method   | Path                              | Body                                          |
| -------- | --------------------------------- | --------------------------------------------- |
| `POST`   | `/api/milestones/:id/submit`      | `{ deliverable_url, deliverable_note? }`      |
| `POST`   | `/api/milestones/:id/approve`     | —                                             |
| `POST`   | `/api/milestones/:id/dispute`     | `{ reason }`                                  |
| `POST`   | `/api/milestones/:id/recheck`     | `{ deliverable_url? }`                        |

## Auto-Settlement

When a milestone is submitted, the settlement engine fires automatically (fire-and-forget):

1. Venice AI verifies the deliverable
2. Scores against the brief
3. Releases USDC if approved

The submit response is never blocked by settlement. No-ops gracefully when Venice or agent keys aren't configured.

## Brand Override

`POST /api/milestones/:id/approve` — when the settlement engine is configured, this approves **and** releases the milestone's USDC (quality-weighted if the AI already scored it, else full amount).
