import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.payments.models import Escrow, EscrowStatus, Payout, PayoutStatus
from app.domain.results.models import ResultBatch, VerifiedResult
from app.domain.tasks.models import MicroTask
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import STREAM_PAYMENT_PENDING, publish_event

logger = get_logger(__name__)

DIFFICULTY_MULTIPLIERS = {
    "public_web": 1.0,
    "lazada_api": 0.8,
    "customer_urls": 1.2,
    "manual_worker": 1.5,
}


def compute_worker_payout(
    base_reward: float,
    difficulty_multiplier: float,
    quality_score: float,
    freshness_score: float,
) -> float:
    payout = base_reward * difficulty_multiplier * quality_score * freshness_score
    return round(max(payout, 0.0001), 6)


async def calculate_batch_payouts(
    db: AsyncSession,
    batch_id: uuid.UUID,
) -> list[dict]:
    batch_result = await db.execute(
        select(ResultBatch).where(ResultBatch.id == batch_id)
    )
    batch = batch_result.scalar_one_or_none()
    if not batch:
        raise ValueError(f"Batch {batch_id} not found")

    verified_result = await db.execute(
        select(VerifiedResult).where(VerifiedResult.batch_id == batch_id)
    )
    verified_items = verified_result.scalars().all()

    payouts = []
    for vr in verified_items:
        raw_result_data = await db.execute(
            select(MicroTask).join(
                "raw_results"
            ).where(MicroTask.id == vr.raw_result.task_id)  # type: ignore[union-attr]
        )
        task = raw_result_data.scalar_one_or_none()
        if not task:
            continue

        amount = compute_worker_payout(
            base_reward=float(task.base_reward_usdc),
            difficulty_multiplier=float(task.difficulty_multiplier),
            quality_score=float(vr.quality_score),
            freshness_score=float(vr.freshness_score),
        )
        payouts.append({
            "worker_id": str(vr.raw_result.worker_id),  # type: ignore[union-attr]
            "amount_usdc": amount,
            "quality_score": float(vr.quality_score),
            "result_batch_id": str(batch_id),
        })
    return payouts


async def create_payouts(
    db: AsyncSession,
    escrow_id: uuid.UUID,
    batch_id: uuid.UUID,
    payout_items: list[dict],
) -> list[Payout]:
    records = []
    for item in payout_items:
        payout = Payout(
            escrow_id=escrow_id,
            worker_id=uuid.UUID(item["worker_id"]),
            result_batch_id=batch_id,
            amount_usdc=item["amount_usdc"],
            quality_score=item["quality_score"],
            status=PayoutStatus.pending,
        )
        db.add(payout)
        records.append(payout)

    await db.flush()

    escrow_result = await db.execute(select(Escrow).where(Escrow.id == escrow_id))
    escrow = escrow_result.scalar_one_or_none()
    if escrow:
        total = sum(p["amount_usdc"] for p in payout_items)
        escrow.remaining_amount_usdc = max(0.0, float(escrow.remaining_amount_usdc) - total)

    await publish_event(STREAM_PAYMENT_PENDING, {
        "escrow_id": str(escrow_id),
        "batch_id": str(batch_id),
        "payout_count": len(records),
        "total_usdc": sum(p["amount_usdc"] for p in payout_items),
    })
    logger.info("payouts_created", batch_id=str(batch_id), count=len(records))
    return records


async def confirm_payout(
    db: AsyncSession, payout_id: uuid.UUID, tx_hash: str
) -> Payout:
    result = await db.execute(select(Payout).where(Payout.id == payout_id))
    payout = result.scalar_one_or_none()
    if not payout:
        raise ValueError(f"Payout {payout_id} not found")

    payout.tx_hash = tx_hash
    payout.status = PayoutStatus.confirmed
    payout.confirmed_at = datetime.now(timezone.utc)
    logger.info("payout_confirmed", payout_id=str(payout_id), tx_hash=tx_hash)
    return payout
