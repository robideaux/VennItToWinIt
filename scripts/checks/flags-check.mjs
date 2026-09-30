import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const V = await import(U('validatePuzzle.js'))
const D = await import(U('puzzleDraft.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const mk = (over={}) => { const d = D.blankDraft(); Object.assign(d, over); return D.fromDraft(d) }

console.log('=== a brand-new blank puzzle marks nothing ===')
chk(V.issuesByField(mk()).size === 0, `0 fields flagged on an empty editor`)

console.log('=== one field entered still marks nothing (the reported hostility) ===')
const one = D.blankDraft(); one.terms.A = 'Eagle'
chk(V.issuesByField(D.fromDraft(one)).size === 0,
    `0 fields flagged after typing a single term — the other six stay quiet`)

console.log('=== half-filled marks nothing ===')
const half = D.blankDraft(); half.title='Half'
half.categories = { A:'Birds', B:'Water', C:'' }
half.terms = { A:'Eagle', B:'Salmon', C:'', AB:'Fish', AC:'', BC:'', ABC:'' }
chk(V.issuesByField(D.fromDraft(half)).size === 0, `0 fields flagged mid-draft`)
chk(V.validatePuzzle(D.fromDraft(half)).status === 'incomplete', `...but still incomplete, so it saves as a draft`)

console.log('\n=== conflicts ARE marked, because they are invisible otherwise ===')
const dup = D.blankDraft(); dup.title='T'
dup.categories = { A:'bbb', B:'bbb', C:'bbb' }
dup.terms = { A:'a', B:'a', C:'a', AB:'a', AC:'a', BC:'a', ABC:'a' }
const f = V.issuesByField(D.fromDraft(dup))
chk(f.size === 10, `all 10 duplicate fields marked`)
chk([...f.values()].every(m => m.includes('Same as')), `each says why: "${[...f.values()][0]}"`)

console.log('\n=== mixed: duplicates marked, blanks left alone ===')
const mix = D.blankDraft(); mix.title='T'
mix.categories = { A:'Birds', B:'Birds', C:'' }
mix.terms = { A:'Eagle', B:'Eagle', C:'', AB:'', AC:'', BC:'', ABC:'' }
const fm = V.issuesByField(D.fromDraft(mix))
chk(fm.size === 4, `exactly 4 marked (2 duplicate categories + 2 duplicate terms), 5 blanks unmarked`)
chk(!fm.has('category:C') && !fm.has('term:AB'), `blank fields not marked`)

console.log('\n=== the count still reflects everything left to do ===')
const all = V.validatePuzzle(D.fromDraft(mix)).issues
chk(all.length > fm.size, `status line counts ${all.length} to fix, of which ${fm.size} are marked on the board`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
