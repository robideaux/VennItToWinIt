import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const D = await import(U('puzzleDraft.js'))
const V = await import(U('validatePuzzle.js'))
const C = await import(U('customPuzzles.js'))
const { CATEGORY_TO_CIRCLE, REGION_KEYS, getCorrectCircles, isSolved } = await import(U('puzzleUtils.js'))
const mk = () => { const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) } }
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

// Author a puzzle the way the editor does: fill slots, convert, save
const draft = D.blankDraft()
draft.title = 'Kitchen Things'
draft.categories = { A:'Sharp', B:'Metal', C:'Hot' }
draft.terms = { A:'Scissors', B:'Spoon', C:'Kettle', AB:'Knife', AC:'Match', BC:'Pan', ABC:'Blowtorch' }

console.log('=== authoring flow ===')
let s = mk()
const candidate = D.fromDraft(draft)
chk(V.validatePuzzle(candidate).status==='complete', `filled draft -> complete`)
const saved = C.saveCustom(candidate, s)
chk(saved.ok && saved.puzzle.id.startsWith('custom_'), `saved -> ${saved.puzzle?.id}`)

console.log('\n=== saving a DRAFT must also succeed ===')
const half = D.blankDraft(); half.title='Half Done'; half.terms.A='Only one'
const halfSaved = C.saveCustom(D.fromDraft(half), s)
chk(halfSaved.ok, `incomplete draft saves (completeness gates PLAY, not save)`)
chk(V.validatePuzzle(halfSaved.puzzle).status==='incomplete', `...and is stored as incomplete`)

console.log('\n=== reopen, rename, re-save keeps one record ===')
const reopened = D.toDraft(halfSaved.puzzle)
reopened.title = 'Renamed Draft'
const resaved = C.saveCustom(D.fromDraft(reopened, { id: halfSaved.puzzle.id }), s)
chk(resaved.ok && resaved.puzzle.id===halfSaved.puzzle.id, `same id after rename`)
chk(C.listCustom('local',s).length===2, `still 2 records, not 3`)

console.log('\n=== title clash is refused ===')
const clash = C.saveCustom(D.fromDraft({...draft, title:'kitchen things'}), s)
chk(!clash.ok && clash.reason==='duplicate-title', `duplicate title rejected -> "${clash.reason}"`)

console.log('\n=== preview placement mapping matches the game ===')
const placements = Object.fromEntries(
  candidate.terms.map(t => [t.regions.map(c=>CATEGORY_TO_CIRCLE[c]).sort().join(''), t.id]))
chk(REGION_KEYS.every(k => placements[k]), `all 7 physical regions filled: ${REGION_KEYS.map(k=>placements[k]).join(', ')}`)
chk(isSolved(candidate, placements), `preview board is the SOLVED arrangement (what the author intends)`)
chk(getCorrectCircles(candidate, placements).length===3, `all 3 circles read as correct in preview`)

const G = await import(U('gameRules.js'))
console.log('')
console.log('=== attempts are fixed for every puzzle ===')
chk(G.ATTEMPTS===5, `every game gets ${G.ATTEMPTS} attempts`)
chk(!('maxAttempts' in D.fromDraft(draft)), `the editor no longer emits a per-puzzle value`)
chk(G.PERFECT_SCORE===1 && G.CLEAN_SCORE===3, `ladder: ${G.PERFECT_SCORE} via One Shot, ${G.CLEAN_SCORE} clean`)
console.log('\n=== label cap is what the renderer can actually draw ===')
chk(V.MAX_TERM_CHARS===40, `editor inputs cap at MAX_TERM_CHARS = ${V.MAX_TERM_CHARS}`)
const long = D.blankDraft(); Object.assign(long, {title:'x'.repeat(V.MAX_LABEL_CHARS)})
chk(V.validatePuzzle(D.fromDraft(long)).issues.every(i=>!i.message.includes('too long')), `a title at the cap is not "too long"`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
