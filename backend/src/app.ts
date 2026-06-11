import { createServer } from 'node:http';
import { config } from './config/index.ts';
import { toErrorResponse } from './middleware/index.ts';
import { InMemoryPaymentRepository } from './models/payment.ts';
import { InMemoryJobRepository } from './models/job.ts';
import { InMemoryApplicationRepository } from './models/application.ts';
import { InMemoryMilestoneRepository } from './models/milestone.ts';
import { InMemoryProfileRepository } from './models/profile.ts';
import { InMemoryWalletRepository } from './models/wallet.ts';
import { InMemoryUserRepository } from './models/user.ts';
import { createPaymentRoutes } from './routes/payment.ts';
import { createJobRoutes } from './routes/job.ts';
import { createAuthRoutes } from './routes/auth.ts';
import { createProfileRoutes } from './routes/profile.ts';
import { createWalletRoutes } from './routes/wallet.ts';
import { createReputationRoutes } from './routes/reputation.ts';
import { PaymentService } from './services/paymentService.ts';
import { JobService } from './services/jobService.ts';
import { ProfileService } from './services/profileService.ts';
import { WalletService } from './services/walletService.ts';
import { AuthService } from './services/authService.ts';
import { buildJsonResponse } from './utils/helpers.ts';
import { NotFoundError, UnauthorizedError, ValidationError } from './utils/errors.ts';

const MAX_BODY_BYTES = 1024 * 1024;

async function readJsonBody(req) {
  const chunks: any[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new ValidationError('Request body is too large');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody.trim()) return {};

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    throw new ValidationError('Request body must be valid JSON');
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', config.frontendUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function trimApiPrefix(pathname) {
  return pathname.replace(/^\/api/, '') || '/';
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

async function requireAuth(req, authService: AuthService, skipAuth?: boolean, mockUser?: any) {
  if (skipAuth) return mockUser || { id: 'test-user', email: 'test@test.com', profileType: 'organization', walletAddress: '0x0000000000000000000000000000000000000001' };
  const token = getBearerToken(req);
  if (!token) throw new UnauthorizedError('Missing authorization token');
  const { user } = await authService.getMe(token);
  return user;
}

export function createApp(options: any = {}) {
  // Payment slice (existing)
  const repository = options.repository || new InMemoryPaymentRepository();
  const service = options.service || new PaymentService(repository);
  const routes = createPaymentRoutes(service);

  // Auth slice (existing)
  const userRepository = options.userRepository || new InMemoryUserRepository();
  const authService = options.authService || new AuthService(userRepository);
  const authRoutes = createAuthRoutes(authService);

  // Profile slice
  const profileRepository = options.profileRepository || new InMemoryProfileRepository();
  const profileService = options.profileService || new ProfileService(profileRepository, userRepository);
  const profileRoutes = createProfileRoutes(profileService);

  // Job slice
  const jobRepository = options.jobRepository || new InMemoryJobRepository();
  const applicationRepository = options.applicationRepository || new InMemoryApplicationRepository();
  const milestoneRepository = options.milestoneRepository || new InMemoryMilestoneRepository();
  const jobService = options.jobService || new JobService(jobRepository, applicationRepository, milestoneRepository, profileRepository);
  const jobRoutes = createJobRoutes(jobService);

  // Wallet slice
  const walletRepository = options.walletRepository || new InMemoryWalletRepository();
  const walletService = options.walletService || new WalletService(walletRepository);
  const walletRoutes = createWalletRoutes(walletService);

  // Reputation routes (shares profileService)
  const reputationRoutes = createReputationRoutes(profileService);

  const skipAuth: boolean = options.skipAuth ?? false;
  const mockUser: any = options.mockUser;

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
        response = { statusCode: 200, body: { status: 'ok', service: 'fluxpay-backend', storage: 'memory' } };
      } else if (parts[0] === 'auth') {
        response = await dispatchAuthRoute(req, parts, authRoutes);
      } else if (parts[0] === 'payments') {
        response = await dispatchPaymentRoute(req, parts, url.searchParams, routes);
      } else if (parts[0] === 'jobs') {
        const user = await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchJobRoute(req, parts, url.searchParams, jobRoutes, user);
      } else if (parts[0] === 'milestones') {
        const user = await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchMilestoneRoute(req, parts, jobRoutes, user);
      } else if (parts[0] === 'profile') {
        const user = await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchProfileRoute(req, parts, profileRoutes, user);
      } else if (parts[0] === 'wallet') {
        const user = await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchWalletRoute(req, parts, url.searchParams, walletRoutes, user);
      } else if (parts[0] === 'reputation') {
        await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchReputationRoute(req, parts, reputationRoutes);
      } else if (parts[0] === 'applications') {
        const user = await requireAuth(req, authService, skipAuth, mockUser);
        response = await dispatchApplicationRoute(req, parts, jobRoutes, user);
      } else {
        throw new NotFoundError('Route not found');
      }

      buildJsonResponse(res, response.statusCode, response.body);
    } catch (error) {
      const response = toErrorResponse(error);
      buildJsonResponse(res, response.statusCode, response.body);
    }
  });

  (server as any).locals = {
    repository, service,
    jobRepository, applicationRepository, milestoneRepository, jobService,
    profileRepository, profileService,
    walletRepository, walletService,
    userRepository, authService,
  };

  return server;
}

