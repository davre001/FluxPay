import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.tasks.models import TaskStatus


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    task_index: int
    source_url: str
    source_connector: str
    payload: dict
    output_schema: dict
    base_reward_usdc: float
    difficulty_multiplier: float
    status: TaskStatus
    assigned_worker_id: uuid.UUID | None
    max_retries: int
    retry_count: int
    deadline: datetime | None
    created_at: datetime
    updated_at: datetime


class TaskClaimRequest(BaseModel):
    worker_id: uuid.UUID


class TaskResultSubmit(BaseModel):
    worker_id: uuid.UUID
    data: dict = Field(..., min_length=1)
    source_url: str
    collected_at: datetime
    method: str = Field(..., max_length=50)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class TaskAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    task_id: uuid.UUID
    worker_id: uuid.UUID
    attempt_number: int
    status: TaskStatus
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None
    duration_ms: int | None
