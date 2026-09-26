const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Minimalist Pure Node.js Canvas-like RGBA Rasterizer
 */
class ImageCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(height * width * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.buffer[idx] = Math.round(r * alpha + this.buffer[idx] * invAlpha);
      this.buffer[idx + 1] = Math.round(g * alpha + this.buffer[idx + 1] * invAlpha);
      this.buffer[idx + 2] = Math.round(b * alpha + this.buffer[idx + 2] * invAlpha);
      this.buffer[idx + 3] = Math.min(255, this.buffer[idx + 3] + a);
    }
  }

  fillGradient(topColor, bottomColor) {
    for (let y = 0; y < this.height; y++) {
      const t = y / this.height;
      const r = Math.round(topColor[0] * (1 - t) + bottomColor[0] * t);
      const g = Math.round(topColor[1] * (1 - t) + bottomColor[1] * t);
      const b = Math.round(topColor[2] * (1 - t) + bottomColor[2] * t);
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, r, g, b, 255);
      }
    }
  }

  addRadialGlow(cx, cy, radius, color, maxAlpha = 180) {
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(this.width - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(this.height - 1, Math.ceil(cy + radius));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist < radius) {
          const factor = 1 - (dist / radius);
          const a = Math.round(maxAlpha * factor * factor);
          this.setPixel(x, y, color[0], color[1], color[2], a);
        }
      }
    }
  }

  fillRoundRect(rx, ry, rw, rh, rad, color, borderColor = null, borderWidth = 1) {
    const x0 = Math.max(0, Math.floor(rx));
    const x1 = Math.min(this.width - 1, Math.ceil(rx + rw));
    const y0 = Math.max(0, Math.floor(ry));
    const y1 = Math.min(this.height - 1, Math.ceil(ry + rh));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = Math.max(rx + rad - x, 0, x - (rx + rw - rad));
        const dy = Math.max(ry + rad - y, 0, y - (ry + rh - rad));
        const dist = Math.hypot(dx, dy);

        if (dist <= rad) {
          if (borderColor && (dist > rad - borderWidth || x < rx + borderWidth || x > rx + rw - borderWidth || y < ry + borderWidth || y > ry + rh - borderWidth)) {
            this.setPixel(x, y, borderColor[0], borderColor[1], borderColor[2], borderColor[3] !== undefined ? borderColor[3] : 255);
          } else {
            this.setPixel(x, y, color[0], color[1], color[2], color[3] !== undefined ? color[3] : 255);
          }
        }
      }
    }
  }

  drawCircle(cx, cy, r, color) {
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(this.width - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(this.height - 1, Math.ceil(cy + r));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (Math.hypot(x - cx, y - cy) <= r) {
          this.setPixel(x, y, color[0], color[1], color[2], color[3] !== undefined ? color[3] : 255);
        }
      }
    }
  }

  drawRing(cx, cy, r, thickness, color) {
    const rOuter = r + thickness / 2;
    const rInner = r - thickness / 2;
    const x0 = Math.max(0, Math.floor(cx - rOuter));
    const x1 = Math.min(this.width - 1, Math.ceil(cx + rOuter));
    const y0 = Math.max(0, Math.floor(cy - rOuter));
    const y1 = Math.min(this.height - 1, Math.ceil(cy + rOuter));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= rInner && d <= rOuter) {
          this.setPixel(x, y, color[0], color[1], color[2], color[3] !== undefined ? color[3] : 255);
        }
      }
    }
  }

  drawStars(count = 100) {
    for (let i = 0; i < count; i++) {
      const sx = Math.floor(Math.random() * this.width);
      const sy = Math.floor(Math.random() * this.height);
      const brightness = Math.floor(150 + Math.random() * 105);
      const size = Math.random() > 0.85 ? 2 : 1;
      if (size === 1) {
        this.setPixel(sx, sy, brightness, brightness, brightness, 220);
      } else {
        this.drawCircle(sx, sy, 1.5, [brightness, brightness, 255, 240]);
      }
    }
  }

  // Simple clean 5x7 block bitmap font for crisp labels
  drawText(text, startX, startY, scale = 2, color = [255, 255, 255, 255]) {
    const font = {
      'A': [0x7C, 0x12, 0x11, 0x12, 0x7C],
      'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
      'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
      'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
      'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
      'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
      'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
      'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
      'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
      'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
      'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
      'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
      'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
      'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
      'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
      'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
      'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
      'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
      'S': [0x46, 0x49, 0x49, 0x49, 0x31],
      'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
      'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
      'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
      'W': [0x7F, 0x20, 0x18, 0x20, 0x7F],
      'X': [0x63, 0x14, 0x08, 0x14, 0x63],
      'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
      'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
      '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
      '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
      '2': [0x42, 0x61, 0x51, 0x49, 0x46],
      '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
      '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
      '5': [0x27, 0x45, 0x45, 0x45, 0x39],
      '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
      '7': [0x01, 0x71, 0x09, 0x05, 0x03],
      '8': [0x36, 0x49, 0x49, 0x49, 0x36],
      '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
      ':': [0x00, 0x36, 0x36, 0x00, 0x00],
      '-': [0x08, 0x08, 0x08, 0x08, 0x08],
      '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
      '!': [0x00, 0x00, 0x5F, 0x00, 0x00],
      '.': [0x00, 0x40, 0x60, 0x00, 0x00],
      '•': [0x00, 0x1C, 0x1C, 0x1C, 0x00],
      '/': [0x20, 0x10, 0x08, 0x04, 0x02],
      ' ': [0x00, 0x00, 0x00, 0x00, 0x00]
    };

    let curX = startX;
    const upper = text.toUpperCase();

    for (let c = 0; c < upper.length; c++) {
      const char = upper[c];
      const cols = font[char] || font[' '];
      for (let col = 0; col < 5; col++) {
        const val = cols[col];
        for (let row = 0; row < 7; row++) {
          if ((val >> row) & 1) {
            for (let dx = 0; dx < scale; dx++) {
              for (let dy = 0; dy < scale; dy++) {
                this.setPixel(curX + col * scale + dx, startY + row * scale + dy, color[0], color[1], color[2], color[3] || 255);
              }
            }
          }
        }
      }
      curX += 6 * scale;
    }
  }

  toPNG() {
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(this.width, 0);
    ihdrData.writeUInt32BE(this.height, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdrChunk = createChunk('IHDR', ihdrData);

    const rawData = Buffer.alloc(this.height * (1 + this.width * 4));
    let srcOffset = 0;
    let dstOffset = 0;
    for (let y = 0; y < this.height; y++) {
      rawData[dstOffset++] = 0;
      this.buffer.copy(rawData, dstOffset, srcOffset, srcOffset + this.width * 4);
      srcOffset += this.width * 4;
      dstOffset += this.width * 4;
    }

    const compressed = zlib.deflateSync(rawData, { level: 9 });
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  }
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + len)), 8 + len);
  return chunk;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Ensure output dir
