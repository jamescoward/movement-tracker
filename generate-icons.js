/**
 * Generate PWA icons as valid PNG files.
 * Design: A sage-green rounded square with a stylised foot/kick mark.
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Minimal PNG encoder — creates an uncompressed (store) PNG
function createPNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA data (width * height * 4)
  const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
      }
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function adler32(buf) {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData));
    return Buffer.concat([len, typeData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — raw pixel data with filter byte per row, wrapped in zlib
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(Buffer.from([0])); // filter: none
    rawRows.push(Buffer.from(pixels.buffer, y * width * 4, width * 4));
  }
  const rawData = Buffer.concat(rawRows);

  // Wrap in zlib (deflate store blocks)
  const zlibParts = [Buffer.from([0x78, 0x01])]; // zlib header

  // Split into 65535-byte store blocks
  let offset = 0;
  while (offset < rawData.length) {
    const remaining = rawData.length - offset;
    const blockSize = Math.min(remaining, 65535);
    const isLast = (offset + blockSize >= rawData.length) ? 1 : 0;
    const header = Buffer.alloc(5);
    header[0] = isLast;
    header.writeUInt16LE(blockSize, 1);
    header.writeUInt16LE(blockSize ^ 0xFFFF, 3);
    zlibParts.push(header);
    zlibParts.push(rawData.slice(offset, offset + blockSize));
    offset += blockSize;
  }

  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(adler32(rawData));
  zlibParts.push(adler);

  const zlibData = Buffer.concat(zlibParts);

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Colors from the app palette
  const bg = { r: 122, g: 158, b: 135 };       // --color-primary #7a9e87
  const bgDark = { r: 94, g: 128, b: 104 };     // --color-primary-dark #5e8068
  const white = { r: 255, g: 255, b: 255 };
  const cream = { r: 250, g: 247, b: 242 };      // --color-bg #faf7f2

  function setPixel(x, y, r, g, b, a) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }

  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  const s = size; // shorthand
  const cx = s / 2;
  const cy = s / 2;
  const cornerRadius = s * 0.18;

  // Draw each pixel
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // Rounded rectangle check
      const margin = s * 0.02;
      const inRect = isInRoundedRect(x, y, margin, margin, s - margin * 2, s - margin * 2, cornerRadius);

      if (!inRect) {
        setPixel(x, y, 0, 0, 0, 0); // transparent
        continue;
      }

      // Background: subtle radial gradient
      const d = dist(x, y, cx, cy * 0.85);
      const t = Math.min(d / (s * 0.7), 1);
      const r = Math.round(bg.r * (1 - t * 0.15) + bgDark.r * (t * 0.15));
      const g = Math.round(bg.g * (1 - t * 0.15) + bgDark.g * (t * 0.15));
      const b = Math.round(bg.b * (1 - t * 0.15) + bgDark.b * (t * 0.15));
      setPixel(x, y, r, g, b, 255);
    }
  }

  // Draw a baby footprint icon in the centre
  drawFootprint(pixels, size, cream);

  return createPNG(size, size, pixels);

  function isInRoundedRect(px, py, rx, ry, rw, rh, rad) {
    if (px < rx || px > rx + rw || py < ry || py > ry + rh) return false;
    // Check corners
    const corners = [
      [rx + rad, ry + rad],
      [rx + rw - rad, ry + rad],
      [rx + rad, ry + rh - rad],
      [rx + rw - rad, ry + rh - rad],
    ];
    for (const [ccx, ccy] of corners) {
      if (
        ((px < ccx && ccx === corners[0][0]) || (px > ccx && ccx === corners[1][0])) &&
        ((py < ccy && ccy === corners[0][1]) || (py > ccy && ccy === corners[3][1]))
      ) {
        // in a corner region
        if (px < rx + rad && py < ry + rad && dist(px, py, rx + rad, ry + rad) > rad) return false;
        if (px > rx + rw - rad && py < ry + rad && dist(px, py, rx + rw - rad, ry + rad) > rad) return false;
        if (px < rx + rad && py > ry + rh - rad && dist(px, py, rx + rad, ry + rh - rad) > rad) return false;
        if (px > rx + rw - rad && py > ry + rh - rad && dist(px, py, rx + rw - rad, ry + rh - rad) > rad) return false;
      }
    }
    return true;
  }

  function drawFootprint(px, sz, color) {
    // A baby footprint: oval sole + 5 toe dots
    const scale = sz / 512; // normalise to 512 base

    function fillEllipse(ecx, ecy, erx, ery) {
      for (let ey = Math.floor(ecy - ery); ey <= Math.ceil(ecy + ery); ey++) {
        for (let ex = Math.floor(ecx - erx); ex <= Math.ceil(ecx + erx); ex++) {
          const nx = (ex - ecx) / erx;
          const ny = (ey - ecy) / ery;
          if (nx * nx + ny * ny <= 1) {
            setPixel(ex, ey, color.r, color.g, color.b, 255);
          }
        }
      }
    }

    function fillCircle(fcx, fcy, fr) {
      fillEllipse(fcx, fcy, fr, fr);
    }

    // Sole — slightly rotated oval, we approximate with an ellipse
    const soleCx = cx - sz * 0.02;
    const soleCy = cy + sz * 0.08;
    const soleRx = sz * 0.17;
    const soleRy = sz * 0.25;

    // Draw sole with slight taper (narrower at heel)
    for (let ey = Math.floor(soleCy - soleRy); ey <= Math.ceil(soleCy + soleRy); ey++) {
      const ny = (ey - soleCy) / soleRy;
      // Taper: narrower at bottom (heel)
      const taper = 1 - ny * 0.2;
      const rx = soleRx * Math.max(0.3, taper);
      for (let ex = Math.floor(soleCx - rx); ex <= Math.ceil(soleCx + rx); ex++) {
        const nx = (ex - soleCx) / rx;
        if (nx * nx + ny * ny <= 1) {
          setPixel(ex, ey, color.r, color.g, color.b, 255);
        }
      }
    }

    // Toes — 5 circles above the sole
    const toeRadius = sz * 0.045;
    const toeY = soleCy - soleRy - toeRadius * 0.6;
    const toeSpacing = sz * 0.075;

    // Big toe (slightly bigger, slightly offset)
    fillCircle(soleCx - toeSpacing * 2.1, toeY + toeRadius * 0.8, toeRadius * 1.25);
    // Second toe
    fillCircle(soleCx - toeSpacing * 1.1, toeY - toeRadius * 0.3, toeRadius * 1.05);
    // Third toe
    fillCircle(soleCx - toeSpacing * 0.05, toeY - toeRadius * 0.4, toeRadius * 0.95);
    // Fourth toe
    fillCircle(soleCx + toeSpacing * 0.95, toeY - toeRadius * 0.1, toeRadius * 0.85);
    // Little toe
    fillCircle(soleCx + toeSpacing * 1.75, toeY + toeRadius * 0.6, toeRadius * 0.75);
  }
}

// Generate both sizes
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), renderIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), renderIcon(512));

console.log('Icons generated: icons/icon-192.png, icons/icon-512.png');
