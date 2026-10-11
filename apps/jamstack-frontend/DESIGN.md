# Nexus Prime: Quantum Jamstack & Git Intelligence Portal
## Technical Design Document (DESIGN.md)

### 1. Executive Overview & Philosophy

**Nexus Prime** is a futuristic, hyper-performant, Git-integrated Jamstack web frontend architected for **Abhijeet Raut** (Lead Backend & AI/ML Engineer | Solutions Architect, 12 years experience). 

The portal serves as the unified command center and living showcase for the entire **All-Projects** monorepo—spanning autonomous AI agent swarms, distributed cloud storage NAS, Chrome Manifest V3 developer extensions, enterprise Wagtail/Django platforms, and DevOps automation.

#### Key Architectural Pillars
1. **Ultra-Fast Jamstack Delivery**: Pure vanilla ES Modules, zero bloated JS framework dependencies (0 kB React/Vue runtime penalty), instantaneous First Contentful Paint (< 80ms), and 100/100 Lighthouse performance metrics.
2. **Git & GitHub Intelligence Layer**: Bi-directional Git integration featuring real-time commit heatmaps, branch status, presubmit test telemetry, and dynamic fallback between live GitHub REST APIs and pre-compiled static snapshots.
3. **Futuristic "Living" Interface**: A dynamic, kinetic user experience driven by an interactive 60 FPS HTML5 canvas particle constellation (`quantum-canvas`), 3D card tilt physics, holographic glassmorphism, glowing energy conduits, and a native Web Audio API cyber synthesizer.
4. **Interactive Holodeck Sandboxes**: Live browser-native simulators allowing instant execution of core monorepo architectures (Agentic DAG Swarm, Anti-Gravity Physics sandbox, ARNAS Zero-Knowledge Cryptographic Vault, API Pulse Network Interceptor, and WorkspaceCurator webhook digests).
5. **Cyber Quantum Terminal**: An integrated command-line interface directly within the web portal providing keyboard navigation, system diagnostics, commit logs, and cyber matrix visualization.

---

### 2. Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BUILD / COMPILATION PHASE                       │
├────────────────────────────────────────────────────────────────────────┤
│  PROFILE.md  CV_Abhijeet_Raut.md  README.md  DESIGN.md  Git Logs       │
│        │               │               │          │         │          │
│        └───────────────┼───────────────┼──────────┼─────────┘          │
│                        ▼                                               │
│             scripts/build-jamstack.mjs                                 │
│                        │                                               │
│                        ▼                                               │
│   ┌──────────────────────────────────────────────┐                     │
│   │ Pre-rendered Static JSON Datasets & Assets   │                     │
│   │  - data/monorepo-data.json                   │                     │
│   │  - data/profile-data.json                    │                     │
│   │  - data/git-feed.json                        │                     │
│   └──────────────────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT RUNTIME HYDRATION                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────┐          ┌─────────────────────────────┐   │
│   │   index.html          │ ◄────────┤ Service Worker / Cache API  │   │
│   │  (Semantic Jamstack)  │          └─────────────────────────────┘   │
│   └──────────┬────────────┘                                            │
│              │                                                         │
│     ┌────────┴─────────────────────────────────────────┐               │
│     ▼                                                  ▼               │
│  [Visual Presentation Engine]              [Interactive Core Modules]  │
│  - Quantum Canvas (60 FPS particles)       - Git Intelligence Engine   │
│  - Hologram 3D Card Physics                - Web Audio Synthesizer     │
│  - Glassmorphic Obsidian Design System     - Cyber Quantum CLI         │
│  - Live Telemetry & HUD                    - Holodeck Sandboxes (x5)   │
│                                            - Global Spotlight (Cmd+K)  │
│                                            - Monorepo Code Browser     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Design System & Futuristic Tokens

The visual identity embodies **Quantum Cybernetic / Obsidian Glassmorphism**:

