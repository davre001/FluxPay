import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { JobService } from '../src/services/jobService.ts';
import { PayoutService } from '../src/services/payoutService.ts';
import { collectCreatorMilestones } from '../src/utils/reputation.ts';
import { InMemoryJobRepository } from '../src/models/job.ts';
import { InMemoryApplicationRepository } from '../src/models/application.ts';
import { InMemoryMilestoneRepository } from '../src/models/milestone.ts';
import { InMemoryProfileRepository } from '../src/models/profile.ts';
import { InMemoryUserRepository } from '../src/models/user.ts';
import { InMemoryPermissionRepository } from '../src/models/permission.ts';

const ORG_ID = 'org1';

// A 2-slot deal: pool (total_budget) = $800, split into a $400 per-creator cut
// (milestones 100 + 300 = 400 = 800 / 2 slots).
const JOB_INPUT = {
  title: 'Multi campaign',
  total_budget: 800,
  payout_type: 'milestone',
  target_platform: 'other',
  platform_other: 'Newsletter',
  creator_slots: 2,
  milestones: [{ title: 'M1', amount: 100 }, { title: 'M2', amount: 300 }],
};

function buildJobService() {
  return new JobService(
    new InMemoryJobRepository(),
    new InMemoryApplicationRepository(),
    new InMemoryMilestoneRepository(),
    new InMemoryProfileRepository(),
  );
}

async function seedApprovedDeal(svc: any, creatorIds: string[]) {
  const job = await svc.createJob(ORG_ID, JOB_INPUT);
  for (const c of creatorIds) await svc.applyToJob(job.id, c, { cover_note: 'pick me' });
  return job;
}

describe('Multi-creator: approveApplicant', () => {
  let svc: any;
  beforeEach(() => { svc = buildJobService(); });

  it('approves multiple creators without rejecting the others while slots remain', async () => {
    const job = await seedApprovedDeal(svc, ['c1', 'c2', 'c3']);

    await svc.approveApplicant(job.id, 'c1');
    let apps = await svc.listApplications(job.id);
    // c1 accepted; c2 and c3 still pending (slot still open).
    assert.equal(apps.find((a: any) => a.creator_id === 'c1').status, 'accepted');
    assert.equal(apps.find((a: any) => a.creator_id === 'c2').status, 'pending');
    assert.equal(apps.find((a: any) => a.creator_id === 'c3').status, 'pending');

    // Filling the last slot declines the remaining pending applicant.
    await svc.approveApplicant(job.id, 'c2');
    apps = await svc.listApplications(job.id);
    assert.equal(apps.find((a: any) => a.creator_id === 'c2').status, 'accepted');
    assert.equal(apps.find((a: any) => a.creator_id === 'c3').status, 'rejected');
  });

  it('gives each approved creator their own milestone instances', async () => {
    const job = await seedApprovedDeal(svc, ['c1', 'c2']);
    await svc.approveApplicant(job.id, 'c1');
    await svc.approveApplicant(job.id, 'c2');

    const c1 = await svc.listCreatorMilestones(job.id, 'c1');
    const c2 = await svc.listCreatorMilestones(job.id, 'c2');
    const templates = await svc.listMilestones(job.id);
    assert.equal(c1.length, 2);
    assert.equal(c2.length, 2);
    assert.equal(templates.length, 2); // definition untouched
    assert.notEqual(c1[0].id, c2[0].id); // distinct instances
    assert.equal(c1.reduce((s: number, m: any) => s + m.amount, 0), 400);
  });

  it('rejects approving more creators than the slot count', async () => {
    const job = await seedApprovedDeal(svc, ['c1', 'c2', 'c3']);
    await svc.approveApplicant(job.id, 'c1');
    await svc.approveApplicant(job.id, 'c2');
    await assert.rejects(() => svc.approveApplicant(job.id, 'c3'), /slot/);
  });

  it('is idempotent when re-approving the same creator', async () => {
    const job = await seedApprovedDeal(svc, ['c1', 'c2']);
    await svc.approveApplicant(job.id, 'c1');
    await svc.approveApplicant(job.id, 'c1');
    const c1 = await svc.listCreatorMilestones(job.id, 'c1');
    assert.equal(c1.length, 2); // not cloned twice
    const updated = await svc.getJob(job.id);
    assert.deepEqual(updated.approved_creator_ids, ['c1']);
  });

  it('only submits the submitting creator\'s own instances', async () => {
    const job = await seedApprovedDeal(svc, ['c1', 'c2']);
    await svc.approveApplicant(job.id, 'c1');
    await svc.approveApplicant(job.id, 'c2');

    await svc.submitDealDeliverable(job.id, 'c1', { deliverable_url: 'https://x/1' });
    const c1 = await svc.listCreatorMilestones(job.id, 'c1');
    const c2 = await svc.listCreatorMilestones(job.id, 'c2');
    assert.ok(c1.every((m: any) => m.status === 'submitted'));
    assert.ok(c2.every((m: any) => m.status === 'pending'));
  });
});

