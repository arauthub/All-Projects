# ⚡ API Pulse Pro: Network Inspector, Replay & Mock Studio

> **The modern Chrome extension that turns your browser into an IDE-grade API playground.**  
> Monitor all API calls in real-time, inspect POST requests & JSON payloads, replay calls with active page cookies, mock server responses on the fly, and auto-generate TypeScript interfaces with a single click.

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-38bdf8.svg?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](../../LICENSE)

📄 **Technical Documentation**: [Technical Design Document](DESIGN.md) • [Privacy Policy](PRIVACY_POLICY.md) • [Store Listing](STORE_LISTING.md)

---

## 🌟 Why Engineers Get Addicted to API Pulse Pro

Standard browser DevTools Network tabs are cluttered with hundreds of script chunks, stylesheet files, images, analytics beacons, and font files. Finding your API calls, inspecting POST bodies, replaying requests with session cookies, or testing what happens when an endpoint fails is clumsy.

**API Pulse Pro** is built specifically for frontend, backend, full-stack, and QA engineers who want immediate clarity and full control over every network transaction:

1. **⚡ Laser-Focused API & POST Monitoring**
   - Automatically intercepts both `window.fetch()` and `XMLHttpRequest` calls in the page's execution context.
   - Distinct, color-coded badges for **POST**, **GET**, **PUT/PATCH**, **DELETE**, and **GraphQL**.
   - Captures request headers, query parameters, serialized request payloads (JSON, FormData, URL-encoded), response status, response headers, latency waterfall, and parsed response bodies.

2. **🪄 In-Page Floating HUD (Heads-Up Display)**
   - A sleek, dark-mode glassmorphic floating capsule docked right on the web page.
   - Shows live counters: e.g. `14 APIs | 6 POST | 0 ERR`.
   - Flashes an animated pulse dot whenever new traffic arrives.
   - Draggable anywhere on the screen (remembers position).
   - Expandable into an **In-Page Quick Inspector drawer** without opening DevTools!
   - Keyboard shortcut: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> (Mac: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd>).

3. **🚀 Full-Screen API Studio Workbench (`studio/studio.html`)**
   - Dedicated full-page developer workstation.
   - **Live API Stream**: search across URLs, headers, payloads, and response bodies in real-time.
   - **Filter Pills**: One-click toggles for `[ALL]`, `[POST]`, `[GET]`, `[PUT/PATCH]`, `[DELETE]`, `[GRAPHQL]`, `[ERRORS]`, and `[SLOW (>500ms)]`.
   - **Pin & Star**: Keep critical API calls pinned to the top of your stream.
   - **Auto-Scroll**: Toggle live following on/off.

4. **⚡ Interactive Replay in Page Context**
   - Replay any captured request directly from inside the page context, retaining active authentication tokens, session cookies, and CORS permissions.
   - Or test via direct studio fetch with customized headers and body.
   - View execution results side-by-side with the original response.

5. **🎭 In-Browser Mocking Engine (Response Stubbing)**
   - Intercept matching API calls directly in the browser and return synthetic responses without touching your backend server.
   - Match by URL wildcard (`/api/v1/user*`) or regular expression.
   - Customize status code (`200`, `400`, `404`, `500`), simulated delay slider (0ms to 3000ms), and custom JSON response body.
   - Test frontend loading spinners, empty states, and error toasts effortlessly!

6. **📐 Auto-Generated TypeScript Interfaces**
   - Instantly analyzes request payloads and response bodies and generates clean, production-ready TypeScript interfaces.
   - Strongly types nested objects, arrays, and primitive fields.

7. **📋 Instant Multi-Language Code Generators**
   - One-click export to:
     - **cURL (bash)** (escaped headers and payload)
     - **JavaScript `fetch()`**
     - **Axios (JS/TS)**
     - **Python `requests`**
     - **Go `net/http`**

