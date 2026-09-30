import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const D = await import(U('puzzleDraft.js'))
const { validatePuzzle } = await import(U('validatePuzzle.js'))
const { categoryRegionToPhysical } = await import(U('puzzleUtils.js'))
const { CENTROIDS } = await import(U('vennGeometry.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

console.log('=== category region -> physical region (editor positioning) ===')
for (const [cat, phys] of [['A','1'],['B','2'],['C','3'],['AB','12'],['AC','13'],['BC','23'],['ABC','123']]) {
  const got = categoryRegionToPhysical(cat)
  chk(got===phys && got in CENTROIDS, `'${cat}' -> '${got}' (a real geometry key)`)
}

console.log('\n=== round trip through every library puzzle ===')
const dir=ROOT + '/public/puzzles'
let n=0, bad=0
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')||f==='index.json') continue
  const p = JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'))
  if (validatePuzzle(p).status !== 'complete') continue
  n++
  const back = D.fromDraft(D.toDraft(p))
  const norm = q => JSON.stringify({
    title:q.title.trim(),
    categories:q.categories,
    terms:[...q.terms].map(t=>[[...t.regions].sort().join(''),t.label.trim()]).sort(),
  })
  if (norm(p)!==norm(back)) { bad++; if(bad<3) console.log(`   FAIL ${f}`) }
}
chk(bad===0, `${n} complete puzzles survive toDraft -> fromDraft unchanged (title, categories, terms)`)
chk(!('maxAttempts' in D.fromDraft(D.toDraft(JSON.parse(fs.readFileSync(dir+'/2026_001.json','utf8'))))),
    `and the draft no longer carries maxAttempts`)

console.log('\n=== drafts ===')
const blank = D.blankDraft()
chk(D.isBlankDraft(blank), `blankDraft is blank`)
chk(validatePuzzle(D.fromDraft(blank)).status==='incomplete', `empty draft -> incomplete, never invalid (so it can always be saved)`)
const partial = D.blankDraft(); partial.title='Half'; partial.terms.A='Eagle'; partial.categories.A='Birds'
const pz = D.fromDraft(partial)
chk(validatePuzzle(pz).status==='incomplete', `partial draft -> incomplete (${validatePuzzle(pz).issues.length} issues)`)
chk(pz.terms.length===7, `always emits 7 terms, blanks included (slots are the structure)`)
chk(new Set(pz.terms.map(t=>t.id)).size===7, `term ids unique`)

console.log('\n=== reopening a partial puzzle keeps gaps in the right slots ===')
const re = D.toDraft(pz)
chk(re.terms.A==='Eagle' && re.terms.AB==='' && re.terms.ABC==='', `A="Eagle", AB and ABC still empty`)

console.log('\n=== a full draft becomes complete ===')
const full = D.blankDraft()
full.title='T'; for (const k of ['A','B','C']) full.categories[k]='Cat'+k
for (const k of ['A','B','C','AB','AC','BC','ABC']) full.terms[k]='Term'+k
chk(validatePuzzle(D.fromDraft(full)).status==='complete', `all slots filled -> complete`)
console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
