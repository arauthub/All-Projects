# 🌐 All-Projects: Monorepo & Engineering Portfolio

Welcome to the **All-Projects** repository — a curated monorepo containing browser extensions, fullstack web applications, CMS platforms, AI agent architectures, and containerized deployment configurations.

📄 **Profile & CV**: [Developer Profile](PROFILE.md) • [Curriculum Vitae (12 Years Experience)](CV_Abhijeet_Raut.md)

---

## 📁 Repository Architecture & Directory Map

```text
All-Projects/
├── extensions/                         # 🧩 Browser Extensions
│   ├── diagram-image-lens/             # Diagram & Image Lens Pro (Magnifier, Deep-Zoom & Screenshots)
│   └── link-inspector-extension/       # Link Inspector Pro & Broken Link Checker (Manifest V3)
│
├── apps/                               # 🌐 Fullstack Web Apps & Content Management
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
| [**Diagram & Image Lens Pro**](extensions/diagram-image-lens/) | Browser Extension | JavaScript (ES6+), Manifest V3, HTML5 Canvas, CSS3 | HD hover loupe (2x–16x), fullscreen blueprint deep-zoom lightbox with schematic invert mode, 1-click PNG/SVG clipboard copying, and Retina area snipping tool. |
| [**Link Inspector Pro**](extensions/link-inspector-extension/) | Browser Extension | JavaScript (ES6+), Manifest V3, CSS3 | Real-time link inspector, broken link auditor (404/5xx), redirect tracker, Wayback Machine recovery, UTM parameter stripper, and CSV/JSON exporter. |
| [**Flashapps**](apps/flashapps/) | Fullstack Web App | Django, Angular, SQLite, Docker | Fullstack web platform featuring a Django REST backend and Angular modern frontend with containerized deployment. |
| [**Wagtailwind**](apps/wagtailwind/) | CMS Platform | Wagtail, Django, Tailwind CSS, Docker | Enterprise-grade Wagtail Content Management System integrated with Tailwind CSS utility styling. |
| [**Mytail Blog**](apps/mytail/) | CMS Platform | Wagtail, Django, SCSS, Tailwind CSS | Feature-rich Wagtail CMS instance with custom blog architectures, accounts, and responsive layouts. |
| [**Wagtail Demo**](apps/wagtaildemo/) | Backend Module | Python, Django | Specialized Django/Wagtail models and custom service components. |
| [**MyAgents**](agents/myagents/) | AI & Agents | Python, Agent Development Kit (ADK) | Autonomous AI agent prototypes and integration pipelines built on the Google ADK. |
| [**Docker Orchestration**](devops/docker/) | DevOps & Infra | Docker Compose, Alpine Linux | Multi-container composition uniting backend APIs, frontend clients, and media storage. |

---

## 🛠️ Category Quick Start Guides

### 1. 🧩 Browser Extensions (`extensions/`)

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
  - Admin Panel: `http://localhost:8000/admin/`

---

### 3. 🤖 AI Agents & Workflows (`agents/`)

#### **MyAgents (ADK Samples)**
* **Location**: [`agents/myagents/`](agents/myagents/)
* Explores autonomous agent patterns, tool bindings, and intelligent orchestration.

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
