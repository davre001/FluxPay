import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.results.models import VerificationStatus


class RawResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    worker_id: uuid.UUID
    data: dict
    source_url: str
    collected_at: datetime
    method: str
    confidence: float
    verification_status: VerificationStatus
    submitted_at: datetime


class VerifiedResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    raw_result_id: uuid.UUID
    batch_id: uuid.UUID | None
    normalized_data: dict
    quality_score: float
    freshness_score: float
    confidence_score: float
    is_duplicate: bool
    verification_notes: str
    verified_at: datetime


class ResultBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    batch_hash: str
    result_count: int
    total_payout_usdc: float
    is_paid: bool
    created_at: datetime
    results: list[VerifiedResultResponse] = []


class JobResultsResponse(BaseModel):
    job_id: uuid.UUID
    total_results: int
    batches: list[ResultBatchResponse]
    export_url: str | None = None
