import { NotFoundError, ValidationError } from '../utils/errors.ts';

// The autonomous settlement agent — the heart of the "funds release
// automatically" story. One call runs the full loop with NO human in the middle:
//
//   1. Venice AI verifies the deliverable against the brief
//   2. If approved, the AI *score* sets how much of the milestone is released
//      (score 0.85 → 85% of the milestone amount — quality-weighted payout)
//   3. The milestone is marked approved and the scored USDC is released via the
//      brand's ERC-7715 permission (direct redeem or 1Shot relay)
//
// The AI verdict is the on-chain trigger; nobody clicks "approve".
export class SettlementService {
  constructor(
    private verification: any,
    private payout: any,
    private milestones: any,
  ) {}

  async settleMilestone(
    milestoneId: string,
    opts: { via?: 'direct' | 'relayer'; minScore?: number } = {},
  ) {
    if (!milestoneId) throw new ValidationError('milestoneId is required');
    const minScore = opts.minScore ?? 0.5;

    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');

    // 1. AI verification
    const verdict = await this.verification.verifyMilestone(milestoneId);
    if (!verdict.verified) {
      // Venice not configured or errored — surface, don't pay.
      return { settled: false, stage: 'verification', verdict };
    }

    // 2. Decision gate: must be approved AND clear the score threshold.
    if (!verdict.approved || verdict.score < minScore) {
      return {
        settled: false,
        stage: 'rejected',
        reason: `score ${verdict.score} < ${minScore} or not approved`,
        verdict,
      };
    }

    // 3. Quality-weighted amount: milestone amount × AI score.
    const scoredAmount = round6(Number(milestone.amount) * verdict.score);

    // The AI approves it — record the autonomous approval so payout's invariant
    // (only pay approved milestones) holds and the UI reflects the new state.
    await this.milestones.update(milestoneId, { status: 'approved' });

    // 4. Release the scored USDC via the brand's permission.
    const payout = await this.payout.releaseMilestone(milestoneId, {
      via: opts.via || 'direct',
      amountUsdc: scoredAmount,
    });
    await this.recordSettlement(milestoneId, payout);

    return {
      settled: Boolean(payout.ok),
      stage: 'settled',
      verdict: { approved: verdict.approved, score: verdict.score, reasoning: verdict.reasoning },
      scored_amount: scoredAmount,
      milestone_amount: milestone.amount,
      payout,
    };
  }

  // Brand override: manually approve a submitted milestone and release its USDC
  // without waiting for (or regardless of) the autonomous AI loop. The amount is
  // quality-weighted when the AI already scored the deliverable, otherwise the
  // full milestone amount is released. Unlike settleMilestone there is no score
  // gate — the brand's approval is the authority.
  async approveAndRelease(
    milestoneId: string,
    opts: { via?: 'direct' | 'relayer' } = {},
  ) {
    if (!milestoneId) throw new ValidationError('milestoneId is required');

    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (milestone.status !== 'submitted') {
      throw new ValidationError(`Cannot approve milestone from status: ${milestone.status}`);
    }

    // Quality-weighted if the AI already scored it; full amount otherwise.
    const score = Number(milestone.ai_verification?.score);
    const amountUsdc = Number.isFinite(score) && score > 0
      ? round6(Number(milestone.amount) * score)
      : Number(milestone.amount);

    // The brand approves — record it so payout's invariant (only pay approved
    // milestones) holds and reputation/UI reflect the new state.
    const updated = await this.milestones.update(milestoneId, { status: 'approved' });

    // Attempt the release. A payout failure (e.g. no permission on the job) must
    // NOT undo the approval — surface it instead so the brand can act.
    let payout: any;
    try {
      payout = await this.payout.releaseMilestone(milestoneId, {
        via: opts.via || 'direct',
        amountUsdc,
      });
    } catch (error) {
      payout = { ok: false, reason: (error as Error).message };
    }

    // Record how it settled on the milestone so the UI can show the rail (real
    // transfer + live 1Shot gas-in-USDC) on the settled card.
    const settled = await this.recordSettlement(milestoneId, payout) || updated;

    // Spread the updated milestone so callers expecting the record (status:
    // 'approved') keep working, then attach the release metadata.
    return {
      ...settled,
      approved: true,
      scored_amount: amountUsdc,
      milestone_amount: milestone.amount,
      payout,
    };
  }

  // Persist a compact settlement summary (rail used, 1Shot fee proof) onto the
  // milestone. Never throws — surfacing must not break the payout response.
  private async recordSettlement(milestoneId: string, payout: any) {
    if (!payout?.ok) return null;
    const settlement = {
      via: payout.via,
      simulated: Boolean(payout.simulated),
      tx: payout.txHash || null,
      oneshot: payout.oneshot ? { chainId: payout.oneshot.chainId, feeToken: payout.oneshot.feeToken } : null,
    };
    return this.milestones.update(milestoneId, { settlement }).catch(() => null);
  }
}

// USDC has 6 decimals — round to avoid parseUnits overflow on long floats.
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
