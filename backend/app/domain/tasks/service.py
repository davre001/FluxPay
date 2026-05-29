import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.results.models import RawResult, VerificationStatus
from app.domain.tasks.models import MicroTask, TaskAttempt, TaskStatus
from app.domain.tasks.schemas import TaskResultSubmit
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import (
    STREAM_TASK_COMPLETED,
    STREAM_TASK_FAILED,
    publish_event,
)

logger = get_logger(__name__)


async def get_task(db: AsyncSession, task_id: uuid.UUID) -> MicroTask | None:
    result = await db.execute(
        select(MicroTask)
        .where(MicroTask.id == task_id)
        .options(selectinload(MicroTask.attempts))
    )
    return result.scalar_one_or_none()


async def list_tasks_for_job(db: AsyncSession, job_id: uuid.UUID) -> list[MicroTask]:
    result = await db.execute(
        select(MicroTask)
        .where(MicroTask.job_id == job_id)
        .order_by(MicroTask.task_index)
    )
    return result.scalars().all()


async def claim_task(
    db: AsyncSession, task_id: uuid.UUID, worker_id: uuid.UUID
) -> MicroTask:
    result = await db.execute(
        select(MicroTask).where(
            MicroTask.id == task_id, MicroTask.status == TaskStatus.pending
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not available for claiming")

    task.status = TaskStatus.claimed
    task.assigned_worker_id = worker_id

    attempt = TaskAttempt(
        task_id=task_id,
        worker_id=worker_id,
        attempt_number=task.retry_count + 1,
        status=TaskStatus.claimed,
    )
    db.add(attempt)
    logger.info("task_claimed", task_id=str(task_id), worker_id=str(worker_id))
    return task


async def submit_result(
    db: AsyncSession, task_id: uuid.UUID, data: TaskResultSubmit
) -> RawResult:
    result = await db.execute(
        select(MicroTask).where(MicroTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError(f"Task {task_id} not found")

    raw = RawResult(
        task_id=task_id,
        worker_id=data.worker_id,
        data=data.data,
        source_url=data.source_url,
        collected_at=data.collected_at,
        method=data.method,
        confidence=data.confidence,
        verification_status=VerificationStatus.pending,
    )
    db.add(raw)

    task.status = TaskStatus.completed
    await db.flush()

    await publish_event(STREAM_TASK_COMPLETED, {
        "task_id": str(task_id),
        "job_id": str(task.job_id),
        "raw_result_id": str(raw.id),
        "worker_id": str(data.worker_id),
    })
    logger.info("task_result_submitted", task_id=str(task_id), result_id=str(raw.id))
    return raw


async def fail_task(
    db: AsyncSession, task_id: uuid.UUID, worker_id: uuid.UUID, error: str
) -> MicroTask:
    result = await db.execute(select(MicroTask).where(MicroTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError(f"Task {task_id} not found")

    task.retry_count += 1
    if task.retry_count >= task.max_retries:
        task.status = TaskStatus.failed
    else:
        task.status = TaskStatus.pending
        task.assigned_worker_id = None

    attempt_result = await db.execute(
        select(TaskAttempt).where(
            TaskAttempt.task_id == task_id,
            TaskAttempt.worker_id == worker_id,
        ).order_by(TaskAttempt.started_at.desc())
    )
    attempt = attempt_result.scalars().first()
    if attempt:
        attempt.status = TaskStatus.failed
        attempt.error_message = error
        attempt.completed_at = datetime.now(timezone.utc)

    await publish_event(STREAM_TASK_FAILED, {
        "task_id": str(task_id),
        "job_id": str(task.job_id),
        "worker_id": str(worker_id),
        "error": error,
        "retry_count": task.retry_count,
    })
    logger.warning("task_failed", task_id=str(task_id), retry=task.retry_count)
    return task
