# 🔍 Link Inspector Pro: Technical Design Document

> **Document Version**: 1.0.0  
> **Status**: Approved & Production Ready  
> **Target Platform**: Google Chrome, Microsoft Edge, Brave (Chromium Manifest V3)  
> **Author**: Abhijeet Raut ([@arauthub](https://github.com/arauthub))  

---

## 1. Executive Summary & Objectives

Web hyperlinking is the fundamental substrate of the internet, but broken links (404/5xx), unsafe redirects, insecure HTTP mixed content, tabnabbing vulnerabilities, and messy marketing tracking parameters degrade user experience, harm SEO search ranking, and expose web applications to security hazards.

**Link Inspector Pro & Broken Link Checker** is a high-performance browser extension built on Chromium Manifest V3 designed to:
1. **Interactive Hover Link Inspection**: Real-time floating card displaying protocol, target, anchor text, and live HTTP status code.
2. **Automated SEO & Security Risk Audit**: Identifies tabnabbing (`target="_blank"` without `rel="noopener"`), mixed content, dummy links (`#`, `javascript:void(0)`), and missing anchor text.
3. **Tracking Parameter Sanitization**: One-click URL stripping of UTM parameters, click IDs (`gclid`, `fbclid`), and referral tags.
4. **Wayback Machine 404 Recovery**: Automated 1-click lookup to retrieve archived snapshots of dead links on `web.archive.org`.
5. **Full-Page Concurrent Health Scanner**: Asynchronous link health auditing with throttled concurrency, progress telemetry, and redirect resolution.
6. **Dual Export Pipeline**: Immediate export of page link inventories to structured CSV and JSON formats.

---

## 2. Technology Stack & Prerequisites

| Subsystem | Technology | Specification / Version | Rationale & Trade-offs |
| :--- | :--- | :--- | :--- |
| **Extension Framework** | Chromium Extensions API | Manifest V3 (MV3) | Compliance with Chrome Web Store; background service worker execution; declarative permissions. |
| **Language Runtime** | JavaScript (ES6+ / ECMAScript 2022) | Native Browser Engine | Native `Promise.allSettled`, `URL`, `URLSearchParams`, and `AbortController` primitives for robust network requests. |
| **DOM Inspection Engine** | Native DOM Traversal & Mutation Observer | HTML5 Web APIs | Live scanning of dynamic anchors `<a>`, area tags, and SVG xlink references with zero DOM framework overhead. |
| **Network Audit Worker** | `fetch()` with HEAD/GET fallback | Background Service Worker | Bypasses page-level CORS restrictions by performing HTTP status checks via the extension background context. |
| **Export Serialization** | Blob & Data URI Streamers | Native Web APIs | Synthesizes client-side RFC 4180 compliant CSV and structured JSON files without backend server dependencies. |
| **UI Design System** | Glassmorphic Dark Vanilla CSS | Scoped CSS3 | High-contrast status badges (Green 200, Amber 301, Red 404, Purple 500) isolated to avoid host CSS collision. |
| **Packaging & CI** | POSIX Shell (`package.sh`) | Bash 4+ / Zip | Deterministic production artifact generation in `dist/link-inspector-extension-v1.0.0.zip`. |

---

## 3. System Architecture & Audit Pipeline

```mermaid
graph TD
    User([User Hover / Action / Hotkey Cmd+Shift+L]) --> ContentScript[content.js DOM Controller]
    
    subgraph Page DOM Context
        ContentScript --> LinkScanner[Live Link Scanner: a href]
        LinkScanner --> SecurityAuditor[Security Audit: Mixed Content, Tabnabbing, rel]
        LinkScanner --> SEOAuditor[SEO Audit: Empty Anchor, Generic Text]
        LinkScanner --> HoverCard[Interactive Glassmorphic Hover Card]
    end

    subgraph Service Worker Network Engine
        ContentScript -->|chrome.runtime.sendMessage CHECK_URL| BgWorker[background.js Service Worker]
        BgWorker -->|HEAD Request / Fallback GET| RemoteServer[Remote Web Server]
        RemoteServer -->>BgWorker: HTTP Status 200/301/404 + Redirect Location
        BgWorker -->>ContentScript: Status Badge + Latency Metrics
    end

    subgraph User Actions & Recovery
        HoverCard --> CleanURL[Strip UTM / fbclid / gclid]
        HoverCard --> CopyMarkdown[Export [Anchor](URL)]
        HoverCard --> Wayback[Wayback Machine 404 Archive Fetch]
        HoverCard --> Highlight[Flash-Highlight Matching Links]
    end

    subgraph Reporting & Bulk Audit
        ContentScript <--> Popup[popup/popup.js Bulk Scanner]
        Popup --> ExportCSV[CSV Audit Exporter]
        Popup --> ExportJSON[JSON Audit Exporter]
    end
```

---

## 4. Key Subsystem Specifications

### 4.1. Real-Time Hover Inspector (`content/content.js`)
* **Event Delegation**: Listens to mouseover events on anchor tags with debounce (150ms) to prevent unwanted popups during rapid scrolling.
* **Metadata Extraction**:
  * `href`: Resolved absolute URL via `new URL(el.href, document.baseURI)`.
  * `text`: Inner text or nested `img[alt]` text.
  * `target`: Evaluates `_blank`, `_self`, `_parent`, `_top`.
  * `rel`: Evaluates `noopener`, `noreferrer`, `nofollow`, `sponsored`.
* **Heuristic Risk Detection**:
  * *Mixed Content*: If page protocol is `https:` and link protocol is `http:`.
  * *Tabnabbing*: If `target === "_blank"` and `rel` does NOT include `noopener`.
  * *Dummy Link*: If URL matches `^#`, `javascript:void(0)`, or empty.
  * *Weak Anchor*: If text is empty, whitespace, or generic ("click here", "read more", "link").

### 4.2. Background Network Status Validation (`background/background.js`)
* **CORS Bypass**: Content scripts cannot directly send arbitrary cross-origin `fetch()` requests due to CORS restrictions. The background service worker executes status queries using extension origin permissions.
* **HEAD-first Optimization**:
  ```javascript
  async function checkLinkStatus(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      if (res.status === 405) { // Method Not Allowed on HEAD
        res = await fetch(url, { method: 'GET', signal: controller.signal });
      }
      return { status: res.status, ok: res.ok, redirected: res.redirected, finalUrl: res.url };
    } catch (err) {
      return { status: 0, error: err.message };
    } finally {
      clearTimeout(timeout);
    }
  }
  ```
* **Status Badge Matrix**:
  * `2xx`: Green (Healthy / Active)
  * `3xx`: Amber (Redirected with final destination preview)
  * `4xx`: Red (Client Error / Broken Link)
  * `5xx`: Purple (Server Failure)
  * `0`: Gray (Network / Timeout / DNS Failure)

### 4.3. URL Sanitizer Engine
* Strips tracking parameters from target URLs:
  * `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
  * `fbclid`, `gclid`, `msclkid`, `mc_eid`, `_hsenc`, `ref`, `source`
* Re-encodes cleaned URL maintaining path, query parameters, and hash fragments.

### 4.4. Full Page Audit & Dual Exporter (`popup/popup.js`)
* Concurrency Queue: Audits all page links with a concurrency pool of 5 simultaneous requests to avoid browser connection exhaustion.
* Dual Export formats:
  * **CSV**: Columns: `URL, Anchor Text, HTTP Status, Redirect Destination, Mixed Content, Tabnabbing Risk, Rel Attributes`.
  * **JSON**: Normalized array of audited link objects ready for automated CI/CD integration.

---

## 5. Security & Manifest V3 Sandboxing

1. **Manifest V3 Model**:
   * Uses `activeTab`, `storage`, `contextMenus`, and host permissions.
   * Completely local execution; zero analytics or external tracking.
2. **Safe Wayback URL Routing**:
   * Wayback recovery routes requests directly to the official Internet Archive URL format:
     `https://web.archive.org/web/*/${encodeURIComponent(url)}` without intermediary proxy servers.

---

## 6. Execution & Verification Runbook

### Prerequisites
* Google Chrome (v109+), Microsoft Edge (v109+), or Brave browser.

### Installation
1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `/Users/abhijeetraut/Documents/All-Projects/extensions/link-inspector-extension`.

### Functional Verification
1. Open any public website (or local HTML test file with links).
2. Hover over any link:
   * Verify floating card appears showing URL, Anchor, and HTTP 200 badge.
3. Hover over broken/mock link:
   * Verify red 404 badge and **Wayback Machine** recovery button appears.
4. Click **Clean URL**: Verify tracking parameters (`utm_*`) are removed from clipboard.
5. Press `Cmd+Shift+L` (Mac) or `Alt+Shift+L` (Win): Verify inspection mode toggles.
6. Open popup dashboard and click **⚡ Scan Link Health**:
   * Verify live progress bar tracks inspected links.
   * Click **📥 Export CSV**: Verify CSV file downloads with accurate headers and data rows.

### Packaging
```bash
cd extensions/link-inspector-extension
./package.sh
```
Verify `dist/link-inspector-extension-v1.0.0.zip` is created cleanly.