const outDir = path.join(__dirname, '..', 'cws-assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating Chrome Web Store High-Resolution Assets...');

// 1. Small Promo Tile (440 x 280)
{
  const img = new ImageCanvas(440, 280);
  img.fillGradient([11, 15, 25], [19, 27, 46]);
  img.drawStars(60);
  img.addRadialGlow(220, 140, 160, [99, 102, 241], 120);
  img.addRadialGlow(350, 70, 130, [56, 189, 248], 100);

  // Logo orbital rings
  img.drawRing(220, 110, 48, 4, [56, 189, 248, 200]);
  img.drawCircle(220, 110, 26, [168, 85, 247, 240]);
  img.drawCircle(220, 110, 12, [56, 238, 255, 255]);

  // Title & Subtitle
  img.drawText('ANTI-GRAVITY WEB', 90, 175, 3, [56, 189, 248]);
  img.drawText('PHYSICS & ARCADE BROWSER', 85, 205, 2, [226, 232, 240]);

  // Feature pill
  img.fillRoundRect(80, 230, 280, 26, 8, [15, 23, 42, 220], [56, 189, 248, 180], 1);
  img.drawText('ZERO-G • ASTEROIDS • 5 STAGES', 96, 238, 1, [147, 197, 253]);

  fs.writeFileSync(path.join(outDir, 'promo-small-440x280.png'), img.toPNG());
  console.log('✓ promo-small-440x280.png');
}

