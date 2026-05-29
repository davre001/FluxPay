"""
Webhook endpoint for indexing on-chain escrow events.
Call this from an off-chain event listener (e.g. a simple poller or
a service like Alchemy Notify / Morph event stream).
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.domain.payments.models import Escrow, EscrowEvent, EscrowStatus, Payout, PayoutStatus
from app.infrastructure.db import get_db
from app.infrastructure.logging import get_logger

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = get_logger(__name__)


class EscrowEventPayload(BaseModel):
    escrow_address: str
    event_name: str
    tx_hash: str
    block_number: int
    log_index: int
    event_data: dict


def _verify_webhook_secret(x_webhook_secret: str | None = Header(None)) -> None:
    expected = settings.secret_key
    if x_webhook_secret != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret")


@router.post("/escrow-event", status_code=status.HTTP_201_CREATED)
async def index_escrow_event(
    payload: EscrowEventPayload,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(_verify_webhook_secret),
):
    # Find escrow by address
    result = await db.execute(
        select(Escrow).where(Escrow.escrow_address == payload.escrow_address)
    )
    escrow = result.scalar_one_or_none()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow not found")

    # Deduplicate
    existing = await db.execute(
        select(EscrowEvent).where(
            EscrowEvent.tx_hash == payload.tx_hash,
            EscrowEvent.log_index == payload.log_index,
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "duplicate", "skipped": True}

    event = EscrowEvent(
        escrow_id=escrow.id,
        event_name=payload.event_name,
        tx_hash=payload.tx_hash,
        block_number=payload.block_number,
        log_index=payload.log_index,
        event_data=payload.event_data,
    )
    db.add(event)

    # Update escrow state based on event
    if payload.event_name == "JobFunded":
        escrow.status = EscrowStatus.funded
        escrow.funded_at = datetime.now(timezone.utc)
        amount = payload.event_data.get("amount", 0)
        escrow.funded_amount_usdc = int(amount) / 1_000_000
        escrow.remaining_amount_usdc = escrow.funded_amount_usdc

    elif payload.event_name == "ManifestAttached":
        escrow.status = EscrowStatus.active
        escrow.manifest_hash = payload.event_data.get("manifestHash")

    elif payload.event_name == "WorkerPaid":
        worker_addr = payload.event_data.get("worker", "").lower()
        amount_units = int(payload.event_data.get("amount", 0))
        amount_usdc = amount_units / 1_000_000

        payout_result = await db.execute(
            select(Payout)
            .join(Escrow)
            .where(
                Escrow.escrow_address == payload.escrow_address,
                Payout.tx_hash == payload.tx_hash,
                Payout.status == PayoutStatus.submitted,
            )
        )
        payout = payout_result.scalars().first()
        if payout:
            payout.status = PayoutStatus.confirmed
            payout.confirmed_at = datetime.now(timezone.utc)

    elif payload.event_name in ("JobCancelled", "RequesterRefunded"):
        escrow.status = EscrowStatus.cancelled if payload.event_name == "JobCancelled" else EscrowStatus.refunded

    await db.flush()
    logger.info("escrow_event_indexed", event=payload.event_name, tx=payload.tx_hash)
    return {"status": "indexed", "event": payload.event_name}
