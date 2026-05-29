import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class WorkerType(str, enum.Enum):
    agent = "agent"
    human = "human"


class WorkerStatus(str, enum.Enum):
    available = "available"
    busy = "busy"
    offline = "offline"
    suspended = "suspended"


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    worker_type: Mapped[WorkerType] = mapped_column(Enum(WorkerType), default=WorkerType.agent)
    wallet_address: Mapped[str] = mapped_column(String(42), nullable=False, index=True)
    allowed_task_types: Mapped[list] = mapped_column(JSONB, default=list)
    capacity: Mapped[int] = mapped_column(default=5)
    status: Mapped[WorkerStatus] = mapped_column(
        Enum(WorkerStatus), default=WorkerStatus.offline, index=True
    )
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    reputation: Mapped["WorkerReputation | None"] = relationship(
        "WorkerReputation", back_populates="worker", uselist=False
    )
    assigned_tasks: Mapped[list["MicroTask"]] = relationship(  # noqa: F821
        "MicroTask", back_populates="assigned_worker"
    )
    attempts: Mapped[list["TaskAttempt"]] = relationship(  # noqa: F821
        "TaskAttempt", back_populates="worker"
    )
    payouts: Mapped[list["Payout"]] = relationship("Payout", back_populates="worker")  # noqa: F821


class WorkerReputation(Base):
    __tablename__ = "worker_reputation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id", ondelete="CASCADE"), unique=True
    )
    overall_score: Mapped[float] = mapped_column(Numeric(5, 2), default=1.0)
    tasks_completed: Mapped[int] = mapped_column(default=0)
    tasks_failed: Mapped[int] = mapped_column(default=0)
    average_quality_score: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0)
    average_freshness_score: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0)
    total_earned_usdc: Mapped[float] = mapped_column(Numeric(18, 6), default=0.0)
    score_history: Mapped[list] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", back_populates="reputation")


from app.domain.tasks.models import MicroTask, TaskAttempt  # noqa: E402, F401
from app.domain.payments.models import Payout  # noqa: E402, F401