// 2. Marquee Promo Tile (1400 x 560)
{
  const img = new ImageCanvas(1400, 560);
  img.fillGradient([8, 12, 20], [24, 18, 45]);
  img.drawStars(240);
  img.addRadialGlow(400, 280, 320, [99, 102, 241], 140);
  img.addRadialGlow(1050, 260, 300, [56, 189, 248], 130);
  img.addRadialGlow(700, 480, 250, [244, 63, 94], 100);

  // Floating Glass Cards on Sides
  img.fillRoundRect(100, 120, 240, 140, 16, [15, 23, 42, 200], [56, 189, 248, 150], 2);
  img.drawText('HEADLINE ORBIT', 125, 150, 2, [56, 189, 248]);
  img.drawText('FLOATING CARD 01', 125, 180, 1, [203, 213, 225]);
  img.drawText('+250 PTS', 125, 210, 2, [74, 222, 128]);

  img.fillRoundRect(1060, 280, 240, 150, 16, [15, 23, 42, 200], [168, 85, 247, 150], 2);
  img.drawText('KATAMARI SPHERE', 1085, 310, 2, [168, 85, 247]);
  img.drawText('ROLL & ABSORB', 1085, 340, 1, [203, 213, 225]);
  img.drawText('STAGE 3: STORM', 1085, 370, 2, [251, 191, 36]);

  // Center Emblem
  img.drawRing(700, 210, 85, 6, [56, 189, 248, 220]);
  img.drawCircle(700, 210, 46, [168, 85, 247, 240]);
  img.drawCircle(700, 210, 20, [255, 255, 255, 255]);

  // Main Titles
  img.drawText('ANTI-GRAVITY WEB', 450, 325, 6, [56, 189, 248]);
  img.drawText('INTERACTIVE PHYSICS & ARCADE BROWSER', 460, 385, 3, [248, 250, 252]);

  // Bottom Badge Pill
  img.fillRoundRect(420, 440, 560, 42, 12, [15, 23, 42, 230], [56, 189, 248, 200], 2);
  img.drawText('1-HIT SHATTER • TWIN LASERS • 5 STAGE PROGRESSION • 100% REVERSIBLE', 438, 454, 1, [56, 189, 248]);

  fs.writeFileSync(path.join(outDir, 'promo-marquee-1400x560.png'), img.toPNG());
  console.log('✓ promo-marquee-1400x560.png');
}

// Helper to create 1280x800 Screenshot Base
function createScreenshotBase(headline, subheadline, badgeText, badgeColor = [56, 189, 248]) {
  const img = new ImageCanvas(1280, 800);
  img.fillGradient([9, 13, 22], [17, 24, 39]);
  img.drawStars(180);

  // Top Header Bar
  img.fillRoundRect(0, 0, 1280, 80, 0, [15, 23, 42, 240], [255, 255, 255, 30], 1);
  img.drawCircle(30, 40, 7, [239, 68, 68]);
  img.drawCircle(50, 40, 7, [245, 158, 11]);
  img.drawCircle(70, 40, 7, [16, 185, 129]);

  img.fillRoundRect(120, 22, 600, 36, 8, [30, 41, 59, 200], [255, 255, 255, 20], 1);
  img.drawText('HTTPS://EN.WIKIPEDIA.ORG/WIKI/ZERO-GRAVITY-PHYSICS', 135, 33, 1, [148, 163, 184]);

  // Feature Badge
  img.fillRoundRect(780, 24, 220, 32, 8, [15, 23, 42, 220], [badgeColor[0], badgeColor[1], badgeColor[2], 180], 1);
  img.drawText(badgeText, 800, 33, 1, badgeColor);

  // Bottom Banner
  img.fillRoundRect(40, 700, 1200, 70, 14, [15, 23, 42, 240], [56, 189, 248, 140], 2);
  img.drawText(headline, 65, 715, 3, [56, 189, 248]);
  img.drawText(subheadline, 65, 745, 2, [203, 213, 225]);

  return img;
}

