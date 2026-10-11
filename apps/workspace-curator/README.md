# ⚡ WorkspaceCurator Pro

> **Universal Google Workspace Webhook Ingestion, Content Analysis & Multi-Channel Curation Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](../../LICENSE)
[![Google Workspace](https://img.shields.io/badge/Google_Workspace-4285F4?style=flat&logo=google&logoColor=white)](https://workspace.google.com)

**WorkspaceCurator Pro** is an enterprise-grade platform that receives webhooks and push notifications from Google Workspace products (**Docs**, **Sheets**, **Drive**, **Gmail**, **Calendar**, **Forms**), automatically extracts and analyzes the content, and curates it into actionable formats that anyone can easily consume (interactive dashboard, Clean Markdown reports, Slack digests, email briefings, JSON-LD, and live RSS feeds).

---

## 🌟 Key Features

1. **Universal Google Workspace Ingestor**:
   - **Google Drive Push Notifications**: Supports `changes.watch` and `files.watch` with instant handshake synchronization (`X-Goog-Resource-State: sync`).
   - **Gmail Push Notifications**: Decodes Google Cloud Pub/Sub push envelopes (`{"message": {"data": "..."}}`).
   - **Google Forms Webhooks**: Parses responses and questions from `onFormSubmit` triggers.
   - **Google Calendar Push**: Ingests event changes, attendee lists, and Google Meet conference links.
   - **Google Docs & Sheets**: Real-time cell edit streaming and document snapshots via Google Apps Script.
2. **Deep Content Curation & NLP Intelligence**:
   - **Executive TL;DR Summaries**: Auto-generated 2-sentence executive briefings.
   - **Action Item Extraction**: Identifies tasks, assignees (`@Sarah`), deadlines (`by Friday`), and priority ratings (`Low`, `Medium`, `High`, `Critical`).
   - **Quantified Metrics**: Extracts monetary figures (`$1.45M`), percentages (`34%`), and key metrics.
   - **Named Entities & Tags**: Detects systems, platforms, and taxonomy tags (`#roadmap`, `#budget`, `#legal`, `#incident`).
   - **Urgency & Sentiment Engine**: Analyzes tone and flags critical Sev-1/P0 operational risks.
3. **Universal Accessibility ("Anyone Can Use It Easily")**:
   - **Modern Glassmorphic Web App**: Real-time Server-Sent Events (SSE) updates, filter chips by product and urgency, interactive checklists, and dark mode UI.
   - **1-Click Formats**: Clean Markdown (for Obsidian/Notion/GitHub), Slack Block Digests, Executive Email Briefings, and JSON-LD.
   - **Universal RSS / Atom Feed**: `/api/v1/feed.rss` allows anyone to subscribe via Feedly, Outlook, or Slack RSS bots.
   - **Outbound Webhook Forwarder**: Automatically forwards curated items to external Slack, Discord, or Zapier webhooks.
   - **Interactive Webhook Simulator**: Built-in test bench with realistic presets (Docs roadmap, Sheets budget, Gmail P0 escalation, Forms survey, Calendar review, Drive contract).
   - **Zero-Config Google Apps Script**: Copy-paste script (`scripts/google_apps_script.js`) to connect real Google documents in 30 seconds.

---

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the project directory
cd apps/workspace-curator

# (Optional) Activate your Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Server

```bash
# Start the FastAPI application with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload
```

The application will be accessible at:
- **Interactive Web Dashboard**: [http://localhost:8090](http://localhost:8090)
- **OpenAPI / Swagger Documentation**: [http://localhost:8090/docs](http://localhost:8090/docs)
- **Live RSS Feed**: [http://localhost:8090/api/v1/feed.rss](http://localhost:8090/api/v1/feed.rss)

### 3. Run the Unit & Integration Tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```

---

## 🧪 Testing with the Webhook Simulator

WorkspaceCurator Pro includes a built-in interactive simulator right on the dashboard. You can also trigger simulations via `curl`:

```bash
curl -X POST http://localhost:8090/api/v1/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "product": "docs",
    "source_title": "Q3 Strategic Product Roadmap & Multi-Region Launch",
    "source_sender": "elena.rostova@enterprise.tech",
    "source_url": "https://docs.google.com/document/d/demo123/edit",
    "content": "Q3 Roadmap: Target launch Oct 24 with $1.45M budget. 34% projected revenue increase. - [ ] TODO: @Marcus to finalize multi-region Terraform setup by Friday. - [ ] Action Item: @Priya to coordinate legal review before Oct 15."
  }'
```

---

## 🔗 Connecting Real Google Workspace Products

### Method 1: Google Apps Script (Docs, Sheets & Forms)
1. Open any Google Doc, Sheet, or Form.
2. Click **Extensions > Apps Script**.
3. Open `scripts/google_apps_script.js` in this repository, copy the code, and paste it into `Code.gs`.
4. Update `CURATOR_WEBHOOK_URL` to your WorkspaceCurator endpoint (or tunnel URL):
   ```javascript
   const CURATOR_WEBHOOK_URL = "https://your-domain.app/api/v1/webhook/google";
   ```
5. In Apps Script, click **Triggers (clock icon)** > **Add Trigger**:
   - For Sheets: Select `onEdit` or `onChange`.
   - For Forms: Select `onFormSubmit`.

### Method 2: Google Drive API Push Notifications (`changes.watch`)
Register a webhook watch channel with Google Drive API:
```bash
curl -X POST https://www.googleapis.com/drive/v3/changes/watch \
  -H "Authorization: Bearer [YOUR_ACCESS_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "channel-uuid-12345",
    "type": "web_hook",
    "address": "https://your-domain.app/api/v1/webhook/google",
    "token": "wk-secret-curator-token"
  }'
```

---

## 📑 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /api/v1/webhook/google` | POST | Universal Google Workspace webhook receiver (supports Drive, Gmail, Forms, Calendar, Docs, Sheets) |
| `POST /api/v1/simulate` | POST | Simulate a realistic Workspace event and run it through the curation pipeline |
| `GET /api/v1/curated` | GET | List curated items with query filters (`product`, `urgency`, `tag`, `query`) |
| `GET /api/v1/curated/{id}` | GET | Get single curated item details |
| `PATCH /api/v1/curated/{id}/action/{action_id}` | PATCH | Toggle action item completed status |
| `GET /api/v1/curated/{id}/export/{format}` | GET | Export formatted content (`markdown`, `slack`, `email`, `json`) |
| `GET /api/v1/feed.rss` | GET | Universal RSS / Atom XML feed of curated intelligence |
| `GET /api/v1/stats` | GET | Aggregated curation counts by product and urgency |
| `GET /api/v1/events/stream` | GET | Real-time Server-Sent Events (SSE) stream for live updates |
| `GET /api/v1/settings` | GET | Retrieve outbound forwarder and RSS endpoints |
| `POST /api/v1/settings` | POST | Configure outbound webhook forwarder (Slack, Discord, Zapier) |

---

## 🛡️ Architecture & Technical Design

For detailed architectural specifications, data models, sequence diagrams, and security protocols, refer to [**DESIGN.md**](DESIGN.md).
