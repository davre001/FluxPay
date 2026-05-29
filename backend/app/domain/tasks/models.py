import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class TaskStatus(str, enum.Enum):
    pending = "pending"
    claimed = "claimed"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    timeout = "timeout"
    skipped = "skipped"


class MicroTask(Base):
    __tablename__ = "micro_tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_index: Mapped[int] = mapped_column(nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    source_connector: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    output_schema: Mapped[dict] = mapped_column(JSONB, default=dict)
    base_reward_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    difficulty_multiplier: Mapped[float] = mapped_column(Numeric(4, 2), default=1.0)
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), default=TaskStatus.pending, index=True
    )
    assigned_worker_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id"), nullable=True
    )
    max_retries: Mapped[int] = mapped_column(default=3)
    retry_count: Mapped[int] = mapped_column(default=0)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    job: Mapped["DataJob"] = relationship("DataJob", back_populates="tasks")  # noqa: F821
    attempts: Mapped[list["TaskAttempt"]] = relationship("TaskAttempt", back_populates="task")
    assigned_worker: Mapped["WorkerProfile | None"] = relationship(  # noqa: F821
        "WorkerProfile", back_populates="assigned_tasks"
    )
    raw_results: Mapped[list["RawResult"]] = relationship("RawResult", back_populates="task")  # noqa: F821


class TaskAttempt(Base):
    __tablename__ = "task_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("micro_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id"), nullable=False
    )
    attempt_number: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(nullable=True)

    task: Mapped["MicroTask"] = relationship("MicroTask", back_populates="attempts")
    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", back_populates="attempts")  # noqa: F821


from app.domain.jobs.models import DataJob  # noqa: E402, F401
from app.domain.workers.models import WorkerProfile  # noqa: E402, F401
from app.domain.results.models import RawResult  # noqa: E402, F401
