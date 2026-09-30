import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const C = await import(U('customPuzzles.js'))
const { formatStoredDate } = await import(U('puzzleSchedule.js'))

const mk = () => { const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) } }
const base  = JSON.parse(fs.readFileSync('public/puzzles/2026_001.json','utf8'))
const other = JSON.parse(fs.readFileSync('public/puzzles/2026_002.json','utf8'))
const rows = s => C.listCustom(null,s).map(p =>
  `      ${p.source.padEnd(7)} | ${formatStoredDate(p.createdAt).padEnd(7)} | ${p.title}`).join('\n')

console.log('SCENARIO 1 — two DIFFERENT puzzles, both titled "Demo", from two people')
let s = mk()
C.importShared({...base,  title:'Demo'}, s)
C.importShared({...other, title:'Demo'}, s)
console.log('   both import (you must be able to play what someone sent you):')
console.log(rows(s))

// Same-day arrivals: the date cannot separate them
const sameDay = C.listCustom('shared',s).map(p => `${formatStoredDate(p.createdAt)}|${p.title}`)
console.log(`   >>> distinguishable today? ${new Set(sameDay).size === sameDay.length ? 'yes' : 'NO — same title, same day'}`)

// Arriving on different days, which is the common case
let s1b = mk()
C.importShared({...base, title:'Demo', }, s1b)
const st = JSON.parse(s1b.getItem('vennit_custom'))
st.puzzles[0].createdAt = new Date(Date.now() - 5*864e5).toISOString()
s1b.setItem('vennit_custom', JSON.stringify(st))
C.importShared({...other, title:'Demo'}, s1b)
console.log('   arriving on different days:')
console.log(rows(s1b))

console.log('\nSCENARIO 2 — I author "Test1", then open my own share link')
let s2 = mk()
const local = C.saveCustom({...base, id:null, title:'Test1'}, s2)
const back  = C.importShared({...base, title:'Test1'}, s2)
console.log(`   authored:  ${local.puzzle.id} (local)`)
console.log(`   my link:   duplicate=${!!back.duplicate} -> returns ${back.puzzle.id} (${back.puzzle.source})`)
console.log(`   same record as the one I authored? ${back.puzzle.id === local.puzzle.id ? 'YES' : 'no'}`)
console.log(`   store holds ${C.listCustom(null,s2).length}:`)
console.log(rows(s2))

console.log('\nSCENARIO 2b — someone sends me a DIFFERENT puzzle that I did not write')
const third = C.importShared({...other, title:'Theirs'}, s2)
console.log(`   imported normally: ${!third.duplicate} -> ${C.listCustom(null,s2).length} records`)
console.log(rows(s2))