// 3. Screenshot 1: Zero-G DOM Levitation & Physics Simulator
{
  const img = createScreenshotBase('1. ZERO-G LEVITATION', 'VISIBLE WEB ELEMENTS FLOAT IN ORBIT • NON-DESTRUCTIVE DOM CLONING', 'ZERO-G MODE ACTIVE', [56, 189, 248]);
  img.addRadialGlow(400, 400, 260, [99, 102, 241], 100);

  // Floating cards
  img.fillRoundRect(180, 160, 320, 180, 16, [15, 23, 42, 220], [56, 189, 248, 180], 2);
  img.drawText('PHYSICS LAB CARD', 205, 190, 2, [56, 189, 248]);
  img.drawText('COMPUTED STYLES PRESERVED', 205, 220, 1, [203, 213, 225]);
  img.drawText('ROTATION: +0.28 RAD', 205, 250, 1, [148, 163, 184]);
  img.drawText('MASS: 4.8 KG', 205, 280, 2, [74, 222, 128]);

  img.fillRoundRect(680, 220, 380, 160, 16, [15, 23, 42, 220], [168, 85, 247, 180], 2);
  img.drawText('HEADING 1: COSMIC DRIFT', 710, 250, 2, [168, 85, 247]);
  img.drawText('ELEMENTS FLOAT SMOOTHLY UPWARDS', 710, 285, 1, [203, 213, 225]);
  img.drawText('MATTER.JS 60 FPS ENGINE', 710, 315, 2, [56, 189, 248]);

  // Floating button
  img.fillRoundRect(440, 460, 220, 60, 12, [56, 189, 248, 220], [255, 255, 255, 180], 2);
  img.drawText('BUTTON: LAUNCH', 475, 482, 2, [15, 23, 42]);

  fs.writeFileSync(path.join(outDir, 'screenshot-1-zerog-1280x800.png'), img.toPNG());
  console.log('✓ screenshot-1-zerog-1280x800.png');
}

// 4. Screenshot 2: Twin Laser Asteroids & 1-Hit Shattering
{
  const img = createScreenshotBase('2. TWIN LASER ASTEROIDS', '1-HIT EXPLOSIVE SHATTERING • WORD SHARDS • MULTI-HIT COMBOS', 'ASTEROIDS MODE', [244, 63, 94]);
  img.addRadialGlow(640, 380, 260, [244, 63, 94], 100);

  // Spaceship
  img.drawCircle(400, 360, 18, [56, 189, 248]);
  img.drawCircle(400, 360, 6, [255, 255, 255]);

  // Twin Laser Beams
  img.fillRoundRect(420, 345, 180, 6, 3, [34, 211, 238]);
  img.fillRoundRect(420, 375, 180, 6, 3, [34, 211, 238]);

  // Exploding Target Element
  img.fillRoundRect(620, 300, 240, 130, 12, [15, 23, 42, 180], [244, 63, 94, 220], 2);
  img.drawText('SHATTERING!', 655, 335, 3, [244, 63, 94]);
  img.drawText('COMBO X4! +400 PTS', 655, 375, 2, [251, 191, 36]);

  // Shockwaves and sparks
  img.drawRing(740, 365, 80, 4, [56, 189, 248, 200]);
  img.drawRing(740, 365, 130, 2, [244, 63, 94, 150]);

  fs.writeFileSync(path.join(outDir, 'screenshot-2-asteroids-1280x800.png'), img.toPNG());
  console.log('✓ screenshot-2-asteroids-1280x800.png');
}

// 5. Screenshot 3: Multi-Stage Progression (Cadet Orbit to Quantum Chaos)
{
  const img = createScreenshotBase('3. 5-STAGE PROGRESSION', 'AUTOMATIC LEVEL ADVANCE • DEBRIS SPLITTERS • COSMIC STORMS', 'STAGE 3: HARD', [251, 191, 36]);
  img.addRadialGlow(640, 320, 240, [251, 191, 36], 90);

  // Stage Announcement Banner in Center
  img.fillRoundRect(360, 180, 560, 120, 16, [15, 23, 42, 240], [56, 189, 248, 220], 2);
  img.drawText('STAGE 2 COMPLETED! +1500 PTS', 400, 210, 2, [251, 191, 36]);
  img.drawText('ENTERING STAGE 3: COSMIC STORM', 400, 245, 2, [56, 189, 248]);

  // 5 Stage Progress Pills
  const stages = [
    { name: '1. CADET', diff: 'EASY', col: [74, 222, 128] },
    { name: '2. SPLITTER', diff: 'NORMAL', col: [56, 189, 248] },
    { name: '3. STORM', diff: 'HARD', col: [251, 191, 36] },
    { name: '4. VORTEX', diff: 'EXTREME', col: [244, 63, 94] },
    { name: '5. CHAOS', diff: 'NIGHTMARE', col: [192, 132, 252] }
  ];

  stages.forEach((st, idx) => {
    const px = 180 + idx * 190;
    img.fillRoundRect(px, 350, 170, 90, 12, [15, 23, 42, 220], [st.col[0], st.col[1], st.col[2], 180], 2);
    img.drawText(st.name, px + 16, 375, 1, [248, 250, 252]);
    img.drawText(st.diff, px + 16, 405, 2, st.col);
  });

  // Hazard Spiked Mine
  img.drawCircle(840, 520, 30, [244, 63, 94]);
  img.drawRing(840, 520, 46, 3, [244, 63, 94, 180]);
  img.drawText('HAZARD PULSAR', 785, 575, 1, [244, 63, 94]);

  fs.writeFileSync(path.join(outDir, 'screenshot-3-stages-1280x800.png'), img.toPNG());
  console.log('✓ screenshot-3-stages-1280x800.png');
}

