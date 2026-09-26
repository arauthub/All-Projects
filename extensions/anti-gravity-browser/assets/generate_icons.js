const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Generate a PNG icon for Anti-Gravity Extension:
 * Dark Cosmic Indigo background, Glowing Magenta & Cyan Anti-Gravity Rings, Central Floating Core.
 */
function createIconPNG(size) {
  const width = size;
  const height = size;
  
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const center = size / 2;
  const rRound = size * 0.46;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded square background bounds
      const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
      const roundedCorner = (Math.abs(dx) > size * 0.35 && Math.abs(dy) > size * 0.35)
        ? Math.sqrt(Math.pow(Math.abs(dx) - size * 0.35, 2) + Math.pow(Math.abs(dy) - size * 0.35, 2))
        : 0;

      if (cornerDist > rRound || roundedCorner > (size * 0.11)) {
        // Transparent outside rounded box
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        continue;
      }

      // Inside icon tile:
      // Cosmic gradient base: #0b0f19 to #1e1b4b
      const grad = (y / height);
      let r = Math.round(11 + grad * 20);
      let g = Math.round(15 + grad * 12);
      let b = Math.round(35 + grad * 45);
      let a = 255;

      // Anti-gravity elliptical orbital ring (rotated ~25 deg)
      // Rotated coordinates
      const angle = 0.44;
      const rx = dx * Math.cos(angle) + dy * Math.sin(angle);
      const ry = -dx * Math.sin(angle) + dy * Math.cos(angle);
      const ellipseVal = Math.sqrt(Math.pow(rx / (size * 0.40), 2) + Math.pow(ry / (size * 0.16), 2));

      // Upward floating arrow / core triangle in center
      // Dy is negative upward
      const inCoreSphere = dist <= size * 0.20;
      const inRing = Math.abs(ellipseVal - 1.0) < 0.16;
      const inArrow = (dy < size * 0.10 && dy > -size * 0.26 && Math.abs(dx) <= (size * 0.26 - (-dy)) * 0.6);

      if (inArrow) {
        // Neon Cyan / White arrow pointing UP (Anti-gravity!)
        r = 56;
        g = 238;
        b = 255;
      } else if (inCoreSphere) {
        // Glowing Neon Violet / Purple Core
        const coreFactor = 1 - (dist / (size * 0.20));
        r = Math.min(255, Math.round(168 + coreFactor * 80));
        g = Math.min(255, Math.round(85 + coreFactor * 50));
        b = Math.min(255, Math.round(247 + coreFactor * 8));
      } else if (inRing) {
        // Glowing Cyan Orbital Ring
        r = 99;
        g = 102;
        b = 241;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
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

const assetsDir = path.join(__dirname);
[16, 32, 48, 128].forEach(size => {
  const iconBuffer = createIconPNG(size);
  const iconPath = path.join(assetsDir, `icon${size}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  console.log(`Generated ${iconPath}`);
});
