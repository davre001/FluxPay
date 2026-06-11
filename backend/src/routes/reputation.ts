import { ProfileService } from '../services/profileService.ts';

export function createReputationRoutes(service = new ProfileService()) {
  return {
    async lookup(walletAddress: string) {
      return { statusCode: 200, body: await service.getReputation(walletAddress) };
    },
  };
}
