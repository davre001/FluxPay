"""
Coordinator Agent — listens on job.created stream, plans tasks, pushes to task.ready.
On-chain: calls mark_ready() after manifest is built (if private key is configured).
"""
import asyncio
import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.jobs.models import DataJob, JobManifest, JobStatus
from app.domain.payments.models import Escrow
from app.domain.tasks.models import MicroTask
from app.infrastructure.db import AsyncSessionLocal
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import (
    GROUP_COORDINATORS,
    STREAM_JOB_CREATED,
    STREAM_JOB_PLANNED,
    STREAM_NOTIFICATION,
    STREAM_TASK_READY,
    get_redis,
    publish_event,
)

logger = get_logger(__name__)

CONSUMER_NAME = "coordinator-1"
ROWS_PER_TASK = 10
BASE_REWARD_PER_ROW = 0.001


# ---------------------------------------------------------------------------
# On-chain helpers (safe — skips if no private key configured)
# ---------------------------------------------------------------------------

async def _on_chain_mark_ready(escrow_address: str, manifest_hash: str, job_id: str) -> str | None:
    """Call markReady on the escrow contract. Returns tx hash or None in dev mode."""
    from app.config import settings
    if not settings.coordinator_private_key:
        logger.info("escrow_mark_ready_skipped_dev_mode", job_id=job_id)
        return None
    try:
        from app.domain.payments.escrow_client import escrow_client
        tx_hash = await asyncio.to_thread(
            escrow_client.mark_ready, escrow_address, manifest_hash
        )
        logger.info("escrow_marked_ready_onchain", job_id=job_id, tx=tx_hash)
        return tx_hash
    except Exception as e:
        logger.error("escrow_mark_ready_failed", job_id=job_id, error=str(e))
        return None


# ---------------------------------------------------------------------------
# Task planning
# ---------------------------------------------------------------------------

def _plan_tasks(job: DataJob, manifest: dict) -> list[dict]:
    estimated_rows = manifest.get("scope", {}).get("estimated_rows", 100)
    task_count = max(1, estimated_rows // ROWS_PER_TASK)
    sources = manifest.get("source_rules", {}).get("urls", [f"https://source.example.com/{job.category}"])

    tasks = []
    for i in range(task_count):
        source_url = sources[i % len(sources)]
        tasks.append({
            "task_index": i,
            "source_url": source_url,
            "source_connector": job.source_type,
            "payload": {
                "category": job.category,
                "region": job.region,
                "rows": ROWS_PER_TASK,
                "offset": i * ROWS_PER_TASK,
            },
            "output_schema": job.output_schema,
            "base_reward_usdc": BASE_REWARD_PER_ROW * ROWS_PER_TASK,
            "difficulty_multiplier": 1.0,
            "deadline": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        })
    return tasks


# ---------------------------------------------------------------------------
# Core job processing
# ---------------------------------------------------------------------------

async def _process_job(db: AsyncSession, job_id: str) -> None:
    result = await db.execute(
        select(DataJob).where(DataJob.id == uuid.UUID(job_id))
    )
    job = result.scalar_one_or_none()
    if not job or job.status != JobStatus.funded:
        logger.warning("coordinator_skip_job", job_id=job_id, reason="not funded or not found")
        return

    job.status = JobStatus.planning

    # Get escrow address (may be None in dev mode)
    esc_result = await db.execute(select(Escrow).where(Escrow.job_id == job.id))
    escrow = esc_result.scalar_one_or_none()
    escrow_address = escrow.escrow_address if escrow else None

    # Build manifest
    scope = {
        "category": job.category,
        "region": job.region,
        "max_rows": job.max_rows,
        "estimated_rows": min(job.max_rows, 500),
        "freshness": job.freshness,
    }
    source_rules = {"connector": job.source_type, "urls": []}
    manifest_data = {"scope": scope, "source_rules": source_rules, "output_schema": job.output_schema}
    manifest_hash = "0x" + hashlib.sha256(json.dumps(manifest_data, sort_keys=True).encode()).hexdigest()

    manifest = JobManifest(
        job_id=job.id,
        scope=scope,
        source_rules=source_rules,
        output_schema=job.output_schema,
        manifest_hash=manifest_hash,
    )
    db.add(manifest)
    await db.flush()

    # On-chain: attach manifest hash to the escrow contract
    if escrow_address:
        tx_hash = await _on_chain_mark_ready(escrow_address, manifest_hash, job_id)
        if tx_hash and escrow:
            escrow.manifest_hash = manifest_hash

    # Create micro-tasks
    task_defs = _plan_tasks(job, manifest_data)
    task_ids = []
    for td in task_defs:
        deadline = datetime.fromisoformat(td["deadline"])
        task = MicroTask(
            job_id=job.id,
            task_index=td["task_index"],
            source_url=td["source_url"],
            source_connector=td["source_connector"],
            payload=td["payload"],
            output_schema=td["output_schema"],
            base_reward_usdc=td["base_reward_usdc"],
            difficulty_multiplier=td["difficulty_multiplier"],
            deadline=deadline,
        )
        db.add(task)
        await db.flush()
        task_ids.append(str(task.id))

        await publish_event(STREAM_TASK_READY, {
            "job_id": job_id,
            "task_id": str(task.id),
            "task_index": td["task_index"],
            "source_url": td["source_url"],
            "source_connector": td["source_connector"],
            "payload": td["payload"],
            "output_schema": td["output_schema"],
            "base_reward_usdc": td["base_reward_usdc"],
        })

    job.status = JobStatus.running

    await publish_event(STREAM_JOB_PLANNED, {
        "job_id": job_id,
        "manifest_hash": manifest_hash,
        "task_count": len(task_ids),
        "escrow_address": escrow_address,
    })
    await publish_event(STREAM_NOTIFICATION, {
        "job_id": job_id,
        "event": "job_planned",
        "task_count": len(task_ids),
        "status": JobStatus.running,
    })

    logger.info("job_planned", job_id=job_id, task_count=len(task_ids), escrow=escrow_address)


# ---------------------------------------------------------------------------
# Event loop
# ---------------------------------------------------------------------------

async def run_coordinator() -> None:
    logger.info("coordinator_starting")
    r = await get_redis()

    while True:
        try:
            messages = await r.xreadgroup(
                GROUP_COORDINATORS,
                CONSUMER_NAME,
                {STREAM_JOB_CREATED: ">"},
                count=5,
                block=2000,
            )
            if not messages:
                continue

            for _, entries in messages:
                for msg_id, fields in entries:
                    try:
                        payload = json.loads(fields.get("payload", "{}"))
                        job_id = payload.get("job_id")
                        if job_id:
                            async with AsyncSessionLocal() as db:
                                async with db.begin():
                                    await _process_job(db, job_id)
                        await r.xack(STREAM_JOB_CREATED, GROUP_COORDINATORS, msg_id)
                    except Exception as e:
                        logger.error("coordinator_error", msg_id=msg_id, error=str(e))

        except aioredis.RedisError as e:
            logger.error("coordinator_redis_error", error=str(e))
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            logger.info("coordinator_stopped")
            break
        except Exception as e:
            logger.error("coordinator_unexpected_error", error=str(e))
            await asyncio.sleep(2)
