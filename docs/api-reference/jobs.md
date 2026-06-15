---
description: Deal lifecycle — create, list, apply, select, fund.
---

# Jobs & Deals

| Method   | Path                                  | Body / Query                                    | Auth  |
| -------- | ------------------------------------- | ----------------------------------------------- | ----- |
| `GET`    | `/api/jobs`                           | `?status&platform&payout_type&min_budget&max_budget&page&page_size` | No  |
| `POST`   | `/api/jobs`                           | Job fields                                      | Yes   |
| `POST`   | `/api/jobs/quote`                     | Job fields → `{ id, quote }`                    | Yes   |
| `GET`    | `/api/jobs/mine`                      | `?status&page`                                  | Yes   |
| `GET`    | `/api/jobs/:id`                       | —                                               | No    |
| `POST`   | `/api/jobs/:id/apply`                 | `{ cover_note }`                                | Yes   |
| `GET`    | `/api/jobs/:id/applications`          | —                                               | Yes   |
| `POST`   | `/api/jobs/:id/select/:creatorId`     | —                                               | Yes   |
| `POST`   | `/api/jobs/:id/cancel`                | —                                               | Yes   |
| `POST`   | `/api/jobs/:id/confirm-funding`       | Funding data                                    | Yes   |
| `POST`   | `/api/jobs/:id/submit-deliverable`    | `{ deliverable_url, deliverable_note? }`        | Yes   |
| `GET`    | `/api/jobs/:id/milestones`            | —                                               | Yes   |

{% hint style="warning" %}
Applying to a job is `jobAPI.apply(jobId, { cover_note })` — **not** `applicationAPI.apply(...)`. The `applicationAPI` only has `listMine`.
{% endhint %}

## Posting a Deal

A brand posts a deal with title, platform, content type, budget, and a milestone breakdown:

![Post a Deal — deal details and budget](/images/post-deal.png)

## Managing Deals

All of a brand's active deals, with budgets and applicant counts:

![All Jobs — active brand deals](/images/all-jobs.png)
