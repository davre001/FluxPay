import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.workers.models import WorkerStatus, WorkerType


class WorkerRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    worker_type: WorkerType = WorkerType.agent
    wallet_address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    allowed_task_types: list[str] = Field(default_factory=list)
    capacity: int = Field(default=5, ge=1, le=100)


class WorkerHeartbeat(BaseModel):
    worker_id: uuid.UUID
    status: WorkerStatus = WorkerStatus.available
    current_load: int = Field(default=0, ge=0)


class WorkerReputationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    worker_id: uuid.UUID
    overall_score: float
    tasks_completed: int
    tasks_failed: int
    average_quality_score: float
    average_freshness_score: float
    total_earned_usdc: float
    updated_at: datetime


class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    worker_type: WorkerType
    wallet_address: str
    allowed_task_types: list
    capacity: int
    status: WorkerStatus
    last_heartbeat: datetime | None
    registered_at: datetime
    reputation: WorkerReputationResponse | None = None
