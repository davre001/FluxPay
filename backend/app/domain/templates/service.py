import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.jobs.models import DataJob, JobFreshness, JobStatus
from app.domain.jobs.service import quote_job
from app.domain.jobs.schemas import JobCreate
from app.domain.templates.models import CustomerRequest, DatasetProduct, JobSchedule, RequestStatus
from app.domain.templates.schemas import (
    CustomerRequestCreate,
    JobScheduleCreate,
    TemplateLaunchRequest,
)
from app.infrastructure.logging import get_logger

logger = get_logger(__name__)

FRESHNESS_TO_CRON = {
    "daily":  "0 2 * * *",   # 02:00 UTC every day
    "weekly": "0 3 * * 1",   # 03:00 UTC every Monday
}


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

async def list_templates(
    db: AsyncSession,
    category: str | None = None,
    featured_only: bool = False,
    page: int = 1,
    page_size: int = 20,
) -> list[DatasetProduct]:
    q = select(DatasetProduct).where(DatasetProduct.is_active.is_(True))
    if category:
        q = q.where(DatasetProduct.category == category)
    if featured_only:
        q = q.where(DatasetProduct.is_featured.is_(True))
    q = q.order_by(DatasetProduct.is_featured.desc(), DatasetProduct.launch_count.desc())
    q = q.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


async def get_template(db: AsyncSession, template_id: uuid.UUID) -> DatasetProduct | None:
    result = await db.execute(
        select(DatasetProduct).where(DatasetProduct.id == template_id, DatasetProduct.is_active.is_(True))
    )
    return result.scalar_one_or_none()


async def launch_template(
    db: AsyncSession,
    template_id: uuid.UUID,
    requester_id: uuid.UUID,
    launch: TemplateLaunchRequest,
) -> DataJob:
    template = await get_template(db, template_id)
    if not template:
        raise ValueError(f"Template {template_id} not found or inactive")

    freshness_str = launch.freshness or template.default_freshness
    try:
        freshness = JobFreshness(freshness_str)
    except ValueError:
        freshness = JobFreshness.once

    job_data = JobCreate(
        title=template.title,
        description=template.description,
        category=template.category,
        region=launch.region or template.region,
        source_type=template.source_type,
        output_schema=template.output_schema,
        freshness=freshness,
        max_rows=launch.max_rows or template.default_max_rows,
        budget_usdc=launch.budget_usdc or float(template.estimated_cost_usdc) or 10.0,
        compliance_accepted=launch.compliance_accepted,
    )

    job = await quote_job(db, requester_id, job_data)

    # Bump launch counter
    template.launch_count += 1

    logger.info("template_launched", template_id=str(template_id), job_id=str(job.id))
    return job


# ---------------------------------------------------------------------------
# Customer requests
# ---------------------------------------------------------------------------

async def submit_customer_request(
    db: AsyncSession, data: CustomerRequestCreate
) -> CustomerRequest:
    req = CustomerRequest(
        email=data.email,
        name=data.name,
        description=data.description,
        data_type=data.data_type,
        region=data.region,
        budget_usdc=data.budget_usdc,
        frequency=data.frequency,
    )
    db.add(req)
    await db.flush()
    logger.info("customer_request_submitted", email=data.email, id=str(req.id))
    return req


async def list_customer_requests(
    db: AsyncSession, status: RequestStatus | None = None, page: int = 1, page_size: int = 50
) -> list[CustomerRequest]:
    q = select(CustomerRequest)
    if status:
        q = q.where(CustomerRequest.status == status)
    q = q.order_by(CustomerRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Schedules
# ---------------------------------------------------------------------------

async def create_schedule(
    db: AsyncSession, user_id: uuid.UUID, data: JobScheduleCreate
) -> JobSchedule:
    if data.freshness not in FRESHNESS_TO_CRON:
        raise ValueError(f"Unsupported freshness: {data.freshness}. Use 'daily' or 'weekly'.")

    cron = FRESHNESS_TO_CRON[data.freshness]
    schedule = JobSchedule(
        user_id=user_id,
        template_id=data.template_id,
        job_config=data.job_config,
        cron_expression=cron,
        freshness=data.freshness,
        is_active=True,
    )
    db.add(schedule)
    await db.flush()
    logger.info("schedule_created", schedule_id=str(schedule.id), user_id=str(user_id))
    return schedule


async def list_schedules(db: AsyncSession, user_id: uuid.UUID) -> list[JobSchedule]:
    result = await db.execute(
        select(JobSchedule)
        .where(JobSchedule.user_id == user_id)
        .order_by(JobSchedule.created_at.desc())
    )
    return result.scalars().all()


async def pause_schedule(db: AsyncSession, schedule_id: uuid.UUID, user_id: uuid.UUID) -> JobSchedule:
    result = await db.execute(
        select(JobSchedule).where(JobSchedule.id == schedule_id, JobSchedule.user_id == user_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise ValueError(f"Schedule {schedule_id} not found")
    schedule.is_active = False
    return schedule


async def resume_schedule(db: AsyncSession, schedule_id: uuid.UUID, user_id: uuid.UUID) -> JobSchedule:
    result = await db.execute(
        select(JobSchedule).where(JobSchedule.id == schedule_id, JobSchedule.user_id == user_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise ValueError(f"Schedule {schedule_id} not found")
    schedule.is_active = True
    return schedule


async def load_active_schedules(db: AsyncSession) -> list[JobSchedule]:
    result = await db.execute(
        select(JobSchedule).where(JobSchedule.is_active.is_(True))
    )
    return result.scalars().all()


async def record_schedule_run(
    db: AsyncSession, schedule_id: uuid.UUID, job_id: uuid.UUID
) -> None:
    result = await db.execute(select(JobSchedule).where(JobSchedule.id == schedule_id))
    schedule = result.scalar_one_or_none()
    if schedule:
        schedule.last_run_at = datetime.now(timezone.utc)
        schedule.last_job_id = job_id
        schedule.run_count += 1
