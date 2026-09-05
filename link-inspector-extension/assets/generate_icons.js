const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Generate a PNG buffer with a modern dark cyan theme icon
 */
function createIconPNG(size) {
  const width = size;
  const height = size;
  
  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw Image Data (Filter 0 + RGBA per pixel)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const center = size / 2;
  const outerRadius = size * 0.42;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte 0 for scanline
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Icon colors: Dark Slate background (#0f172a) with Cyan accent ring (#38bdf8)
      if (dist <= outerRadius) {
        if (dist >= outerRadius * 0.7) {
          // Cyan Ring
          rawData[offset++] = 56;  // R
          rawData[offset++] = 189; // G
          rawData[offset++] = 248; // B
          rawData[offset++] = 255; // A
        } else {
          // Inner Icon Fill
          rawData[offset++] = 15;  // R
          rawData[offset++] = 23;  // G
          rawData[offset++] = 42;  // B
          rawData[offset++] = 255; // A
        }
      } else {
        // Rounded Square Base (#0284c7)
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist <= size * 0.46) {
          rawData[offset++] = 2;   // R
          rawData[offset++] = 132; // G
          rawData[offset++] = 199; // B
          rawData[offset++] = 255; // A
        } else {
          // Transparent
          rawData[offset++] = 0;
          rawData[offset++] = 0;
          rawData[offset++] = 0;
          rawData[offset++] = 0;
        }
      }
    }
  }

  // IDAT Chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
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

// Generate Icons into assets/
const assetsDir = path.join(__dirname);
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const iconBuffer = createIconPNG(size);
  const iconPath = path.join(assetsDir, `icon${size}.png`);
  fs.writeFileSync(iconPath, iconBuffer);
  console.log(`Generated ${iconPath}`);
});
