# 🚀 Chrome Web Store Listing Submission Handbook

Use this document as your exact copy-paste guide when publishing **Anti-Gravity Web** in the **Chrome Web Store Developer Dashboard**.

---

## 1. Basic Information

| Field | Value | Constraints |
| :--- | :--- | :--- |
| **Extension Name** | `Anti-Gravity Web: Arcade Physics Browser` | Max 45 characters (40 chars used) |
| **Short Name** | `Anti-Gravity` | Max 12 characters (12 chars used) |
| **Version** | `1.0.0` | Match `manifest.json` |
| **Primary Category** | `Fun / Games` or `Productivity / Tools` | Select from CWS dropdown |
| **Language** | `English (United States)` | Default locale |

---

## 2. Summary (Short Description)
*Character limit: Strictly 132 characters (122 characters used).*

```
Transform any webpage into an interactive Zero-G playground with twin laser Asteroids, Katamari roll, and 5 arcade stages.
```

---

## 3. Detailed Description (Long Description)
*Copy and paste the formatted markdown below into the Store Listing Description box:*

```markdown
🌌 Transform ANY webpage into an interactive Zero-G physics playground!

Turn boring reading sessions into a dynamic, tactile arcade universe. Float headings into microgravity orbit, fire continuous twin plasma lasers, roll up cards into a massive magnetic Katamari, and conquer 5 progressive difficulty stages from Cadet Orbit to Quantum Chaos!

Built for high-performance 60 FPS rigid body simulation without breaking the host webpage's layout. Press ESC anytime to smoothly return all elements 100% back to their original slots.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ KEY FEATURES & GAME MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 1. ASTEROIDS BROWSER MODE
• Steer an agile interceptor spacecraft using WASD or mouse aim.
• Stream continuous twin plasma lasers with Spacebar or Left-Click.
• 1-Hit Shattering: Pop headings, paragraphs, and buttons like bubble wrap into tumbling word shards and spark rings!
• Smash through floating cards with spaceship ramming.

🟡 2. ORBITAL KATAMARI MODE
• Roll a sticky magnetic sphere across the viewport.
• Absorb smaller cards, images, and buttons into your cluster.
• Grow exponentially in radius and gravitational pull!

🌌 3. ZERO-G PHYSICS PLAYGROUND
• Pure microgravity space drift: elements float upward gently.
• Invertible Directional Gravity: Use Arrow Keys (▲ ▼ ◄ ►) or 0 to reverse gravity vectors in real-time.
• Dynamic Mouse Tools: Drag & Fling, Tractor Beams, and Repulsor shockwaves.

⚫ 4. COSMIC BLACK HOLE SINGULARITY
• Right-click or press B/X to spawn an event horizon black hole!
• Vacuums surrounding debris into a swirling accretion vortex and implodes them into stardust.

🏆 5. 5-STAGE ARCADE CAMPAIGN
• Stage 1 (Easy): Cadet Orbit — relaxed zero-G target practice.
• Stage 2 (Normal): Debris Splitters — elements split into 2 smaller tumbling text fragments on impact!
• Stage 3 (Hard): Cosmic Storm — shifting gravitational wind pulses and bouncing spiked hazard pulsars.
• Stage 4 (Extreme): Vortex Singularity — wandering mini black holes warp element trajectories.
• Stage 5 (Nightmare): Quantum Chaos — hyper-speed ricochets and a 60s Quantum Supernova countdown!
• Continuous gameplay: Automatic reinforcement debris warps in dynamically so you can always finish all 5 stages.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 CONTROLS & SHORTCUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Toggle Anti-Gravity: Alt+Shift+G (Mac: Cmd+Shift+G) or click toolbar icon
• Instant Restore: Escape key or Restore button
• Aim & Fire Lasers: Spacebar or Hold Left-Click
• Steer Ship / Roll Katamari: W, A, S, D or Arrow Keys
• Click-to-Shatter: Click any floating element directly
• Cosmic Black Hole: Right-Click or B / X Key
• Flip Gravity: Arrow Keys (Up, Down, Left, Right)
• Zero Gravity: 0 or Z Key
• Interactive Tutorial: Click ❓ Guide in HUD or Popup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 100% PRIVATE • MANIFEST V3 COMPLIANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Zero Data Collection: No personal data, tracking, or browsing history is collected, stored, or transmitted.
• 100% Client-Side: Physics calculations run purely in local memory (RAM) via bundled Matter.js.
• Zero Remote Code: No remote scripts, analytics, or CDNs.
• Non-Destructive: Original host page layouts are preserved with pixel-perfect reversibility.

Ready to launch? Click "Add to Chrome" and elevate your browsing into orbit!
```

---

## 4. Single Purpose Description
*(Required in the Chrome Web Store Developer Console under the "Single Purpose" compliance section)*

```
The single purpose of Anti-Gravity Web is to provide an interactive, client-side 2D physics simulation and gamified arcade overlay on the active browser tab to make webpage browsing playful, tactile, and engaging.
```

---

## 5. Permission Justification Statements
*(Provide these exact justifications if prompted during submission review)*

### `activeTab`
> **Justification:** Required to run the physics simulation and interactive DOM overlay strictly on the specific tab the user explicitly activates via the extension icon or keyboard shortcut (`Alt+Shift+G`). It prevents the extension from requiring persistent access to inactive tabs.

### `scripting`
> **Justification:** Required to inject the locally bundled 2D physics simulation engine (`lib/matter.min.js`) and content controller into the active webpage upon user command.

### `storage`
> **Justification:** Used solely to save local user gameplay settings (audio mute status, preferred game mode, and tutorial completion flag) on the client machine using `chrome.storage.local`. No personal data is stored or transmitted.

---

## 6. Store Graphic Assets Checklist

All required graphic assets are pre-rendered and located in the `cws-assets/` and `assets/` folders:

- [x] **Store Icon**: `assets/icon128.png` (128 x 128 px PNG)
- [x] **Small Promo Tile**: `cws-assets/promo-small-440x280.png` (440 x 280 px PNG)
- [x] **Marquee Promo Tile**: `cws-assets/promo-marquee-1400x560.png` (1400 x 560 px PNG)
- [x] **Screenshot 1**: `cws-assets/screenshot-1-zerog-1280x800.png` (1280 x 800 px PNG)
- [x] **Screenshot 2**: `cws-assets/screenshot-2-asteroids-1280x800.png` (1280 x 800 px PNG)
- [x] **Screenshot 3**: `cws-assets/screenshot-3-stages-1280x800.png` (1280 x 800 px PNG)
- [x] **Screenshot 4**: `cws-assets/screenshot-4-katamari-1280x800.png` (1280 x 800 px PNG)
- [x] **Screenshot 5**: `cws-assets/screenshot-5-dashboard-1280x800.png` (1280 x 800 px PNG)

---

## 7. Submission Steps

1. Run `node scripts/package_extension.js` to create the clean production zip: `dist/anti-gravity-web-v1.0.0.zip`.
2. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Click **Add new item** and upload `dist/anti-gravity-web-v1.0.0.zip`.
4. Fill in the **Store Listing** fields using Sections 1, 2, and 3 of this document.
5. Upload the icons, promo tiles, and screenshots from Section 6.
6. Under **Privacy**, paste the hosted URL of `privacy_policy.html` (or your GitHub raw markdown link).
7. Under **Single Purpose**, paste Section 4.
8. Under **Permissions Justifications**, paste Section 5.
9. Click **Submit for Review**!
