const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Generate 440x280 Promo Tile for Chrome Web Store
 */
function createPromoPNG(width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const iconCenterX = width * 0.28;
  const iconCenterY = height * 0.5;
  const iconRadius = 55;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const dx = x - iconCenterX;
      const dy = y - iconCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background: Dark Slate to Deep Blue (#0b0f19 to #032b43)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(11 + (3 - 11) * gradRatio);
      let g = Math.round(15 + (43 - 15) * gradRatio);
      let b = Math.round(25 + (67 - 25) * gradRatio);

      // Icon Badge (#0284c7 with Cyan ring #38bdf8)
      if (dist <= iconRadius) {
        if (dist >= iconRadius * 0.8) {
          // Cyan Ring
          r = 56; g = 189; b = 248;
        } else if (dist >= iconRadius * 0.65) {
          // Dark Ring Gap
          r = 15; g = 23; b = 42;
        } else if (dist <= iconRadius * 0.55 && dist >= iconRadius * 0.38) {
          // Inner Magnifier Lens Ring
          r = 56; g = 189; b = 248;
        } else {
          // Inner Deep Blue
          r = 2; g = 132; b = 199;
        }
      }

      // Border glow at bottom/top
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        r = 56; g = 189; b = 248;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = 255;
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

const promoPath = path.join(__dirname, 'promo_tile_440x280.png');
const promoBuffer = createPromoPNG(440, 280);
fs.writeFileSync(promoPath, promoBuffer);
console.log(`Generated Chrome Web Store Promo Tile: ${promoPath}`);
