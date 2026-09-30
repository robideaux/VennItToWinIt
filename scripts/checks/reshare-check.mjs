import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const C = await import(pathToFileURL(ROOT + '/src/utils/customPuzzles.js').href)
const mk = () => { const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) } }
const base = JSON.parse(fs.readFileSync('public/puzzles/2026_001.json','utf8'))
let fails=0, n=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const distinct = title => ({ ...base, title, terms: base.terms.map((t,i)=> i===0?{...t,label:`U${++n}`}:t) })

console.log('=== three people send me "Demo" ===')
let me = mk()
const p1 = C.importShared(distinct('Demo'), me)
const p2 = C.importShared(distinct('Demo'), me)
const p3 = C.importShared(distinct('Demo'), me)
for (const p of [p1,p2,p3]) {
  console.log(`   shown "${C.displayTitle(p.puzzle).padEnd(8)}" | title stays "${p.puzzle.title}"`)
}
chk(C.displayTitle(p3.puzzle)==='Demo 03', `third shows as "Demo 03"`)
chk(p3.puzzle.title==='Demo', `...but its title is still the author's "Demo"`)
chk(!('localTitle' in p1.puzzle), `first needed no suffix -> no localTitle field at all`)

console.log('\n=== I re-share the one I filed as "Demo 03" ===')
const outgoing = C.toShareable(p3.puzzle)
chk(outgoing.title==='Demo', `link carries "${outgoing.title}" — the author's title, not mine`)
chk(!('localTitle' in outgoing), `localTitle stripped`)
for (const k of ['id','source','createdAt']) chk(!(k in outgoing), `${k} stripped`)
chk(JSON.stringify(Object.keys(outgoing).sort())===JSON.stringify(['categories','terms','title'].sort()),
    `only puzzle content remains: ${Object.keys(outgoing).join(', ')}`)
for (const k of ['year','sequence']) chk(!(k in outgoing), `${k} stripped (library scheduling, meaningless on a custom puzzle)`)
chk(!('maxAttempts' in C.toShareable({ ...p3.puzzle, maxAttempts: 5 })), `maxAttempts stripped (ignored since the budget was fixed)`)
const bytes = Buffer.byteLength(JSON.stringify(outgoing))
console.log(`   payload ${bytes} bytes -> ~${Math.ceil(bytes*4/3)} base64 chars (safe URL limit ~2000)`)

console.log('\n=== recipient imports it fresh: sees the author title ===')
let them = mk()
const got = C.importShared(outgoing, them)
chk(C.displayTitle(got.puzzle)==='Demo', `they see "${C.displayTitle(got.puzzle)}" — my local numbering never travelled`)

console.log('\n=== recipient who ALSO already has a "Demo" ===')
let them2 = mk()
C.importShared(distinct('Demo'), them2)
const got2 = C.importShared(outgoing, them2)
chk(C.displayTitle(got2.puzzle)==='Demo 02', `they file it as "${C.displayTitle(got2.puzzle)}" by THEIR own numbering`)
chk(got2.puzzle.title==='Demo', `and its title is still "${got2.puzzle.title}"`)

console.log('\n=== suffixing counts displayed titles, not raw ones ===')
const p4 = C.importShared(distinct('Demo'), me)
chk(C.displayTitle(p4.puzzle)==='Demo 04', `next arrival -> "${C.displayTitle(p4.puzzle)}" (not "Demo 02" again, despite 3 records whose title is "Demo")`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
