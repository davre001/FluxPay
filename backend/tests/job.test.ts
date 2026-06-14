import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createTestServer, readJson, post, patch, CREATOR_USER } from './helpers.ts';

describe('Jobs API', () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  const BASE_JOB = {
    title: 'Promo video',
    description: 'Short Instagram reel',
    target_platform: 'instagram',
    post_type: 'video',
    payout_type: 'milestone',
    total_budget: 500,
    milestones: [
      { title: 'Script', description: 'Write the script', amount: 100 },
      { title: 'Final cut', description: 'Deliver the video', amount: 400 },
    ],
  };

  it('creates a job with milestones and lists/gets it', async () => {
    const createRes = await post(server.baseUrl, '/api/jobs', BASE_JOB);
    const job = await readJson(createRes);

    assert.equal(createRes.status, 201);
    assert.equal(job.status, 'open');
    assert.equal(job.title, 'Promo video');
    assert.equal(job.milestones.length, 2);
    assert.equal(job.organization.brand_name, 'test-org-1');

    const listRes = await fetch(`${server.baseUrl}/api/jobs`);
    const list = await readJson(listRes);
    assert.equal(list.length, 1);

    const getRes = await fetch(`${server.baseUrl}/api/jobs/${job.id}`);
    const fetched = await readJson(getRes);
    assert.equal(fetched.id, job.id);
    assert.equal(fetched.milestones.length, 2);
  });

  it('GET /api/jobs/mine returns only the org\'s own jobs', async () => {
    await post(server.baseUrl, '/api/jobs', BASE_JOB);
    await post(server.baseUrl, '/api/jobs', { ...BASE_JOB, title: 'Second job' });

    const res = await fetch(`${server.baseUrl}/api/jobs/mine`);
    const jobs = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(jobs.length, 2);
    assert.ok(jobs.every((j: any) => j.organization_id === 'test-org-1'));
  });

  it('POST /api/jobs/quote returns a quote without creating a job', async () => {
    const res = await post(server.baseUrl, '/api/jobs/quote', BASE_JOB);
    const body = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(body.quote.total_usdc, 500);
    assert.ok(body.id);

    // No jobs should have been created
    const list = await fetch(`${server.baseUrl}/api/jobs`);
    assert.equal((await readJson(list)).length, 0);
  });

  it('runs the full job lifecycle: apply → select → confirm-funding', async () => {
    const { body: job } = await post(server.baseUrl, '/api/jobs', BASE_JOB).then(async (r) => ({
      res: r,
      body: await r.json(),
    }));

    // Creator applies via a separate server instance but sharing the same repos
    const { locals } = server;
    const creatorServer = await createTestServer({
      mockUser: CREATOR_USER,
      jobRepository: locals.jobRepository,
      applicationRepository: locals.applicationRepository,
      milestoneRepository: locals.milestoneRepository,
      profileRepository: locals.profileRepository,
    });
    const applyRes = await post(creatorServer.baseUrl, `/api/jobs/${job.id}/apply`, {
      cover_note: 'I can do this!',
    });
    const application = await readJson(applyRes);
    assert.equal(applyRes.status, 201);
    assert.equal(application.status, 'pending');
    assert.equal(application.cover_note, 'I can do this!');
    await creatorServer.close();

    // Org views applications
    const appsRes = await fetch(`${server.baseUrl}/api/jobs/${job.id}/applications`);
    const apps = await readJson(appsRes);
    assert.equal(apps.length, 1);
    assert.equal(apps[0].creator_id, CREATOR_USER.id);

    // Org selects the creator
    const selectRes = await post(server.baseUrl, `/api/jobs/${job.id}/select/${CREATOR_USER.id}`);
    const updatedJob = await readJson(selectRes);
    assert.equal(selectRes.status, 200);
    assert.equal(updatedJob.status, 'in_progress');
    assert.equal(updatedJob.selected_creator_id, CREATOR_USER.id);

    // Confirm on-chain funding
    const fundRes = await post(server.baseUrl, `/api/jobs/${job.id}/confirm-funding`, {
      tx_hash: '0x' + 'a'.repeat(64),
    });
    assert.equal(fundRes.status, 200);
  });

  it('POST /api/jobs/:id/cancel cancels an open job', async () => {
    const { body: job } = await post(server.baseUrl, '/api/jobs', BASE_JOB).then(async (r) => ({
      res: r,
      body: await r.json(),
    }));

    const cancelRes = await post(server.baseUrl, `/api/jobs/${job.id}/cancel`);
    const cancelled = await readJson(cancelRes);
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelled.status, 'cancelled');
  });

  it('rejects invalid job creation', async () => {
    const res = await post(server.baseUrl, '/api/jobs', { description: 'missing title' });
    const body = await readJson(res);
    assert.equal(res.status, 400);
    assert.equal(body.error.code, 'validation_error');
  });

  it('refuses applications to a non-open job', async () => {
    const { body: job } = await post(server.baseUrl, '/api/jobs', BASE_JOB).then(async (r) => ({
      res: r,
      body: await r.json(),
    }));
    await post(server.baseUrl, `/api/jobs/${job.id}/cancel`);

    const applyRes = await post(server.baseUrl, `/api/jobs/${job.id}/apply`, {
      cover_note: 'too late',
    });
    assert.equal(applyRes.status, 400);
  });

  it('returns 404 for unknown job', async () => {
    const res = await fetch(`${server.baseUrl}/api/jobs/job_nope`);
    const body = await readJson(res);
    assert.equal(res.status, 404);
    assert.equal(body.error.code, 'not_found');
  });
});

