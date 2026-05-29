import json
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None

# Stream names
STREAM_JOB_CREATED = "job.created"
STREAM_JOB_PLANNED = "job.planned"
STREAM_TASK_READY = "task.ready"
STREAM_TASK_COMPLETED = "task.completed"
STREAM_TASK_FAILED = "task.failed"
STREAM_RESULT_VERIFIED = "result.verified"
STREAM_PAYMENT_PENDING = "payment.pending"
STREAM_PAYMENT_COMPLETED = "payment.completed"
STREAM_NOTIFICATION = "notification.events"

# Consumer group names
GROUP_COORDINATORS = "coordinators"
GROUP_SCRAPER_WORKERS = "scraper-workers"
GROUP_VERIFIERS = "verifiers"
GROUP_PAYMENT_WORKERS = "payment-workers"
GROUP_NOTIFIERS = "notifiers"


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_timeout=30,
            socket_connect_timeout=10,
            retry_on_timeout=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


async def publish_event(stream: str, data: dict[str, Any]) -> str:
    r = await get_redis()
    message_id = await r.xadd(stream, {"payload": json.dumps(data)})
    return message_id


async def ensure_consumer_groups() -> None:
    r = await get_redis()
    groups = [
        (STREAM_JOB_CREATED, GROUP_COORDINATORS),
        (STREAM_JOB_PLANNED, GROUP_COORDINATORS),
        (STREAM_TASK_READY, GROUP_SCRAPER_WORKERS),
        (STREAM_TASK_COMPLETED, GROUP_VERIFIERS),
        (STREAM_TASK_FAILED, GROUP_COORDINATORS),
        (STREAM_RESULT_VERIFIED, GROUP_PAYMENT_WORKERS),
        (STREAM_PAYMENT_PENDING, GROUP_PAYMENT_WORKERS),
        (STREAM_PAYMENT_COMPLETED, GROUP_NOTIFIERS),
        (STREAM_NOTIFICATION, GROUP_NOTIFIERS),
    ]
    for stream, group in groups:
        try:
            await r.xgroup_create(stream, group, id="0", mkstream=True)
        except aioredis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
