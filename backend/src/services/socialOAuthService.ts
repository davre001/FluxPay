import { randomBytes, createHash } from 'node:crypto';
import { config } from '../config/index.ts';
import { ValidationError } from '../utils/errors.ts';

// "Connect account" OAuth for the platforms we can verify without screenshots.
// Verifying ownership also snapshots followers / verified / account age, which
// powers eligibility + the reputation bonus. Instagram/TikTok are deferred.
//
// Flow (PKCE, frontend-driven so the callback stays authenticated):
//   1. GET  /connect  → { authorize_url } ; browser redirects to the provider
//   2. provider redirects back to the frontend /social/callback?code&state
//   3. POST /callback (authed) { code, state } → exchange + fetch + store
//
// The verifier↔state map is in-memory (fine for a single Render instance / demo).

export interface ConnectedSocial {
  handle: string;
  platform_user_id: string;
  followers: number;
  verified: boolean;
  joined_at: string | null;
  connected_at: string;
}

type Provider = {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  cfg: () => { clientId: string; clientSecret: string };
  fetchProfile: (accessToken: string) => Promise<Omit<ConnectedSocial, 'connected_at'>>;
};

const PROVIDERS: Record<string, Provider> = {
  youtube: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    cfg: () => config.oauth.youtube,
    fetchProfile: async (accessToken) => {
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new ValidationError(`youtube_profile_${res.status}`);
      const data: any = await res.json();
      const ch = data.items?.[0];
      if (!ch) throw new ValidationError('No YouTube channel on this account');
      return {
        handle: ch.snippet?.title || ch.id,
        platform_user_id: ch.id,
        followers: Number(ch.statistics?.subscriberCount || 0),
        verified: false, // YouTube doesn't expose the verified badge via the API
        joined_at: ch.snippet?.publishedAt || null,
      };
    },
  },
  twitter: {
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scope: 'users.read tweet.read',
    cfg: () => config.oauth.twitter,
    fetchProfile: async (accessToken) => {
      const res = await fetch(
        'https://api.twitter.com/2/users/me?user.fields=public_metrics,verified,created_at',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new ValidationError(`twitter_profile_${res.status}`);
      const data: any = await res.json();
      const u = data.data;
      if (!u) throw new ValidationError('Could not read X profile');
      return {
        handle: u.username,
        platform_user_id: u.id,
        followers: Number(u.public_metrics?.followers_count || 0),
        verified: Boolean(u.verified),
        joined_at: u.created_at || null,
      };
    },
  },
};

const b64url = (buf: Buffer) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const pkceStore = new Map<string, { verifier: string; userId: string; platform: string; at: number }>();

export class SocialOAuthService {
  isEnabled(platform: string): boolean {
    const p = PROVIDERS[platform];
    if (!p) return false;
    const { clientId, clientSecret } = p.cfg();
    return Boolean(clientId && clientSecret);
  }

  // Build the provider authorize URL and stash a PKCE verifier under `state`.
  buildAuthorizeUrl(platform: string, userId: string): { authorize_url: string; state: string } {
    const p = PROVIDERS[platform];
    if (!p) throw new ValidationError(`Unsupported platform: ${platform}`);
    if (!this.isEnabled(platform)) throw new ValidationError(`${platform} connect is not configured`);

    const verifier = b64url(randomBytes(32));
    const challenge = b64url(createHash('sha256').update(verifier).digest());
    const state = b64url(randomBytes(16));
    pkceStore.set(state, { verifier, userId, platform, at: Date.now() });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: p.cfg().clientId,
      redirect_uri: config.oauth.callbackUrl,
      scope: p.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });
    return { authorize_url: `${p.authorizeUrl}?${params.toString()}`, state };
  }

  // Exchange the code (validating state belongs to this user) and fetch metrics.
  async completeConnect(platform: string, code: string, state: string, userId: string): Promise<ConnectedSocial> {
    const p = PROVIDERS[platform];
    if (!p) throw new ValidationError(`Unsupported platform: ${platform}`);
    const entry = pkceStore.get(state);
    if (!entry || entry.userId !== userId || entry.platform !== platform) {
      throw new ValidationError('Invalid or expired OAuth state — please retry the connection');
    }
    pkceStore.delete(state);

    const { clientId, clientSecret } = p.cfg();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oauth.callbackUrl,
      client_id: clientId,
      code_verifier: entry.verifier,
    });
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (clientSecret) {
      // X requires HTTP Basic for confidential clients; Google accepts the secret
      // in the body. Sending both is safe.
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
      body.set('client_secret', clientSecret);
    }

    const tokenRes = await fetch(p.tokenUrl, { method: 'POST', headers, body });
    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => '');
      throw new ValidationError(`${platform}_token_${tokenRes.status}: ${text.slice(0, 160)}`);
    }
    const token: any = await tokenRes.json();
    const accessToken = token.access_token;
    if (!accessToken) throw new ValidationError(`${platform}: no access token returned`);

    const profile = await p.fetchProfile(accessToken);
    return { ...profile, connected_at: new Date().toISOString() };
  }
}
