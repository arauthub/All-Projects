# Privacy Policy for API Pulse Pro

**Last Updated**: October 11, 2026  
**Developer**: Abhijeet Raut ([github.com/arauthub](https://github.com/arauthub))  
**Extension**: API Pulse Pro: Network Inspector, Replay & Mock Studio (Manifest V3)

---

## 1. Overview & Commitment to Privacy

**API Pulse Pro** ("the Extension") is designed with a strict **privacy-first, 100% local client-side only** architecture. Software engineers deal with proprietary APIs, authorization tokens, staging servers, and sensitive data. We believe this data must remain strictly on your local machine.

* The Extension **does NOT collect, record, harvest, or transmit any personally identifiable information (PII)**.
* The Extension **does NOT communicate with any external tracking, telemetry, or analytics server**.
* The Extension **does NOT send your API requests, responses, headers, or payloads to any cloud server**.
* All network interception, mocking, request replaying, diffing, and inspection happen exclusively in your local browser instance.

---

## 2. Information Handled Locally

The Extension monitors and stores network transactions solely within your local browser memory and Chrome local storage:

1. **Captured Request Metadata**: HTTP method, URL, headers, and request body (for POST/PUT requests).
2. **Captured Response Metadata**: Status code, headers, latency duration, and response body.
3. **Mocking Configurations**: Custom mock patterns, status codes, and mock JSON bodies saved in `chrome.storage.local`.
4. **User Preferences**: Pinned request IDs, active filters, and HUD floating positions stored in local storage.

*None of this data is ever uploaded, synchronized to third-party endpoints, or transmitted outside your local machine.*

---

## 3. Explanation of Browser Permissions

* **`storage`**: Persists your mock rules, pinned requests, and workbench preferences locally on your device.
* **`activeTab`**: Allows the extension to interact with and display the in-page Floating HUD on your current tab.
* **`scripting`**: Required to inject the MAIN-world interceptor for monkey-patching `fetch` and `XMLHttpRequest`.
* **`<all_urls>`**: Required to enable developers to inspect API calls across all development origins (including `localhost`, internal staging, and production domains).

---

## 4. Third-Party Services & Telemetry

API Pulse Pro uses **zero third-party services**, zero tracking scripts, zero CDNs, and zero analytics packages.

---

## 5. Contact & Questions

If you have questions about this policy or the extension:
- GitHub: [https://github.com/arauthub](https://github.com/arauthub)
