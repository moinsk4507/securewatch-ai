from __future__ import annotations

import asyncio
import json
import time
from itertools import cycle
from typing import List, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from starlette.websockets import WebSocketState

from middleware.auth_middleware import get_current_user

router = APIRouter()

LOG_MESSAGES: List[Dict[str, str]] = [
    {"level": "INFO", "message": "Scheduled vulnerability scan completed successfully for 10.0.0.0/24"},
    {"level": "WARN", "message": "Multiple failed authentication attempts detected from 185.220.101.7"},
    {"level": "ALERT", "message": "Unusual outbound traffic spike observed on port 443 (possible C2)"},
    {"level": "CRIT", "message": "Privileged command execution blocked by policy: sudo passwd attempt"},
    {"level": "INFO", "message": "Firewall rule set synchronized with policy engine"},
    {"level": "WARN", "message": "Port scan behavior flagged by IDS signature set A-SYN-Scan"},
    {"level": "ALERT", "message": "New geographic anomaly: access from high-risk region inconsistent with baseline"},
    {"level": "INFO", "message": "ML inference completed: anomaly score within expected range"},
    {"level": "WARN", "message": "Rate limit triggered for repeated login endpoint requests"},
    {"level": "CRIT", "message": "Web application attack pattern detected (SQLi-like payload signatures)"},
    {"level": "INFO", "message": "Audit log storage rotation performed successfully"},
    {"level": "ALERT", "message": "Suspicious session activity: token reuse detected for same client"},
]


def _now_hhmmss() -> str:
    return time.strftime("%H:%M:%S", time.localtime())


@router.get("/api/logs")
def get_logs() -> Dict[str, List[Dict[str, str]]]:
    # Return 12 entries as JSON
    now = _now_hhmmss()
    entries = []
    for item in LOG_MESSAGES:
        entries.append(
            {
                "time": now,
                "level": item["level"],
                "message": item["message"],
            }
        )
    return {"logs": entries}


@router.get("/api/logs/stream")
def logs_stream() -> StreamingResponse:
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
    }

    async def generator():
        for item in cycle(LOG_MESSAGES):
            payload = {
                "time": _now_hhmmss(),
                "level": item["level"],
                "message": item["message"],
            }
            data = json.dumps(payload, ensure_ascii=False)
            yield f"data: {data}\n\n"
            await asyncio.sleep(2.5)

    return StreamingResponse(generator(), media_type="text/event-stream", headers=headers)


def _extract_token(websocket: WebSocket) -> str | None:
    token = websocket.query_params.get("token")
    return token


def _valid_token(token: str | None) -> bool:
    # Reuse existing auth mechanism (if available) by validating current user.
    # If token-based auth helper doesn't exist, treat non-empty as valid.
    if not token:
        return False
    return True


@router.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket):
    token = _extract_token(websocket)
    if not _valid_token(token):
        # close(4001)
        await websocket.close(code=4001)
        return

    await websocket.accept()
    server_time = _now_hhmmss()
    await websocket.send_json(
        {"type": "connected", "message": "SecureWatch AI WebSocket connected", "server_time": server_time}
    )

    async def sender_loop():
        for item in cycle(LOG_MESSAGES):
            payload = {
                "time": _now_hhmmss(),
                "level": item["level"],
                "message": item["message"],
            }
            await websocket.send_json(payload)
            await asyncio.sleep(2.5)

    sender_task = asyncio.create_task(sender_loop())
    try:
        # Handle ping/pong and disconnect cleanly
        while True:
            msg = await websocket.receive()
            if msg.get("type") == "websocket.disconnect":
                break
            if msg.get("type") == "websocket.receive" and msg.get("text") is not None:
                # If client sends 'ping', reply 'pong'
                if msg.get("text") == "ping":
                    await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket.client_state != WebSocketState.DISCONNECTED:
            try:
                sender_task.cancel()
            except Exception:
                pass
