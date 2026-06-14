import { ProfileService } from '../services/profileService.ts';

export function createProfileRoutes(service = new ProfileService()) {
  return {
    async getMe(user: any) {
      return { statusCode: 200, body: await service.getMyProfile(user.id) };
    },

    async updateMe(user: any, body: any) {
      return { statusCode: 200, body: await service.updateMyProfile(user.id, body) };
    },

    async getReputation(walletAddress: string) {
      return { statusCode: 200, body: await service.getReputation(walletAddress) };
    },

    // Public profile — no auth required.
    async getPublic(userId: string) {
      return { statusCode: 200, body: await service.getPublicProfile(userId) };
    },

    // ── Social connect (OAuth) ──
    async socialConnect(user: any, platform: string) {
      return { statusCode: 200, body: await service.getSocialConnectUrl(user.id, platform) };
    },
    async socialCallback(user: any, platform: string, body: any) {
      return { statusCode: 200, body: await service.connectSocial(user.id, platform, body?.code, body?.state) };
    },
    async socialDisconnect(user: any, platform: string) {
      return { statusCode: 200, body: await service.disconnectSocial(user.id, platform) };
    },
  };
}
