import csv
import io
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user
from app.domain.jobs.models import DataJob
from app.domain.jobs.service import get_job
from app.domain.results.models import RawResult, ResultBatch, VerifiedResult
from app.domain.results.verifier import verify_raw_result
from app.domain.shared.models import User
from app.domain.tasks.models import MicroTask
from app.infrastructure.db import get_db

router = APIRouter(prefix="/results", tags=["results"])


async def _get_verified_items(db: AsyncSession, job_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(VerifiedResult)
        .join(RawResult, VerifiedResult.raw_result_id == RawResult.id)
        .join(MicroTask, RawResult.task_id == MicroTask.id)
        .where(MicroTask.job_id == job_id, VerifiedResult.is_duplicate.is_(False))
        .order_by(VerifiedResult.verified_at)
    )
    return result.scalars().all()


@router.get("/jobs/{job_id}/export/json")
async def export_json(
    job_id: uuid.UUID,
    include_proof: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job or job.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    items = await _get_verified_items(db, job_id)
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No verified results yet")

    rows = []
    for vr in items:
        row = dict(vr.normalized_data)
        if include_proof:
            row["_meta"] = {
                "quality_score": float(vr.quality_score),
                "freshness_score": float(vr.freshness_score),
                "confidence_score": float(vr.confidence_score),
                "verified_at": vr.verified_at.isoformat(),
            }
        # Flatten items array if present
        if "items" in row and isinstance(row["items"], list):
            rows.extend(row["items"])
        else:
            rows.append(row)

    export = {
        "job_id": str(job_id),
        "job_title": job.title,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_rows": len(rows),
        "data": rows,
    }

    content = json.dumps(export, indent=2, default=str)
    filename = f"fluxpay_{job_id}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.json"
    return StreamingResponse(
        io.StringIO(content),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/jobs/{job_id}/export/csv")
async def export_csv(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job or job.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    items = await _get_verified_items(db, job_id)
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No verified results yet")

    # Flatten all rows first
    rows = []
    for vr in items:
        data = dict(vr.normalized_data)
        if "items" in data and isinstance(data["items"], list):
            for item in data["items"]:
                item["_quality_score"] = float(vr.quality_score)
                item["_verified_at"] = vr.verified_at.isoformat()
                rows.append(item)
        else:
            data["_quality_score"] = float(vr.quality_score)
            data["_verified_at"] = vr.verified_at.isoformat()
            rows.append(data)

    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No data rows found")

    # Collect all column names preserving order
    cols_seen: dict[str, None] = {}
    for row in rows:
        for k in row:
            cols_seen[k] = None
    fieldnames = list(cols_seen.keys())

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)

    filename = f"fluxpay_{job_id}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/jobs/{job_id}/summary")
async def results_summary(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = await get_job(db, job_id)
    if not job or job.requester_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    items = await _get_verified_items(db, job_id)

    # Batch stats
    batches_result = await db.execute(
        select(ResultBatch).where(ResultBatch.job_id == job_id)
    )
    batches = batches_result.scalars().all()

    total_rows = sum(
        len(vr.normalized_data.get("items", [vr.normalized_data])) for vr in items
    )
    avg_quality = (
        sum(float(vr.quality_score) for vr in items) / len(items) if items else 0
    )
    avg_confidence = (
        sum(float(vr.confidence_score) for vr in items) / len(items) if items else 0
    )

    return {
        "job_id": str(job_id),
        "job_title": job.title,
        "job_status": job.status,
        "verified_result_count": len(items),
        "total_data_rows": total_rows,
        "average_quality_score": round(avg_quality, 4),
        "average_confidence_score": round(avg_confidence, 4),
        "batch_count": len(batches),
        "total_payout_usdc": sum(float(b.total_payout_usdc) for b in batches),
        "export_json": f"/api/results/jobs/{job_id}/export/json",
        "export_csv": f"/api/results/jobs/{job_id}/export/csv",
    }


@router.post("/jobs/{job_id}/verify-pending")
async def trigger_verification(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger verification on any pending raw results for a job (admin/debug use)."""
    pending_result = await db.execute(
        select(RawResult)
        .join(MicroTask, RawResult.task_id == MicroTask.id)
        .where(
            MicroTask.job_id == job_id,
            RawResult.verification_status == "pending",
        )
    )
    pending = pending_result.scalars().all()

    verified_count = 0
    for raw in pending:
        vr = await verify_raw_result(db, raw.id)
        if vr:
            verified_count += 1

    await db.commit()
    return {"triggered": len(pending), "verified": verified_count}
