import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db import Base


class RequestStatus(str, enum.Enum):
    pending  = "pending"
    reviewed = "reviewed"
    accepted = "accepted"
    rejected = "rejected"


class DatasetProduct(Base):
    """A reusable, pre-configured data job template customers can one-click launch."""
    __tablename__ = "dataset_products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(100), default="")
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    output_schema: Mapped[dict] = mapped_column(JSONB, default=dict)
    default_freshness: Mapped[str] = mapped_column(String(20), default="once")
    default_max_rows: Mapped[int] = mapped_column(default=100)
    estimated_cost_usdc: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    tags: Mapped[list] = mapped_column(JSONB, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    launch_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    schedules: Mapped[list["JobSchedule"]] = relationship("JobSchedule", back_populates="template")


class CustomerRequest(Base):
    """Market-discovery requests from prospective buyers before a product exists."""
    __tablename__ = "customer_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    data_type: Mapped[str] = mapped_column(String(100), default="")
    region: Mapped[str] = mapped_column(String(100), default="")
    budget_usdc: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    frequency: Mapped[str] = mapped_column(String(50), default="once")
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus), default=RequestStatus.pending, index=True
    )
    admin_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class JobSchedule(Base):
    """Ties a recurring job config to a user + optional template."""
    __tablename__ = "job_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset_products.id"), nullable=True
    )
    # Snapshot of job config at schedule creation time
    job_config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # APScheduler cron fields
    cron_expression: Mapped[str] = mapped_column(String(100), nullable=False)
    freshness: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    # Tracking
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_job_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    run_count: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    template: Mapped["DatasetProduct | None"] = relationship("DatasetProduct", back_populates="schedules")