// 6. Screenshot 4: Orbital Katamari Mode & Cosmic Black Hole Singularity
{
  const img = createScreenshotBase('4. KATAMARI & BLACK HOLE', 'MAGNETIC KATAMARI ROLLING • SINGULARITY ACCRETION VORTEX', 'KATAMARI & VOID', [168, 85, 247]);
  img.addRadialGlow(400, 360, 240, [234, 179, 8], 110);
  img.addRadialGlow(900, 360, 240, [168, 85, 247], 110);

  // Katamari Ball
  img.drawCircle(380, 360, 60, [234, 179, 8]);
  img.drawCircle(380, 360, 40, [254, 240, 138]);
  img.drawText('KATAMARI CORE', 325, 440, 2, [250, 204, 21]);

  // Stuck card
  img.fillRoundRect(240, 270, 130, 60, 8, [15, 23, 42, 220], [56, 189, 248, 180], 1);
  img.drawText('ROLLED UP!', 255, 292, 1, [56, 189, 248]);

  // Black Hole Singularity
  img.drawRing(900, 360, 95, 6, [168, 85, 247, 200]);
  img.drawRing(900, 360, 65, 4, [56, 189, 248, 200]);
  img.drawCircle(900, 360, 35, [15, 23, 42]);
  img.drawText('EVENT HORIZON', 840, 440, 2, [192, 132, 252]);

  fs.writeFileSync(path.join(outDir, 'screenshot-4-katamari-1280x800.png'), img.toPNG());
  console.log('✓ screenshot-4-katamari-1280x800.png');
}

// 7. Screenshot 5: Interactive Tutorial & Glassmorphic Controller
{
  const img = createScreenshotBase('5. FLIGHT ACADEMY & POPUP', 'INTERACTIVE 4-SLIDE TUTORIAL • ESCAPE INSTANT LAYOUT RETURN', 'FLIGHT ACADEMY', [16, 185, 129]);
  img.addRadialGlow(640, 360, 280, [56, 189, 248], 80);

  // Tutorial Modal in Center
  img.fillRoundRect(360, 150, 560, 380, 20, [15, 23, 42, 245], [56, 189, 248, 180], 2);
  img.drawText('ANTI-GRAVITY FLIGHT ACADEMY', 410, 185, 2, [56, 189, 248]);

  img.drawText('SLIDE 1: FLIGHT & NAVIGATION', 410, 230, 2, [248, 250, 252]);
  img.drawText('STEER YOUR SPACECRAFT WITH WASD OR ARROW KEYS', 410, 265, 1, [203, 213, 225]);

  // Key pills
  const keys = ['W', 'A', 'S', 'D', 'ARROWS', 'SPACEBAR', 'ESC'];
  keys.forEach((k, idx) => {
    const kx = 410 + idx * 68;
    img.fillRoundRect(kx, 310, 58, 38, 8, [30, 41, 59, 240], [56, 189, 248, 160], 1);
    img.drawText(k, kx + 10, 322, 1, [56, 189, 248]);
  });

  // Action button
  img.fillRoundRect(410, 420, 460, 50, 12, [16, 185, 129, 220], [255, 255, 255, 180], 1);
  img.drawText('BLAST OFF! LAUNCH SIMULATION', 470, 436, 2, [255, 255, 255]);

  fs.writeFileSync(path.join(outDir, 'screenshot-5-dashboard-1280x800.png'), img.toPNG());
  console.log('✓ screenshot-5-dashboard-1280x800.png');
}

console.log('All Chrome Web Store graphical assets successfully generated in cws-assets/!');
