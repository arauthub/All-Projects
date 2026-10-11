"""
app/main.py
FastAPI Web Application serving Multi-Agent Orchestrator API & Real-Time UI.
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.orchestrator import MultiAgentOrchestrator

APP_DIR = Path(__file__).parent
BASE_DIR = APP_DIR.parent

app = FastAPI(
    title="Google ADK Multi-Agent Orchestrator",
    description="Enterprise Multi-Agent Orchestration Framework with Zero-Config Local Reasoning, Vector RAG & Slide Deck Generator",
    version="1.0.0",
)

# CORS middleware for open accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static assets
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")

# Global Orchestrator Instance
orchestrator = MultiAgentOrchestrator()

class CreateMissionRequest(BaseModel):
    objective: str
    scenario_id: Optional[str] = None

class LLMConfigRequest(BaseModel):
    api_key: Optional[str] = None
    model: Optional[str] = "gemini-1.5-flash"

class VectorSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class ScrapeUrlRequest(BaseModel):
    url: str
    output_format: Optional[str] = "json"
    custom_schema: Optional[Dict[str, Any]] = None
    extraction_goal: Optional[str] = None

class AuditUrlRequest(BaseModel):
    url: str


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the single-page rich user interface."""
    template_path = APP_DIR / "templates" / "index.html"
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Template not found")
    return HTMLResponse(content=template_path.read_text(encoding="utf-8"))

@app.get("/api/status")
async def get_system_status():
    """Return system readiness, LLM mode, and vector store statistics."""
    return {
        "status": "healthy",
        "service": "Google ADK Multi-Agent Orchestrator",
        "mode": orchestrator.llm_adapter.mode,
        "model": orchestrator.llm_adapter.model,
        "agents_count": len(orchestrator.agents),
        "vector_store_stats": orchestrator.vector_store.get_stats(),
        "active_missions": len(orchestrator.missions),
    }

@app.get("/api/scenarios")
async def get_demo_scenarios():
    """Return pre-configured enterprise demo scenarios."""
    return {"scenarios": orchestrator.get_demo_scenarios()}

@app.get("/api/agents")
async def get_agents():
    """Return registered agent profiles and capabilities."""
    return {
        "agents": orchestrator.get_agent_specs(),
        "tools": orchestrator.tool_registry.get_tool_schemas(),
    }

@app.post("/api/missions")
async def create_mission(req: CreateMissionRequest):
    """Initialize a new mission."""
    if not req.objective.strip():
        raise HTTPException(status_code=400, detail="Objective cannot be empty.")
    memory = orchestrator.create_mission(objective=req.objective.strip())
    return {
        "mission_id": memory.mission_id,
        "objective": memory.objective,
        "status": memory.status,
    }

@app.get("/api/missions/{mission_id}")
async def get_mission_details(mission_id: str):
    """Retrieve full mission memory, messages, blackboard, and presentation."""
    memory = orchestrator.get_mission(mission_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Mission not found.")
    return memory.to_dict()

@app.get("/api/missions/{mission_id}/stream")
async def stream_mission_execution(mission_id: str):
    """Server-Sent Events (SSE) streaming endpoint for live multi-agent execution."""
    memory = orchestrator.get_mission(mission_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Mission not found.")

    async def event_generator():
        # Execute mission generator in thread-safe loop
        for event in orchestrator.execute_mission(mission_id):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.04)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@app.post("/api/vector-store/search")
async def search_vector_store(req: VectorSearchRequest):
    """Direct query interface for the vector store knowledge base."""
    results = orchestrator.vector_store.search(req.query, top_k=req.top_k or 3)
    return {
        "query": req.query,
        "total_results": len(results),
        "results": results,
    }

@app.post("/api/config/llm")
async def update_llm_config(req: LLMConfigRequest):
    """Update LLM settings or switch between Simulation Mode and Gemini Live."""
    orchestrator.llm_adapter.set_api_key(req.api_key)
    if req.model:
        orchestrator.llm_adapter.model = req.model
    return {
        "mode": orchestrator.llm_adapter.mode,
        "model": orchestrator.llm_adapter.model,
        "message": "Configuration updated successfully.",
    }

@app.post("/api/scraper/audit")
async def audit_target_url(req: AuditUrlRequest):
    """Perform preflight SSRF and security audit on target URL."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    audit_res = orchestrator.tool_registry.execute("url_security_audit", {"url": req.url.strip()})
    return audit_res.get("result", {})

@app.post("/api/scraper/scrape")
async def scrape_target_url(req: ScrapeUrlRequest):
    """Scrape and extract public website content into requested or standard format."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")

    exec_res = orchestrator.tool_registry.execute(
        "web_scraper_extract",
        {
            "url": req.url.strip(),
            "output_format": req.output_format or "json",
            "custom_schema": req.custom_schema,
            "extraction_goal": req.extraction_goal,
        }
    )

    result_data = exec_res.get("result", {})
    if not exec_res.get("success") or not result_data.get("success", False):
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": result_data.get("error") or exec_res.get("error", "Failed to scrape URL."),
                "security_audit": result_data.get("security_audit", {}),
            }
        )

    return result_data


@app.get("/api/scraper/formats")
async def get_supported_formats():
    """Return supported export formats and extraction capabilities."""
    return {
        "formats": [
            {
                "id": "json",
                "name": "Standard Structured JSON",
                "description": "Comprehensive document object including metadata, OpenGraph, JSON-LD, headings, paragraphs, tables, links, and stats.",
            },
            {
                "id": "markdown",
                "name": "GitHub-Flavored Markdown",
                "description": "Clean, formatted Markdown ready for LLM ingestion, documentation, or RAG embeddings.",
            },
            {
                "id": "summary",
                "name": "Executive Summary & Bullet Takeaways",
                "description": "Distilled executive summary with top 5 factual takeaways and core topic sections.",
            },
            {
                "id": "key_value",
                "name": "Key-Value Entities & Contacts",
                "description": "Normalized dictionary of detected emails, phone numbers, pricing, social channels, and canonical meta.",
            },
            {
                "id": "csv",
                "name": "Tabular Data (CSV)",
                "description": "Structured matrix extraction of all HTML tables found on the page.",
            },
            {
                "id": "custom",
                "name": "Custom Target JSON Schema",
                "description": "User-defined JSON schema mapping fields directly from page content.",
            },
        ],
        "security_features": [
            "Strict protocol enforcement (HTTP/HTTPS only)",
            "RFC1918 Private IP range blocking",
            "Cloud metadata (169.254.169.254) isolation",
            "Loopback & localhost exploit prevention",
            "Manual redirect hop validation (max 5 hops)",
            "Payload size capping (5MB stream cap)",
            "Anti-prompt-injection boundary tagging",
            "Script & Tracker DOM sanitization",
        ],
    }

