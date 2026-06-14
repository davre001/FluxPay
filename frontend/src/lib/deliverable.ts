// Client-side deliverable validation — mirrors the backend rules in
// backend/src/utils/validators.ts so creators get instant feedback. The backend
// remains authoritative (submitMilestone re-validates).

// Allowed deliverable hosts per target platform. 'other' has no constraint.
export const PLATFORM_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com'],
  twitter: ['twitter.com', 'x.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  facebook: ['facebook.com', 'fb.watch'],
  other: [],
};

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns an error message if the deliverable URL is invalid for the given
// platform, or null if it's acceptable.
export function validateDeliverableUrl(url: string, platform?: string): string | null {
  const value = (url || '').trim();
  if (!value) return 'Please provide a deliverable URL';
  if (!isValidHttpUrl(value)) return 'Enter a valid http(s) link';

  const domains = platform ? PLATFORM_DOMAINS[platform] : undefined;
  if (!domains || domains.length === 0) return null; // 'other'/unknown — no check

  let host: string;
  try {
    host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'Enter a valid http(s) link';
  }
  const matches = domains.some((d) => host === d || host.endsWith(`.${d}`));
  return matches ? null : `Deliverable must be a ${platform} link`;
}
