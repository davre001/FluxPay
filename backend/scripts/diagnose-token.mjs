// Diagnose how a Web3Auth idToken is signed.
// Usage:  node scripts/diagnose-token.mjs "<paste-token-here>"
// The token stays on your machine — nothing is sent anywhere.
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';

const token = process.argv[2];
if (!token) {
  console.error('Pass the token: node scripts/diagnose-token.mjs "<token>"');
  process.exit(1);
}

const [h, p, s] = token.split('.');
const header = JSON.parse(Buffer.from(h, 'base64url').toString());
const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
const signingInput = Buffer.from(`${h}.${p}`);
const signature = Buffer.from(s, 'base64url');

console.log('header:', header);
console.log('iss:', payload.iss, '| sig length:', signature.length, 'bytes');
console.log('---');

// Analyze the kid: is it itself the signing key (raw/compressed point), or a thumbprint?
function analyzeKid(kid) {
  for (const enc of ['base64url', 'base64', 'hex']) {
    try {
      const buf = Buffer.from(kid, enc);
      if (buf.length >= 32 && buf.length <= 65) {
        console.log(`kid as ${enc}: ${buf.length} bytes, hex=${buf.toString('hex')}`);
      }
    } catch {}
  }
}
analyzeKid(header.kid);
// Compare kid to each wallet public_key
for (const w of payload.wallets || []) {
  for (const enc of ['base64url', 'hex']) {
    try {
      const kidHex = Buffer.from(header.kid, enc).toString('hex');
      if (kidHex && (w.public_key.includes(kidHex) || kidHex.includes(w.public_key.replace(/^0[23]/, '')))) {
        console.log(`>>> kid (${enc}) matches ${w.type}/${w.curve} public_key`);
      }
    } catch {}
  }
}
console.log('---');

// Try the kid itself as a verification key (compressed EC point), both curves.
function tryKidAsKey(kid) {
  let buf;
  for (const enc of ['base64url', 'hex']) {
    try { const b = Buffer.from(kid, enc); if (b.length === 33 || b.length === 65) { buf = b; break; } } catch {}
  }
  if (!buf) { console.log('kid is not a 33/65-byte EC point'); return; }
  for (const cn of ['secp256k1', 'P-256']) {
    try {
      let jwk;
      if (buf.length === 65 && buf[0] === 0x04) {
        jwk = { kty: 'EC', crv: CURVES[cn].jwkCrv, x: buf.subarray(1,33).toString('base64url'), y: buf.subarray(33,65).toString('base64url') };
      } else {
        const { x, y } = decompress(buf.toString('hex'), cn);
        jwk = { kty: 'EC', crv: CURVES[cn].jwkCrv, x, y };
      }
      const key = createPublicKey({ key: jwk, format: 'jwk' });
      const ok = cryptoVerify('sha256', signingInput, { key, dsaEncoding: 'ieee-p1363' }, signature);
      console.log(`kid-as-key (${cn}): ${ok ? '✓✓✓ VERIFIED' : 'no'}`);
    } catch (e) { console.log(`kid-as-key (${cn}): error ${e.message}`); }
  }
}

// Curve params for point decompression (both have p ≡ 3 mod 4 → simple sqrt).
const CURVES = {
  secp256k1: {
    p: 2n ** 256n - 2n ** 32n - 977n,
    a: 0n,
    b: 7n,
    jwkCrv: 'secp256k1',
  },
  'P-256': {
    p: 2n ** 256n - 2n ** 224n + 2n ** 192n + 2n ** 96n - 1n,
    a: -3n,
    b: 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn,
    jwkCrv: 'P-256',
  },
};

