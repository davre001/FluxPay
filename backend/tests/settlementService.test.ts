import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { InMemoryMilestoneRepository } from '../src/models/milestone.ts';
import { SettlementService } from '../src/services/settlementService.ts';

// Stub payout that records the amount it was asked to release. Returns ok by
// default; can be told to throw to simulate "no permission on the job".
function makePayout({ throws = false } = {}) {
  const calls: any[] = [];
  return {
    calls,
    async releaseMilestone(milestoneId: string, opts: any) {
      calls.push({ milestoneId, opts });
      if (throws) throw new Error('No spending permission granted for this job');
      return { ok: true, txHash: '0xabc', via: opts.via };
    },
  };
}

describe('SettlementService.approveAndRelease', () => {
  let milestones: any;

  beforeEach(() => {
    milestones = new InMemoryMilestoneRepository([
      { id: 'ms_full', job_id: 'job_1', amount: 100, status: 'submitted' },
      { id: 'ms_scored', job_id: 'job_1', amount: 100, status: 'submitted', ai_verification: { score: 0.85 } },
      { id: 'ms_pending', job_id: 'job_1', amount: 100, status: 'pending' },
    ]);
  });

  it('releases the full amount when the AI has not scored it', async () => {
    const payout = makePayout();
    const svc = new SettlementService({}, payout, milestones);

    const result = await svc.approveAndRelease('ms_full');

    assert.equal(result.approved, true);
    assert.equal(result.scored_amount, 100);
    assert.equal(payout.calls[0].opts.amountUsdc, 100);
    assert.equal((await milestones.findById('ms_full')).status, 'approved');
  });

  it('releases score x amount when the AI already scored it', async () => {
    const payout = makePayout();
    const svc = new SettlementService({}, payout, milestones);

    const result = await svc.approveAndRelease('ms_scored');

    assert.equal(result.scored_amount, 85);
    assert.equal(payout.calls[0].opts.amountUsdc, 85);
  });

  it('still records the approval when payout fails (e.g. no permission)', async () => {
    const payout = makePayout({ throws: true });
    const svc = new SettlementService({}, payout, milestones);

    const result = await svc.approveAndRelease('ms_scored');

    assert.equal(result.approved, true);
    assert.equal(result.payout.ok, false);
    assert.match(result.payout.reason, /permission/);
    assert.equal((await milestones.findById('ms_scored')).status, 'approved');
  });

  it('rejects approval from a non-submitted status', async () => {
    const payout = makePayout();
    const svc = new SettlementService({}, payout, milestones);

    await assert.rejects(() => svc.approveAndRelease('ms_pending'), /Cannot approve/);
    assert.equal(payout.calls.length, 0);
  });
});
