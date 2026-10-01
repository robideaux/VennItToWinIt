import { ROOT } from './_root.mjs'
// The ?p= link format (Phase 21): versioned, compact, compressed — and every link already
// sent must keep opening.
import fs from 'fs'
import { pathToFileURL } from 'url'
const I = p => import(pathToFileURL(ROOT + p).href)
const S = await I('/src/utils/shareLink.js')
const C = await I('/src/utils/customPuzzles.js')
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const dir = ROOT + '/public/puzzles'
const { puzzles: index } = JSON.parse(fs.readFileSync(dir + '/index.json', 'utf8'))
const library = index.map(e => ({ ...JSON.parse(fs.readFileSync(dir + '/' + e.file, 'utf8')), id: 'custom_x' }))

// Exactly what every link before Phase 21 carried: base64url of the shareable JSON.
const v0 = p => Buffer.from(JSON.stringify(C.toShareable(p))).toString('base64url')
const same = (a, b) => C.contentKey(a) === C.contentKey(b) && a.title === b.title.trim()

console.log(`=== every library puzzle round-trips through v1 (${library.length}) ===`)
const bad = library.filter(p => { const d = S.decodePuzzle(S.encodePuzzle(p)); return !d || !same(d, p) })
chk(bad.length === 0, bad.length ? `broken: ${bad.map(p => p.title).join(', ')}` : `title, categories, terms and regions all intact`)
chk(library.every(p => S.encodePuzzle(p)[0] === S.LINK_VERSION), `every new link leads with version "${S.LINK_VERSION}"`)
const d0 = S.decodePuzzle(S.encodePuzzle(library[0]))
chk(d0.terms.map(t => t.id).join() === 't1,t2,t3,t4,t5,t6,t7', `decoded terms get the editor's ids t1..t7`)
chk(!('maxAttempts' in d0) && !('id' in d0), `nothing but content comes back`)

console.log('\n=== links sent before Phase 21 (v0) still open ===')
const old = library.filter(p => { const d = S.decodePuzzle(v0(p)); return !d || !same(d, p) })
chk(old.length === 0, `all ${library.length} decode from their old-format link`)
chk(library.every(p => v0(p).startsWith('eyJ')), `every v0 payload starts "eyJ", so "e" can never be a version`)

console.log('\n=== old and new links to one puzzle are the same puzzle ===')
chk(library.every(p => C.contentKey(S.decodePuzzle(v0(p))) === C.contentKey(S.decodePuzzle(S.encodePuzzle(p)))),
  `same contentKey, so receiving both still makes one copy`)

console.log('\n=== frozen v1 link — fails if the encoding ever changes under links already sent ===')
const FROZEN = '1VYxBCoAwDASfkjzAP4iIevRQPxBqtMXYQFoQf2_15nFnZ3eUu0F3xbNBNexV1haWENOesQQqWPtfftUfIONvBgPtwuBITk3gkl6b0MFQD6qMY8zhozipZobZPEFnvkSPC1t6AA'
const frozen = S.decodePuzzle(FROZEN)
chk(frozen && frozen.title === 'Fly, Swim, or Cold?' && same(frozen, library.find(p => p.title === 'Fly, Swim, or Cold?')),
  `decodes to "${frozen?.title}" with every term in place`)

console.log('\n=== hostile and broken input ===')
const sample = library[0]
const sep = { ...sample, title: 'Odd\u001fTitle', categories: { ...sample.categories, A: 'Tab\there' } }
const ds = S.decodePuzzle(S.encodePuzzle(sep))
chk(ds?.title === 'Odd Title' && ds.categories.A === 'Tab here', `a separator or control character in a label becomes a space, not a shifted field`)
chk(S.decodePuzzle('2' + S.encodePuzzle(sample).slice(1)) === null, `an unknown version is refused, not misread`)
chk(S.decodePuzzle(S.encodePuzzle(sample).slice(0, 40)) === null, `a truncated link is refused`)
chk(S.decodePuzzle('1@@@@') === null && S.decodePuzzle('') === null && S.decodePuzzle('eyJub3Q') === null, `garbage is refused`)
const short = { ...sample, terms: sample.terms.map((t, i) => i === 3 ? { ...t, label: '' } : t) }
chk(S.decodePuzzle(S.encodePuzzle(short)) === null, `an incomplete puzzle is refused, as before`)
const unicode = { ...sample, title: 'Café Crème ☕', categories: { ...sample.categories, B: '日本語' } }
chk(same(S.decodePuzzle(S.encodePuzzle(unicode)), unicode), `accents, emoji and CJK survive`)

console.log('\n=== length ===')
const base = 'https://vennittowinit.netlify.app/?p='.length
const lens = f => library.map(p => f(p).length).sort((a, b) => a - b)
const [a, b] = [lens(v0), lens(S.encodePuzzle)]
const med = v => v[v.length >> 1]
console.log(`    v0: median ${med(a)}, max ${a.at(-1)}   v1: median ${med(b)}, max ${b.at(-1)}   (+${base} for the URL)`)
chk(med(b) * 3 < med(a), `v1 is under a third of v0 at the median`)
chk(b.at(-1) + base < 300, `the longest library puzzle makes a ${b.at(-1) + base}-character link`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
