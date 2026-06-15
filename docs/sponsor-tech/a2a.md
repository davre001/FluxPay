---
description: Agent-to-Agent coordination through delegation redelegation.
---

# A2A Redelegation

## Overview

The platform agent holds the brand's broad grant but **redelegates a narrower, per-job permission** to a settlement agent that performs the actual release.

## Delegation Chain

```
Brand (7702 account)
  └─→ Platform Agent (holds broad grant)
        └─→ Settlement Agent (redelegated, scoped + capped)
              └─→ Creator wallet 💸
```

## Security Benefits

* The child delegation's `authority` cryptographically **links to the parent**
* A leak of the settlement key can spend at most the redelegated cap for one job
* The brand's full authorization is never exposed

## Configuration

| Env Var                          | Purpose                    |
| -------------------------------- | -------------------------- |
| `AGENT_PRIVATE_KEY`              | Platform agent wallet      |
| `SETTLEMENT_AGENT_PRIVATE_KEY`   | Settlement agent wallet    |

## Validation

```bash
# Run the A2A harness on a real chain
node --import tsx scripts/a2a-harness.ts
```
