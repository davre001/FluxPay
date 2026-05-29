import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.coordinator import run_coordinator
from app.agents.verifier_agent import run_verifier
from app.agents.worker import run_worker
from app.api.routers import admin, auth, jobs, results, schedules, tasks, templates, webhooks, websocket, workers
from app.config import settings
from app.infrastructure.db import engine, AsyncSessionLocal
from app.infrastructure.db import Base
from app.infrastructure.logging import get_logger, setup_logging
from app.infrastructure.redis_client import close_redis, ensure_consumer_groups
from app.domain.templates.scheduler import start_scheduler, stop_scheduler
from app.domain.templates.seed import seed_templates

# Register all SQLAlchemy models before create_all
from app.domain.shared.models import User, Wallet, SourceConnector, AuditLog  # noqa: F401
from app.domain.jobs.models import DataJob, JobQuote, JobManifest  # noqa: F401
from app.domain.tasks.models import MicroTask, TaskAttempt  # noqa: F401
from app.domain.workers.models import WorkerProfile, WorkerReputation  # noqa: F401
from app.domain.results.models import RawResult, VerifiedResult, ResultBatch  # noqa: F401
from app.domain.payments.models import Escrow, Payout, EscrowEvent  # noqa: F401
from app.domain.templates.models import DatasetProduct, CustomerRequest, JobSchedule  # noqa: F401

setup_logging()
logger = get_logger(__name__)

_background_tasks: list[asyncio.Task] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("fluxpay_starting", env=settings.environment)

    # Create all tables (dev convenience — use Alembic in prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial templates if table is empty
    async with AsyncSessionLocal() as db:
        async with db.begin():
            await seed_templates(db)

    await ensure_consumer_groups()

    # Launch background agents
    _background_tasks.append(asyncio.create_task(run_coordinator(), name="coordinator"))
    _background_tasks.append(asyncio.create_task(run_worker(), name="worker"))
    _background_tasks.append(asyncio.create_task(run_verifier(), name="verifier"))

    # Start recurring job scheduler
    await start_scheduler()

    logger.info("fluxpay_started")
    yield

    # Shutdown
    await stop_scheduler()
    for task in _background_tasks:
        task.cancel()
    await asyncio.gather(*_background_tasks, return_exceptions=True)
    await close_redis()
    await engine.dispose()
    logger.info("fluxpay_stopped")


app = FastAPI(
    title="FluxPay API",
    description="Agentic micro-bounty platform for verified data collection",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(websocket.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "fluxpay-backend",
        "version": "0.1.0",
        "environment": settings.environment,
    }
