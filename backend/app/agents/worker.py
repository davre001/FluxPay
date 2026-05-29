"""
Worker Agent — consumes task.ready events and fetches real data via source adapters.
Phase 3: uses actual httpx + selectolax scraping instead of simulation.
"""
import asyncio
import json
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis

from app.domain.tasks.schemas import TaskResultSubmit
from app.domain.tasks.service import submit_result, fail_task
from app.infrastructure.db import AsyncSessionLocal
from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import (
    GROUP_SCRAPER_WORKERS,
    STREAM_TASK_READY,
    get_redis,
)
from app.sources.registry import get_source_adapter

logger = get_logger(__name__)

CONSUMER_NAME = "worker-agent-1"
_WORKER_ID: uuid.UUID | None = None


async def _get_or_create_worker_id() -> uuid.UUID:
    global _WORKER_ID
    if _WORKER_ID:
        return _WORKER_ID

    from sqlalchemy import select
    from app.domain.workers.models import WorkerProfile, WorkerType
    from app.domain.workers.registry import register_worker
    from app.domain.workers.schemas import WorkerRegister

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(WorkerProfile).where(WorkerProfile.name == "FluxPayWorkerAgent")
        )
        worker = result.scalar_one_or_none()
        if not worker:
            async with db.begin():
                worker = await register_worker(
                    db,
                    WorkerRegister(
                        name="FluxPayWorkerAgent",
                        worker_type=WorkerType.agent,
                        wallet_address="0x" + "a" * 40,
                        allowed_task_types=["public_web", "lazada_ph", "shopee_ph", "customer_urls", "generic_ecommerce"],
                        capacity=10,
                    ),
                )
        _WORKER_ID = worker.id
    return _WORKER_ID


async def _process_task(msg_payload: dict, worker_id: uuid.UUID) -> None:
    task_id_str = msg_payload.get("task_id")
    source_url = msg_payload.get("source_url", "")
    source_connector = msg_payload.get("source_connector", "generic_ecommerce")
    payload = msg_payload.get("payload", {})
    output_schema = msg_payload.get("output_schema", {})

    if not task_id_str:
        return

    task_id = uuid.UUID(task_id_str)
    payload["output_schema"] = output_schema

    # Resolve adapter
    adapter = get_source_adapter(source_connector, source_url)

    logger.info(
        "worker_fetching",
        task_id=task_id_str,
        connector=source_connector,
        url=source_url,
    )

    try:
        results = await adapter.fetch(source_url, payload)
    except Exception as e:
        async with AsyncSessionLocal() as db:
            async with db.begin():
                await fail_task(db, task_id, worker_id, str(e))
        logger.error("worker_fetch_failed", task_id=task_id_str, error=str(e))
        return

    if not results or all(not r.success for r in results):
        errors = [r.error for r in results if r.error]
        error_msg = "; ".join(errors) if errors else "No results returned"
        async with AsyncSessionLocal() as db:
            async with db.begin():
                await fail_task(db, task_id, worker_id, error_msg)
        logger.warning("worker_no_results", task_id=task_id_str)
        return

    # Submit the first successful batch as a single structured result
    successful = [r for r in results if r.success]
    combined_data = {
        "items": [r.data for r in successful],
        "item_count": len(successful),
        "source_connector": source_connector,
    }
    first_proof = successful[0].proof

    result_payload = TaskResultSubmit(
        worker_id=worker_id,
        data=combined_data,
        source_url=first_proof.source_url,
        collected_at=first_proof.collected_at,
        method=first_proof.method,
        confidence=first_proof.confidence,
    )

    async with AsyncSessionLocal() as db:
        async with db.begin():
            await submit_result(db, task_id, result_payload)

    logger.info(
        "worker_submitted",
        task_id=task_id_str,
        item_count=len(successful),
        confidence=first_proof.confidence,
    )


async def run_worker() -> None:
    logger.info("worker_agent_starting")
    r = await get_redis()
    worker_id = await _get_or_create_worker_id()

    while True:
        try:
            messages = await r.xreadgroup(
                GROUP_SCRAPER_WORKERS,
                CONSUMER_NAME,
                {STREAM_TASK_READY: ">"},
                count=3,
                block=2000,
            )
            if not messages:
                continue

            # Process up to 3 tasks concurrently
            tasks_to_run = []
            msg_ids = []
            for _, entries in messages:
                for msg_id, fields in entries:
                    try:
                        payload = json.loads(fields.get("payload", "{}"))
                        tasks_to_run.append(_process_task(payload, worker_id))
                        msg_ids.append(msg_id)
                    except Exception as e:
                        logger.error("worker_parse_error", msg_id=msg_id, error=str(e))

            if tasks_to_run:
                await asyncio.gather(*tasks_to_run, return_exceptions=True)
                for msg_id in msg_ids:
                    await r.xack(STREAM_TASK_READY, GROUP_SCRAPER_WORKERS, msg_id)

        except aioredis.RedisError as e:
            logger.error("worker_redis_error", error=str(e))
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            logger.info("worker_agent_stopped")
            break
        except Exception as e:
            logger.error("worker_unexpected_error", error=str(e))
            await asyncio.sleep(2)
