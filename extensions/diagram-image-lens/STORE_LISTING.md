# 🏪 Chrome Web Store & Edge Add-ons Listing Metadata

Use the copy and justifications below when submitting **Diagram & Image Lens Pro** to the **Google Chrome Web Store Developer Console** and **Microsoft Edge Partner Center**.

---

## 1. Store Metadata & General Information

* **Extension Name**: `Diagram & Image Lens Pro`
* **Version**: `1.0.0`
* **Short Description** (128 / 132 chars):  
  `Magnify images and diagrams with HD loupe, deep-zoom blueprints, copy high-res images to clipboard, and snip area screenshots.`
* **Primary Category**: `Productivity`
* **Secondary Category**: `Developer Tools`
* **Pricing**: `Free`
* **Language**: `English`
* **Privacy Policy URL**:  
  `https://github.com/arauthub/All-Projects/blob/main/extensions/diagram-image-lens/PRIVACY_POLICY.md`
* **Support URL / Website**:  
  `https://github.com/arauthub/All-Projects`

---

## 2. Detailed Description (Copy & Paste into Store Listing)

```text
🔍 Diagram & Image Lens Pro: The Precision Magnifier, Blueprint Deep-Zoom & Screenshot Suite for Developers, Engineers, Researchers & Designers.

Ever struggled to read tiny schematics, intricate Mermaid diagrams, architecture flowcharts, mathematical formulas, or high-density document figures? Diagram & Image Lens Pro lets you inspect, magnify, copy, and capture any image or vector diagram with zero hassle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔬 INTERACTIVE HOVER LOUPE (MAGNIFYING GLASS)
• Hover over any image, SVG, HTML5 canvas, or diagram to view an instant HD magnified loupe.
• Seamless zoom power from 2x up to 16x with real-time keyboard controls (+ / -).
• Customizable lens shapes: Circular precision loupe or modern rounded square with center reticle crosshair.

📐 DEEP-ZOOM BLUEPRINT LIGHTBOX
• Fullscreen high-definition canvas viewer for technical schematics, patent diagrams, and system architecture charts.
• Ultra-smooth pan and zoom from 10% up to 1000% via mouse wheel or touchpad pinch.
• Invert Colors Mode: Instantly invert schematics and dark-mode blueprints for maximum readability.
• High Contrast & Grayscale Filters: Make faded document text and wireframe charts pop out.
• 90° Rotation & Horizontal/Vertical Flip for inverted diagrams.

⚡ ONE-CLICK COPY ENGINE
• Copy any image or diagram directly to your system clipboard as a high-resolution PNG.
• Native vector SVG copy support: exports clean, crisp vector code or SVG data URIs.
• Never deal with disabled right-click or protected image elements again.

✂️ PRECISION AREA SNIPPING TOOL
• Drag-to-select crosshair tool captures any region of the webpage or document (Cmd+Shift+S / Alt+Shift+S).
• Automatic Retina / 4K high-DPI scaling for ultra-sharp screenshot output.
• Instant action bar: Copy to Clipboard, Download PNG, or Open directly in the Deep-Zoom Lightbox.

📊 PAGE VISUAL ASSET SCANNER & GALLERY
• Open the extension popup to view a live thumbnail gallery of every diagram, SVG vector, and chart on the active page.
• 1-click inspection takes you directly into the full-screen Deep-Zoom viewer.

⌨️ PRODUCTIVITY SHORTCUTS
• Command+Shift+M (Mac) / Alt+Shift+M (Windows): Toggle hover loupe.
• Command+Shift+S (Mac) / Alt+Shift+S (Windows): Launch area screenshot snip tool.
• Z: Open currently hovered image in Deep-Zoom Lightbox.
• C: Copy image/diagram to clipboard as PNG.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 100% PRIVACY-FIRST & CLIENT-SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• No external tracking servers, analytics, or remote code.
• All image processing, magnification, and screenshot cropping occurs 100% locally in your browser.
• Open-source codebase verified for privacy.

Install Diagram & Image Lens Pro and inspect visual assets with crystal clarity!
```

---

## 3. Single Purpose Description (For Store Review)

**Single Purpose Statement**:  
> *"To magnify, deep-zoom, copy, and capture screenshots of images, vector diagrams, and document visuals on web pages."*

---

## 4. Privacy Practices Tab (Store Review Questionnaire)

When filling out the **Privacy Practices** tab in the Chrome Web Store Developer Console, select the following options:

### ⚡ Remote Code Declaration
* **Question**: **"Are you using remote code?"**
* **Answer**: Select **`No, I am not using remote code`**
* **Rationale**: Manifest V3 compliant. Diagram & Image Lens Pro packages 100% of its scripts (`background.js`, `content.js`, `popup.js`), HTML, and CSS directly inside the extension archive. It does not fetch external CDN scripts, dynamic code, or use `eval()`.

### 🛡️ Data Usage / Data Collection Declaration
* **Question**: **"Do you collect or transmit any user data?"**
* **Answer**: Select **`No, I do not collect or transmit user data`** (or check **`I certify that my extension doesn't collect or transmit any user data`**).
* **Data categories**: Leave **all data category checkboxes unchecked**.
* **Compliance Checkboxes**:
  - [x] *I confirm that my item complies with the Chrome Web Store Developer Program Policies.*
  - [x] *I confirm that my item complies with the Limited Use policy.*

---

## 5. Permission Justifications (Copy & Paste for Store Reviewers)

* **`activeTab`**:  
  > *"Required to detect images, SVG vector diagrams, and HTML5 canvas elements on the active webpage and inject the interactive hover loupe and deep-zoom viewer upon user request."*

* **`storage`**:  
  > *"Required to save user preferences locally across browser sessions, including preferred zoom magnification (2x–16x), lens shape (circle/square), lens size, and toolbar visibility."*

* **`contextMenus`**:  
  > *"Required to provide right-click options for users to inspect target images in the Deep-Zoom lightbox, copy images as PNG, or launch the area screenshot snip tool."*

* **`clipboardWrite`**:  
  > *"Required to copy image and screenshot PNG data directly into the user's system clipboard when they explicitly click the 'Copy PNG' button."*

* **`<all_urls>` (Host Permissions)**:  
  > *"Required for the Chrome Web Store `chrome.tabs.captureVisibleTab` API to capture and crop high-resolution area screenshots across web pages, and to read image canvas data across origins without Cross-Origin Resource Sharing (CORS) blocks."*

---

## 6. Graphic Assets Checklist

- [x] **Store Icon (128 x 128 px)**: `assets/icon128.png`
- [x] **Small Promo Tile (440 x 280 px)**: `store_assets/promo_tile_small_440x280.png`
- [x] **Marquee Promo Tile (1400 x 560 px)**: `store_assets/promo_tile_marquee_1400x560.png`
- [x] **Screenshot 1 (1280 x 800 px)**: `store_assets/screenshot_1_hover_loupe.png`
- [x] **Screenshot 2 (1280 x 800 px)**: `store_assets/screenshot_2_blueprint_deepzoom.png`
- [x] **Screenshot 3 (1280 x 800 px)**: `store_assets/screenshot_3_area_snipping.png`
- [x] **Screenshot 4 (1280 x 800 px)**: `store_assets/screenshot_4_popup_dashboard.png`
