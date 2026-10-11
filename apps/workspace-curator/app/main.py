"""WorkspaceCurator Pro - FastAPI Main Application & API Router."""

import asyncio
import json
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException, Query, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    PORT, HOST, DEBUG,
    WORKSPACE_WEBHOOK_SECRET, REQUIRE_AUTH,
    OUTBOUND_WEBHOOK_URL, OUTBOUND_WEBHOOK_ENABLED
)
from app.models import (
    WorkspaceProduct, UrgencyLevel, CuratedItem,
    SimulationRequest, ForwarderConfig
)
from app.database import db
from app.ingestion.verifier import WebhookVerifier
from app.ingestion.parser import WorkspacePayloadParser
from app.analyzer.engine import analyzer
from app.curation.forwarder import forwarder


app = FastAPI(
    title="WorkspaceCurator Pro",
    description="Intelligent Google Workspace Webhook Ingestion, Content Analysis & Universal Curation Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & templates directory
STATIC_DIR = Path(__file__).resolve().parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# In-memory SSE subscribers
_sse_subscribers: List[asyncio.Queue] = []


async def notify_sse_subscribers(item: CuratedItem):
    """Broadcast newly curated item to all active SSE browser connections."""
    data_dict = item.model_dump() if hasattr(item, "model_dump") else item.dict()
    msg = f"data: {json.dumps(data_dict)}\n\n"
    for queue in list(_sse_subscribers):
        try:
            await queue.put(msg)
        except Exception:
            _sse_subscribers.remove(queue)


# -------------------------------------------------------------
# Webhook Ingestion Pipeline
# -------------------------------------------------------------

async def process_inbound_webhook(request: Request, default_product: Optional[WorkspaceProduct] = None) -> CuratedItem:
    headers = dict(request.headers)
    is_valid, reason = WebhookVerifier.verify_headers(headers)
    if not is_valid:
        raise HTTPException(status_code=401, detail=reason or "Unauthorized webhook")

    # Read payload (can be JSON or plain text)
    body: Any = {}
    content_type = headers.get("content-type", "").lower()
    raw_bytes = await request.body()

    if raw_bytes:
        try:
            body = json.loads(raw_bytes.decode("utf-8"))
        except Exception:
            body = raw_bytes.decode("utf-8", errors="ignore")

    # Parse payload
    product, title, sender, content, url, metadata = WorkspacePayloadParser.parse(headers, body)
    if default_product and product == WorkspaceProduct.OTHER:
        product = default_product

    # Run Analysis & Curation Pipeline
    curated_item = analyzer.analyze(
        product=product,
        title=title,
        sender=sender,
        raw_content=content,
        url=url,
        metadata=metadata
    )

    # Persist in Database
    db.save_item(curated_item)

    # Dispatch via Outbound Forwarder if configured
    if db.get_setting("forwarder_enabled", str(OUTBOUND_WEBHOOK_ENABLED)).lower() in ("true", "1"):
        fw_url = db.get_setting("forwarder_url", OUTBOUND_WEBHOOK_URL)
        if fw_url:
            asyncio.create_task(asyncio.to_thread(forwarder.forward, curated_item, fw_url))

    # Notify live browser clients via SSE
    asyncio.create_task(notify_sse_subscribers(curated_item))

    return curated_item


@app.post("/api/v1/webhook/google", summary="Universal Google Workspace Webhook Receiver")
async def google_webhook_handler(request: Request):
    """
    Primary endpoint for Google Drive push notifications, Cloud Pub/Sub,
    Google Forms, Google Calendar, and Apps Script triggers.
    """
    # Acknowledge Google handshake immediately if state is sync
    if request.headers.get("x-goog-resource-state") == "sync":
        return Response(content="Google push channel sync acknowledged", media_type="text/plain", status_code=200)

    curated = await process_inbound_webhook(request)
    return {
        "status": "processed",
        "curated_id": curated.id,
        "title": curated.source_title,
        "product": curated.product.value,
        "urgency": curated.urgency.value,
        "summary": curated.summary
    }


@app.post("/api/v1/webhook/drive", summary="Google Drive Watch Push Receiver")
async def drive_webhook(request: Request):
    if request.headers.get("x-goog-resource-state") == "sync":
        return Response(content="Drive sync acknowledged", media_type="text/plain", status_code=200)
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.DRIVE)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


