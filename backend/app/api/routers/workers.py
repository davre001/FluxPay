import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.domain.shared.models import User
from app.domain.workers import registry
from app.domain.workers.models import WorkerStatus
from app.domain.workers.schemas import WorkerHeartbeat, WorkerRegister, WorkerResponse
from app.infrastructure.db import get_db

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("/register", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def register_worker(
    data: WorkerRegister,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        worker = await registry.register_worker(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return worker


@router.post("/heartbeat", response_model=WorkerResponse)
async def heartbeat(
    data: WorkerHeartbeat,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        worker = await registry.heartbeat(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return worker


@router.get("", response_model=list[WorkerResponse])
async def list_workers(
    status_filter: WorkerStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await registry.list_workers(db, status_filter, page, page_size)


@router.get("/{worker_id}", response_model=WorkerResponse)
async def get_worker(
    worker_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = await registry.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return worker
