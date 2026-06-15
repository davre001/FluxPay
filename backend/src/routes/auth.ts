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

    // POST /api/auth/role  { profileType }  — switch the caller's active role.
    // Demo aid so judges can explore both the Brand and Creator dashboards on one
    // account; only exposed when DEMO_MODE is on.
    async setRole(user, body) {
      return {
        statusCode: 200,
        body: await service.setRole(user.id, body?.profileType),
      };
    },
  };
}
