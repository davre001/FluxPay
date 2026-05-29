import asyncio
import json
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.infrastructure.logging import get_logger
from app.infrastructure.redis_client import get_redis

router = APIRouter(tags=["websocket"])
logger = get_logger(__name__)

_connections: dict[str, list[WebSocket]] = {}


async def broadcast_job_event(job_id: str, event: dict) -> None:
    sockets = _connections.get(job_id, [])
    dead = []
    for ws in sockets:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            dead.append(ws)
    for ws in dead:
        sockets.remove(ws)


@router.websocket("/ws/jobs/{job_id}")
async def job_status_stream(websocket: WebSocket, job_id: uuid.UUID):
    job_str = str(job_id)
    await websocket.accept()
    _connections.setdefault(job_str, []).append(websocket)
    logger.info("ws_connected", job_id=job_str)

    try:
        r = await get_redis()
        last_id = "$"

        while True:
            messages = await r.xread(
                {f"notification.events": last_id}, count=10, block=1000
            )
            for _, entries in (messages or []):
                for msg_id, fields in entries:
                    last_id = msg_id
                    try:
                        payload = json.loads(fields.get("payload", "{}"))
                        if payload.get("job_id") == job_str:
                            await websocket.send_text(json.dumps(payload))
                    except Exception:
                        pass

            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
            except asyncio.TimeoutError:
                pass

    except WebSocketDisconnect:
        logger.info("ws_disconnected", job_id=job_str)
    finally:
        sockets = _connections.get(job_str, [])
        if websocket in sockets:
            sockets.remove(websocket)
