import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JobService } from '../src/services/jobService.ts';
import { InMemoryJobRepository } from '../src/models/job.ts';
import { InMemoryApplicationRepository } from '../src/models/application.ts';
import { InMemoryMilestoneRepository } from '../src/models/milestone.ts';
import { InMemoryProfileRepository } from '../src/models/profile.ts';

function buildService() {
  return new JobService(
    new InMemoryJobRepository(),
    new InMemoryApplicationRepository(),
    new InMemoryMilestoneRepository(),
    new InMemoryProfileRepository()
  );
}

const ORG_ID = 'org1';
const CREATOR_ID = 'creator1';

const JOB_INPUT = {
  title: 'Campaign',
  total_budget: 1000,
  payout_type: 'milestone',
  milestones: [{ title: 'M1', amount: 500 }, { title: 'M2', amount: 500 }],
};

describe('JobService state machine', () => {
  it('creates a job and auto-creates milestone records', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    assert.equal(job.status, 'open');
    assert.equal(job.milestones.length, 2);
    assert.equal(job.milestones[0].title, 'M1');
  });

  it('select by creatorId accepts that application and rejects others', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    await svc.applyToJob(job.id, CREATOR_ID, { cover_note: 'hire me' });
    await svc.applyToJob(job.id, 'creator2', { cover_note: 'pick me' });

    const updated = await svc.selectCreator(job.id, CREATOR_ID);
    assert.equal(updated.status, 'in_progress');
    assert.equal(updated.selected_creator_id, CREATOR_ID);

    const apps = await svc.listApplications(job.id);
    assert.equal(apps.find((a: any) => a.creator_id === CREATOR_ID).status, 'accepted');
    assert.equal(apps.find((a: any) => a.creator_id === 'creator2').status, 'rejected');
  });

  it('blocks applications to a cancelled job', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    await svc.cancelJob(job.id);
    await assert.rejects(
      () => svc.applyToJob(job.id, CREATOR_ID, { cover_note: 'too late' }),
      /not open/
    );
  });

  it('throws NotFoundError when selecting a creator who never applied', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    await assert.rejects(
      () => svc.selectCreator(job.id, 'nobody'),
      /No application from this creator/
    );
  });

  it('milestone lifecycle: submit → approve', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    const milestones = await svc.listMilestones(job.id);
    const ms = milestones[0];

    const submitted = await svc.submitMilestone(ms.id, { deliverable_url: 'https://x/1' });
    assert.equal(submitted.status, 'submitted');

    const approved = await svc.approveMilestone(ms.id);
    assert.equal(approved.status, 'approved');
  });

  it('milestone lifecycle: submit → dispute → resubmit', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    const milestones = await svc.listMilestones(job.id);
    const ms = milestones[0];

    await svc.submitMilestone(ms.id, { deliverable_url: 'https://x/1' });
    const disputed = await svc.disputeMilestone(ms.id, { reason: 'Bad quality' });
    assert.equal(disputed.status, 'disputed');

    const resubmitted = await svc.submitMilestone(ms.id, { deliverable_url: 'https://x/2' });
    assert.equal(resubmitted.status, 'submitted');
  });

  it('rejects invalid job input', async () => {
    const svc = buildService();
    await assert.rejects(() => svc.createJob(ORG_ID, { title: '' }), /title/);
    await assert.rejects(() => svc.createJob(ORG_ID, { title: 't', total_budget: 0 }), /budget/);
  });

  it('rejects missing cover_note on application', async () => {
    const svc = buildService();
    const job = await svc.createJob(ORG_ID, JOB_INPUT);
    await assert.rejects(() => svc.applyToJob(job.id, CREATOR_ID, {}), /cover_note/);
  });
});
