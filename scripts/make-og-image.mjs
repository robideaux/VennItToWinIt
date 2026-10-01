// Generates public/og-image.png, the preview card image chat apps show under a link.
//
//   node scripts/make-og-image.mjs
//
// Drawn here rather than exported from a design tool so it stays in step with the game:
// the circles use CATEGORY_COLORS straight from src/styles/colors.js. Re-run it after a
// palette change. No text on purpose: the card's title and description come from the
// og: meta tags in index.html, and baked-in text would need a font renderer.
//
// PNG, not SVG — Facebook, Messenger and most other link previewers do not render SVG.

import fs from 'fs'
import zlib from 'zlib'
import { pathToFileURL } from 'url'
import { ROOT } from './checks/_root.mjs'

const { CATEGORY_COLORS } = await import(pathToFileURL(ROOT + '/src/styles/colors.js').href)

const W = 1200, H = 630          // the size Open Graph and Twitter large cards expect
const BG = [0x1a, 0x1a, 0x1a]    // the app icon's background
const ALPHA = 0.75               // the app icon's circle opacity
const SS = 4                     // supersampling per axis, for smooth edges

// Same arrangement as the app icon, scaled to the card: one circle above two.
const R = 170
const CIRCLES = [
  { cx: 600, cy: 228, color: CATEGORY_COLORS.A.bold },
  { cx: 502, cy: 398, color: CATEGORY_COLORS.B.bold },
  { cx: 698, cy: 398, color: CATEGORY_COLORS.C.bold },
].map(c => ({ ...c, rgb: [1, 3, 5].map(i => parseInt(c.color.slice(i, i + 2), 16)) }))

const px = Buffer.alloc(W * H * 3)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const acc = [0, 0, 0]
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const fx = x + (sx + 0.5) / SS, fy = y + (sy + 0.5) / SS
        let c = [...BG]
        for (const k of CIRCLES) {   // painted in order, like stacked SVG circles
          if ((fx - k.cx) ** 2 + (fy - k.cy) ** 2 <= R * R) {
            c = c.map((v, i) => v * (1 - ALPHA) + k.rgb[i] * ALPHA)
          }
        }
        for (let i = 0; i < 3; i++) acc[i] += c[i]
      }
    }
    const o = (y * W + x) * 3
    for (let i = 0; i < 3; i++) px[o + i] = Math.round(acc[i] / (SS * SS))
  }
}

// Minimal PNG: signature, IHDR, one IDAT, IEND. Each row is prefixed with filter 0.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8; ihdr[9] = 2   // 8-bit RGB
const raw = Buffer.alloc(H * (W * 3 + 1))
for (let y = 0; y < H; y++) px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])
const out = ROOT + '/public/og-image.png'
fs.writeFileSync(out, png)
console.log(`wrote ${out} — ${W}×${H}, ${(png.length / 1024).toFixed(1)} KB`)
