"""Universal Curation Formatters (Markdown, Slack Digest, Email, JSON-LD, RSS)."""

import json
from typing import Dict, Any


class CurationFormatter:
    @staticmethod
    def generate_all(item: Any) -> Dict[str, str]:
        """Generates all curated consumption formats for an item."""
        return {
            "markdown": CurationFormatter.to_markdown(item),
            "slack": CurationFormatter.to_slack_digest(item),
            "email": CurationFormatter.to_email_digest(item),
            "json_ld": CurationFormatter.to_json_ld(item),
            "executive_card": CurationFormatter.to_executive_card(item),
        }

    @staticmethod
    def to_markdown(item: Any) -> str:
        urgency_emoji = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}.get(item.urgency.value, "⚪")
        sentiment_badge = item.sentiment.value.upper()

        actions_md = ""
        if item.action_items:
            actions_md = "### ✅ Action Items\n"
            for a in item.action_items:
                assignee_str = f" **(@{a.assignee})**" if a.assignee else ""
                deadline_str = f" `Due: {a.deadline}`" if a.deadline else ""
                check = "[x]" if a.completed else "[ ]"
                actions_md += f"- {check} {a.task}{assignee_str}{deadline_str}\n"

        metrics_md = ""
        if item.metrics:
            metrics_md = f"**📊 Quantified Metrics**: {', '.join(f'`{m}`' for m in item.metrics)}\n\n"

        takeaways_md = ""
        if item.key_takeaways:
            takeaways_md = "### 📌 Key Takeaways\n"
            for pt in item.key_takeaways:
                takeaways_md += f"- {pt}\n"

        tags_str = " ".join(item.tags)

        url_str = f" • [Source Document]({item.source_url})" if item.source_url else ""

        return f"""# {urgency_emoji} [{item.product.value.upper()}] {item.source_title}
> **Sender**: {item.source_sender} • **Urgency**: {item.urgency.value.title()} ({item.urgency_score}/100) • **Tone**: {sentiment_badge}{url_str}  
> **Tags**: {tags_str}

## ⚡ Executive Summary (TL;DR)
{item.summary}

{metrics_md}{takeaways_md}
{actions_md}
---
*Curated automatically by WorkspaceCurator Pro • Ingested at {item.received_at}*
""".strip()

    @staticmethod
    def to_slack_digest(item: Any) -> str:
        urgency_emoji = {"low": "🟢", "medium": "🟡", "high": "🚨", "critical": "🔥"}.get(item.urgency.value, "ℹ️")
        
        actions_txt = ""
        if item.action_items:
            actions_txt = "\n*Action Items:*\n"
            for a in item.action_items:
                owner = f" (@{a.assignee})" if a.assignee else ""
                due = f" [Due: {a.deadline}]" if a.deadline else ""
                actions_txt += f"• {'[COMPLETED] ' if a.completed else ''}{a.task}{owner}{due}\n"

        url_txt = f" | <{item.source_url}|Open Source>" if item.source_url else ""

        return f"""{urgency_emoji} *Google {item.product.value.title()}: {item.source_title}*
*From:* {item.source_sender} | *Urgency:* {item.urgency.value.upper()} ({item.urgency_score}%){url_txt}
*Summary:* {item.summary}
{actions_txt}
_Tags: {' '.join(item.tags)}_
""".strip()

    @staticmethod
    def to_email_digest(item: Any) -> str:
        actions_html = ""
        if item.action_items:
            actions_html = "<h4>Action Items Required:</h4><ul>"
            for a in item.action_items:
                actions_html += f"<li><strong>{a.task}</strong> (Assignee: {a.assignee or 'Unassigned'}, Due: {a.deadline or 'TBD'})</li>"
            actions_html += "</ul>"

        return f"""Subject: [{item.urgency.value.upper()}] Curated Brief: {item.source_title}

Hello Team,

Here is your curated executive briefing from Google {item.product.value.title()}:

TITLE: {item.source_title}
SOURCE: {item.source_sender}
URGENCY: {item.urgency.value.upper()} ({item.urgency_score}/100)
TAGS: {', '.join(item.tags)}

EXECUTIVE SUMMARY:
{item.summary}

KEY TAKEAWAYS:
{chr(10).join(f'- {pt}' for pt in item.key_takeaways)}

{actions_html}

Best regards,
WorkspaceCurator Intelligence Engine
""".strip()

    @staticmethod
    def to_json_ld(item: Any) -> str:
        payload = {
            "@context": "https://schema.org",
            "@type": "DigitalDocument",
            "name": item.source_title,
            "abstract": item.summary,
            "creator": {"@type": "Organization", "name": item.source_sender},
            "dateCreated": item.received_at,
            "keywords": item.tags,
            "urgency": item.urgency.value,
            "sentiment": item.sentiment.value,
            "actionItems": [
                {"task": a.task, "assignee": a.assignee, "deadline": a.deadline, "completed": a.completed}
                for a in item.action_items
            ],
            "metrics": item.metrics,
        }
        return json.dumps(payload, indent=2)

    @staticmethod
    def to_executive_card(item: Any) -> str:
        return f"[{item.urgency.value.upper()}] {item.source_title} - {item.summary[:140]}..."
