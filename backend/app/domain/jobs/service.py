import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.domain.jobs.models import DataJob, JobManifest, JobQuote, JobStatus
from app.domain.jobs.schemas import FundingConfirmation, JobCreate
from app.domain.payments.models import Escrow, EscrowStatus
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import STREAM_JOB_CREATED, publish_event

logger = get_logger(__name__)

ROWS_PER_TASK = 10
BASE_REWARD_PER_ROW = 0.001  # USDC
VERIFIER_COST_RATIO = 0.1
INFRA_COST_RATIO = 0.05
CHAIN_COST_USDC = 0.02


def _compute_quote(job: JobCreate) -> dict:
    estimated_rows = min(job.max_rows, 500)
    task_count = max(1, estimated_rows // ROWS_PER_TASK)
    worker_rewards = round(estimated_rows * BASE_REWARD_PER_ROW, 6)
    verifier_cost = round(worker_rewards * VERIFIER_COST_RATIO, 6)
    infra_cost = round(worker_rewards * INFRA_COST_RATIO, 6)
    chain_cost = round(CHAIN_COST_USDC * task_count, 6)
    subtotal = worker_rewards + verifier_cost + infra_cost + chain_cost
    platform_fee = round(subtotal * (settings.platform_fee_percent / 100), 6)
    total = round(subtotal + platform_fee, 6)
    return {
        "estimated_rows": estimated_rows,
        "task_count": task_count,
        "worker_rewards_usdc": worker_rewards,
        "verifier_cost_usdc": verifier_cost,
        "infrastructure_cost_usdc": infra_cost,
        "chain_cost_usdc": chain_cost,
        "platform_fee_usdc": platform_fee,
        "total_usdc": total,
    }


async def quote_job(db: AsyncSession, requester_id: uuid.UUID, data: JobCreate) -> dict:
    job = DataJob(
        requester_id=requester_id,
        title=data.title,
        description=data.description,
        category=data.category,
        region=data.region,
        source_type=data.source_type,
        output_schema=data.output_schema,
        freshness=data.freshness,
        max_rows=data.max_rows,
        budget_usdc=data.budget_usdc,
        compliance_accepted=data.compliance_accepted,
        deadline=data.deadline,
        status=JobStatus.draft,
    )
    db.add(job)
    await db.flush()

    quote_data = _compute_quote(data)
    quote = JobQuote(
        job_id=job.id,
        **quote_data,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(quote)
    await db.flush()

    job.status = JobStatus.quoted
    await db.refresh(job)
    result = await db.execute(
        select(DataJob)
        .where(DataJob.id == job.id)
        .options(selectinload(DataJob.quote))
    )
    refreshed_job = result.scalar_one()
    logger.info("job_quoted", job_id=str(refreshed_job.id), total_usdc=quote_data["total_usdc"])
    return refreshed_job


async def create_job(db: AsyncSession, job_id: uuid.UUID) -> DataJob:
    result = await db.execute(
        select(DataJob)
        .where(DataJob.id == job_id, DataJob.status == JobStatus.quoted)
        .options(selectinload(DataJob.quote))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise ValueError(f"Job {job_id} not found or not in quoted state")

    job.status = JobStatus.funding_pending
    logger.info("job_awaiting_funding", job_id=str(job_id))
    return job


async def confirm_funding(
    db: AsyncSession, job_id: uuid.UUID, data: FundingConfirmation, coordinator_address: str
) -> DataJob:
    result = await db.execute(
        select(DataJob)
        .where(DataJob.id == job_id)
        .options(selectinload(DataJob.quote), selectinload(DataJob.escrow))
    )
    job = result.scalar_one_or_none()
    if not job:
        raise ValueError(f"Job {job_id} not found")
    if job.status not in (JobStatus.funding_pending, JobStatus.quoted):
        raise ValueError(f"Job {job_id} is not awaiting funding")

    escrow = Escrow(
        job_id=job.id,
        escrow_address=data.escrow_address,
        usdc_token_address=settings.usdc_address or "0x0000000000000000000000000000000000000000",
        requester_address=data.requester_address,
        coordinator_address=coordinator_address,
        funded_amount_usdc=data.funded_amount_usdc,
        remaining_amount_usdc=data.funded_amount_usdc,
        funding_tx_hash=data.tx_hash,
        status=EscrowStatus.funded,
        funded_at=datetime.now(timezone.utc),
    )
    db.add(escrow)
    job.status = JobStatus.funded

    await publish_event(STREAM_JOB_CREATED, {
        "job_id": str(job.id),
        "escrow_address": data.escrow_address,
        "funded_amount": data.funded_amount_usdc,
    })
    logger.info("job_funded", job_id=str(job_id), tx_hash=data.tx_hash)
    return job


async def get_job(db: AsyncSession, job_id: uuid.UUID) -> DataJob | None:
    result = await db.execute(
        select(DataJob)
        .where(DataJob.id == job_id)
        .options(
            selectinload(DataJob.quote),
            selectinload(DataJob.manifest),
            selectinload(DataJob.escrow),
        )
    )
    return result.scalar_one_or_none()


async def list_jobs(
    db: AsyncSession, requester_id: uuid.UUID, page: int = 1, page_size: int = 20
) -> tuple[list[DataJob], int]:
    offset = (page - 1) * page_size
    q = select(DataJob).where(DataJob.requester_id == requester_id)

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()

    result = await db.execute(
        q.options(selectinload(DataJob.quote))
        .order_by(DataJob.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all(), total


async def cancel_job(db: AsyncSession, job_id: uuid.UUID, admin_id: uuid.UUID) -> DataJob:
    result = await db.execute(select(DataJob).where(DataJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise ValueError(f"Job {job_id} not found")
    if job.status in (JobStatus.completed, JobStatus.cancelled):
        raise ValueError(f"Job {job_id} cannot be cancelled in status {job.status}")

    job.status = JobStatus.cancelled
    logger.info("job_cancelled", job_id=str(job_id), admin_id=str(admin_id))
    return job