// ─── Auth dispatch ────────────────────────────────────────────────────────────

async function dispatchAuthRoute(req, parts, authRoutes) {
  if (req.method === 'POST' && parts[1] === 'session') {
    return authRoutes.session(await readJsonBody(req));
  }
  if (req.method === 'GET' && parts[1] === 'me') {
    return authRoutes.me(getBearerToken(req));
  }
  throw new NotFoundError('Route not found');
}

// ─── Payment dispatch (existing) ──────────────────────────────────────────────

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

// ─── Job dispatch ─────────────────────────────────────────────────────────────

async function dispatchJobRoute(req, parts, query, routes, user) {
  // POST /api/jobs
  if (req.method === 'POST' && parts.length === 1) {
    return routes.create(user, await readJsonBody(req));
  }
  // GET /api/jobs
  if (req.method === 'GET' && parts.length === 1) {
    return routes.list(query);
  }
  // POST /api/jobs/quote   (must come before /:id checks)
  if (req.method === 'POST' && parts[1] === 'quote') {
    return routes.quote(await readJsonBody(req));
  }
  // GET /api/jobs/mine
  if (req.method === 'GET' && parts[1] === 'mine') {
    return routes.listMine(user, query);
  }

  const jobId = parts[1] ? decodeURIComponent(parts[1]) : '';

  // GET /api/jobs/:id
  if (req.method === 'GET' && parts.length === 2) {
    return routes.get(jobId);
  }
  // POST /api/jobs/:id/apply
  if (req.method === 'POST' && parts[2] === 'apply') {
    return routes.apply(jobId, user, await readJsonBody(req));
  }
  // GET /api/jobs/:id/applications
  if (req.method === 'GET' && parts[2] === 'applications') {
    return routes.listApplications(jobId);
  }
  // POST /api/jobs/:id/select/:creatorId
  if (req.method === 'POST' && parts[2] === 'select' && parts[3]) {
    return routes.selectCreator(jobId, decodeURIComponent(parts[3]));
  }
  // POST /api/jobs/:id/cancel
  if (req.method === 'POST' && parts[2] === 'cancel') {
    return routes.cancel(jobId);
  }
  // POST /api/jobs/:id/confirm-funding
  if (req.method === 'POST' && parts[2] === 'confirm-funding') {
    return routes.confirmFunding(jobId, await readJsonBody(req));
  }
  // GET /api/jobs/:id/milestones
  if (req.method === 'GET' && parts[2] === 'milestones') {
    return routes.listMilestones(jobId);
  }

  throw new NotFoundError('Route not found');
}

// ─── Milestone dispatch (flat action routes) ──────────────────────────────────

async function dispatchMilestoneRoute(req, parts, routes, _user) {
  const milestoneId = parts[1] ? decodeURIComponent(parts[1]) : '';

  // POST /api/milestones/:id/submit
  if (req.method === 'POST' && parts[2] === 'submit') {
    return routes.submitMilestone(milestoneId, await readJsonBody(req));
  }
  // POST /api/milestones/:id/approve
  if (req.method === 'POST' && parts[2] === 'approve') {
    return routes.approveMilestone(milestoneId);
  }
  // POST /api/milestones/:id/dispute
  if (req.method === 'POST' && parts[2] === 'dispute') {
    return routes.disputeMilestone(milestoneId, await readJsonBody(req));
  }

  throw new NotFoundError('Route not found');
}

// ─── Profile dispatch ─────────────────────────────────────────────────────────

async function dispatchProfileRoute(req, parts, routes, user) {
  // GET /api/profile/me
  if (req.method === 'GET' && parts[1] === 'me') {
    return routes.getMe(user);
  }
  // PUT /api/profile/me
  if (req.method === 'PUT' && parts[1] === 'me') {
    return routes.updateMe(user, await readJsonBody(req));
  }
  // GET /api/profile/reputation/:wallet
  if (req.method === 'GET' && parts[1] === 'reputation' && parts[2]) {
    return routes.getReputation(decodeURIComponent(parts[2]));
  }
  throw new NotFoundError('Route not found');
}

// ─── Wallet dispatch ──────────────────────────────────────────────────────────

async function dispatchWalletRoute(req, parts, query, routes, user) {
  if (req.method === 'GET' && parts[1] === 'balance') {
    return routes.getBalance(user);
  }
  if (req.method === 'POST' && parts[1] === 'deposit') {
    return routes.deposit(user, await readJsonBody(req));
  }
  if (req.method === 'POST' && parts[1] === 'withdraw') {
    return routes.withdraw(user, await readJsonBody(req));
  }
  if (req.method === 'GET' && parts[1] === 'transactions') {
    return routes.getTransactions(user, query);
  }
  throw new NotFoundError('Route not found');
}

// ─── Application dispatch ─────────────────────────────────────────────────────

async function dispatchApplicationRoute(req, parts, routes, user) {
  if (req.method === 'GET' && parts[1] === 'mine') {
    return routes.listMyApplications(user);
  }
  throw new NotFoundError('Route not found');
}

// ─── Reputation dispatch ──────────────────────────────────────────────────────

async function dispatchReputationRoute(req, parts, routes) {
  if (req.method === 'GET' && parts[1]) {
    return routes.lookup(decodeURIComponent(parts[1]));
  }
  throw new NotFoundError('Route not found');
}
