import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';

export function generatePaymentId() {
  return `pay_${randomUUID().replaceAll('-', '')}`;
}

export function generateJobId() {
  return `job_${randomUUID().replaceAll('-', '')}`;
}

export function generateApplicationId() {
  return `app_${randomUUID().replaceAll('-', '')}`;
}

export function generateMilestoneId() {
  return `ms_${randomUUID().replaceAll('-', '')}`;
}

/** @deprecated use generateJobId */
export function generateDealId() {
  return generateJobId();
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeAddress(value: any) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function sanitizeString(value: any) {
  return typeof value === 'string' ? value.trim() : value;
}

export function buildJsonResponse(res: ServerResponse, statusCode: number, body: any) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}
