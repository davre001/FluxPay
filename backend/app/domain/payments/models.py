import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class EscrowStatus(str, enum.Enum):
    pending = "pending"
    funded = "funded"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"


class PayoutStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    confirmed = "confirmed"
    failed = "failed"


class Escrow(Base):
    __tablename__ = "escrows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("data_jobs.id", ondelete="RESTRICT"), unique=True
    )
    chain_id: Mapped[int] = mapped_column(nullable=False, default=2910)
    escrow_address: Mapped[str | None] = mapped_column(String(42), nullable=True, index=True)
    usdc_token_address: Mapped[str] = mapped_column(String(42), nullable=False)
    requester_address: Mapped[str] = mapped_column(String(42), nullable=False)
    coordinator_address: Mapped[str] = mapped_column(String(42), nullable=False)
    funded_amount_usdc: Mapped[float] = mapped_column(Numeric(18, 6), default=0.0)
    remaining_amount_usdc: Mapped[float] = mapped_column(Numeric(18, 6), default=0.0)
    funding_tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    manifest_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    status: Mapped[EscrowStatus] = mapped_column(
        Enum(EscrowStatus), default=EscrowStatus.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    funded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    job: Mapped["DataJob"] = relationship("DataJob", back_populates="escrow")  # noqa: F821
    payouts: Mapped[list["Payout"]] = relationship("Payout", back_populates="escrow")
    events: Mapped[list["EscrowEvent"]] = relationship("EscrowEvent", back_populates="escrow")


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("escrows.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("worker_profiles.id"), nullable=False
    )
    result_batch_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("result_batches.id"), nullable=True
    )
    amount_usdc: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    quality_score: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    status: Mapped[PayoutStatus] = mapped_column(
        Enum(PayoutStatus), default=PayoutStatus.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    escrow: Mapped["Escrow"] = relationship("Escrow", back_populates="payouts")
    worker: Mapped["WorkerProfile"] = relationship("WorkerProfile", back_populates="payouts")  # noqa: F821
    result_batch: Mapped["ResultBatch | None"] = relationship(  # noqa: F821
        "ResultBatch", back_populates="payout"
    )


class EscrowEvent(Base):
    __tablename__ = "escrow_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("escrows.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tx_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    block_number: Mapped[int] = mapped_column(nullable=False)
    log_index: Mapped[int] = mapped_column(nullable=False)
    event_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    indexed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    escrow: Mapped["Escrow"] = relationship("Escrow", back_populates="events")


from app.domain.jobs.models import DataJob  # noqa: E402, F401
from app.domain.workers.models import WorkerProfile  # noqa: E402, F401
from app.domain.results.models import ResultBatch  # noqa: E402, F401
