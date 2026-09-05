# 🔍 Link Inspector Pro & Broken Link Checker (Chrome Extension - Manifest V3)

A high-performance, modern Chrome Extension designed to inspect, audit, validate, and clean links on any webpage in real time. Features interactive hover controls, live HTTP status & redirect destination tracking, 1-click Wayback Machine 404 recovery, real-time SEO & security risk audits, UTM tracking parameter stripping, customizable hover pointers, global keyboard shortcut (`Cmd+Shift+L`), and dual CSV/JSON audit reporting.

---

## 🌟 Key Features

- 🔍 **Interactive Hover Link Inspector & Control Panel**: Hover over any link on any webpage to open a real-time, interactive floating card. Inspect target URL, anchor text, target/rel attributes, security protocol (HTTPS/HTTP), and live HTTP status badge (200 OK, 301 Redirect, 404 Not Found, etc.).
- 🛠️ **Built-in Quick Action Controls**: Directly interact with links from the hover popup:
  - 📋 **Copy URL**: One-click copy link to clipboard with instant feedback.
  - 🧹 **Clean URL**: Automatically strip marketing & tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`, etc.) to get clean links.
  - 📝 **Copy Markdown**: Export as ready-to-paste `[Anchor](URL)` format.
  - 🔄 **Re-Check Status**: Live ping the URL to re-validate HTTP status and latency.
  - 🎯 **Highlight Instances**: Flash-highlight all matching occurrences of this link across the current page.
  - 🏛️ **Wayback Machine Recovery**: 1-click button on broken links (404/500) to view archived snapshots on `web.archive.org`.
  - ✕ **Instant Dismissal**: Close using the top-right button or pressing `Escape`.
- 🔀 **Redirect Destination Tracking**: Instantly view redirect destinations (`301/302 → https://...`) in the hover card and popup list.
- 🛡️ **SEO & Security Audits**:
  - Detects **Mixed Content** (insecure HTTP links on secure HTTPS pages).
  - Detects **Tabnabbing risks** (`target="_blank"` missing `rel="noopener"`).
  - Flags **Weak SEO / Empty Anchors** (links without text/alt or generic text like "click here").
  - Detects **Dummy/Placeholder Links** (`href="#"`, `javascript:void(0)`).
- 🎯 **Customizable Hover Pointers**: Choose your cursor inspection style from the popup (`Default Arrow`, `Magnifier 🔍`, `Crosshair ✛`, `Target 🎯`).
- ⌨️ **Global Keyboard Shortcut**: Press `Cmd+Shift+L` (Mac) or `Alt+Shift+L` (Windows/Linux) to toggle inspection instantly on any page.
- 🎨 **Visual Link Highlighter**: Instantly color-code links directly on the page:
  - 🟢 **Internal Links**: Same origin links
  - 🔵 **External Links**: Outbound links
  - 🟠 **Nofollow / Sponsored Links**: SEO rel attribute links
  - 🔴 **Broken Links**: Visual red pulse outline on 4xx/5xx errors
- ⚡ **Page Link Health Audit**: Scan all links on the active tab concurrently with status code detection and progress tracking.
- 📥 **Dual Audit Export (CSV & JSON)**: Export all audited page links with HTTP status codes, redirect destinations, tracking flags, and anchor text.
- 🖱️ **Context Menu Actions**: Right-click any link or page to inspect link details or toggle highlighting instantly.

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Open Extensions Page in your Browser
Open your Chromium browser (Google Chrome, Brave, Microsoft Edge, or Arc) and navigate to the extension management page:
- **Chrome / Brave**: Type `chrome://extensions` in the address bar and press **Enter**.
- **Edge**: Type `edge://extensions` in the address bar.

### Step 2: Enable Developer Mode
In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

### Step 3: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left action toolbar.
2. Select the directory:
   ```text
   /Users/abhijeetraut/Documents/All-Projects/extensions/link-inspector-extension
   ```
3. Click **Select Folder** / **Open**.

### Step 4: Pin the Extension
Click the **Puzzle piece icon** (Extensions menu) in the top-right toolbar of Chrome and pin **Link Inspector Pro & Broken Link Checker**.

---

## 📖 How to Use

### 1. Hover Inspector Mode
1. Click the **Link Inspector** popup icon in your browser toolbar.
2. Toggle **Interactive Inspector** to **ON**.
3. Hover over any link on any website. A glassmorphic card will appear displaying link attributes and live HTTP status.

### 2. Visual Link Highlighting
1. Open the popup dashboard.
2. Toggle **Visual Highlighting** to **ON**.
3. Page links will immediately be framed with color badges representing Internal, External, and Nofollow status.

### 3. Full Page Link Health Audit
1. Open the extension popup on any webpage.
2. Click **⚡ Scan Link Health**.
3. Watch the progress bar as the background service worker audits link status codes.
4. Click **📥 Export CSV** to download the link report.

---

## 📁 Project Structure

```text
link-inspector-extension/
├── manifest.json            # Chrome Manifest V3 configuration
├── background/
│   └── background.js        # Service worker (HTTP status checking, CORS handling, context menus)
├── content/
│   ├── content.js           # DOM link extraction, hover cards, visual highlights
│   └── content.css          # Floating tooltip, highlight overlays, toast styles
├── popup/
│   ├── popup.html           # Control dashboard layout
│   ├── popup.css            # Dark mode glassmorphic UI stylesheet
│   └── popup.js             # Controller logic, search/filtering, CSV export
└── assets/
    ├── generate_icons.js    # PNG icon generator script
    ├── icon16.png           # 16x16 icon
    ├── icon48.png           # 48x48 icon
    └── icon128.png          # 128x128 icon
```

---

## 🔒 Permissions & Privacy

- `activeTab` & `scripting`: Required to inspect DOM elements on the active tab.
- `storage`: Preserves user settings (inspector state, highlight toggles).
- `contextMenus`: Adds right-click inspect options.
- `<all_urls>` host permission: Enables background service worker to check HTTP status codes without CORS restrictions.
- **Privacy Notice**: No user data or browsing activity is sent to external servers. All checks run locally within your browser extension environment.
