# Privacy Policy for Diagram & Image Lens Pro

**Last Updated:** September 9, 2026  
**Developer:** Abhijeet Raut ([arauthub](https://github.com/arauthub))  
**Repository:** [https://github.com/arauthub/All-Projects](https://github.com/arauthub/All-Projects)

---

## 1. Overview & Commitment to Privacy

**Diagram & Image Lens Pro** is built with an uncompromising, 100% client-side privacy architecture. 

Our core philosophy is simple: **Your visual content, document diagrams, screenshots, and browsing activity are strictly your own.**

* We do **not** collect, store, transmit, or monetize any user data.
* We do **not** use remote tracking servers, third-party analytics (e.g., Google Analytics), or telemetry SDKs.
* All image magnification, blueprint rendering, and screenshot cropping operations execute entirely within your local browser sandbox.

---

## 2. Permissions & Data Handling

Diagram & Image Lens Pro requests only the minimal browser permissions necessary to provide its core image inspection and screenshot capabilities:

| Permission | Purpose & Client-Side Scope |
| :--- | :--- |
| **`activeTab`** | Enables the hover loupe, quick toolbar, and deep-zoom modal on the webpage the user chooses to inspect. |
| **`storage`** | Persists user preferences locally (e.g., preferred zoom power, lens shape, and lens size) using `chrome.storage.local`. No data leaves your machine. |
| **`contextMenus`** | Adds convenient right-click context menu options to inspect images or launch the area snipping tool. |
| **`clipboardWrite`** | Allows the user to copy magnified images, vector graphics, and screenshots directly to the system clipboard upon explicit user action (e.g., clicking "Copy PNG"). |
| **`<all_urls>`** | Enables `chrome.tabs.captureVisibleTab` for capturing area screenshots and reading cross-origin image data without CORS blocks. |

---

## 3. Remote Code Declaration

In strict compliance with Google Chrome's Manifest V3 developer policies:
* **No Remote Code**: Diagram & Image Lens Pro does **not** download, execute, or evaluate remotely hosted code, CDN scripts, or external libraries.
* 100% of the extension code is packaged and distributed directly within the certified `.zip` extension bundle.

---

## 4. Third-Party Disclosures

Diagram & Image Lens Pro does **not** share, sell, or disclose any information to third parties, advertising networks, data brokers, or search engines.

---

## 5. Contact & Open Source Verification

The source code for Diagram & Image Lens Pro is open source and available for independent audit:
* GitHub: [https://github.com/arauthub/All-Projects/tree/main/extensions/diagram-image-lens](https://github.com/arauthub/All-Projects/tree/main/extensions/diagram-image-lens)
* Issues & Inquiries: [https://github.com/arauthub/All-Projects/issues](https://github.com/arauthub/All-Projects/issues)