describe('Milestones API', () => {
  let server: any;

  beforeEach(async () => {
    server = await createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  async function createJobWithMilestone() {
    const jobRes = await post(server.baseUrl, '/api/jobs', {
      title: 'M test',
      total_budget: 100,
      payout_type: 'milestone',
      target_platform: 'other',
      platform_other: 'Newsletter',
      milestones: [{ title: 'Deliverable', amount: 100 }],
    });
    const job = await readJson(jobRes);
    const msRes = await fetch(`${server.baseUrl}/api/jobs/${job.id}/milestones`);
    const milestones = await readJson(msRes);
    return { job, milestone: milestones[0] };
  }

  it('GET /api/jobs/:id/milestones lists milestones', async () => {
    const { job } = await createJobWithMilestone();
    const res = await fetch(`${server.baseUrl}/api/jobs/${job.id}/milestones`);
    const milestones = await readJson(res);
    assert.equal(res.status, 200);
    assert.equal(milestones.length, 1);
    assert.equal(milestones[0].status, 'pending');
  });

  it('walks a milestone: submit → approve', async () => {
    const { milestone } = await createJobWithMilestone();

    const submitRes = await post(server.baseUrl, `/api/milestones/${milestone.id}/submit`, {
      deliverable_url: 'https://drive.google.com/x',
      deliverable_note: 'here it is',
    });
    const submitted = await readJson(submitRes);
    assert.equal(submitRes.status, 200);
    assert.equal(submitted.status, 'submitted');
    assert.equal(submitted.deliverable_url, 'https://drive.google.com/x');

    const approveRes = await post(server.baseUrl, `/api/milestones/${milestone.id}/approve`);
    const approved = await readJson(approveRes);
    assert.equal(approveRes.status, 200);
    assert.equal(approved.status, 'approved');
  });

  it('walks a milestone: submit → dispute → resubmit', async () => {
    const { milestone } = await createJobWithMilestone();

    await post(server.baseUrl, `/api/milestones/${milestone.id}/submit`, {
      deliverable_url: 'https://x/1',
    });

    const disputeRes = await post(server.baseUrl, `/api/milestones/${milestone.id}/dispute`, {
      reason: 'Does not meet spec',
    });
    const disputed = await readJson(disputeRes);
    assert.equal(disputeRes.status, 200);
    assert.equal(disputed.status, 'disputed');
    assert.equal(disputed.dispute_reason, 'Does not meet spec');

    // Creator resubmits after fixing
    const resubmitRes = await post(server.baseUrl, `/api/milestones/${milestone.id}/submit`, {
      deliverable_url: 'https://x/2',
    });
    assert.equal((await readJson(resubmitRes)).status, 'submitted');
  });

  it('rejects submit without deliverable_url', async () => {
    const { milestone } = await createJobWithMilestone();
    const res = await post(server.baseUrl, `/api/milestones/${milestone.id}/submit`, {});
    assert.equal(res.status, 400);
  });

  it('rejects approve on a pending milestone', async () => {
    const { milestone } = await createJobWithMilestone();
    const res = await post(server.baseUrl, `/api/milestones/${milestone.id}/approve`);
    assert.equal(res.status, 400);
  });
});
