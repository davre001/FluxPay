"""
Verifier Agent — consumes task.completed events, verifies results, creates batches,
and triggers on-chain micro-payouts via the escrow contract.
"""
import asyncio
import json
import uuid

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.jobs.models import DataJob, JobStatus
from app.domain.payments.models import Escrow, Payout, PayoutStatus
from app.domain.payments.payout_calculator import create_payouts
from app.domain.results.models import RawResult, ResultBatch, VerifiedResult
from app.domain.results.verifier import create_result_batch, verify_raw_result
from app.domain.tasks.models import MicroTask, TaskStatus
from app.infrastructure.db import AsyncSessionLocal
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import (
    GROUP_VERIFIERS,
    STREAM_NOTIFICATION,
    STREAM_TASK_COMPLETED,
    get_redis,
    publish_event,
)

logger = get_logger(__name__)
CONSUMER_NAME = "verifier-1"


# ---------------------------------------------------------------------------
# On-chain helpers (safe — skips if no private key configured)
# ---------------------------------------------------------------------------

async def _on_chain_execute_payout(
    escrow_address: str,
    worker_wallets: list[str],
    amounts: list[float],
    batch_hash: str,
    job_id: str,
) -> str | None:
    from app.config import settings
    if not settings.coordinator_private_key:
        logger.info("payout_skipped_dev_mode", job_id=job_id)
        return None
    try:
        from app.domain.payments.escrow_client import escrow_client
        tx_hash = await asyncio.to_thread(
            escrow_client.execute_micro_payout,
            escrow_address, worker_wallets, amounts, batch_hash,
        )
        logger.info("payout_executed_onchain", job_id=job_id, tx=tx_hash)
        return tx_hash
    except Exception as e:
        logger.error("payout_onchain_failed", job_id=job_id, error=str(e))
        return None


async def _on_chain_complete_job(escrow_address: str, job_id: str) -> str | None:
    from app.config import settings
    if not settings.coordinator_private_key:
        logger.info("complete_job_skipped_dev_mode", job_id=job_id)
        return None
    try:
        from app.domain.payments.escrow_client import escrow_client
        tx_hash = await asyncio.to_thread(escrow_client.complete_job, escrow_address)
        logger.info("job_completed_onchain", job_id=job_id, tx=tx_hash)
        return tx_hash
    except Exception as e:
        logger.error("complete_job_onchain_failed", job_id=job_id, error=str(e))
        return None


# ---------------------------------------------------------------------------
# Finalize job: batch verified results → payout → complete
# ---------------------------------------------------------------------------

