import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, require_admin
from app.domain.jobs.schemas import JobResponse
from app.domain.shared.models import User
from app.domain.templates import service as tmpl_service
from app.domain.templates.models import RequestStatus
from app.domain.templates.schemas import (
    CustomerRequestCreate,
    CustomerRequestResponse,
    DatasetProductResponse,
    TemplateLaunchRequest,
)
from app.infrastructure.db import get_db

router = APIRouter(prefix="/templates", tags=["templates"])


# ---------------------------------------------------------------------------
# Templates (data products)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[DatasetProductResponse])
async def list_templates(
    category: str | None = Query(None),
    featured: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await tmpl_service.list_templates(db, category, featured, page, page_size)


@router.get("/{template_id}", response_model=DatasetProductResponse)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    tmpl = await tmpl_service.get_template(db, template_id)
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return tmpl


@router.post("/{template_id}/launch", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def launch_template(
    template_id: uuid.UUID,
    data: TemplateLaunchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        job = await tmpl_service.launch_template(db, template_id, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return job


# ---------------------------------------------------------------------------
# Customer requests (market discovery — no auth required)
# ---------------------------------------------------------------------------

@router.post("/requests", response_model=CustomerRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_request(
    data: CustomerRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    req = await tmpl_service.submit_customer_request(db, data)
    return req


@router.get("/requests/all", response_model=list[CustomerRequestResponse])
async def list_requests(
    status_filter: RequestStatus | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return await tmpl_service.list_customer_requests(db, status_filter, page, page_size)