function modpow(base, exp, mod) {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

function decompress(hex, curveName) {
  const { p, a, b } = CURVES[curveName];
  const buf = Buffer.from(hex, 'hex');
  const prefix = buf[0];
  const x = BigInt('0x' + buf.subarray(1).toString('hex'));
  let aTerm = a < 0n ? ((a % p) + p) % p : a;
  const rhs = (modpow(x, 3n, p) + aTerm * x + b) % p;
  let y = modpow(rhs, (p + 1n) / 4n, p);
  const yIsOdd = (y & 1n) === 1n;
  const wantOdd = prefix === 0x03;
  if (yIsOdd !== wantOdd) y = p - y;
  const toB64 = (n) => Buffer.from(n.toString(16).padStart(64, '0'), 'hex').toString('base64url');
  return { x: toB64(x), y: toB64(y) };
}

// secp256k1 / P-256 compressed keys
for (const w of payload.wallets || []) {
  if (w.curve === 'ed25519') continue;
  const tryCurves = w.curve === 'secp256k1' ? ['secp256k1', 'P-256'] : ['P-256', 'secp256k1'];
  for (const cn of tryCurves) {
    try {
      const { x, y } = decompress(w.public_key, cn);
      const key = createPublicKey({ key: { kty: 'EC', crv: CURVES[cn].jwkCrv, x, y }, format: 'jwk' });
      const ok = cryptoVerify('sha256', signingInput, { key, dsaEncoding: 'ieee-p1363' }, signature);
      console.log(`${w.type} (declared ${w.curve}) verified as ${cn} sha256: ${ok ? '✓✓✓ VERIFIED' : 'no'}`);
    } catch (e) {
      console.log(`${w.type} as ${cn}: error ${e.message}`);
    }
  }
}

// ed25519 keys (EdDSA)
for (const w of payload.wallets || []) {
  if (w.curve !== 'ed25519') continue;
  try {
    const raw = Buffer.from(w.public_key, 'hex');
    const der = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]);
    const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
    const ok = cryptoVerify(null, signingInput, key, signature);
    console.log(`${w.type} (ed25519) EdDSA: ${ok ? '✓✓✓ VERIFIED' : 'no'}`);
  } catch (e) {
    console.log(`${w.type} (ed25519): error ${e.message}`);
  }
}

// Network JWKS: fetch candidate endpoints and test every key against the signature.
console.log('--- testing JWKS endpoints (kid =', header.kid, ') ---');
const ENDPOINTS = [
  'https://api-auth.web3auth.io/.well-known/jwks.json',
  'https://api-auth.web3auth.io/jwks',
  'https://authjs.web3auth.io/jwks',
  // devnet / develop hosts (SAPPHIRE_DEVNET)
  'https://api-develop.web3auth.io/.well-known/jwks.json',
  'https://api-develop.web3auth.io/jwks',
  'https://api-develop.web3auth.io/signer-service/api/v1/jwks',
  'https://api-develop.web3auth.io/signer-service/jwks',
  'https://develop-auth.web3auth.io/.well-known/jwks.json',
  'https://develop-auth.web3auth.io/jwks',
  'https://auth.web3auth.io/.well-known/jwks.json',
  // signer-service (mainnet shape, in case)
  'https://api.web3auth.io/.well-known/jwks.json',
  'https://api.web3auth.io/signer-service/api/v1/jwks',
  'https://api.web3auth.io/signer-service/jwks',
];
for (const url of ENDPOINTS) {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.log(`${url} → HTTP ${res.status}`); continue; }
    const data = await res.json();
    const keys = data.keys || [];
    let hit = false;
    for (const jwk of keys) {
      try {
        const key = createPublicKey({ key: jwk, format: 'jwk' });
        const ok = cryptoVerify('sha256', signingInput, { key, dsaEncoding: 'ieee-p1363' }, signature);
        if (ok) { console.log(`${url} kid=${jwk.kid} → ✓✓✓ VERIFIED`); hit = true; }
      } catch {}
    }
    if (!hit) console.log(`${url} → no match (kids: ${keys.map((k) => k.kid).join(', ')})`);
  } catch (e) {
    console.log(`${url} → error ${e.message}`);
  }
}

console.log('--- testing kid-as-key ---');
tryKidAsKey(header.kid);
