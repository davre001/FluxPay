import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class JobStatus(str, enum.Enum):
    draft = "draft"
    quoted = "quoted"
    funding_pending = "funding_pending"
    funded = "funded"
    planning = "planning"
    running = "running"
    verifying = "verifying"
    paying = "paying"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


class JobFreshness(str, enum.Enum):
    once = "once"
    daily = "daily"
    weekly = "weekly"


class DataJob(Base):
    __tablename__ = "data_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    output_schema: Mapped[dict] = mapped_column(JSONB, default=dict)
    freshness: Mapped[JobFreshness] = mapped_column(Enum(JobFreshness), default=JobFreshness.once)
    max_rows: Mapped[int] = mapped_column(default=100)
    budget_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), default=JobStatus.draft, index=True
    )
    compliance_accepted: Mapped[bool] = mapped_column(default=False)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    requester: Mapped["User"] = relationship("User", back_populates="jobs")  # noqa: F821
    quote: Mapped["JobQuote | None"] = relationship("JobQuote", back_populates="job", uselist=False)
    manifest: Mapped["JobManifest | None"] = relationship(
        "JobManifest", back_populates="job", uselist=False
    )
    tasks: Mapped[list["MicroTask"]] = relationship("MicroTask", back_populates="job")  # noqa: F821
    escrow: Mapped["Escrow | None"] = relationship("Escrow", back_populates="job", uselist=False)  # noqa: F821
    result_batches: Mapped[list["ResultBatch"]] = relationship("ResultBatch", back_populates="job")  # noqa: F821


class JobQuote(Base):
    __tablename__ = "job_quotes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_jobs.id", ondelete="CASCADE"), unique=True
    )
    estimated_rows: Mapped[int] = mapped_column(nullable=False)
    task_count: Mapped[int] = mapped_column(nullable=False)
    worker_rewards_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    verifier_cost_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    infrastructure_cost_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    chain_cost_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    platform_fee_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    total_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    job: Mapped["DataJob"] = relationship("DataJob", back_populates="quote")


class JobManifest(Base):
    __tablename__ = "job_manifests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_jobs.id", ondelete="CASCADE"), unique=True
    )
    scope: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    output_schema: Mapped[dict] = mapped_column(JSONB, nullable=False)
    manifest_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job: Mapped["DataJob"] = relationship("DataJob", back_populates="manifest")


# Import after to avoid circular
from app.domain.shared.models import User  # noqa: E402, F401
from app.domain.tasks.models import MicroTask  # noqa: E402, F401
from app.domain.payments.models import Escrow  # noqa: E402, F401
from app.domain.results.models import ResultBatch  # noqa: E402, F401
