import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    needs_review = "needs_review"


class RawResult(Base):
    __tablename__ = "raw_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("micro_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id"), nullable=False
    )
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.pending, index=True
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    task: Mapped["MicroTask"] = relationship("MicroTask", back_populates="raw_results")  # noqa: F821
    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile")  # noqa: F821
    verified_result: Mapped["VerifiedResult | None"] = relationship(
        "VerifiedResult", back_populates="raw_result", uselist=False
    )


class VerifiedResult(Base):
    __tablename__ = "verified_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    raw_result_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("raw_results.id", ondelete="CASCADE"), unique=True
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("result_batches.id"), nullable=True, index=True
    )
    normalized_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    quality_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    freshness_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_notes: Mapped[str] = mapped_column(Text, default="")
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    raw_result: Mapped["RawResult"] = relationship("RawResult", back_populates="verified_result")
    batch: Mapped["ResultBatch | None"] = relationship("ResultBatch", back_populates="results")


class ResultBatch(Base):
    __tablename__ = "result_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    batch_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    result_count: Mapped[int] = mapped_column(nullable=False)
    total_payout_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    job: Mapped["DataJob"] = relationship("DataJob", back_populates="result_batches")  # noqa: F821
    results: Mapped[list["VerifiedResult"]] = relationship("VerifiedResult", back_populates="batch")
    payout: Mapped["Payout | None"] = relationship("Payout", back_populates="result_batch", uselist=False)  # noqa: F821


from app.domain.tasks.models import MicroTask  # noqa: E402, F401
from app.domain.workers.models import WorkerProfile  # noqa: E402, F401
from app.domain.jobs.models import DataJob  # noqa: E402, F401
from app.domain.payments.models import Payout  # noqa: E402, F401