async def _finalize_job(db: AsyncSession, job_id: str) -> None:
    result = await db.execute(select(DataJob).where(DataJob.id == uuid.UUID(job_id)))
    job = result.scalar_one_or_none()
    if not job or job.status != JobStatus.running:
        return

    # Check all tasks are done
    pending = await db.execute(
        select(MicroTask).where(
            MicroTask.job_id == uuid.UUID(job_id),
            MicroTask.status.notin_([TaskStatus.completed, TaskStatus.failed, TaskStatus.skipped]),
        )
    )
    if pending.scalars().first():
        return  # still tasks in progress

    job.status = JobStatus.verifying

    # Collect all approved, non-duplicate verified results for this job
    vr_result = await db.execute(
        select(VerifiedResult)
        .join(RawResult, VerifiedResult.raw_result_id == RawResult.id)
        .join(MicroTask, RawResult.task_id == MicroTask.id)
        .where(
            MicroTask.job_id == uuid.UUID(job_id),
            VerifiedResult.is_duplicate.is_(False),
        )
    )
    verified_items = vr_result.scalars().all()

    if not verified_items:
        job.status = JobStatus.failed
        logger.warning("job_no_verified_results", job_id=job_id)
        return

    # Build payout items
    payout_items = []
    for vr in verified_items:
        raw = await db.get(RawResult, vr.raw_result_id)
        if not raw:
            continue
        task = await db.get(MicroTask, raw.task_id)
        if not task:
            continue
        amount = round(
            float(task.base_reward_usdc)
            * float(task.difficulty_multiplier)
            * float(vr.quality_score)
            * float(vr.freshness_score),
            6,
        )
        payout_items.append({
            "worker_id": str(raw.worker_id),
            "wallet_address": None,  # resolved below
            "amount_usdc": max(amount, 0.000001),
            "quality_score": float(vr.quality_score),
        })

    total_payout = sum(p["amount_usdc"] for p in payout_items)

    # Create result batch
    batch = await create_result_batch(
        db, uuid.UUID(job_id), [vi.id for vi in verified_items], total_payout
    )

    # Get escrow
    esc_result = await db.execute(select(Escrow).where(Escrow.job_id == uuid.UUID(job_id)))
    escrow = esc_result.scalar_one_or_none()

    if escrow and escrow.escrow_address and payout_items:
        # Resolve worker wallet addresses
        from app.domain.workers.models import WorkerProfile
        worker_ids = [uuid.UUID(p["worker_id"]) for p in payout_items]
        workers_result = await db.execute(
            select(WorkerProfile).where(WorkerProfile.id.in_(worker_ids))
        )
        wallet_map = {str(w.id): w.wallet_address for w in workers_result.scalars().all()}

        worker_wallets = [wallet_map.get(p["worker_id"], "0x" + "0" * 40) for p in payout_items]
        amounts = [p["amount_usdc"] for p in payout_items]

        job.status = JobStatus.paying

        # On-chain payout
        tx_hash = await _on_chain_execute_payout(
            escrow.escrow_address,
            worker_wallets,
            amounts,
            batch.batch_hash,
            job_id,
        )

        # Record payouts in DB
        db_payout_items = [
            {
                "worker_id": p["worker_id"],
                "amount_usdc": p["amount_usdc"],
                "quality_score": p["quality_score"],
                "result_batch_id": str(batch.id),
            }
            for p in payout_items
        ]
        payouts = await create_payouts(db, escrow.id, batch.id, db_payout_items)

        if tx_hash:
            for payout in payouts:
                payout.tx_hash = tx_hash
                payout.status = PayoutStatus.confirmed

            batch.is_paid = True
            escrow.remaining_amount_usdc = max(
                0.0, float(escrow.remaining_amount_usdc) - total_payout
            )

        # Complete the job on-chain (returns leftover USDC to requester)
        await _on_chain_complete_job(escrow.escrow_address, job_id)

    job.status = JobStatus.completed

    await publish_event(STREAM_NOTIFICATION, {
        "job_id": job_id,
        "event": "job_completed",
        "result_count": len(verified_items),
        "total_payout_usdc": total_payout,
        "status": JobStatus.completed,
    })

    logger.info(
        "job_finalized",
        job_id=job_id,
        results=len(verified_items),
        total_payout_usdc=total_payout,
    )


# ---------------------------------------------------------------------------
# Event loop
# ---------------------------------------------------------------------------

async def run_verifier() -> None:
    logger.info("verifier_agent_starting")
    r = await get_redis()

    while True:
        try:
            messages = await r.xreadgroup(
                GROUP_VERIFIERS,
                CONSUMER_NAME,
                {STREAM_TASK_COMPLETED: ">"},
                count=10,
                block=2000,
            )
            if not messages:
                continue

            for _, entries in messages:
                for msg_id, fields in entries:
                    try:
                        payload = json.loads(fields.get("payload", "{}"))
                        raw_result_id = payload.get("raw_result_id")
                        job_id = payload.get("job_id")

                        if raw_result_id:
                            async with AsyncSessionLocal() as db:
                                async with db.begin():
                                    await verify_raw_result(db, uuid.UUID(raw_result_id))
                                    if job_id:
                                        await _finalize_job(db, job_id)

                        await r.xack(STREAM_TASK_COMPLETED, GROUP_VERIFIERS, msg_id)

                    except Exception as e:
                        logger.error("verifier_error", error=str(e), msg_id=msg_id)

        except aioredis.RedisError as e:
            logger.error("verifier_redis_error", error=str(e))
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            logger.info("verifier_agent_stopped")
            break
        except Exception as e:
            logger.error("verifier_unexpected_error", error=str(e))
            await asyncio.sleep(2)
