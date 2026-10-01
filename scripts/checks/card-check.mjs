import { ROOT } from './_root.mjs'
// The link preview card (Phase 21): static Open Graph tags in index.html, read by chat-app
// crawlers that run no JavaScript.
import fs from 'fs'
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const html = fs.readFileSync(ROOT + '/index.html', 'utf8')
const meta = key => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1]

console.log('=== tags present in the static HTML ===')
for (const k of ['og:type', 'og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:card', 'description'])
  chk(meta(k), `${k}: ${meta(k)?.slice(0, 60)}`)

console.log('\n=== the image they point at ===')
const img = meta('og:image') ?? ''
chk(/^https:\/\//.test(img), `og:image is absolute (crawlers do not resolve relative URLs)`)
const file = ROOT + '/public' + new URL(img).pathname
chk(fs.existsSync(file), `served from public/: ${new URL(img).pathname}`)
const png = fs.readFileSync(file)
chk(png.subarray(1, 4).toString() === 'PNG', `a PNG (Messenger and Facebook do not render SVG previews)`)
const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)]
chk(String(w) === meta('og:image:width') && String(h) === meta('og:image:height'), `${w}×${h}, matching the declared size`)
chk(png.length < 300 * 1024, `${(png.length / 1024).toFixed(1)} KB — well under crawler limits`)

console.log('\n=== spoiler-free ===')
const card = [meta('og:title'), meta('og:description'), meta('og:image:alt')].join(' ')
chk(!/[?&]p=|puzzle=/.test(html.split('<body')[0].replace(/<!--[\s\S]*?-->/g, '')), `no per-puzzle data in the head`)
chk(card.length > 0, `one generic card for every link`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
