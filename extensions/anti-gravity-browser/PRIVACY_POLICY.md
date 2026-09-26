# Privacy Policy for Anti-Gravity Web

**Effective Date:** September 18, 2026  
**Last Updated:** September 18, 2026  
**Developer:** Abhijeet Raut  
**Extension Name:** Anti-Gravity Web: Arcade Physics Browser  
**Repository:** [https://github.com/arauthub/anti-gravity-browser](https://github.com/arauthub/anti-gravity-browser)

---

## 1. Introduction

**Anti-Gravity Web** ("we", "our", or "the Extension") is committed to protecting your privacy. This Privacy Policy explains our data collection, handling, and storage practices in accordance with the Google Chrome Web Store Developer Program Policies and the Google API Services User Data Policy.

**Summary:**  
- **We do NOT collect, transmit, store, sell, or monetize any of your personal data or browsing history.**
- All physics simulations and arcade interactions occur **100% locally on your computer** within client-side memory.
- No network requests are made to any remote servers, analytics services, or third-party trackers.

---

## 2. Data Collection and Usage

### A. Personal Identifiable Information (PII)
The Extension does **NOT** collect any personally identifiable information, including but not limited to:
- Names, email addresses, physical addresses, or phone numbers.
- User accounts, passwords, or authentication credentials.
- Financial, payment, or biometric information.

### B. Browsing Activity and Webpage Content
- **In-Memory DOM Extraction:** When you activate Anti-Gravity mode on an active tab, the extension reads the computed styles and coordinates of visible semantic elements on that webpage (such as cards, headings, and buttons) to render floating physics bodies inside an isolated overlay.
- **Strictly Local Processing:** This DOM processing occurs **exclusively in your browser's local RAM**. At no point is the content of any webpage, text, or image transmitted to external servers, cloud databases, or third parties.
- **No Keystroke or Form Logging:** The extension does not record, log, or transmit form inputs, password fields, or private data.

### C. Chrome Storage (`chrome.storage.local`)
The Extension uses Google Chrome's local storage API solely to persist non-identifiable user preferences across sessions:
- Sound effects toggle (muted or unmuted).
- Preferred game mode (`asteroids`, `katamari`, or `sandbox`).
- Preferred gravity strength setting.
- Tutorial completion state (`ag_tutorial_seen = true`).

All stored preference data remains on your local device and is never synchronized with external servers.

---

## 3. Permissions Justification

In compliance with the Chrome Web Store **Principle of Least Privilege**, the Extension requests only the minimum permissions required for core functionality:

| Permission | Technical Purpose |
| :--- | :--- |
| **`activeTab`** | Allows the extension to run physics simulations on the specific tab you explicitly activate, without granting background access to all tabs. |
| **`storage`** | Saves your local gameplay preferences (audio volume, tutorial status, active mode) on your local device. |
| **`scripting`** | Injects the bundled Matter.js physics engine and content script into the active page when you click the extension action or press the keyboard shortcut. |
| **`<all_urls>`** | Enables the playful anti-gravity simulation to function across general websites when explicitly launched by the user. |

---

## 4. Third-Party Services and Remote Code

- **Zero Remote Code Execution:** The Extension does not load external scripts, remote CDNs, Google Analytics, or third-party tracking pixels. All code, scripts (`matter.min.js`), stylesheets, and audio synthesis are bundled locally in the extension package, strictly conforming to Chrome Extension Manifest V3 security standards.
- **Zero Third-Party Data Sharing:** Because no data is collected, no user information is ever sold, transferred, or shared with third parties, advertising networks, or data brokers.

---

## 5. Security Practices

The Extension follows industry-standard security protocols:
- Operates under strict Manifest V3 Content Security Policies (`script-src 'self'; object-src 'self';`).
- Non-destructive DOM rendering: the original host webpage layout is never broken, modified, or permanently deleted. Pressing `Escape` restores the host page to its original state immediately.

---

## 6. Children's Privacy

The Extension does not knowingly collect or solicit any personal information from children under the age of 13.

---

## 7. Changes to This Privacy Policy

We may periodically update this Privacy Policy. Any updates will be posted to this document and reflected in the extension's release notes. Continued use of the Extension after any modification constitutes acceptance of the updated policy.

---

## 8. Contact Us

If you have questions, feedback, or concerns regarding this Privacy Policy or our security practices, please contact:

- **Developer:** Abhijeet Raut
- **GitHub Issues:** [https://github.com/arauthub/anti-gravity-browser/issues](https://github.com/arauthub/anti-gravity-browser/issues)
- **Repository:** [https://github.com/arauthub/anti-gravity-browser](https://github.com/arauthub/anti-gravity-browser)
