# 🔍 Diagram & Image Lens Pro

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-38bdf8.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4.svg?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Edge Add-ons](https://img.shields.io/badge/Microsoft-Edge%20Add--ons-0078D7.svg?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)

> The Ultimate Precision Magnifier, Blueprint Deep-Zoom Lightbox, and Area Screenshot Suite for Chrome and Edge.

Inspect tiny schematics, intricate Mermaid diagrams, architecture flowcharts, mathematical formulas, and document figures with crystal clarity. Copy images and vector graphics directly to your clipboard and take precision area screenshots.

---

## 🌟 Key Features

### 🔬 1. Interactive Hover Loupe (Magnifying Glass)
* **Real-time HD Magnification**: Tracks cursor across `<img>`, `<svg>`, `<canvas>`, and background images.
* **Configurable Zoom Levels**: Smooth 2x, 3x, 4x, 8x, or up to 16x magnification.
* **Customizable Lens Shapes**: Circular precision loupe or modern rounded square with center reticle crosshair.
* **Inline Key Controls**: Press `+` or `-` while hovering to adjust zoom power dynamically.

### 📐 2. Deep-Zoom Blueprint Lightbox
* **Full-Screen Canvas**: Perfect for reviewing architectural blueprints, patent drawings, and complex workflow charts.
* **Smooth Pan & Zoom**: Pan by dragging; zoom smoothly from 10% to 1000% using mouse wheel or touchpad.
* **Invert Colors Mode**: Inverts dark-mode diagrams and schematics for high-contrast visibility.
* **Filter Suite**: High-contrast mode and grayscale filters make faded technical documents pop out.
* **Transform Controls**: Rotate 90° clockwise and flip horizontally/vertically.

### ⚡ 3. One-Click Copy Engine
* **Direct Clipboard Write**: Copies any image, diagram, or canvas directly to your clipboard as a PNG (`ClipboardItem`).
* **Vector SVG Support**: Native handling for inline SVGs (Mermaid, D3, Excalidraw) ensuring infinite crispness.
* **Bypass Restrictions**: Seamlessly copies images even when right-click is disabled or obscured.

### ✂️ 4. Precision Area Snipping Tool
* **Interactive Drag Selection**: Press `Cmd+Shift+S` (or `Alt+Shift+S`) to drag a crosshair box over any region.
* **Retina High-DPI Output**: Automatically scales to device pixel ratio for ultra-sharp captures.
* **Instant Action Bar**: Copy directly to clipboard, download as PNG, or open immediately in the Deep-Zoom Lightbox.

### 📊 5. Page Visual Asset Scanner & Gallery
* **Live Discovery**: The extension popup automatically scans the active tab for all images, vector SVGs, and HTML5 canvas charts.
* **Thumbnail Gallery**: Displays dimensions, formats, and 1-click inspection into the Deep-Zoom viewer.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| **`Cmd+Shift+M`** / **`Alt+Shift+M`** | Toggle Hover Magnifier on/off | Global / Active Tab |
| **`Cmd+Shift+S`** / **`Alt+Shift+S`** | Launch Area Snipping Tool | Global / Active Tab |
| **`Z`** | Open currently hovered image in Deep-Zoom Lightbox | While hovering over an image |
| **`+` / `-`** | Increase / Decrease magnifier zoom power | While hovering over an image |
| **`C`** | Copy image / diagram to clipboard as PNG | In Lightbox or hover |
| **`R`** | Rotate 90° clockwise | In Deep-Zoom Lightbox |
| **`I`** | Invert colors (blueprint mode) | In Deep-Zoom Lightbox |
| **`0`** | Reset zoom and pan | In Deep-Zoom Lightbox |
| **`Esc`** | Close Lightbox or cancel snipping | Modal / Overlay |

---

## 🚀 Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/arauthub/All-Projects.git
   cd All-Projects/extensions/diagram-image-lens
   ```

2. **Load in Google Chrome or Microsoft Edge**:
   - Open Chrome and navigate to `chrome://extensions/` (or `edge://extensions/` in Edge).
   - Enable **Developer mode** (top right toggle).
   - Click **Load unpacked** and select the `extensions/diagram-image-lens` directory.

3. **Build Production Package**:
   ```bash
   ./package.sh
   ```
   Outputs a clean, certified ZIP at `dist/diagram-image-lens-v1.0.0.zip` ready for store submission.

---

## 🔒 Privacy & Client-Side Guarantee

* **100% Client-Side**: No user data, images, or browsing activity are stored or transmitted.
* **Zero Remote Code**: Strictly Manifest V3 compliant without any external scripts or CDN calls.
* Full policy: [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

---

## 📄 License

Distributed under the [MIT License](../../LICENSE).
