import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const C = await import(pathToFileURL(ROOT + '/src/utils/customPuzzles.js').href)
const mk = () => { const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) } }
const base = JSON.parse(fs.readFileSync('public/puzzles/2026_001.json','utf8'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

// distinct content each time, so dedupe never fires
let n = 0
const distinct = title => ({ ...base, title,
  terms: base.terms.map((t,i)=> i===0 ? {...t, label:`Unique${++n}`} : t) })

console.log('=== different people sending same-titled puzzles ===')
let s = mk()
const a = C.importShared(distinct('Demo'), s)
const b = C.importShared(distinct('Demo'), s)
const c = C.importShared(distinct('Demo'), s)
chk(C.displayTitle(a.puzzle)==='Demo',    `1st -> "${C.displayTitle(a.puzzle)}"`)
chk(C.displayTitle(b.puzzle)==='Demo 02', `2nd -> "${C.displayTitle(b.puzzle)}"`)
chk(C.displayTitle(c.puzzle)==='Demo 03', `3rd -> "${C.displayTitle(c.puzzle)}"`)

console.log('\n=== freed numbers get reused (no gaps) ===')
C.deleteCustom(b.puzzle.id, s)
const d = C.importShared(distinct('Demo'), s)
chk(C.displayTitle(d.puzzle)==='Demo 02', `after deleting "Demo 02", next import reclaims it -> "${C.displayTitle(d.puzzle)}"`)

console.log('\n=== case-insensitive, matching the local rule ===')
const e = C.importShared(distinct('DEMO'), s)
chk(C.displayTitle(e.puzzle)!=='DEMO' && /^DEMO \d\d$/.test(C.displayTitle(e.puzzle)), `"DEMO" collides with "Demo" -> "${C.displayTitle(e.puzzle)}"`)

console.log('\n=== a local puzzle does NOT trigger a suffix ===')
let s2 = mk()
C.saveCustom({...base, id:null, title:'Demo'}, s2)
const f = C.importShared(distinct('Demo'), s2)
chk(C.displayTitle(f.puzzle)==='Demo', `local "Demo" + received "Demo" both keep their title (separate sections)`)
console.log('   ' + C.listCustom(null,s2).map(p=>`${p.source.padEnd(7)} ${C.displayTitle(p)}`).join('\n   '))

console.log('\n=== same link twice still dedupes, no suffix creep ===')
let s3 = mk()
const g = C.importShared(distinct('Demo'), s3)
const h = C.importShared({...g.puzzle, id:'x', source:undefined}, s3)
chk(h.duplicate && C.listCustom(null,s3).length===1, `re-import -> deduped, still 1 record titled "${C.displayTitle(C.listCustom(null,s3)[0])}"`)

console.log('\n=== title that already ends in a number ===')
let s4 = mk()
const i1 = C.importShared(distinct('Chapter 02'), s4)
const i2 = C.importShared(distinct('Chapter 02'), s4)
chk(C.displayTitle(i2.puzzle)==='Chapter 02 02', `"Chapter 02" twice -> "${C.displayTitle(i2.puzzle)}" (odd-looking but unambiguous)`)

console.log('\n=== blank title ===')
let s5 = mk()
const j1 = C.importShared({...distinct(''), title:''}, s5)
console.log(`   blank title import: ok=${j1.ok} (blocked as incomplete, never reaches suffixing)`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
