import { VeniceService } from './veniceService.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';
import { nowIso } from '../utils/helpers.ts';

const SYSTEM_PROMPT =
  'You are a strict brand-deal deliverable reviewer for FluxPay. Given a campaign ' +
  'brief and a creator\'s submitted deliverable, decide whether the deliverable ' +
  'satisfies the brief. Be fair but rigorous. Respond with ONLY a JSON object: ' +
  '{"approved": boolean, "score": number between 0 and 1, "reasoning": string, ' +
  '"missing": string[]}. "missing" lists any unmet requirements.';

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i;

// Tolerant verdict parser — handles raw JSON, ```json fenced blocks, or JSON
// embedded in prose (not every Venice model honors response_format).
function parseVerdict(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    return JSON.parse(candidate);
  }
}

// Turns a job record into a human-readable brief the model can judge against.
function buildBrief(job: any): string {
  const req = job?.required_elements || {};
  const lines = [
    `Platform: ${job?.target_platform || 'any'}`,
    `Post type: ${job?.post_type || 'any'}`,
    `Description: ${job?.description || '(none)'}`,
    `Required hashtags: ${(req.hashtags || []).join(', ') || 'none'}`,
    `Required mentions: ${(req.mentions || []).join(', ') || 'none'}`,
    `Brand tag required: ${req.brand_tag ? 'yes' : 'no'}`,
    `Link in bio required: ${req.link_in_bio ? 'yes' : 'no'}`,
  ];
  if (req.custom) lines.push(`Other requirements: ${req.custom}`);
  return lines.join('\n');
}

// Orchestrates AI verification: gathers the job brief + the milestone's
// deliverable, asks Venice for a verdict, and records it on the milestone as
// metadata. Does NOT change milestone status — approval stays an explicit step,
// so this never alters the integrated approve/submit flow.
export class VerificationService {
  constructor(
    private milestones: any,
    private jobs: any,
    private venice = new VeniceService(),
  ) {}

  isEnabled() {
    return this.venice.isEnabled();
  }

  async verifyMilestone(milestoneId: string) {
    if (!milestoneId) throw new ValidationError('milestoneId is required');

    const milestone = await this.milestones.findById(milestoneId);
    if (!milestone) throw new NotFoundError('Milestone not found');
    if (!milestone.deliverable_url && !milestone.deliverable_note) {
      throw new ValidationError('Milestone has no deliverable to verify');
    }

    if (!this.venice.isEnabled()) {
      return { verified: false, reason: 'venice_not_configured' };
    }

    const job = await this.jobs.findById(milestone.job_id);
    const brief = buildBrief(job || {});

    // Build the user message. If the deliverable looks like an image, attach it
    // so a vision model can actually look at it; otherwise send the link/note.
    const text =
      `BRIEF:\n${brief}\n\n` +
      `DELIVERABLE:\n- URL: ${milestone.deliverable_url || '(none)'}\n` +
      `- Creator note: ${milestone.deliverable_note || '(none)'}\n\n` +
      'Does this deliverable satisfy the brief?';

    const content: any[] = [{ type: 'text', text }];
    if (milestone.deliverable_url && IMAGE_RE.test(milestone.deliverable_url)) {
      content.push({ type: 'image_url', image_url: { url: milestone.deliverable_url } });
    }

    let verdict: any;
    try {
      const raw = await this.venice.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ]);
      verdict = parseVerdict(raw);
    } catch (error) {
      return { verified: false, reason: 'venice_error', error: (error as Error).message };
    }

    const result = {
      approved: Boolean(verdict?.approved),
      score: Math.max(0, Math.min(1, Number(verdict?.score) || 0)),
      reasoning: String(verdict?.reasoning || ''),
      missing: Array.isArray(verdict?.missing) ? verdict.missing : [],
    };

    // Record as metadata only — status is untouched.
    await this.milestones.update(milestoneId, {
      ai_verification: { ...result, model: 'venice', at: nowIso() },
    });

    return { verified: true, milestone_id: milestoneId, ...result };
  }
}
