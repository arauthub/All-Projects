"""High-Performance Heuristic & LLM Curation Analysis Engine."""

import re
from typing import List, Dict, Tuple, Any
from app.models import (
    WorkspaceProduct, UrgencyLevel, SentimentType,
    ActionItem, Entity, CuratedItem
)
from app.analyzer.gemini_client import gemini_client
from app.curation.formatter import CurationFormatter


class ContentAnalyzer:
    # Heuristic dictionary patterns
    CRITICAL_TRIGGERS = [
        r"\b(?:sev-?1|p0|critical|outage|breach|emergency|data loss|sla breach|production down)\b",
        r"\b(?:immediate(?:ly)? action required|security alert|severe)\b"
    ]
    HIGH_TRIGGERS = [
        r"\b(?:urgent|asap|escalat(?:e|ion)|blocker|blocking|deadline today|eod deadline|high priority|at risk)\b",
        r"\b(?:churn risk|compliance violation|legal action)\b"
    ]
    MEDIUM_TRIGGERS = [
        r"\b(?:action item|todo|review needed|approval required|upcoming deadline|milestone|deliverable)\b"
    ]

    POSITIVE_WORDS = {
        "success", "achieved", "exceeded", "approved", "completed", "growth",
        "milestone", "launched", "celebrate", "effective", "aligned", "closed", "won"
    }
    CONCERNED_WORDS = {
        "risk", "delay", "behind schedule", "overrun", "concern", "warning",
        "issue", "defect", "flaw", "slipping", "friction", "churn", "bottleneck"
    }

    ACTION_PATTERNS = [
        re.compile(r"(?:^|\n)\s*(?:[-*•]|\d+\.)\s*(?:\[\s*\])?\s*(?:TODO:?|Action Item:?|Task:?)?\s*(.+)", re.IGNORECASE),
        re.compile(r"(?:^|\n)\s*(?:[-*•]|\d+\.)\s*(@\w+|[A-Z][a-z]+)\s+to\s+(.+)", re.IGNORECASE),
        re.compile(r"((?:Please|Must|Should|Need to)\s+[^.\n]+)", re.IGNORECASE),
    ]

    METRIC_PATTERNS = [
        re.compile(r"\$\d+(?:,\d{3})*(?:\.\d+)?[kKmMbBtT]?(?:\s*(?:million|billion|thousand|USD|EUR))?"),
        re.compile(r"\b\d+(?:\.\d+)?%"),
        re.compile(r"\b\d+(?:,\d{3})*\s+(?:users|customers|requests|transactions|leads|issues|tickets|qps)\b", re.IGNORECASE),
        re.compile(r"\b(?:Q[1-4]|FY\d{2,4})\b"),
    ]

    ENTITY_KEYWORDS = [
        ("Platform", ["Google Cloud", "GCP", "Workspace", "AWS", "Azure", "GitHub", "Jira", "Slack", "Salesforce", "PostgreSQL"]),
        ("Category", ["SOC2", "GDPR", "HIPAA", "Q3 OKR", "Q4 OKR", "MSA", "SLA", "NDA", "KPI"]),
    ]

    def analyze(
        self,
        product: WorkspaceProduct,
        title: str,
        sender: str,
        raw_content: str,
        url: str = None,
        metadata: Dict[str, Any] = None
    ) -> CuratedItem:
        """Runs curation analysis over extracted Google Workspace content."""
        metadata = metadata or {}
        content_lower = raw_content.lower()

        # 1. Determine Urgency & Score
        urgency, urgency_score = self._compute_urgency(raw_content)

        # 2. Determine Sentiment
        sentiment = self._compute_sentiment(content_lower, urgency)

        # 3. Extract Action Items
        action_items = self._extract_action_items(raw_content)

        # 4. Extract Metrics
        metrics = self._extract_metrics(raw_content)

        # 5. Extract Entities
        entities = self._extract_entities(raw_content)

        # 6. Extract Tags
        tags = self._compute_tags(product, content_lower, urgency, title)

        # 7. Extract Key Takeaways & Summary
        key_takeaways, summary = self._generate_summary_and_takeaways(product, title, sender, raw_content, metrics, action_items)

        # 8. Enrich with Gemini LLM if configured and online
        if gemini_client.is_available:
            llm_res = gemini_client.analyze_content(title, product.value, raw_content[:4000])
            if llm_res:
                summary = llm_res.get("summary", summary)
                if llm_res.get("key_takeaways"):
                    key_takeaways = llm_res["key_takeaways"]
                if llm_res.get("metrics"):
                    metrics = list(set(metrics + llm_res["metrics"]))
                if llm_res.get("tags"):
                    tags = list(set(tags + [f"#{t.lstrip('#')}" for t in llm_res["tags"]]))
                if llm_res.get("urgency_score"):
                    urgency_score = int(llm_res["urgency_score"])

        # Create Curated Item instance
        item = CuratedItem(
            product=product,
            source_title=title,
            source_sender=sender,
            source_url=url,
            resource_id=metadata.get("google_channel_id") or metadata.get("resource_uri"),
            raw_content=raw_content,
            summary=summary,
            key_takeaways=key_takeaways,
            action_items=action_items,
            entities=entities,
            tags=tags,
            metrics=metrics,
            sentiment=sentiment,
            urgency=urgency,
            urgency_score=urgency_score,
            metadata=metadata
        )

        # Generate universal curated presentation formats
        item.formats = CurationFormatter.generate_all(item)
        return item

    def _compute_urgency(self, text: str) -> Tuple[UrgencyLevel, int]:
        for pat in self.CRITICAL_TRIGGERS:
            if re.search(pat, text, re.IGNORECASE):
                return UrgencyLevel.CRITICAL, 95
        for pat in self.HIGH_TRIGGERS:
            if re.search(pat, text, re.IGNORECASE):
                return UrgencyLevel.HIGH, 80
        for pat in self.MEDIUM_TRIGGERS:
            if re.search(pat, text, re.IGNORECASE):
                return UrgencyLevel.MEDIUM, 55
        return UrgencyLevel.LOW, 25

    def _compute_sentiment(self, text_lower: str, urgency: UrgencyLevel) -> SentimentType:
        if urgency == UrgencyLevel.CRITICAL:
            return SentimentType.URGENT
        
        pos_count = sum(1 for w in self.POSITIVE_WORDS if w in text_lower)
        neg_count = sum(1 for w in self.CONCERNED_WORDS if w in text_lower)

        if urgency == UrgencyLevel.HIGH and neg_count > 0:
            return SentimentType.CONCERNED
        if neg_count > pos_count + 1:
            return SentimentType.CONCERNED
        if pos_count > neg_count:
            return SentimentType.POSITIVE
        return SentimentType.NEUTRAL

    def _extract_action_items(self, text: str) -> List[ActionItem]:
        actions: List[ActionItem] = []
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        for line in lines:
            # Check for action cues
            is_action = False
            task_text = line
            assignee = None
            deadline = None
            priority = UrgencyLevel.MEDIUM

            # Match bullet lists or lines with action keywords
            if any(cue in line.lower() for cue in ["todo", "action item", "must", "please ensure", "need to", "[ ]", "to review", "to deliver"]):
                is_action = True
                clean = re.sub(r"^(?:[-*•]|\d+\.)\s*(?:\[\s*\])?\s*(?:TODO:?|Action Item:?|Task:?)?\s*", "", line, flags=re.IGNORECASE)
                task_text = clean.strip()

            if is_action and len(task_text) > 8:
                # Extract assignee e.g. @Alex or Assigned to: Sarah
                assignee_match = re.search(r"@([a-zA-Z0-9_]+)", line)
                if not assignee_match:
                    assignee_match = re.search(r"\b(?:assigned to|owner:?)\s+([A-Za-z]+)", line, re.IGNORECASE)
                if assignee_match:
                    assignee = assignee_match.group(1).lstrip("@")

                # Extract deadline e.g. by Friday, by Oct 24, EOD
                dl_match = re.search(r"\b(?:by|due|before)\s+([A-Za-z]+(?:\s+\d{1,2})?|EOD|tomorrow|Monday|Friday)\b", line, re.IGNORECASE)
                if dl_match:
                    deadline = dl_match.group(1)

                if any(w in line.lower() for w in ["critical", "p0", "immediately", "asap"]):
                    priority = UrgencyLevel.HIGH

                actions.append(ActionItem(
                    task=task_text,
                    assignee=assignee,
                    deadline=deadline,
                    priority=priority,
                    completed=False
                ))

        # Default fallback action item if none detected but content is critical/high
        if not actions and any(w in text.lower() for w in ["escalation", "incident", "review", "proposal"]):
            actions.append(ActionItem(
                task="Review incoming Workspace update and acknowledge briefing",
                assignee="Team Lead",
                priority=UrgencyLevel.MEDIUM
            ))

        return actions[:8]

    def _extract_metrics(self, text: str) -> List[str]:
        metrics = []
        for pat in self.METRIC_PATTERNS:
            for match in pat.finditer(text):
                metric_val = match.group(0).strip()
                if metric_val not in metrics:
                    metrics.append(metric_val)
        return metrics[:10]

    def _extract_entities(self, text: str) -> List[Entity]:
        entity_map: Dict[str, Tuple[str, int]] = {}

        for category, keywords in self.ENTITY_KEYWORDS:
            for kw in keywords:
                count = len(re.findall(re.escape(kw), text, re.IGNORECASE))
                if count > 0:
                    entity_map[kw] = (category, count)

        # Extract email domains or named senders
        emails = re.findall(r"\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b", text)
        for domain in set(emails):
            entity_map[domain] = ("Domain", emails.count(domain))

        entities = [
            Entity(name=name, category=cat, count=cnt)
            for name, (cat, cnt) in entity_map.items()
        ]
        return sorted(entities, key=lambda e: e.count, reverse=True)[:10]

    def _compute_tags(self, product: WorkspaceProduct, text_lower: str, urgency: UrgencyLevel, title: str) -> List[str]:
        tags = [f"#{product.value}"]

        category_map = {
            "roadmap": ["roadmap", "milestone", "okr", "strategy", "q3", "q4"],
            "financial": ["budget", "arr", "revenue", "cost", "headcount", "spend", "invoice", "pricing"],
            "legal": ["contract", "msa", "nda", "terms", "compliance", "gdpr", "liability"],
            "incident": ["incident", "outage", "sev1", "p0", "root cause", "post-mortem", "bug"],
            "customer": ["customer", "client", "nps", "survey", "feedback", "escalation", "churn"],
            "meeting": ["meeting", "agenda", "minutes", "attendees", "action items"],
            "release": ["release", "deploy", "v1.", "v2.", "changelog", "launch"],
        }

        for tag, keywords in category_map.items():
            if any(kw in text_lower or kw in title.lower() for kw in keywords):
                tags.append(f"#{tag}")

        if urgency in (UrgencyLevel.HIGH, UrgencyLevel.CRITICAL):
            tags.append(f"#{urgency.value}-urgency")

        return list(dict.fromkeys(tags))[:7]

    def _generate_summary_and_takeaways(
        self,
        product: WorkspaceProduct,
        title: str,
        sender: str,
        text: str,
        metrics: List[str],
        action_items: List[ActionItem]
    ) -> Tuple[List[str], str]:
        # Clean lines
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 15]
        
        # Takeaways
        takeaways = []
        if sentences:
            takeaways.append(sentences[0])
        if len(sentences) > 1:
            takeaways.append(sentences[1])
        if metrics:
            takeaways.append(f"Key quantified metrics: {', '.join(metrics[:4])}.")
        elif len(sentences) > 2:
            takeaways.append(sentences[2])

        if not takeaways:
            takeaways = [f"Google {product.value.title()} event logged from {sender}."]

        # Summary paragraph
        action_snippet = f" {len(action_items)} action item(s) highlighted for follow-up." if action_items else ""
        metric_snippet = f" Highlights key figures: {', '.join(metrics[:3])}." if metrics else ""
        lead_sentence = sentences[0] if sentences else f"Update received regarding '{title}'."
        
        summary = f"{lead_sentence}{metric_snippet}{action_snippet}"
        return takeaways[:3], summary


analyzer = ContentAnalyzer()