@app.post("/api/v1/webhook/gmail", summary="Gmail Cloud Pub/Sub Push Receiver")
async def gmail_webhook(request: Request):
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.GMAIL)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


@app.post("/api/v1/webhook/docs", summary="Google Docs Webhook Receiver")
async def docs_webhook(request: Request):
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.DOCS)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


@app.post("/api/v1/webhook/sheets", summary="Google Sheets Webhook Receiver")
async def sheets_webhook(request: Request):
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.SHEETS)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


@app.post("/api/v1/webhook/forms", summary="Google Forms Webhook Receiver")
async def forms_webhook(request: Request):
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.FORMS)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


@app.post("/api/v1/webhook/calendar", summary="Google Calendar Watch Push Receiver")
async def calendar_webhook(request: Request):
    if request.headers.get("x-goog-resource-state") == "sync":
        return Response(content="Calendar sync acknowledged", media_type="text/plain", status_code=200)
    curated = await process_inbound_webhook(request, default_product=WorkspaceProduct.CALENDAR)
    return {"status": "processed", "id": curated.id, "product": curated.product.value}


# -------------------------------------------------------------
# Simulation & Test Studio
# -------------------------------------------------------------

@app.post("/api/v1/simulate", summary="Simulate Inbound Google Workspace Webhook")
async def simulate_webhook(sim: SimulationRequest):
    """Simulate a realistic Google Workspace event and run it through the curation pipeline."""
    curated_item = analyzer.analyze(
        product=sim.product,
        title=sim.source_title,
        sender=sim.source_sender or "alex@enterprise.com",
        raw_content=sim.content,
        url=sim.source_url,
        metadata={"simulation": True, **(sim.metadata or {})}
    )
    db.save_item(curated_item)

    # Forward if enabled
    if db.get_setting("forwarder_enabled", str(OUTBOUND_WEBHOOK_ENABLED)).lower() in ("true", "1"):
        fw_url = db.get_setting("forwarder_url", OUTBOUND_WEBHOOK_URL)
        if fw_url:
            asyncio.create_task(asyncio.to_thread(forwarder.forward, curated_item, fw_url))

    asyncio.create_task(notify_sse_subscribers(curated_item))
    return curated_item


# -------------------------------------------------------------
# Curation Discovery & Inspection API
# -------------------------------------------------------------

