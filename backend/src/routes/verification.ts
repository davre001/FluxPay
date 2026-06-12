import { VerificationService } from '../services/verificationService.ts';

export function createVerificationRoutes(service: VerificationService, settlement: any = null) {
  return {
    // POST /api/verify — run AI verification on a milestone's deliverable.
    async verify(_user: any, body: any) {
      const result = await service.verifyMilestone(body?.milestoneId || '');
      return { statusCode: 200, body: result };
    },

    // POST /api/settle — autonomous loop: AI verifies, the score sets the amount,
    // and the scored USDC is released — no human approval.
    async settle(_user: any, body: any) {
      if (!settlement) {
        return { statusCode: 503, body: { error: { code: 'unavailable', message: 'Settlement service not configured' } } };
      }
      const result = await settlement.settleMilestone(body?.milestoneId || '', {
        via: body?.via === 'relayer' ? 'relayer' : 'direct',
        minScore: body?.minScore,
      });
      return { statusCode: 200, body: result };
    },
  };
}
