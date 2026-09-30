import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = p => pathToFileURL(ROOT + '/src/utils/'+p).href
const { validatePuzzle } = await import(U('validatePuzzle.js'))
const C = await import(U('customPuzzles.js'))

// Minimal in-memory localStorage stand-in
const mk = () => { const m = new Map(); return {
  getItem: k => m.has(k) ? m.get(k) : null,
  setItem: (k,v) => m.set(k,v),
  _raw: () => m.get('vennit_custom'), _map: m } }

let fails = 0
const chk = (c,m) => { if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

// A real library puzzle as the "complete" fixture
const real  = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/2026_001.json','utf8'))
const other = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/2026_002.json','utf8'))

console.log('=== validatePuzzle: three states ===')
chk(validatePuzzle(real).status==='complete', `real library puzzle -> complete`)

const draft = structuredClone(real); draft.terms[2].label=''; draft.terms[5].label='  '
chk(validatePuzzle(draft).status==='incomplete', `draft with 2 blank labels -> incomplete (${validatePuzzle(draft).issues.length} issues)`)

const partial = structuredClone(real); partial.terms = partial.terms.slice(0,4)
chk(validatePuzzle(partial).status==='incomplete', `only 4 of 7 regions -> incomplete, NOT invalid (a draft must survive)`)

const noTitle = structuredClone(real); noTitle.title=''
chk(validatePuzzle(noTitle).status==='incomplete', `blank title -> incomplete`)

for (const [label, mutate] of [
  ['not an object',      () => 'nope'],
  ['terms not a list',   () => { const p=structuredClone(real); p.terms={}; return p }],
  ['duplicate region',   () => { const p=structuredClone(real); p.terms[1].regions=[...p.terms[0].regions]; return p }],
  ['unknown region',     () => { const p=structuredClone(real); p.terms[0].regions=['Z']; return p }],
  ['too many terms',     () => { const p=structuredClone(real); p.terms=[...p.terms,...p.terms]; return p }],
]) chk(validatePuzzle(mutate()).status==='invalid', `${label} -> invalid`)

const oddAtt = structuredClone(real); oddAtt.maxAttempts=109
chk(validatePuzzle({...structuredClone(real), id:undefined}).status==='complete', `no id -> still complete (identity is the store's job, not content)`)
chk(validatePuzzle(oddAtt).status==='complete', `a stray maxAttempts is ignored, not validated`)
const noAtt = structuredClone(real); delete noAtt.maxAttempts
chk(validatePuzzle(noAtt).status==='complete', `a puzzle with no maxAttempts at all is still complete`)

console.log('\n=== save / rename / collision ===')
let s = mk()
const a = C.saveCustom({...structuredClone(real), id:null, title:'Kitchen Things'}, s)
chk(a.ok && a.puzzle.id.startsWith('custom_'), `save -> id ${a.puzzle?.id}`)
chk(a.puzzle && a.puzzle.source==='local' && !!a.puzzle.createdAt, `stamped source=local + createdAt`)

const dup = C.saveCustom({...structuredClone(real), id:null, title:'kitchen THINGS'}, s)
chk(!dup.ok && dup.reason==='duplicate-title', `duplicate title (case-insensitive) rejected`)

const renamed = C.saveCustom({...a.puzzle, title:'Kitchen Stuff'}, s)
chk(renamed.ok && renamed.puzzle && renamed.puzzle.id===a.puzzle.id, `rename keeps the SAME id (progress follows it)`)
chk(C.listCustom('local',s).length===1, `rename did not create a second puzzle`)
chk(renamed.puzzle && renamed.puzzle.createdAt===a.puzzle.createdAt, `rename preserves createdAt`)

const d = C.saveCustom({...structuredClone(real), id:null, title:'Draft', terms:structuredClone(real).terms.slice(0,3)}, s)
chk(d.ok, `INCOMPLETE draft saves successfully (completeness gates play, not save)`)

console.log('\n=== shared imports ===')
const imp = C.importShared({...structuredClone(other), id:'whatever', title:'Beatles Albums'}, s)
chk(imp.ok && imp.puzzle && imp.puzzle.source==='shared', `import of NEW content -> source=shared`)
const imp2 = C.importShared({...structuredClone(other), id:'other', title:'Beatles Albums'}, s)
chk(imp2.ok && imp2.duplicate && imp2.puzzle?.id===imp.puzzle?.id, `same content re-imported -> deduped, no second copy`)
const impDraft = C.importShared(draft, s)
chk(!impDraft.ok, `incomplete puzzle CANNOT be imported (received are play/delete only)`)

// Opening your own share link must not fork the puzzle away from its progress
const selfBack = C.importShared({...structuredClone(real), title:'Whatever They Called It'}, s)
chk(selfBack.ok && selfBack.duplicate && selfBack.puzzle.source==='local',
    `my own link comes home -> returns MY local copy, no second record`)

// Two different puzzles sharing a title must both still arrive
const t1 = C.importShared({...structuredClone(other), terms:structuredClone(other).terms.map((t,i)=>i===0?{...t,label:'Zebra'}:t), title:'Demo'}, s)
const t2 = C.importShared({...structuredClone(other), terms:structuredClone(other).terms.map((t,i)=>i===0?{...t,label:'Yak'}:t), title:'Demo'}, s)
chk(t1.ok && t2.ok && !t1.duplicate && !t2.duplicate && t1.puzzle.id!==t2.puzzle.id,
    `two DIFFERENT puzzles both titled "Demo" both import (you must be able to play what you are sent)`)
chk(!C.titleExists('Beatles Albums', null, s), `shared title does not block a local one of the same name`)
const localSame = C.saveCustom({...structuredClone(real), id:null, title:'Beatles Albums'}, s)
chk(localSame.ok, `you can name YOUR puzzle the same as a received one`)

console.log('\n=== sections + sort ===')
chk(C.listCustom('local',s).length===3 && C.listCustom('shared',s).length===3, `local=3 shared=3`)
const times = C.listCustom('local',s).map(p=>p.createdAt)
chk([...times].sort().reverse().join()===times.join(), `newest first`)

console.log('\n=== delete ===')
chk(C.deleteCustom(a.puzzle.id,s)===true, `delete existing -> true`)
chk(C.deleteCustom('custom_nope',s)===false, `delete missing -> false`)
chk(C.getCustom(a.puzzle.id,s)===null, `gone from the store`)

console.log('\n=== defensive parse: one bad record must not take the rest ===')
let s2 = mk()
C.saveCustom({...structuredClone(real), id:null, title:'Good One'}, s2)
const blob = JSON.parse(s2._raw())
blob.puzzles.push({id:'custom_bad', terms:'not-a-list'})
blob.puzzles.push('a bare string')
s2.setItem('vennit_custom', JSON.stringify(blob))
chk(C.listCustom(null,s2).length===1 && C.listCustom(null,s2)[0].title==='Good One',
    `2 corrupt records dropped, the good one survives`)

const noId = JSON.parse(s2._raw()); noId.puzzles.push({...structuredClone(real), source:'local', createdAt:'2026-01-01'})
s2.setItem('vennit_custom', JSON.stringify(noId))
chk(C.listCustom(null,s2).length===1, `record with no custom id dropped at the store edge (unaddressable)`)
s2.setItem('vennit_custom','{ not json at all')
chk(C.listCustom(null,s2).length===0, `unparseable store -> empty list, no throw`)
s2.setItem('vennit_custom', JSON.stringify([{...structuredClone(real), id:'custom_x', source:'local', createdAt:'2026-01-01'}]))
chk(C.listCustom(null,s2).length===1, `tolerates a bare legacy array`)

console.log('\n=== storage unavailable / full ===')
const blocked = { getItem(){throw new Error('blocked')}, setItem(){throw new Error('blocked')} }
chk(C.listCustom(null,blocked).length===0, `blocked storage reads -> empty, no throw`)
const full = { getItem:()=>null, setItem(){ const e=new Error('quota'); e.name='QuotaExceededError'; throw e } }
const r = C.saveCustom({...structuredClone(real), id:null, title:'X'}, full)
chk(!r.ok && r.reason==='storage-full', `quota exceeded -> reported, not thrown`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