@app.get("/api/v1/curated", summary="List Curated Workspace Items")
def list_curated(
    product: Optional[WorkspaceProduct] = None,
    urgency: Optional[UrgencyLevel] = None,
    tag: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    items = db.list_items(product=product, urgency=urgency, tag=tag, query=query, limit=limit, offset=offset)
    return {"total": len(items), "items": items}


@app.get("/api/v1/curated/{item_id}", summary="Get Single Curated Item")
def get_curated_item(item_id: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Curated item not found")
    return item


@app.patch("/api/v1/curated/{item_id}/action/{action_id}", summary="Toggle Action Item Status")
def toggle_action_item(item_id: str, action_id: str, completed: bool = Query(...)):
    item = db.update_action_item_status(item_id, action_id, completed)
    if not item:
        raise HTTPException(status_code=404, detail="Item or action not found")
    return {"status": "updated", "item": item}


@app.delete("/api/v1/curated/{item_id}", summary="Delete Curated Item")
def delete_curated_item(item_id: str):
    deleted = db.delete_item(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Curated item not found")
    return {"status": "deleted", "id": item_id}


@app.get("/api/v1/curated/{item_id}/export/{fmt}", summary="Export Curated Item Format")
def export_format(item_id: str, fmt: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    fmt_lower = fmt.lower()
    if fmt_lower in ("md", "markdown"):
        return PlainTextResponse(item.formats.get("markdown", item.summary), media_type="text/markdown")
    elif fmt_lower in ("slack", "txt"):
        return PlainTextResponse(item.formats.get("slack", item.summary), media_type="text/plain")
    elif fmt_lower in ("email", "mail"):
        return PlainTextResponse(item.formats.get("email", item.summary), media_type="text/plain")
    elif fmt_lower in ("json", "json_ld"):
        return JSONResponse(content=json.loads(item.formats.get("json_ld", "{}")))
    else:
        raise HTTPException(status_code=400, detail="Supported export formats: markdown, slack, email, json")


@app.get("/api/v1/stats", summary="Get Workspace Curation Metrics")
def get_metrics():
    return db.get_stats()


# -------------------------------------------------------------
# RSS / Atom Feed for Universal Usability
# -------------------------------------------------------------

@app.get("/api/v1/feed.rss", summary="RSS Feed of Curated Workspace Intelligence")
def rss_feed():
    items = db.list_items(limit=25)
    xml_items = []
    for it in items:
        urgency_badge = it.urgency.value.upper()
        xml_items.append(f"""
        <item>
            <title><![CDATA[[{it.product.value.upper()} | {urgency_badge}] {it.source_title}]]></title>
            <link>{it.source_url or 'http://localhost:' + str(PORT)}</link>
            <guid>{it.id}</guid>
            <pubDate>{it.received_at}</pubDate>
            <description><![CDATA[
                <p><strong>Executive TL;DR:</strong> {it.summary}</p>
                <p><strong>Urgency:</strong> {urgency_badge} ({it.urgency_score}/100) | <strong>Sender:</strong> {it.source_sender}</p>
                <p><strong>Tags:</strong> {', '.join(it.tags)}</p>
            ]]></description>
        </item>
        """)

    rss_xml = f"""<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
    <channel>
        <title>WorkspaceCurator Pro - Curated Intelligence Feed</title>
        <link>http://localhost:{PORT}</link>
        <description>Automated AI-curated intelligence stream from Google Workspace products (Docs, Sheets, Drive, Gmail, Calendar, Forms)</description>
        <language>en-us</language>
        {''.join(xml_items)}
    </channel>
    </rss>
    """
    return Response(content=rss_xml.strip(), media_type="application/rss+xml")


# -------------------------------------------------------------
# Real-time Server Sent Events (SSE)
# -------------------------------------------------------------

@app.get("/api/v1/events/stream", summary="Live SSE Stream for Dashboard")
async def sse_event_stream(request: Request):
    queue: asyncio.Queue = asyncio.Queue()
    _sse_subscribers.append(queue)

    async def event_generator():
        try:
            # Send initial ping
            yield "event: connected\ndata: {}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield data
                except asyncio.TimeoutError:
                    # Heartbeat
                    yield ": ping\n\n"
        finally:
            if queue in _sse_subscribers:
                _sse_subscribers.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# -------------------------------------------------------------
# Settings & Forwarder Management
# -------------------------------------------------------------

@app.get("/api/v1/settings", summary="Get Forwarder Configuration")
def get_settings():
    return {
        "forwarder_url": db.get_setting("forwarder_url", OUTBOUND_WEBHOOK_URL),
        "forwarder_enabled": db.get_setting("forwarder_enabled", str(OUTBOUND_WEBHOOK_ENABLED)).lower() in ("true", "1"),
        "webhook_endpoint": f"http://localhost:{PORT}/api/v1/webhook/google",
        "rss_url": f"http://localhost:{PORT}/api/v1/feed.rss",
        "require_auth": REQUIRE_AUTH
    }


@app.post("/api/v1/settings", summary="Update Forwarder Settings")
def save_settings(config: ForwarderConfig):
    db.set_setting("forwarder_url", config.webhook_url)
    db.set_setting("forwarder_enabled", "true" if config.enabled else "false")
    return {"status": "saved", "config": config}


@app.post("/api/v1/forward/{item_id}", summary="Manually Trigger Webhook Forwarding")
def manual_forward(item_id: str):
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    fw_url = db.get_setting("forwarder_url", OUTBOUND_WEBHOOK_URL)
    result = forwarder.forward(item, target_url=fw_url)
    return {"status": "forwarded", "result": result}


# -------------------------------------------------------------
# Root Web Dashboard
# -------------------------------------------------------------

@app.get("/", response_class=HTMLResponse, summary="WorkspaceCurator Pro Dashboard")
def serve_dashboard():
    index_file = STATIC_DIR / "index.html"
    if not index_file.exists():
        return HTMLResponse("<h1>WorkspaceCurator Pro</h1><p>Building UI...</p>")
    return HTMLResponse(index_file.read_text(encoding="utf-8"))


def start():
    """Start uvicorn server."""
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)


if __name__ == "__main__":
    start()
