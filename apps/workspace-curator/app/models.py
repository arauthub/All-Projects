"""Data models and schemas for WorkspaceCurator Pro."""

from enum import Enum
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field


class WorkspaceProduct(str, Enum):
    DRIVE = "drive"
    DOCS = "docs"
    SHEETS = "sheets"
    GMAIL = "gmail"
    CALENDAR = "calendar"
    FORMS = "forms"
    CHAT = "chat"
    OTHER = "other"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    CONCERNED = "concerned"
    URGENT = "urgent"


class ActionItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    task: str
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    priority: UrgencyLevel = UrgencyLevel.MEDIUM
    completed: bool = False


class Entity(BaseModel):
    name: str
    category: str  # e.g., "Person", "Organization", "Metric", "Deadline", "Product"
    count: int = 1


class CuratedItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product: WorkspaceProduct
    source_title: str
    source_sender: Optional[str] = "Workspace Event"
    source_url: Optional[str] = None
    resource_id: Optional[str] = None
    raw_content: str
    received_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    
    # Analysis & Curation Output
    summary: str  # Executive TL;DR
    key_takeaways: List[str] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    entities: List[Entity] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    metrics: List[str] = Field(default_factory=list)
    sentiment: SentimentType = SentimentType.NEUTRAL
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    urgency_score: int = Field(default=50, ge=0, le=100)
    
    # Ready-to-use curated output formats
    formats: Dict[str, str] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class InboundWebhookEnvelope(BaseModel):
    """Universal wrapper for inbound Google Workspace events."""
    product: Optional[str] = None
    title: Optional[str] = None
    sender: Optional[str] = None
    content: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    url: Optional[str] = None


class SimulationRequest(BaseModel):
    preset_id: Optional[str] = None
    product: WorkspaceProduct = WorkspaceProduct.DOCS
    source_title: str
    source_sender: Optional[str] = "alex@enterprise.com"
    source_url: Optional[str] = "https://docs.google.com/document/d/demo-doc-123"
    content: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class FilterParams(BaseModel):
    product: Optional[WorkspaceProduct] = None
    urgency: Optional[UrgencyLevel] = None
    tag: Optional[str] = None
    query: Optional[str] = None
    limit: int = 50
    offset: int = 0


class ForwarderConfig(BaseModel):
    webhook_url: str
    enabled: bool = True
    filter_urgency: Optional[List[UrgencyLevel]] = None
