---
description: AI-powered deliverable scoring that determines payout amounts.
---

# Venice AI Verification

## Overview

Replaces manual milestone approval with AI judgment. The Venice score directly determines the payment amount — a $100 milestone that scores 0.85 releases exactly $85 USDC.

## How It Works

1. `VerificationService` builds a **brief** from the job (target platform, post type, required hashtags/mentions/brand tag)
2. Sends the brief + deliverable to a Venice **vision model**
3. Returns a structured verdict: `{ approved, score, reasoning, missing }`
4. Records the verdict on the milestone as `ai_verification` metadata

## Configuration

| Env Var           | Default                         |
| ----------------- | ------------------------------- |
| `VENICE_API_KEY`  | — (safe no-op when unset)       |
| `VENICE_MODEL`    | `claude-opus-4-8`                 |
| `VENICE_BASE_URL` | `https://api.venice.ai/api/v1`  |

## Fallback

When `GEMINI_API_KEY` is set and Venice is unavailable, the system falls back to Gemini AI (same OpenAI-compatible interface).

## Key Files

| File                            | Purpose                    |
| ------------------------------- | -------------------------- |
| `services/veniceService.ts`     | Venice AI HTTP client      |
| `services/verificationService.ts` | Brief building + verdict parsing |
