"""Google Workspace payload parser supporting Drive, Gmail, Docs, Sheets, Calendar, Forms, and Chat."""

import base64
import json
from typing import Dict, Any, Tuple
from app.models import WorkspaceProduct


class WorkspacePayloadParser:
    @staticmethod
    def parse(
        headers: Dict[str, str],
        body: Any
    ) -> Tuple[WorkspaceProduct, str, str, str, str, Dict[str, Any]]:
        """
        Parses inbound request into standard fields:
        Returns: (product, title, sender, content, url, metadata)
        """
        h = {k.lower(): v for k, v in headers.items()}
        metadata: Dict[str, Any] = {}

        # 1. Google Drive / Docs / Sheets Push Notification (Header-driven)
        if "x-goog-channel-id" in h:
            channel_id = h.get("x-goog-channel-id", "")
            resource_uri = h.get("x-goog-resource-uri", "")
            resource_state = h.get("x-goog-resource-state", "change")
            message_num = h.get("x-goog-message-number", "1")

            metadata["google_channel_id"] = channel_id
            metadata["resource_uri"] = resource_uri
            metadata["resource_state"] = resource_state
            metadata["message_num"] = message_num

            # Determine product from resource uri or body
            product = WorkspaceProduct.DRIVE
            if "spreadsheets" in resource_uri or (isinstance(body, dict) and "sheet" in str(body).lower()):
                product = WorkspaceProduct.SHEETS
            elif "documents" in resource_uri or (isinstance(body, dict) and "document" in str(body).lower()):
                product = WorkspaceProduct.DOCS

            title = f"Google Drive File Change ({resource_state.upper()})"
            sender = "Google Drive Push Sync"
            url = resource_uri or "https://drive.google.com"

            content = ""
            if isinstance(body, dict):
                content = body.get("content") or body.get("text") or json.dumps(body, indent=2)
                title = body.get("title") or body.get("name") or title
                sender = body.get("sender") or body.get("author") or sender
                url = body.get("url") or url
            elif isinstance(body, str) and body.strip():
                content = body
            else:
                content = f"Resource state changed to '{resource_state}' on resource URI: {resource_uri}."

            return product, title, sender, content, url, metadata

        # 2. Body as dictionary
        if isinstance(body, dict):
            # 2a. Gmail via Google Cloud Pub/Sub
            if "message" in body and isinstance(body["message"], dict):
                msg = body["message"]
                raw_data = msg.get("data", "")
                decoded_str = ""
                if raw_data:
                    try:
                        decoded_bytes = base64.b64decode(raw_data)
                        decoded_str = decoded_bytes.decode("utf-8")
                        sub_json = json.loads(decoded_str)
                        metadata["pubsub_decoded"] = sub_json
                        email_addr = sub_json.get("emailAddress", "Workspace Inbox")
                        history_id = sub_json.get("historyId", "")
                        return (
                            WorkspaceProduct.GMAIL,
                            f"Gmail Inbox Update (History #{history_id})",
                            email_addr,
                            f"New mail sync for account: {email_addr}. History change ID: {history_id}\nDetailed changes: {decoded_str}",
                            "https://mail.google.com",
                            metadata
                        )
                    except Exception:
                        decoded_str = raw_data

                return (
                    WorkspaceProduct.GMAIL,
                    "Gmail Pub/Sub Push Notification",
                    "Google Cloud Pub/Sub",
                    decoded_str or "Incoming Gmail push event received.",
                    "https://mail.google.com",
                    metadata
                )

            # 2b. Google Forms Webhook (e.g. from Apps Script or Add-on)
            if "formTitle" in body or "responses" in body or body.get("product") == "forms":
                title = body.get("formTitle") or body.get("title") or "Google Forms Response"
                sender = body.get("respondentEmail") or body.get("submitter") or body.get("sender") or "Form Respondent"
                responses = body.get("responses", {})
                
                content_lines = [f"Form Submission: {title}"]
                if isinstance(responses, dict):
                    for q, a in responses.items():
                        content_lines.append(f"• {q}: {a}")
                elif isinstance(responses, list):
                    for item in responses:
                        content_lines.append(f"• {item}")
                else:
                    content_lines.append(str(responses or body.get("content", "")))

                return (
                    WorkspaceProduct.FORMS,
                    title,
                    sender,
                    "\n".join(content_lines),
                    body.get("url") or "https://forms.google.com",
                    metadata
                )

            # 2c. Google Calendar Webhook (e.g. events.watch or calendar payload)
            if "calendar" in str(body.get("product", "")).lower() or ("start" in body and "end" in body and "summary" in body):
                title = body.get("summary") or body.get("title") or "Calendar Event Notification"
                organizer = body.get("organizer", {})
                sender = organizer.get("email") if isinstance(organizer, dict) else str(organizer or "Google Calendar")
                start_time = body.get("start", {}).get("dateTime") if isinstance(body.get("start"), dict) else str(body.get("start", ""))
                end_time = body.get("end", {}).get("dateTime") if isinstance(body.get("end"), dict) else str(body.get("end", ""))
                attendees = [a.get("email", str(a)) if isinstance(a, dict) else str(a) for a in body.get("attendees", [])]
                
                desc = body.get("description", "")
                content = f"Event: {title}\nTime: {start_time} to {end_time}\nOrganizer: {sender}\nAttendees: {', '.join(attendees)}\n\nAgenda / Notes:\n{desc}"
                return (
                    WorkspaceProduct.CALENDAR,
                    title,
                    sender,
                    content,
                    body.get("htmlLink") or body.get("url") or "https://calendar.google.com",
                    metadata
                )

            # 2d. Explicit Product specified
            explicit_product = str(body.get("product", "")).lower()
            product = WorkspaceProduct.DOCS
            for p in WorkspaceProduct:
                if p.value == explicit_product:
                    product = p
                    break

            title = body.get("title") or body.get("source_title") or f"{product.value.title()} Update"
            sender = body.get("sender") or body.get("source_sender") or body.get("author") or "Workspace Contributor"
            content = body.get("content") or body.get("raw_content") or body.get("text") or json.dumps(body, indent=2)
            url = body.get("url") or body.get("source_url") or None
            
            return product, title, sender, content, url, metadata

        # 3. Fallback for string / plain text
        raw_text = str(body or "")
        return (
            WorkspaceProduct.OTHER,
            "Inbound Workspace Webhook",
            "External Hook",
            raw_text,
            None,
            metadata
        )
