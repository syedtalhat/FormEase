#!/usr/bin/env node

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const outDir = path.join(process.cwd(), 'extension', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate an uncompressed PNG buffer of given width and height
// with a deep teal background and marigold accent
function createPng(width, height) {
  const bytesPerPixel = 4;
  const rawData = Buffer.alloc(height * (width * bytesPerPixel + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * bytesPerPixel + 1);
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      
      // Calculate circular emblem center
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.45;

      if (dist <= radius) {
        // Teal / Deep Sea primary #0E4D55 (14, 77, 85)
        rawData[pixelOffset] = 14;     // R
        rawData[pixelOffset + 1] = 77;  // G
        rawData[pixelOffset + 2] = 85;  // B
        rawData[pixelOffset + 3] = 255; // Alpha
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(length + 12);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0xffffffff;
  const crcData = Buffer.concat([Buffer.from(type), data]);
  for (let i = 0; i < crcData.length; i++) {
    crc = crcTable[(crc ^ crcData[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;

  chunk.writeUInt32BE(crc >>> 0, length + 8);
  return chunk;
}

[16, 48, 128].forEach((size) => {
  const buf = createPng(size, size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf);
  console.log(`Generated icon-${size}.png`);
});
