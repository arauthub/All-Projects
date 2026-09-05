# 🚀 Step-by-Step Extension Publishing Guide

This guide walks you through publishing **Link Inspector Pro & Broken Link Checker** to the **Google Chrome Web Store**, **Microsoft Edge Add-ons**, and **GitHub Releases** for public availability.

---

## 📦 Step 1: Build the Clean Production Package

The production `.zip` file is pre-built and located at:
```text
extensions/link-inspector-extension/dist/link-inspector-pro-v1.0.0.zip
```

To rebuild the package at any time, run:
```bash
cd extensions/link-inspector-extension
./package.sh
```
*(This script automatically excludes developer artifacts, git files, and `.DS_Store` to create a verified, store-compliant archive).*

---

## 🌐 Step 2: Publish to Google Chrome Web Store

The **Chrome Web Store** is the primary distribution channel for Chromium browsers (Google Chrome, Brave, Arc, Opera, etc.).

### 1. Register as a Chrome Web Store Developer
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. Pay the one-time **$5 USD** developer registration fee required by Google to prevent spam accounts.

### 2. Upload the Package
1. In the Developer Dashboard, click **New Item** (top right).
2. Drag and drop (or select) the production archive:
   ```text
   extensions/link-inspector-extension/dist/link-inspector-pro-v1.0.0.zip
   ```
3. Click **Upload**. Chrome will validate `manifest.json` automatically.

### 3. Complete the Store Listing
Refer to [STORE_LISTING.md](STORE_LISTING.md) for pre-written text:
* **Description**: Paste the detailed description from [STORE_LISTING.md](STORE_LISTING.md#2-detailed-description-copy--paste-into-store-listing).
* **Category**: Select **Developer Tools** (Secondary: **Productivity**).
* **Language**: Select **English**.
* **Graphic Assets**:
  * Upload at least 1 screenshot (1280 x 800 px).
  * Upload the Small Promo Tile (440 x 280 px).

### 4. Privacy & Permissions Justification
Under the **Privacy** tab:
* **Single Purpose Statement**:  
  `To inspect, analyze, highlight, and audit hyperlinks on web pages in real time, detecting broken links, redirects, tracking parameters, and security issues.`
* **Permission Justifications**: Copy the exact justifications provided in [STORE_LISTING.md](STORE_LISTING.md#4-permission-justifications-copy--paste-for-store-reviewers).
* **Data Usage Disclosures**: Certify that the extension does not collect or sell user data.
* **Privacy Policy URL**:  
  `https://github.com/arauthub/All-Projects/blob/main/extensions/link-inspector-extension/PRIVACY_POLICY.md`

### 5. Submit for Review
1. Click **Submit for Review**.
2. Google reviews typically take **24 to 72 hours**. Once approved, your extension will be live on `chromewebstore.google.com` with a public installation link!

---

## 🟦 Step 3: Publish to Microsoft Edge Add-ons (100% Free)

Publishing to the **Microsoft Edge Add-ons** store is **completely free** (no developer registration fee).

1. Go to the [Microsoft Partner Center - Edge Developer Dashboard](https://partner.microsoft.com/dashboard/microsoftedge).
2. Sign in with your Microsoft account and complete the free registration.
3. Click **Create new extension**.
4. Upload `dist/link-inspector-pro-v1.0.0.zip`.
5. *(Optional Shortcut)*: Edge Partner Center allows you to **import directly from your Chrome Web Store listing** once published on Chrome!
6. Paste the Privacy Policy URL and submit. Approvals typically take 1 to 2 business days.

---

## 🐙 Step 4: Publish a Public GitHub Release (Direct Download)

You can also make the extension immediately downloadable from your GitHub repository:

1. Open your repository: **[https://github.com/arauthub/All-Projects](https://github.com/arauthub/All-Projects)**.
2. Click **Releases** (right sidebar) → **Draft a new release**.
3. Tag version: `v1.0.0`
4. Release title: `Link Inspector Pro v1.0.0 - Public Release`
5. Attach the file:
   ```text
   extensions/link-inspector-extension/dist/link-inspector-pro-v1.0.0.zip
   ```
6. Click **Publish release**.

Users can download the `.zip`, unzip it, and load it into any Chromium browser via **Developer mode → Load unpacked**!
