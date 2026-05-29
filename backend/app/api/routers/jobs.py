import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.domain.jobs import service as job_service
from app.domain.jobs.schemas import (
    FundingConfirmation,
    JobCreate,
    JobListResponse,
    JobResponse,
    ManifestResponse,
)
from app.domain.shared.models import User
from app.infrastructure.db import get_db

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/quote", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def quote_job(
    data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await job_service.quote_job(db, current_user.id, data)
    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        job = await job_service.create_job(db, job_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return job


@router.get("", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    jobs, total = await job_service.list_jobs(db, current_user.id, page, page_size)
    return JobListResponse(items=jobs, total=total, page=page, page_size=page_size)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await job_service.get_job(db, job_id)
    if not job or job.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


@router.post("/{job_id}/funding-confirmation", response_model=JobResponse)
async def confirm_funding(
    job_id: uuid.UUID,
    data: FundingConfirmation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.config import settings

    try:
        job = await job_service.confirm_funding(
            db, job_id, data, coordinator_address=settings.coordinator_private_key[:42] or "0x0"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return job


@router.get("/{job_id}/results")
async def get_job_results(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await job_service.get_job(db, job_id)
    if not job or job.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    from sqlalchemy import select
    from app.domain.results.models import ResultBatch, VerifiedResult
    result = await db.execute(
        select(ResultBatch).where(ResultBatch.job_id == job_id).order_by(ResultBatch.created_at)
    )
    batches = result.scalars().all()
    return {"job_id": job_id, "batches": batches, "total_results": sum(b.result_count for b in batches)}
