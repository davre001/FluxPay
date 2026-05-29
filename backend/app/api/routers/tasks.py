import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.domain.shared.models import User
from app.domain.tasks import service as task_service
from app.domain.tasks.schemas import TaskAttemptResponse, TaskClaimRequest, TaskResponse, TaskResultSubmit
from app.infrastructure.db import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/job/{job_id}", response_model=list[TaskResponse])
async def list_tasks(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await task_service.list_tasks_for_job(db, job_id)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.post("/{task_id}/claim", response_model=TaskResponse)
async def claim_task(
    task_id: uuid.UUID,
    data: TaskClaimRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = await task_service.claim_task(db, task_id, data.worker_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return task


@router.post("/{task_id}/result", status_code=status.HTTP_201_CREATED)
async def submit_result(
    task_id: uuid.UUID,
    data: TaskResultSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        raw = await task_service.submit_result(db, task_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"raw_result_id": str(raw.id), "status": "submitted"}


@router.post("/{task_id}/fail")
async def fail_task(
    task_id: uuid.UUID,
    worker_id: uuid.UUID,
    error: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        task = await task_service.fail_task(db, task_id, worker_id, error)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"task_id": str(task.id), "status": task.status, "retry_count": task.retry_count}
