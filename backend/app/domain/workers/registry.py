import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.workers.models import WorkerProfile, WorkerReputation, WorkerStatus, WorkerType
from app.domain.workers.schemas import WorkerHeartbeat, WorkerRegister
from app.infrastructure.logging import get_logger

logger = get_logger(__name__)


async def register_worker(db: AsyncSession, data: WorkerRegister) -> WorkerProfile:
    existing = await db.execute(
        select(WorkerProfile).where(WorkerProfile.wallet_address == data.wallet_address)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Worker with wallet {data.wallet_address} already registered")

    worker = WorkerProfile(
        name=data.name,
        worker_type=data.worker_type,
        wallet_address=data.wallet_address,
        allowed_task_types=data.allowed_task_types,
        capacity=data.capacity,
        status=WorkerStatus.available,
    )
    db.add(worker)
    await db.flush()

    reputation = WorkerReputation(worker_id=worker.id)
    db.add(reputation)
    await db.flush()

    logger.info("worker_registered", worker_id=str(worker.id), wallet=data.wallet_address)
    return worker


async def heartbeat(db: AsyncSession, data: WorkerHeartbeat) -> WorkerProfile:
    result = await db.execute(
        select(WorkerProfile).where(WorkerProfile.id == data.worker_id)
    )
    worker = result.scalar_one_or_none()
    if not worker:
        raise ValueError(f"Worker {data.worker_id} not found")

    worker.status = data.status
    worker.last_heartbeat = datetime.now(timezone.utc)
    return worker


async def get_worker(db: AsyncSession, worker_id: uuid.UUID) -> WorkerProfile | None:
    result = await db.execute(
        select(WorkerProfile)
        .where(WorkerProfile.id == worker_id)
        .options(selectinload(WorkerProfile.reputation))
    )
    return result.scalar_one_or_none()


async def list_workers(
    db: AsyncSession,
    status: WorkerStatus | None = None,
    page: int = 1,
    page_size: int = 20,
) -> list[WorkerProfile]:
    q = select(WorkerProfile).options(selectinload(WorkerProfile.reputation))
    if status:
        q = q.where(WorkerProfile.status == status)
    q = q.order_by(WorkerProfile.registered_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


async def update_reputation_after_task(
    db: AsyncSession,
    worker_id: uuid.UUID,
    quality_score: float,
    freshness_score: float,
    success: bool,
) -> None:
    result = await db.execute(
        select(WorkerReputation).where(WorkerReputation.worker_id == worker_id)
    )
    rep = result.scalar_one_or_none()
    if not rep:
        return

    if success:
        rep.tasks_completed += 1
        total = rep.tasks_completed
        rep.average_quality_score = (
            (rep.average_quality_score * (total - 1) + quality_score) / total
        )
        rep.average_freshness_score = (
            (rep.average_freshness_score * (total - 1) + freshness_score) / total
        )
    else:
        rep.tasks_failed += 1

    completed = rep.tasks_completed
    failed = rep.tasks_failed
    if completed + failed > 0:
        rep.overall_score = round(
            (completed / (completed + failed)) * rep.average_quality_score, 4
        )