8. **🔑 Security & Secrets Scanner + JWT Decoder**
   - Automatically detects Bearer tokens, API keys, and Authorization headers.
   - Built-in **JWT Decoder** displays decoded Header, Payload claims, and live expiration countdown or EXPIRED warning.

9. **⚖️ Side-by-Side JSON Diff Tool**
   - Compare any two captured API responses side-by-side with color-coded diffing.

10. **🛠️ Chrome DevTools Panel Integration**
    - Seamlessly adds an **API Pulse** tab inside Chrome DevTools (<kbd>F12</kbd>).

---

## 🏗️ Architecture & Extension Structure

Built natively on **Manifest V3** with zero runtime build dependencies:

```
api-pulse-pro/
├── manifest.json            # Manifest V3 specification
├── assets/                  # High-resolution icons (16, 32, 48, 128px)
├── background/
│   └── background.js        # Service worker managing tabs, badges, & keyboard commands
├── content/
│   ├── interceptor.js       # MAIN-world monkey-patch for fetch, XHR, mocking, & replay
│   ├── content.js           # ISOLATED-world bridge & draggable In-Page Floating HUD
│   └── content.css          # Scoped glassmorphic styling for in-page HUD & drawer
├── popup/
│   ├── popup.html           # Extension toolbar popup interface
│   ├── popup.css            # Dark cyber styling
│   └── popup.js             # Tab metrics, search, quick inspect, export
├── studio/
│   ├── studio.html          # Full-screen developer API Studio & workbench
│   ├── studio.css           # IDE-grade layout, splitters, code editors
│   └── studio.js            # Master controller (Replay, Mocks, Types, Code Gen, Diff)
├── devtools/
│   ├── devtools.html        # DevTools page registrar
│   └── devtools.js          # Registers 'API Pulse' panel in F12
├── test-page/
│   ├── index.html           # Interactive API test lab
│   ├── style.css            # Test ground UI styling
│   └── test-api.js          # Realistic mock endpoints (JWT auth, checkout, GraphQL)
├── scripts/
│   └── generate_assets.js   # Pure Node.js PNG canvas generator for icons
├── package.sh               # Production packaging script
├── PRIVACY_POLICY.md        # Privacy statement (100% local, no tracking)
├── STORE_LISTING.md         # Chrome Web Store copy
└── README.md
```

---

## 🚀 How to Install & Run

### 1. Load Extension in Chrome / Edge / Brave

1. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the folder:
   ```
   /Users/abhijeetraut/Documents/All-Projects/extensions/api-pulse-pro
   ```
5. Pin **API Pulse Pro** to your browser toolbar!

### 2. Launch the Interactive Test Playground

1. In your browser, open the included test ground:
   ```
   file:///Users/abhijeetraut/Documents/All-Projects/extensions/api-pulse-pro/test-page/index.html
   ```
2. Trigger:
   - **POST User Login**: see the JWT token captured and decoded in the Security tab!
   - **POST Checkout**: inspect nested JSON payloads and generate TypeScript interfaces.
   - **POST GraphQL**: verify operation name and mutation inspection.
   - **Slow POST (1.5s)**: check the timing waterfall.
   - **500 Error**: observe instant error badging.
   - Toggle **Auto-Simulate Traffic** to watch live requests stream in!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd>) | Toggle In-Page Floating HUD & Quick Drawer |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>) | Launch Full API Pulse Studio Workbench |
| <kbd>⌘</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Focus Universal Search in Studio |
| <kbd>Escape</kbd> | Close In-Page Drawer or Open Modals |

---

## 📦 Building Production Package

Run the bundling script to create a production zip file ready for the Chrome Web Store:

```bash
cd extensions/api-pulse-pro
./package.sh
```

Output is generated at `dist/api-pulse-pro-v1.0.0.zip`.

---

## 🔒 Privacy & Security

API Pulse Pro runs **100% locally in your browser**. It contains zero analytics, zero external tracking, and transmits zero data to third-party servers. All request inspection and mocking occurs exclusively within your local browser runtime.
