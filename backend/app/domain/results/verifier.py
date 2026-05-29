import hashlib
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.results.models import RawResult, ResultBatch, VerificationStatus, VerifiedResult
from app.domain.tasks.models import MicroTask
from app.domain.workers.registry import update_reputation_after_task
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import STREAM_RESULT_VERIFIED, publish_event

logger = get_logger(__name__)

MIN_CONFIDENCE = 0.5
MIN_REQUIRED_FIELDS = {"data"}


def _score_freshness(collected_at: datetime) -> float:
    age_hours = (datetime.now(timezone.utc) - collected_at).total_seconds() / 3600
    if age_hours < 1:
        return 1.0
    if age_hours < 24:
        return 0.9
    if age_hours < 72:
        return 0.7
    return 0.5


def _check_schema(data: dict, output_schema: dict) -> tuple[bool, str]:
    required = output_schema.get("required", [])
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"
    return True, ""


async def verify_raw_result(db: AsyncSession, raw_result_id: uuid.UUID) -> VerifiedResult | None:
    result = await db.execute(
        select(RawResult).where(RawResult.id == raw_result_id)
    )
    raw = result.scalar_one_or_none()
    if not raw:
        return None

    task_result = await db.execute(select(MicroTask).where(MicroTask.id == raw.task_id))
    task = task_result.scalar_one_or_none()

    schema_ok, schema_err = _check_schema(raw.data, task.output_schema if task else {})
    if not schema_ok:
        raw.verification_status = VerificationStatus.rejected
        logger.warning("result_schema_invalid", raw_id=str(raw_result_id), reason=schema_err)
        return None

    if raw.confidence < MIN_CONFIDENCE:
        raw.verification_status = VerificationStatus.rejected
        logger.warning("result_low_confidence", raw_id=str(raw_result_id), confidence=raw.confidence)
        return None

    freshness_score = _score_freshness(raw.collected_at)
    quality_score = min(1.0, raw.confidence)
    confidence_score = (quality_score + freshness_score) / 2

    # Duplicate check: hash normalized data
    data_hash = hashlib.sha256(json.dumps(raw.data, sort_keys=True).encode()).hexdigest()
    dup_result = await db.execute(
        select(VerifiedResult).join(RawResult).where(
            RawResult.task_id == raw.task_id,
            VerifiedResult.id != raw.id,
        )
    )
    existing = dup_result.scalars().first()
    is_duplicate = existing is not None and hashlib.sha256(
        json.dumps(existing.normalized_data, sort_keys=True).encode()
    ).hexdigest() == data_hash

    verified = VerifiedResult(
        raw_result_id=raw.id,
        normalized_data=raw.data,
        quality_score=quality_score,
        freshness_score=freshness_score,
        confidence_score=confidence_score,
        is_duplicate=is_duplicate,
    )
    db.add(verified)
    raw.verification_status = VerificationStatus.approved
    await db.flush()

    await update_reputation_after_task(
        db, raw.worker_id, quality_score, freshness_score, success=True
    )

    logger.info("result_verified", raw_id=str(raw_result_id), verified_id=str(verified.id))
    return verified


async def create_result_batch(
    db: AsyncSession, job_id: uuid.UUID, verified_ids: list[uuid.UUID], total_payout_usdc: float
) -> ResultBatch:
    batch_data = sorted(str(v) for v in verified_ids)
    batch_hash = "0x" + hashlib.sha256(json.dumps(batch_data).encode()).hexdigest()

    batch = ResultBatch(
        job_id=job_id,
        batch_hash=batch_hash,
        result_count=len(verified_ids),
        total_payout_usdc=total_payout_usdc,
    )
    db.add(batch)
    await db.flush()

    await db.execute(
        select(VerifiedResult).where(VerifiedResult.id.in_(verified_ids))
    )

    await publish_event(STREAM_RESULT_VERIFIED, {
        "job_id": str(job_id),
        "batch_id": str(batch.id),
        "batch_hash": batch_hash,
        "result_count": len(verified_ids),
        "total_payout_usdc": total_payout_usdc,
    })
    logger.info("batch_created", batch_id=str(batch.id), job_id=str(job_id))
    return batch
