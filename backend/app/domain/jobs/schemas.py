import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.jobs.models import JobFreshness, JobStatus


class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = ""
    category: str = Field(..., min_length=2, max_length=100)
    region: str = ""
    source_type: str = Field(..., min_length=2, max_length=50)
    output_schema: dict = Field(default_factory=dict)
    freshness: JobFreshness = JobFreshness.once
    max_rows: int = Field(default=100, ge=1, le=100_000)
    budget_usdc: float = Field(..., gt=0)
    compliance_accepted: bool = False
    deadline: datetime | None = None


class JobQuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    estimated_rows: int
    task_count: int
    worker_rewards_usdc: float
    verifier_cost_usdc: float
    infrastructure_cost_usdc: float
    chain_cost_usdc: float
    platform_fee_usdc: float
    total_usdc: float
    created_at: datetime
    expires_at: datetime


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester_id: uuid.UUID
    title: str
    description: str
    category: str
    region: str
    source_type: str
    output_schema: dict
    freshness: JobFreshness
    max_rows: int
    budget_usdc: float
    status: JobStatus
    compliance_accepted: bool
    deadline: datetime | None
    created_at: datetime
    updated_at: datetime
    quote: JobQuoteResponse | None = None


class JobListResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    page_size: int


class FundingConfirmation(BaseModel):
    tx_hash: str = Field(..., pattern=r"^0x[0-9a-fA-F]{64}$")
    escrow_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    funded_amount_usdc: float = Field(..., gt=0)
    requester_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")


class ManifestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    scope: dict
    source_rules: dict
    output_schema: dict
    manifest_hash: str
    created_at: datetime