```css
:root {
  /* Core Obsidian Palette */
  --bg-void: #060810;
  --bg-surface: rgba(15, 23, 42, 0.72);
  --bg-surface-elevated: rgba(30, 41, 59, 0.78);
  
  /* Quantum Neon Accents */
  --accent-cyan: #00f5ff;        /* Energy conduits, active badges, primary glows */
  --accent-violet: #8b5cf6;      /* Neural networks, AI swarms, secondary glows */
  --accent-emerald: #10b981;     /* Git clean state, presubmit verification */
  --accent-amber: #f59e0b;       /* Warning telemetry, pending execution */
  --accent-rose: #f43f5e;        /* Critical alerts, failover nodes */
  
  /* Glassmorphism */
  --glass-blur: blur(20px);
  --glass-border: 1px solid rgba(0, 245, 255, 0.14);
  --glass-border-hover: 1px solid rgba(0, 245, 255, 0.45);
  --glass-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.65), 0 0 25px rgba(0, 245, 255, 0.08);
  
  /* Typography */
  --font-display: 'Outfit', -apple-system, sans-serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

### 4. Component Hierarchy

1. **Header & Navigation HUD**:
   - Monorepo Live Health Status (`BRANCH: main`, `COMMIT: a9756b6`, `PRESUBMIT: 5/5 PASSED`).
   - Web Audio Sound Synthesizer toggle with dynamic visual equalizer bars.
   - Command Palette shortcut (`Cmd+K`).
   - Telemetry Clock (UTC / Local switcher with millisecond counter).
2. **Hero Section ("Living Quantum Nexus")**:
   - Dynamic 60 FPS HTML5 canvas particle constellation (`quantum-canvas`) with mouse gravitation and connecting energy lines.
   - Profile title glitch effect, holographic role pills, and typewriter subtitles.
   - Real-time KPI stat matrix (12+ Years Experience, 11 Active Systems, 100% Presubmit Clean, <120ms Latency).
3. **Live Git Intelligence Stream**:
   - Visual commit timeline cards with hashes, messages, timestamps, and author tags.
   - Presubmit suite status indicator displaying real-time checks.
   - Monorepo directory map with instant file viewer.
4. **Holodeck Systems Catalog**:
   - Category filtering (All Systems, AI Swarms, Cloud NAS, Chrome Extensions, Fullstack/CMS, DevOps).
   - Real-time search with fuzzy matching.
   - 3D card tilt & parallax hover physics.
   - Project modal with rendered architecture markdown, metrics, and launch sandbox triggers.
5. **Interactive Holodeck Sandboxes**:
   - **Swarm DAG**: Interactive multi-agent topological execution simulator.
   - **Anti-Gravity Web**: 2D physics floating rigid-body sandbox with mouse gravity.
   - **ARNAS Cryptographic Vault**: Live PBKDF2 key derivation and AES-256-GCM cipher simulator.
   - **API Pulse Pro**: Live HTTP packet inspector and automatic TypeScript interface generator.
   - **WorkspaceCurator**: Live webhook event ingestion ticker and TL;DR briefing synthesizer.
6. **Cyber Quantum Terminal**:
   - Interactive command-line interface with keyboard commands (`help`, `projects`, `skills`, `git log`, `matrix`, `presubmit`, etc.).
7. **Executive Profile & 12-Year Career Timeline**:
   - Chronological engineering journey (Persistent Systems, Cybage Software, University of Pune).
   - Technical competencies radar and skill matrix with animated level bars.
   - Interactive CV viewer and quick copy/download utilities.

---

### 5. Jamstack Static Site Generator (`scripts/build-jamstack.mjs`)

The generator automates:
1. Parsing `PROFILE.md` and `CV_Abhijeet_Raut.md` into structured JSON.
2. Executing `git log -n 20` to extract verified commit hashes, authors, and timestamps.
3. Generating optimized static bundles and sitemaps for edge hosting (GitHub Pages, Cloudflare Pages, Vercel).
4. Prerendering metadata for SEO, OpenGraph tags, and social cards.

---

### 6. Performance & Security Guarantees

- **Zero External Tracking**: 100% privacy-preserving; zero third-party analytics or external ad trackers.
- **Offline First**: All assets and data snapshots operate offline without network connection.
- **Sub-100ms Latency**: Vanilla DOM manipulation delivers instantaneous 60 FPS rendering on all modern desktop and mobile browsers.
- **Presubmit Compliant**: Passes monorepo security checks (0 sensitive credentials, valid JSON syntax, and prerequisite documentation).
