---
description: Repository interfaces with dual storage backends.
---

# Models & Repositories

Each entity has two repository implementations — in-memory and Postgres — sharing identical interfaces.

## Entity Repositories

| Entity        | In-Memory Class                  | Postgres Class             |
| ------------- | -------------------------------- | -------------------------- |
| User          | `InMemoryUserRepository`         | `PgUserRepository`         |
| Job           | `InMemoryJobRepository`          | `PgJobRepository`          |
| Application   | `InMemoryApplicationRepository`  | `PgApplicationRepository`  |
| Milestone     | `InMemoryMilestoneRepository`    | `PgMilestoneRepository`    |
| Profile       | `InMemoryProfileRepository`      | `PgProfileRepository`      |
| Wallet        | `InMemoryWalletRepository`       | `PgWalletRepository`       |
| Payment       | `InMemoryPaymentRepository`      | `PgPaymentRepository`      |
| Permission    | `InMemoryPermissionRepository`   | `PgPermissionRepository`   |

## Postgres Strategy

Each entity is stored as a **JSONB blob** with promoted columns for filtering/sorting:

* New fields never need a migration
* The Postgres repos are a 1:1 drop-in for the in-memory ones
* Connection string is read from `DATABASE_URL` or `POSTGREL_URL`
* Schema is created idempotently on boot

## Automatic Selection

`defaultRepositories()` in `app.ts` picks the right set:

```typescript
function defaultRepositories() {
  if (isDbEnabled()) {
    return { /* Postgres repos */ }
  }
  return { /* In-memory repos */ }
}
```

{% hint style="success" %}
Tests always use in-memory repos — fast, deterministic, no database setup needed.
{% endhint %}
