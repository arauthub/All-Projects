# 🌐 All-Projects: Monorepo & Engineering Portfolio

[![CI / Monorepo Verification](https://github.com/arauthub/All-Projects/actions/workflows/ci.yml/badge.svg)](https://github.com/arauthub/All-Projects/actions/workflows/ci.yml)
[![Author: Abhijeet Raut](https://img.shields.io/badge/Author-Abhijeet_Raut-blue.svg?style=flat&logo=github)](https://github.com/arauthub)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white)](https://cloud.google.com)

Welcome to the **All-Projects** repository — a curated enterprise monorepo architected by **Abhijeet Raut** ([@arauthub](https://github.com/arauthub)), showcasing autonomous multi-agent AI systems, distributed cloud storage NAS, Chrome Manifest V3 extensions, fullstack Django/Angular web apps, Wagtail CMS platforms, and containerized cloud deployment manifests.

📄 **Executive Documentation**: [Developer Profile (Skills & Architecture)](PROFILE.md) • [Curriculum Vitae (12 Years Lead Experience)](CV_Abhijeet_Raut.md) • [Contributing Guide](.github/CONTRIBUTING.md) • [Security Policy](.github/SECURITY.md)

---

## 📁 Repository Architecture & Directory Map

```text
All-Projects/
├── extensions/                         # 🧩 Browser Extensions
│   ├── anti-gravity-browser/           # Anti-Gravity Web (Matter.js 2D Physics & Arcade Browser)
│   ├── diagram-image-lens/             # Diagram & Image Lens Pro (Magnifier, Deep-Zoom & Screenshots)
│   └── link-inspector-extension/       # Link Inspector Pro & Broken Link Checker (Manifest V3)
│
├── apps/                               # 🌐 Fullstack Web Apps & Content Management
│   ├── arnas/                          # ARNAS Enterprise Cloud NAS & Zero-Knowledge E2EE Mobile Sync
│   ├── flashapps/                      # Fullstack Django (REST API) + Angular Single Page App
│   ├── wagtailwind/                    # Wagtail CMS styled with Tailwind CSS
│   ├── mytail/                         # Wagtail CMS Multi-app Blog & Account System
│   └── wagtaildemo/                    # Wagtail Extension & Django Modules
│
├── agents/                             # 🤖 AI Agents & Workflows
│   └── myagents/                       # Google ADK Agent samples & integration workflows
│
└── devops/                             # 🐳 Containerization & Deployment
    └── docker/                         # Docker Compose services for multi-app orchestration
```

---

## 🚀 Projects Catalog

| Project | Category | Primary Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| [**ARNAS Enterprise Cloud NAS**](apps/arnas/) | Distributed Storage & Mobile Sync | Fastify, React Native / Expo, PostgreSQL, Prisma, S3/MinIO, AES-256-GCM | Distributed private cloud storage with multi-server storage clustering, instant ingest + fan-out replication, automatic read failover, zero-knowledge E2EE (AES-256-GCM / PBKDF2), battery sentinel sync, and compliance audit trail. |
| [**Anti-Gravity Web Browser**](extensions/anti-gravity-browser/) | Browser Extension & Game | JavaScript (ES6+), Manifest V3, Matter.js, HTML5 Canvas, CSS3 | Converts any webpage into a 2D zero-gravity physics sandbox with Matter.js rigid-body dynamics, directional gravity inversion, tractor beams, Asteroids arcade combat, and Katamari web absorption. |
| [**Diagram & Image Lens Pro**](extensions/diagram-image-lens/) | Browser Extension | JavaScript (ES6+), Manifest V3, HTML5 Canvas, CSS3 | HD hover loupe (2x–16x), fullscreen blueprint deep-zoom lightbox with schematic invert mode, 1-click PNG/SVG clipboard copying, and Retina area snipping tool. |
| [**Link Inspector Pro**](extensions/link-inspector-extension/) | Browser Extension | JavaScript (ES6+), Manifest V3, CSS3 | Real-time link inspector, broken link auditor (404/5xx), redirect tracker, Wayback Machine recovery, UTM parameter stripper, and CSV/JSON exporter. |
| [**Flashapps**](apps/flashapps/) | Fullstack Web App | Django, Angular, SQLite, Docker | Fullstack web platform featuring a Django REST backend and Angular modern frontend with containerized deployment. |
| [**Wagtailwind**](apps/wagtailwind/) | CMS Platform | Wagtail, Django, Tailwind CSS, Docker | Enterprise-grade Wagtail Content Management System integrated with Tailwind CSS utility styling. |
| [**Mytail Blog**](apps/mytail/) | CMS Platform | Wagtail, Django, SCSS, Tailwind CSS | Feature-rich Wagtail CMS instance with custom blog architectures, accounts, and responsive layouts. |
| [**Wagtail Demo**](apps/wagtaildemo/) | Backend Module | Python, Django | Specialized Django and Wagtail extension modules demonstrating custom model structures, streamfields, and cryptographic test generators. |
| [**MyAgents Multi-Agent Orchestrator**](agents/myagents/) | AI & Multi-Agent Swarm | Python, FastAPI, Google ADK, Vector RAG, Cloud Run, SSE | Enterprise multi-agent orchestration framework with autonomous task DAG decomposition, zero-config local simulation reasoning, in-memory semantic vector store RAG, executive slide presentation generator, and 1-click Google Cloud Run deployment. |
| [**Docker Orchestration**](devops/docker/) | DevOps & Infra | Docker Compose, Alpine Linux | Multi-container composition uniting backend APIs, frontend clients, and media storage. |

---

## 🛠️ Category Quick Start Guides

### 1. 🧩 Browser Extensions (`extensions/`)

#### **Anti-Gravity Web Browser & Arcade Sandbox**
* **Location**: [`extensions/anti-gravity-browser/`](extensions/anti-gravity-browser/)
* **Installation**:
  1. Open Chrome / Edge / Brave and go to `chrome://extensions`.
  2. Toggle **Developer mode** to **ON**.
  3. Click **Load unpacked** and select the folder:
     ```text
     /Users/abhijeetraut/Documents/All-Projects/extensions/anti-gravity-browser
     ```
  4. Shortcuts & Controls:
     * `0` or `Z`: Toggle Zero-G floating mode.
     * Arrow Keys (`▲`, `▼`, `◄`, `►`): Invert directional gravity.
     * Click & Drag: Fling DOM elements with physics momentum.
     * Arcade Modes: Switch between **Asteroids Blaster** (`WASD` + Spacebar lasers) and **Orbital Katamari** (magnetic rolling absorber).

#### **Diagram & Image Lens Pro**
* **Location**: [`extensions/diagram-image-lens/`](extensions/diagram-image-lens/)
* **Installation**:
  1. Open Chrome / Edge / Brave and go to `chrome://extensions`.
  2. Toggle **Developer mode** to **ON**.
  3. Click **Load unpacked** and select the folder:
     ```text
     /Users/abhijeetraut/Documents/All-Projects/extensions/diagram-image-lens
     ```
  4. Shortcuts:
     * `Cmd+Shift+M` (Mac) / `Alt+Shift+M` (Win): Toggle hover loupe magnifier.
     * `Cmd+Shift+S` (Mac) / `Alt+Shift+S` (Win): Launch area screenshot snip tool.
     * `Z`: Open currently hovered diagram in Deep-Zoom Lightbox.
     * `C`: Copy image to clipboard as PNG.

#### **Link Inspector Pro & Broken Link Checker**
* **Location**: [`extensions/link-inspector-extension/`](extensions/link-inspector-extension/)
* **Installation**:
  1. Open Chrome / Edge / Brave and go to `chrome://extensions`.
  2. Toggle **Developer mode** to **ON**.
  3. Click **Load unpacked** and select the folder:
     ```text
     /Users/abhijeetraut/Documents/All-Projects/extensions/link-inspector-extension
     ```
  4. Shortcut: Press `Cmd+Shift+L` (Mac) or `Alt+Shift+L` (Win/Linux) to toggle hover inspection on any page.

---

### 2. 🌐 Web Applications & CMS (`apps/`)

#### **ARNAS (Enterprise Cloud NAS & Zero-Knowledge E2EE Mobile Sync)**
* **Location**: [`apps/arnas/`](apps/arnas/)
* **Features**: Multi-server storage clustering, S3/MinIO failover, AES-256-GCM client encryption, battery sentinel sync, onboarding tutorial, and compliance audit trail.
* **Run Backend Server**:
  ```bash
  cd apps/arnas/server
  cp .env.example .env
  npm install
  npm run dev
  ```
  - API Health: `http://localhost:8080/health`
  - Swagger Docs: `http://localhost:8080/docs`
* **Run Mobile Client (Expo)**:
  ```bash
  cd apps/arnas/mobile
  npm install
  npm run web    # Or npx expo start --ios
  ```

#### **Flashapps (Django + Angular)**
* **Location**: [`apps/flashapps/`](apps/flashapps/)
* **Run via Docker**:
  ```bash
  cd devops/docker
  docker compose up --build
  ```
  - Backend API: `http://localhost:8000`
  - Frontend SPA: `http://localhost:4200`

#### **Wagtailwind (Wagtail + Tailwind CSS)**
* **Location**: [`apps/wagtailwind/`](apps/wagtailwind/)
* **Run Locally**:
  ```bash
  cd apps/wagtailwind
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py runserver
  ```
#### **Mytail (Wagtail Multi-app Blog & Account Platform)**
* **Location**: [`apps/mytail/`](apps/mytail/)
* **Run Locally**:
  ```bash
  cd apps/mytail/demo
  pip install -r requirements.txt
  python manage.py migrate
  python compile_scss.py
  python manage.py runserver
  ```

#### **Wagtail Demo (Modular Extension Utilities)**
* **Location**: [`apps/wagtaildemo/`](apps/wagtaildemo/)
* **Run Token Generator**:
  ```bash
  cd apps/wagtaildemo
  python3 giftcard.py
  ```

---

### 3. 🤖 AI Agents & Workflows (`agents/`)

#### **Google ADK Multi-Agent Orchestrator (MyAgents)**
* **Location**: [`agents/myagents/`](agents/myagents/)
* **Features**: Autonomous task decomposition, 5-agent swarm (Nexus Commander, Scout Intelligence, Vanguard Architect, Sentinel Auditor, Aegis Synthesizer), in-memory semantic vector RAG, zero-key offline reasoning, live Google Gemini adapter, cyber-luxe glassmorphic UI, executive presentation slide generator, and 1-click GCP Cloud Run deployment.
* **Run Locally**:
  ```bash
  cd agents/myagents
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
  ```
  - Web UI: `http://localhost:8080`
  - Swagger Docs: `http://localhost:8080/docs`
* **1-Click Deploy to Google Cloud Run**:
  ```bash
  cd agents/myagents
  ./deploy/deploy_to_gcp.sh
  ```

---

### 4. 🐳 DevOps & Deployment (`devops/`)

#### **Docker Compose Configurations**
* **Location**: [`devops/docker/`](devops/docker/)
* Orchestrates cross-service dependencies, ports, database volume persistence, and environment configurations.

---

## 📜 Repository Standards & Guidelines

* **Code Organization**: Keep domain projects cleanly separated into their respective top-level folders (`extensions/`, `apps/`, `agents/`, `devops/`).
* **Clean Commits**: Ensure build artifacts (`node_modules/`, `.angular/`, `__pycache__/`, `.sqlite3`) are kept out of git tracking (handled automatically by root `.gitignore`).
* **Documentation**: Each project inside its subfolder maintains a standalone `README.md` for local-specific setup and dependencies.

---

## 👤 Author & Maintainer

**Abhijeet Raut**
- GitHub: [@arauthub](https://github.com/arauthub)
- Email: [theabhijeetraut@gmail.com](mailto:theabhijeetraut@gmail.com)
- Profile: [PROFILE.md](PROFILE.md)
- Curriculum Vitae: [CV_Abhijeet_Raut.md](CV_Abhijeet_Raut.md)

---

## 📄 License

This repository is distributed under the [MIT License](LICENSE).
