import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.payments.models import EscrowStatus, PayoutStatus


class EscrowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    chain_id: int
    escrow_address: str | None
    usdc_token_address: str
    requester_address: str
    coordinator_address: str
    funded_amount_usdc: float
    remaining_amount_usdc: float
    funding_tx_hash: str | None
    manifest_hash: str | None
    status: EscrowStatus
    created_at: datetime
    funded_at: datetime | None


class PayoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    escrow_id: uuid.UUID
    worker_id: uuid.UUID
    result_batch_id: uuid.UUID | None
    amount_usdc: float
    quality_score: float
    tx_hash: str | None
    status: PayoutStatus
    created_at: datetime
    confirmed_at: datetime | None


class EscrowEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    escrow_id: uuid.UUID
    event_name: str
    tx_hash: str
    block_number: int
    log_index: int
    event_data: dict
    indexed_at: datetime
