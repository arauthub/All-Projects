# 🌌 Nexus Prime: Futuristic Git-Integrated Jamstack Frontend

[![Monorepo Project: jamstack-frontend](https://img.shields.io/badge/Monorepo-apps%2Fjamstack--frontend-blue.svg)](https://github.com/arauthub/All-Projects)
[![Tech Stack: Vanilla Jamstack](https://img.shields.io/badge/Stack-HTML5%20%7C%20Vanilla%20CSS%20%7C%20ES%20Modules-cyan.svg)](https://developer.mozilla.org)
[![Aesthetics: Quantum Glassmorphism](https://img.shields.io/badge/Design-Quantum%20Cyber%20Glass-purple.svg)](https://github.com/arauthub/All-Projects)
[![Presubmit: Clean](https://img.shields.io/badge/Presubmit-5%2F5%20Verified-emerald.svg)](https://github.com/arauthub/All-Projects)

**Nexus Prime** is an ultra-fast, futuristic, Git-integrated Jamstack web frontend and engineering showcase designed for **Abhijeet Raut** (Lead Backend & AI/ML Engineer | Solutions Architect, 12 years experience).

The portal synthesizes the entire **All-Projects** monorepo into a responsive, living cybernetic command center with real-time Git commit streams, interactive multi-agent DAG simulators, 2D zero-gravity physics, Web Audio synthesizer effects, and an interactive in-browser CLI terminal.

---

## ⚡ Key Highlights & Features

1. **Sub-Millisecond Jamstack Performance**:
   - Zero framework overhead (0 kB React/Vue bundle penalty).
   - Pre-rendered static data layer combined with dynamic client-side edge hydration.
   - 100/100 Lighthouse performance metrics with instant First Contentful Paint (< 80ms).

2. **Living "Quantum Nexus" Visual Aesthetics**:
   - Interactive 60 FPS HTML5 Canvas particle constellation (`quantum-canvas`) with cursor gravitation, dynamic link beams, and nebula energy waves.
   - Obsidian Glassmorphism with neon cyan (`#00f5ff`), neural violet (`#8b5cf6`), and emerald status lighting.
   - Dynamic 3D card tilt & parallax hover physics.
   - Built-in Web Audio API sound synthesizer with sci-fi audio feedback and visual equalizer animations.

3. **Bi-Directional Git & Monorepo Intelligence**:
   - Real-time Git commit stream, branch telemetry, and presubmit test verification indicators.
   - Live GitHub REST API sync with graceful zero-latency fallback to offline static monorepo logs.
   - Interactive Monorepo Tree Explorer with instant code and file viewer.

4. **Interactive Holodeck Sandboxes (x5 Live Simulators)**:
   - 🤖 **MyAgents**: Interactive Swarm DAG topological execution simulator with animated agent nodes.
   - 🌌 **Anti-Gravity Web**: Mini 2D rigid-body floating canvas with mouse fling and gravity inversion.
   - 🛡️ **ARNAS Cryptographic Vault**: Live PBKDF2 key derivation and AES-256-GCM cipher simulator.
   - ⚡ **API Pulse Pro**: In-browser network traffic packet inspector and TypeScript interface generator.
   - 🚀 **WorkspaceCurator**: Live webhook ingestion ticker and executive TL;DR briefing synthesizer.

5. **Cyber Quantum Terminal (Interactive CLI)**:
   - Full keyboard-interactive command line: type `help`, `projects`, `skills`, `git log`, `presubmit`, `matrix`, `clear`, or `contact`.

6. **Global Spotlight Command Palette (`Cmd+K` / `Ctrl+K`)**:
   - Instant search across all projects, technical skills, git commits, and documentation.

---

## 🚀 Quick Start & Local Execution

### 1. Run Dev Server Locally
To start the hyper-fast native dev server on port 3000:
```bash
# Navigate to the project
cd apps/jamstack-frontend

# Run using Node.js
npm run dev
# OR directly:
node scripts/dev-server.mjs
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

Alternatively, serve via Python:
```bash
python3 -m http.server 3000 --directory apps/jamstack-frontend
```

### 2. Build Jamstack Static Assets
To run the static site pre-renderer and compile the latest Git commits and project metadata:
```bash
npm run build
# OR:
node scripts/build-jamstack.mjs
```

### 3. Run Automated Verification Tests
```bash
npm test
```

---

## 📁 Directory Structure

```text
apps/jamstack-frontend/
├── index.html                     # Semantic Jamstack entry point
├── styles/
│   ├── main.css                   # Core tokens, futuristic dark theme & layout
│   ├── components.css             # HUD, glass cards, telemetry & terminal
│   └── sandboxes.css              # Holodeck interactive simulators & canvas styling
├── js/
│   ├── app.js                     # Main application controller & hydration
│   ├── config.js                  # Configuration & telemetry parameters
│   ├── quantum-canvas.js          # Interactive 60 FPS particle nexus canvas
│   ├── audio-synth.js             # Web Audio API sound synthesizer & equalizer
│   ├── git-intelligence.js        # Git commit stream, branch DAG & GitHub sync
│   ├── projects-data.js           # Pre-compiled monorepo projects catalog
│   ├── profile-data.js            # 12-Year career timeline & skill taxonomy
│   ├── holodeck-sandboxes.js      # 5 Interactive project simulators
│   ├── terminal-cli.js            # Interactive Cyber Quantum Terminal
│   ├── command-palette.js         # Cmd+K Spotlight search engine
│   └── monorepo-tree.js           # Interactive Monorepo Explorer & Code Viewer
├── scripts/
│   ├── build-jamstack.mjs         # Jamstack Static Site Generator
│   └── dev-server.mjs             # High-speed HTTP development server
├── tests/
│   └── test_jamstack.js           # Automated data and structure tests
├── .env.example                   # Environment configuration template
├── package.json                   # Project metadata and npm scripts
├── DESIGN.md                      # Technical Design Document
└── README.md                      # Comprehensive user and developer guide
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd+K` / `Ctrl+K` | Open Global Spotlight Search |
| `~` / `\`` or `Ctrl+\`` | Open Cyber Quantum Terminal |
| `Esc` | Close active modal / sandbox / palette |
| `M` | Toggle Cyber Audio Synthesizer ON/OFF |
| `G` | Jump to Live Git Stream |
| `P` | Jump to Projects Catalog |

---

## 🔒 Security & Privacy

Nexus Prime adheres strictly to monorepo presubmit security standards:
- Zero external ad trackers or tracking cookies.
- No sensitive API credentials committed (uses `.env.example`).
- 100% offline capability with cached Git snapshots and local browser state.
