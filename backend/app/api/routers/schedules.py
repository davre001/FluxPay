import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.domain.shared.models import User
from app.domain.templates import service as tmpl_service
from app.domain.templates.scheduler import _sync_schedules
from app.domain.templates.schemas import JobScheduleCreate, JobScheduleResponse
from app.infrastructure.db import get_db

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.post("", response_model=JobScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    data: JobScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        schedule = await tmpl_service.create_schedule(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    # Sync so the new schedule fires immediately without waiting 10 minutes
    await _sync_schedules()
    return schedule


@router.get("", response_model=list[JobScheduleResponse])
async def list_schedules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await tmpl_service.list_schedules(db, current_user.id)


@router.post("/{schedule_id}/pause", response_model=JobScheduleResponse)
async def pause_schedule(
    schedule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        schedule = await tmpl_service.pause_schedule(db, schedule_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    await _sync_schedules()
    return schedule


@router.post("/{schedule_id}/resume", response_model=JobScheduleResponse)
async def resume_schedule(
    schedule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        schedule = await tmpl_service.resume_schedule(db, schedule_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    await _sync_schedules()
    return schedule


@router.get("/{schedule_id}", response_model=JobScheduleResponse)
async def get_schedule(
    schedule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedules = await tmpl_service.list_schedules(db, current_user.id)
    match = next((s for s in schedules if s.id == schedule_id), None)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return match
