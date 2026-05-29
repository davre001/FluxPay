import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.templates.models import RequestStatus


class DatasetProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    category: str
    region: str
    source_type: str
    output_schema: dict
    default_freshness: str
    default_max_rows: int
    estimated_cost_usdc: float
    tags: list
    is_active: bool
    is_featured: bool
    launch_count: int
    created_at: datetime


class TemplateLaunchRequest(BaseModel):
    """Overrideable fields when launching a template as a job."""
    region: str | None = None
    max_rows: int | None = Field(default=None, ge=1, le=100_000)
    budget_usdc: float | None = Field(default=None, gt=0)
    freshness: str | None = None
    requester_wallet: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    compliance_accepted: bool = True


class CustomerRequestCreate(BaseModel):
    email: EmailStr
    name: str = ""
    description: str = Field(..., min_length=10)
    data_type: str = ""
    region: str = ""
    budget_usdc: float | None = Field(default=None, gt=0)
    frequency: str = "once"


class CustomerRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    description: str
    data_type: str
    region: str
    budget_usdc: float | None
    frequency: str
    status: RequestStatus
    created_at: datetime


class JobScheduleCreate(BaseModel):
    template_id: uuid.UUID | None = None
    job_config: dict
    freshness: str = Field(..., pattern=r"^(daily|weekly)$")


class JobScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    template_id: uuid.UUID | None
    job_config: dict
    cron_expression: str
    freshness: str
    is_active: bool
    next_run_at: datetime | None
    last_run_at: datetime | None
    last_job_id: uuid.UUID | None
    run_count: int
    created_at: datetime


class ScheduleRunHistoryItem(BaseModel):
    schedule_id: uuid.UUID
    job_id: uuid.UUID
    ran_at: datetime
    status: str