describe('Reputation back-compat: collectCreatorMilestones', () => {
  it('counts legacy single-winner template milestones (creator_id null)', async () => {
    const jobs = new InMemoryJobRepository();
    const milestones = new InMemoryMilestoneRepository();
    // Legacy deal: selected_creator_id set, NO approved_creator_ids, milestones
    // are templates (creator_id null) — exactly how old deals were stored.
    const job = await jobs.create({ organization_id: ORG_ID, title: 'Legacy', total_budget: 100, selected_creator_id: 'cLegacy' });
    const m = await milestones.create({ job_id: job.id, title: 'm', amount: 100 });
    await milestones.update(m.id, { status: 'approved' });

    const byJob = await collectCreatorMilestones(jobs, milestones, 'cLegacy');
    assert.equal(byJob.size, 1);
    assert.equal(byJob.get(job.id)!.length, 1);
    assert.equal(byJob.get(job.id)![0].status, 'approved');
  });

  it('counts new per-creator instances and ignores legacy templates of multi-hire deals', async () => {
    const jobs = new InMemoryJobRepository();
    const milestones = new InMemoryMilestoneRepository();
    const job = await jobs.create({ organization_id: ORG_ID, title: 'New', total_budget: 200, creator_slots: 2, approved_creator_ids: ['cNew'], selected_creator_id: 'cNew' });
    await milestones.create({ job_id: job.id, title: 't', amount: 100 }); // template (null) — should be ignored
    const inst = await milestones.create({ job_id: job.id, creator_id: 'cNew', title: 'i', amount: 100 });
    await milestones.update(inst.id, { status: 'approved' });

    const byJob = await collectCreatorMilestones(jobs, milestones, 'cNew');
    assert.equal(byJob.get(job.id)!.length, 1); // only the instance, not the template
    assert.equal(byJob.get(job.id)![0].creator_id, 'cNew');
  });
});

describe('Multi-creator: payout pool + recipient', () => {
  let jobs: any, milestones: any, users: any, permissions: any, payout: any, redeem: any;

  beforeEach(async () => {
    jobs = new InMemoryJobRepository();
    milestones = new InMemoryMilestoneRepository();
    users = new InMemoryUserRepository();
    permissions = new InMemoryPermissionRepository();
    await users.upsert({ key: 'c1', walletAddress: '0x' + '1'.repeat(40) });
    await users.upsert({ key: 'c2', walletAddress: '0x' + '2'.repeat(40) });
    // Stub redeem: always succeeds, records the recipient it was asked to pay.
    redeem = { calls: [] as any[], async redeem(opts: any) { this.calls.push(opts); return { redeemed: true, txHash: '0xok' }; } };
    payout = new PayoutService(permissions, jobs, milestones, users, redeem as any);
  });

  async function setupPoolDeal() {
    // pool (total_budget) = $800, 2 slots, $400/creator cut.
    const job = await jobs.create({
      organization_id: ORG_ID, title: 'Pool', total_budget: 800, creator_slots: 2,
      status: 'in_progress', approved_creator_ids: ['c1', 'c2'], selected_creator_id: 'c1',
    });
    await permissions.create({ job_id: job.id, token_address: '0x' + 'a'.repeat(40), chain_id: 84532, permissions_context: '0x', delegation_manager: '0x' + 'd'.repeat(40) });
    const mk = async (creator_id: string, amount: number) => {
      // createMilestoneRecord forces status 'pending'; flip to approved for payout.
      const m = await milestones.create({ job_id: job.id, creator_id, title: 'm', amount });
      return milestones.update(m.id, { status: 'approved' });
    };
    return { job, mk };
  }

  it('pays each milestone to its own creator_id wallet', async () => {
    const { job, mk } = await setupPoolDeal();
    const m1 = await mk('c1', 400);
    const m2 = await mk('c2', 400);

    const r1 = await payout.releaseMilestone(m1.id, { via: 'direct' });
    const r2 = await payout.releaseMilestone(m2.id, { via: 'direct' });
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, true);
    assert.equal(redeem.calls[0].recipient, '0x' + '1'.repeat(40));
    assert.equal(redeem.calls[1].recipient, '0x' + '2'.repeat(40));
  });

  it('allows the full pool (budget x slots) across creators and blocks beyond it', async () => {
    const { job, mk } = await setupPoolDeal();
    const m1 = await mk('c1', 400);
    const m2 = await mk('c2', 400);
    const m3 = await mk('c1', 1); // would push past the $800 pool

    await payout.releaseMilestone(m1.id, { via: 'direct' }); // 400 of 800
    await payout.releaseMilestone(m2.id, { via: 'direct' }); // 800 of 800 — pool reached
    await assert.rejects(() => payout.releaseMilestone(m3.id, { via: 'direct' }), /pool/);

    const after = await jobs.findById(job.id);
    assert.equal(after.released_total, 800);
    assert.equal(after.status, 'completed');
  });
});
