import { AuthService } from '../services/authService.ts';

export function createAuthRoutes(service = new AuthService()) {
  return {
    // POST /api/auth/session  { idToken, profileType? }
    async session(body) {
      return {
        statusCode: 200,
        body: await service.createSession(body),
      };
    },

    // GET /api/auth/me  (Authorization: Bearer <idToken>)
    async me(idToken) {
      return {
        statusCode: 200,
        body: await service.getMe(idToken),
      };
    },
  };
}
