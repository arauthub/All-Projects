# Privacy Policy for Link Inspector Pro & Broken Link Checker

**Last Updated**: September 5, 2026  
**Developer**: Abhijeet Raut ([github.com/arauthub](https://github.com/arauthub))  
**Contact**: theabhijeetraut@gmail.com  
**Extension**: Link Inspector Pro & Broken Link Checker (Chrome Manifest V3)

---

## 1. Overview & Commitment to Privacy

**Link Inspector Pro & Broken Link Checker** ("the Extension") is designed with a strict **privacy-first, client-side only** architecture. We believe your web browsing activity and data belong exclusively to you. 

* The Extension **does NOT collect, harvest, store, or transmit any personally identifiable information (PII)**.
* The Extension **does NOT track your browsing history**, search queries, IP address, device fingerprints, or account credentials.
* The Extension **does NOT communicate with any third-party telemetry, tracking, or analytics services**.

All inspections, status evaluations, and link highlighting take place entirely within your local browser environment.

---

## 2. Information We Handle Locally

The Extension interacts only with the following data on the active webpage you choose to inspect:

1. **Hyperlink Metadata**: The target URL (`href`), anchor text, image alt text, and link attributes (`target`, `rel`) of `<a>` elements found within the Document Object Model (DOM) of the webpage you are viewing.
2. **HTTP Status Code Verification**: When you hover over a link or initiate a "Scan Link Health" action, the background service worker sends standard HTTP `HEAD` or `GET` network requests directly to the target URL to determine its status code (e.g., 200 OK, 301 Redirect, 404 Not Found) and latency. No cookies, authentication tokens, or personal identifiers are attached to these requests.
3. **Local User Settings**: The Extension uses Chrome's `storage.local` API to persist your personal preferences across sessions, including:
   - Inspector enabled/disabled state
   - Visual highlighting enabled/disabled state
   - Preferred hover pointer style (`default`, `magnifier`, `crosshair`, `target`)
   - Highlight categories (`internal`, `external`, `nofollow`, `broken`)
   
   *This data is stored solely on your local computer and is never synced to external servers.*

---

## 3. Explanation of Browser Permissions

The Extension requests only the minimum necessary permissions required to perform its stated utility:

* **`activeTab`**: Allows the Extension to read link attributes on the specific browser tab you are currently viewing and interacting with.
* **`scripting`**: Allows the Extension to inject the user interface overlays (hover cards, visual highlights, and toasts) into the active tab.
* **`storage`**: Used exclusively to save user settings and UI preferences locally on your device.
* **`contextMenus`**: Adds convenient right-click shortcut options ("Inspect Link Details", "Toggle Visual Link Highlights", "Scan All Links for Errors").
* **`host_permissions: ["<all_urls>"]`**: Required solely because links on any webpage can point to any external domain on the internet. To audit HTTP status codes (checking if links are broken or redirected) without being blocked by Cross-Origin Resource Sharing (CORS) restrictions, the background service worker must be permitted to send network check requests to arbitrary destination URLs.

---

## 4. Third-Party Services & Data Sharing

* We do not sell, rent, monetize, or trade user data.
* We do not integrate third-party analytics (e.g., Google Analytics, Mixpanel) or advertising networks into the Extension.
* **Wayback Machine Recovery**: When you explicitly click the "Recover via Wayback Machine" button on a broken link, your browser opens `https://web.archive.org/web/*/<target-url>` in a new tab. This action is subject to the [Internet Archive's Privacy Policy](https://archive.org/about/terms.php).

---

## 5. Changes to This Privacy Policy

If any functional updates require changes to this Privacy Policy, the updated document will be published to the public GitHub repository. Continued use of the Extension constitutes acceptance of the current policy.

---

## 6. Contact & Inquiries

For questions, concerns, or technical inquiries regarding this Privacy Policy or the Extension's security practices, please contact:

* **Email**: theabhijeetraut@gmail.com
* **GitHub Repository**: [https://github.com/arauthub/All-Projects](https://github.com/arauthub/All-Projects)
* **Developer Profile**: [https://github.com/arauthub](https://github.com/arauthub)
