"""
Recurring job scheduler — APScheduler (AsyncIOScheduler).

On startup:
  1. Loads all active JobSchedule rows from the DB.
  2. Registers a cron trigger for each schedule.
  3. When a trigger fires, creates a new DataJob from the stored job_config.

Each schedule is re-synced from the DB every 10 minutes so paused/resumed
schedules are picked up without a server restart.
"""
import uuid
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.domain.jobs.schemas import JobCreate
from app.domain.jobs.service import quote_job
from app.domain.templates.service import load_active_schedules, record_schedule_run
from app.infrastructure.db import AsyncSessionLocal
from app.infrastructure.logging import get_logger

logger = get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None


# ---------------------------------------------------------------------------
# Job runner — called by APScheduler
# ---------------------------------------------------------------------------

async def _run_scheduled_job(schedule_id: str, user_id: str, job_config: dict) -> None:
    logger.info("scheduled_job_firing", schedule_id=schedule_id)
    try:
        async with AsyncSessionLocal() as db:
            async with db.begin():
                data = JobCreate(**job_config)
                job = await quote_job(db, uuid.UUID(user_id), data)
                await record_schedule_run(db, uuid.UUID(schedule_id), job.id)
        logger.info("scheduled_job_created", schedule_id=schedule_id, job_id=str(job.id))
    except Exception as e:
        logger.error("scheduled_job_error", schedule_id=schedule_id, error=str(e))


# ---------------------------------------------------------------------------
# Sync DB schedules → APScheduler
# ---------------------------------------------------------------------------

async def _sync_schedules() -> None:
    """Load active schedules from DB and ensure each has an APScheduler job."""
    if _scheduler is None:
        return

    async with AsyncSessionLocal() as db:
        schedules = await load_active_schedules(db)

    active_ids = set()
    for schedule in schedules:
        job_id_str = f"schedule_{schedule.id}"
        active_ids.add(job_id_str)

        if _scheduler.get_job(job_id_str):
            continue  # already registered

        parts = schedule.cron_expression.split()
        if len(parts) != 5:
            logger.warning("invalid_cron", schedule_id=str(schedule.id), cron=schedule.cron_expression)
            continue

        minute, hour, day, month, day_of_week = parts
        trigger = CronTrigger(
            minute=minute,
            hour=hour,
            day=day,
            month=month,
            day_of_week=day_of_week,
            timezone="UTC",
        )

        _scheduler.add_job(
            _run_scheduled_job,
            trigger=trigger,
            id=job_id_str,
            args=[str(schedule.id), str(schedule.user_id), schedule.job_config],
            replace_existing=True,
            misfire_grace_time=3600,
            coalesce=True,
        )
        logger.info("schedule_registered", schedule_id=str(schedule.id), cron=schedule.cron_expression)

    # Remove jobs whose schedule was paused/deleted
    for job in _scheduler.get_jobs():
        if job.id.startswith("schedule_") and job.id not in active_ids:
            _scheduler.remove_job(job.id)
            logger.info("schedule_removed", job_id=job.id)


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="UTC")
    return _scheduler


async def start_scheduler() -> None:
    scheduler = get_scheduler()

    # Periodic sync every 10 minutes
    scheduler.add_job(
        _sync_schedules,
        trigger=CronTrigger(minute="*/10"),
        id="__sync_schedules__",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("scheduler_started")

    # Initial sync
    await _sync_schedules()


async def stop_scheduler() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("scheduler_stopped")
