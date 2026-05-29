import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, require_admin
from app.domain.jobs import service as job_service
from app.domain.jobs.schemas import JobResponse
from app.domain.shared.models import User
from app.domain.tasks import service as task_service
from app.domain.tasks.schemas import TaskResponse
from app.infrastructure.db import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        job = await job_service.cancel_job(db, job_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return job


@router.post("/tasks/{task_id}/retry", response_model=TaskResponse)
async def retry_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    from app.domain.tasks.models import TaskStatus
    task.status = TaskStatus.pending
    task.assigned_worker_id = None
    return task


@router.get("/jobs", response_model=list[JobResponse])
async def list_all_jobs(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    from app.domain.jobs.models import DataJob
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(DataJob)
        .options(selectinload(DataJob.quote))
        .order_by(DataJob.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return result.scalars().all()
