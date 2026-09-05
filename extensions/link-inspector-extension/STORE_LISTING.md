# 🏪 Chrome Web Store & Edge Add-ons Listing Metadata

Use the ready-to-paste sections below when submitting **Link Inspector Pro & Broken Link Checker** to the **Google Chrome Web Store Developer Dashboard** and **Microsoft Edge Partner Center**.

---

## 1. Store Metadata & General Information

* **Extension Name**: `Link Inspector Pro & Broken Link Checker`
* **Version**: `1.0.0`
* **Short Description** (130 / 132 chars):  
  `Inspect links on hover, check broken links, track redirects, strip UTM tracking params, recover 404s via Wayback, & export audits.`
* **Primary Category**: `Developer Tools`
* **Secondary Category**: `Productivity`
* **Pricing**: `Free`
* **Language**: `English`
* **Privacy Policy URL**:  
  `https://github.com/arauthub/All-Projects/blob/main/extensions/link-inspector-extension/PRIVACY_POLICY.md`
* **Support URL / Website**:  
  `https://github.com/arauthub/All-Projects`

---

## 2. Detailed Description (Copy & Paste into Store Listing)

```text
🔍 Link Inspector Pro & Broken Link Checker: The Ultimate Web Link Auditor for Developers, SEO Specialists, QA Testers & Power Users.

Inspect, validate, highlight, clean, and audit every hyperlink on any webpage in real time with zero external servers and zero tracking.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 INTERACTIVE HOVER INSPECTOR
• Hover over any link to inspect target URL, anchor text, target/rel attributes, and live HTTP status.
• Fast-acting status badge: 200 OK (with response latency in ms), 301/302 Redirects, 404 Not Found, and 500 Server Errors.
• Interactive action toolbar lets you interact directly with links without leaving the page.

🧹 SMART UTM & TRACKING PARAMETER STRIPPER
• Remove messy marketing tokens (utm_source, utm_medium, utm_campaign, fbclid, gclid, mc_eid, etc.) with 1 click.
• "Clean URL" button copies clean, tracking-free links directly to your clipboard.

🔀 REDIRECT DESTINATION TRACKING
• Instantly see where shortened or redirected links lead (e.g., bit.ly or 301 redirects) directly in the hover card and dashboard.

🏛️ 1-CLICK WAYBACK MACHINE 404 RECOVERY
• Found a dead or broken link? Click "Recover via Wayback Machine" to view archived snapshots on web.archive.org.

🛡️ REAL-TIME SEO & SECURITY AUDITS
• Mixed Content Warning: Flags insecure HTTP links on secure HTTPS websites.
• Tabnabbing Risk Alert: Identifies target="_blank" links missing rel="noopener".
• Weak SEO Flags: Detects missing anchor/alt text or generic text ("click here", "read more").
• Dead Link Detector: Flags placeholder links (href="#" or javascript:void(0)).

🎯 CUSTOMIZABLE HOVER POINTERS
• Choose your preferred cursor inspection style: Default Arrow, Magnifier 🔍, Precision Crosshair ✛, or Target 🎯.

⌨️ GLOBAL KEYBOARD SHORTCUT
• Press Command+Shift+L (Mac) or Alt+Shift+L (Windows/Linux) to instantly toggle link inspection on any tab.

🎨 VISUAL LINK HIGHLIGHTER
• Color-code all links directly on the page:
  🟢 Green: Internal Links (same origin)
  🔵 Blue: External Outbound Links
  🟠 Orange: Nofollow & Sponsored Links
  🔴 Pulsing Red: Broken Links (4xx/5xx errors)

📊 FULL PAGE HEALTH AUDIT & DUAL EXPORT
• Concurrent asynchronous HTTP auditing across the entire active tab.
• Export structured audit reports to both CSV and JSON formats.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 100% PRIVACY-FIRST & CLIENT-SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• No user data or browsing activity is tracked, stored, or sent to external servers.
• All network checks are performed locally within your browser.
• Open-source codebase verified for privacy.

Press Cmd+Shift+L or click the extension icon to start auditing links today!
```

---

## 3. Single Purpose Description (For Store Review)

**Single Purpose Statement**:  
> *"To inspect, analyze, highlight, and audit hyperlinks on web pages in real time, detecting broken links, redirects, tracking parameters, and security issues."*

---

## 4. Permission Justifications (Copy & Paste for Store Reviewers)

Google Chrome Web Store requires clear justifications for each requested permission:

* **`activeTab`**:  
  > *"Required to read hyperlink DOM elements (<a> tags) and display interactive hover cards on the specific webpage the user chooses to inspect."*

* **`storage`**:  
  > *"Required to persist user preferences (inspector active state, visual highlight categories, and preferred hover pointer cursor style) locally across browser sessions."*

* **`contextMenus`**:  
  > *"Required to provide convenient right-click context menu shortcuts for inspecting links and toggling page-wide link highlighting."*

* **`scripting`**:  
  > *"Required to inject the floating inspection card, visual highlights, and toast notifications into the active tab when the extension is toggled."*

* **`<all_urls>` (Host Permissions)**:  
  > *"Required because hyperlinks on any inspected webpage can point to external domains anywhere on the internet. To check whether target links are broken (404/500) or redirected (301/302) without being blocked by Cross-Origin Resource Sharing (CORS), the background service worker must be permitted to send asynchronous HTTP HEAD/GET validation requests to arbitrary target URLs."*

---

## 5. Graphic Assets Requirements for Store Submission

When uploading to the developer dashboard, prepare the following graphic assets:

1. **Extension Icons** *(Already generated and packaged)*:
   * `16x16 px`: `assets/icon16.png`
   * `48x48 px`: `assets/icon48.png`
   * `128x128 px`: `assets/icon128.png`

2. **Screenshots** *(Minimum 1, recommended 3 to 5)*:
   * Resolution: **1280 x 800 px** (or 640 x 400 px), 24-bit PNG or JPEG without alpha channel.
   * Suggested screenshots:
     - Screenshot 1: Interactive Hover Popup on a webpage displaying URL, status, and action buttons.
     - Screenshot 2: Visual Link Highlighting (green, blue, orange, red outlines on a live site).
     - Screenshot 3: Popup Dashboard with 5-column metrics and link search/filtering.
     - Screenshot 4: 1-Click Wayback Machine recovery on a 404 broken link.
     - Screenshot 5: Clean URL utility stripping UTM tracking parameters.

3. **Small Promotional Tile** *(Required by Chrome Web Store)*:
   * Resolution: **440 x 280 px**, PNG or JPEG.
   * Concept: Dark slate background `#0b0f19`, 128px icon, title "Link Inspector Pro" and subtitle "Real-Time Link Auditor & Broken Link Checker".
