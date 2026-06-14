// Shared reputation helper: gather the milestones a creator actually worked,
// grouped by job. Backward-compatible across two deal models:
//
//   • New multi-hire deals clone per-creator milestone INSTANCES (creator_id set),
//     so a creator's work is `milestones.findMany({ creator_id })`.
//   • Legacy single-winner deals never cloned — the creator worked the job's
//     TEMPLATE milestones directly (creator_id null) and the job carries
//     selected_creator_id but no approved_creator_ids.
//
// Counting both keeps historical/seeded reputations intact after the multi-hire
// migration. Returns a Map of job_id → the milestones that creator worked.
export async function collectCreatorMilestones(
  jobs: any,
  milestones: any,
  creatorId: string,
): Promise<Map<string, any[]>> {
  const byJob = new Map<string, any[]>();

  // New model: per-creator instances.
  const instances = await milestones.findMany({ creator_id: creatorId });
  for (const m of instances) {
    const list = byJob.get(m.job_id) || [];
    list.push(m);
    byJob.set(m.job_id, list);
  }

  // Legacy model: single-winner deals (no approved_creator_ids) where this creator
  // was selected. Their worked milestones are the templates (creator_id null).
  const legacyJobs = (await jobs.findMany({ selected_creator_id: creatorId }))
    .filter((j: any) => !(Array.isArray(j.approved_creator_ids) && j.approved_creator_ids.length));
  for (const job of legacyJobs) {
    if (byJob.has(job.id)) continue; // already covered by instances
    const templates = await milestones.findMany({ job_id: job.id, creator_id: null });
    if (templates.length) byJob.set(job.id, templates);
  }

  return byJob;
}
