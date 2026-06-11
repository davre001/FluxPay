import { createServer } from 'node:http';
import { config } from './config/index.ts';
import { toErrorResponse } from './middleware/index.ts';
import { InMemoryPaymentRepository } from './models/payment.ts';
import { createPaymentRoutes } from './routes/payment.ts';
import { createAuthRoutes } from './routes/auth.ts';
import { PaymentService } from './services/paymentService.ts';
import { AuthService } from './services/authService.ts';
import { InMemoryUserRepository } from './models/user.ts';
import { buildJsonResponse } from './utils/helpers.ts';
import { NotFoundError, ValidationError } from './utils/errors.ts';

const MAX_BODY_BYTES = 1024 * 1024;

async function readJsonBody(req) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new ValidationError('Request body is too large');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    throw new ValidationError('Request body must be valid JSON');
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', config.frontendUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function trimApiPrefix(pathname) {
  return pathname.replace(/^\/api/, '') || '/';
}

export function createApp(options = {}) {
  const repository = options.repository || new InMemoryPaymentRepository();
  const service = options.service || new PaymentService(repository);
  const routes = createPaymentRoutes(service);

  const userRepository = options.userRepository || new InMemoryUserRepository();
  const authService = options.authService || new AuthService(userRepository);
  const authRoutes = createAuthRoutes(authService);

  const server = createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = trimApiPrefix(url.pathname);
      const parts = pathname.split('/').filter(Boolean);
      let response;

      if (req.method === 'GET' && pathname === '/health') {
        response = {
          statusCode: 200,
          body: {
            status: 'ok',
            service: 'fluxpay-backend',
            storage: 'memory',
          },
        };
      } else if (parts[0] === 'payments') {
        response = await dispatchPaymentRoute(req, parts, url.searchParams, routes);
      } else if (parts[0] === 'auth') {
        response = await dispatchAuthRoute(req, parts, authRoutes);
      } else {
        throw new NotFoundError('Route not found');
      }

      buildJsonResponse(res, response.statusCode, response.body);
    } catch (error) {
      const response = toErrorResponse(error);
      buildJsonResponse(res, response.statusCode, response.body);
    }
  });

  server.locals = {
    repository,
    service,
  };

  return server;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function dispatchAuthRoute(req, parts, authRoutes) {
  if (req.method === 'POST' && parts[1] === 'session') {
    return authRoutes.session(await readJsonBody(req));
  }

  if (req.method === 'GET' && parts[1] === 'me') {
    return authRoutes.me(getBearerToken(req));
  }

  throw new NotFoundError('Route not found');
}

async function dispatchPaymentRoute(req, parts, query, routes) {
  if (req.method === 'POST' && parts.length === 1) {
    return routes.create(await readJsonBody(req));
  }

  if (req.method === 'GET' && parts.length === 1) {
    return routes.list(query);
  }

  if (req.method === 'GET' && parts[1] === 'history' && parts[2]) {
    return routes.history(decodeURIComponent(parts[2]));
  }

  if (req.method === 'GET' && parts[1] && parts[2] === 'status') {
    return routes.status(parts[1]);
  }

  if (req.method === 'GET' && parts[1]) {
    return routes.get(parts[1]);
  }

  if (req.method === 'PATCH' && parts[1] && parts[2] === 'status') {
    return routes.updateStatus(parts[1], await readJsonBody(req));
  }

  throw new NotFoundError('Route not found');
}
