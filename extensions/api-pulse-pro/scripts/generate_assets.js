const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

  fillRoundRect(x0, y0, w, h, radius, topColor, bottomColor) {
    const x1 = x0 + w;
    const y1 = y0 + h;
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / h;
      const r = Math.round(topColor[0] * (1 - t) + bottomColor[0] * t);
      const g = Math.round(topColor[1] * (1 - t) + bottomColor[1] * t);
      const b = Math.round(topColor[2] * (1 - t) + bottomColor[2] * t);

      for (let x = x0; x < x1; x++) {
        let inside = true;
        if (x < x0 + radius && y < y0 + radius) {
          inside = Math.hypot(x - (x0 + radius), y - (y0 + radius)) <= radius;
        } else if (x > x1 - radius && y < y0 + radius) {
          inside = Math.hypot(x - (x1 - radius), y - (y0 + radius)) <= radius;
        } else if (x < x0 + radius && y > y1 - radius) {
          inside = Math.hypot(x - (x0 + radius), y - (y1 - radius)) <= radius;
        } else if (x > x1 - radius && y > y1 - radius) {
          inside = Math.hypot(x - (x1 - radius), y - (y1 - radius)) <= radius;
        }

        if (inside) {
          this.setPixel(x, y, r, g, b, 255);
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
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= r) {
          const edgeAlpha = dist > r - 0.75 ? Math.max(0, Math.min(255, Math.round(255 * (r - dist + 0.75)))) : 255;
          const a = (color[3] !== undefined ? color[3] : 255) * (edgeAlpha / 255);
          this.setPixel(x, y, color[0], color[1], color[2], Math.round(a));
        }
      }
    }
  }

  drawLine(x1, y1, x2, y2, thickness, color) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(Math.ceil(dist * 2), 1);
    const radius = thickness / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      this.drawCircle(x, y, radius, color);
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

function renderIcon(size) {
  const canvas = new ImageCanvas(size, size);
  const pad = Math.max(1, Math.round(size * 0.05));
  const innerSize = size - pad * 2;
  const cornerR = Math.round(size * 0.22);

  // Background gradient: sleek dark cyber violet to deep navy
  canvas.fillRoundRect(pad, pad, innerSize, innerSize, cornerR, [26, 18, 54], [10, 12, 32]);

  // Subtle border highlight
  const cx = size / 2;
  const cy = size / 2;

  // Pulse waveform points across the center
  // Normalizing coords in 0..1
  const points = [
    [0.18, 0.52],
    [0.32, 0.52],
    [0.42, 0.28], // high peak
    [0.52, 0.76], // low dip
    [0.62, 0.38], // secondary peak
    [0.72, 0.52],
    [0.82, 0.52]
  ].map(([x, y]) => [Math.round(x * size), Math.round(y * size)]);

  // Draw glow line first
  const glowColor = [99, 102, 241, 100]; // Indigo glow
  const lineColor = [6, 182, 212, 255]; // Vibrant Cyan
  const peakColor = [244, 63, 94, 255]; // Rose pink accent

  const lineThick = Math.max(1.5, size * 0.07);
  const glowThick = lineThick * 2.2;

  // Glow pass
  for (let i = 0; i < points.length - 1; i++) {
    canvas.drawLine(points[i][0], points[i][1], points[i+1][0], points[i+1][1], glowThick, glowColor);
  }

  // Main stroke pass
  for (let i = 0; i < points.length - 1; i++) {
    const isPeak = i === 1 || i === 2;
    const col = isPeak ? [168, 85, 247, 255] : lineColor;
    canvas.drawLine(points[i][0], points[i][1], points[i+1][0], points[i+1][1], lineThick, col);
  }

  // Draw node endpoints (pulsing connection circles)
  const nodeR = Math.max(1.5, size * 0.055);
  canvas.drawCircle(points[0][0], points[0][1], nodeR, lineColor);
  canvas.drawCircle(points[2][0], points[2][1], nodeR * 1.1, [236, 72, 153, 255]); // high peak node
  canvas.drawCircle(points[3][0], points[3][1], nodeR, [147, 51, 234, 255]);
  canvas.drawCircle(points[6][0], points[6][1], nodeR, lineColor);

  return canvas.toPNG();
}

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

[16, 32, 48, 128].forEach(size => {
  const buf = renderIcon(size);
  fs.writeFileSync(path.join(assetsDir, `icon${size}.png`), buf);
  console.log(`Generated icon${size}.png (${buf.length} bytes)`);
});
