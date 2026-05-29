import { randomUUID } from 'node:crypto';

export function generatePaymentId() {
  return `pay_${randomUUID().replaceAll('-', '')}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeAddress(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function buildJsonResponse(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}
