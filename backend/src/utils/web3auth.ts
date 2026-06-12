import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { config } from '../config/index.ts';
import { UnauthorizedError } from './errors.ts';

// Verifies a Web3Auth (MetaMask Embedded Wallets) idToken with no external
// dependencies — the JWT is ES256-signed and validated against Web3Auth's
// public JWKS. We never need CLIENT_SECRET for this; signature + expiry are the
// trust anchors. CLIENT_SECRET stays out of token verification entirely.

const JWKS_TTL_MS = 10 * 60 * 1000;
let jwksCache: { keys: any[]; fetchedAt: number } = { keys: [], fetchedAt: 0 };

function b64urlToBuffer(value: string) {
  return Buffer.from(value, 'base64url');
}

function decodeSegment(segment: string) {
  return JSON.parse(b64urlToBuffer(segment).toString('utf8'));
}

async function getSigningKeys() {
  const now = Date.now();
  if (jwksCache.keys.length && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }

  const res = await fetch(config.web3auth.jwksEndpoint);
  if (!res.ok) {
    throw new UnauthorizedError('Unable to fetch token signing keys');
  }
  const data = await res.json();
  jwksCache = { keys: data.keys || [], fetchedAt: now };
  return jwksCache.keys;
}

// Returns the public KeyObjects to try when verifying a token. Prefers the
// project's static verification key (no HTTP call); otherwise uses the JWKS.
async function getVerificationKeys(header: any) {
  if (config.web3auth.verificationKey) {
    return [createPublicKey(config.web3auth.verificationKey)];
  }
  const keys = await getSigningKeys();
  const matched = keys.find((key: any) => key.kid === header.kid);
  const ordered = matched ? [matched, ...keys.filter((k: any) => k !== matched)] : keys;
  return ordered.map((jwk: any) => createPublicKey({ key: jwk, format: 'jwk' }));
}

export async function verifyWeb3AuthToken(token: string) {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedError('Missing token');
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new UnauthorizedError('Malformed token');
  }
  const [headerB64, payloadB64, signatureB64] = segments;

  let header;
  let payload;
  try {
    header = decodeSegment(headerB64);
    payload = decodeSegment(payloadB64);
  } catch {
    throw new UnauthorizedError('Malformed token');
  }

  if (header.alg !== 'ES256') {
    throw new UnauthorizedError(`Unsupported token algorithm: ${header.alg}`);
  }

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = b64urlToBuffer(signatureB64);

  // Accept the token if ANY candidate key verifies it. JWS ES256 signatures are
  // raw r||s (IEEE P1363), not DER. When signature verification is allowed to be
  // skipped (devnet), don't even fetch the JWKS — go straight to claim checks.
  let valid = false;
  if (!config.web3auth.allowUnverifiedSignature) {
    const verificationKeys = await getVerificationKeys(header);
    if (!verificationKeys.length) {
      throw new UnauthorizedError('No verification keys available');
    }
    for (const publicKey of verificationKeys) {
      try {
        if (cryptoVerify('sha256', signingInput, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature)) {
          valid = true;
          break;
        }
      } catch {
        // try the next key
      }
    }
  }

  if (!valid) {
    if (config.web3auth.allowUnverifiedSignature) {
      console.warn(
        `[auth] ⚠️  signature UNVERIFIED but allowed (WEB3AUTH_ALLOW_UNVERIFIED=true) — ` +
        `kid=${header.kid} iss=${payload.iss}. Enforcing aud/iss/exp only. DO NOT use on mainnet.`,
      );
    } else {
      console.warn(
        `[auth] signature check failed — kid=${header.kid} iss=${payload.iss}`,
        config.web3auth.verificationKey ? '(using static key)' : '(using JWKS)',
      );
      throw new UnauthorizedError('Invalid token signature');
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSeconds) {
    throw new UnauthorizedError('Token expired');
  }
  if (config.web3auth.issuers.length && payload.iss && !config.web3auth.issuers.includes(payload.iss)) {
    throw new UnauthorizedError(`Unexpected token issuer: ${payload.iss}`);
  }
  if (config.web3auth.clientId && payload.aud && payload.aud !== config.web3auth.clientId) {
    throw new UnauthorizedError('Token audience mismatch');
  }

  return payload;
}
