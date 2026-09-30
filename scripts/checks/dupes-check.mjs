import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const V = await import(U('validatePuzzle.js'))
const D = await import(U('puzzleDraft.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

console.log('=== the exact case reported: "bbb" groups, "a" terms ===')
const bad = D.blankDraft()
bad.title = 'Test'
for (const k of ['A','B','C']) bad.categories[k] = 'bbb'
for (const k of ['A','B','C','AB','AC','BC','ABC']) bad.terms[k] = 'a'
const r = V.validatePuzzle(D.fromDraft(bad))
chk(r.status === 'incomplete', `-> ${r.status} (was wrongly "complete")`)
const fields = V.issuesByField(D.fromDraft(bad))
chk(fields.size === 10, `${fields.size} fields flagged (3 categories + 7 terms)`)
console.log(`   e.g. category:A -> "${fields.get('category:A')}", term:AB -> "${fields.get('term:AB')}"`)

console.log('\n=== duplicates are case- and space-insensitive ===')
const d2 = D.blankDraft(); d2.title='T'
d2.categories = { A:'Birds', B:'  birds  ', C:'Fish' }
for (const k of ['A','B','C','AB','AC','BC','ABC']) d2.terms[k] = 'Term'+k
const f2 = V.issuesByField(D.fromDraft(d2))
chk(f2.has('category:A') && f2.has('category:B') && !f2.has('category:C'),
    `"Birds" vs "  birds  " flags both, leaves "Fish" alone`)

console.log('\n=== only ONE pair needs to clash ===')
const d3 = D.blankDraft(); d3.title='T'
for (const k of ['A','B','C']) d3.categories[k]='Cat'+k
const t3 = { A:'Eagle', B:'Salmon', C:'Ice', AB:'Fish', AC:'Snow', BC:'Orca', ABC:'eagle' }
d3.terms = t3
const f3 = V.issuesByField(D.fromDraft(d3))
chk(f3.has('term:A') && f3.has('term:ABC') && f3.size===2, `"Eagle"/"eagle" flags exactly those two`)

console.log('\n=== empty fields are ISSUES but are not MARKED on the board ===')
const d4 = D.blankDraft(); d4.title='T'
for (const k of ['A','B','C']) d4.categories[k]='Cat'+k
d4.terms.A='Only'
const all4 = V.validatePuzzle(D.fromDraft(d4)).issues
const miss4 = all4.filter(i => i.kind === 'missing' && i.field && i.field.startsWith('term:'))
chk(miss4.length===6, `6 empty term slots each reported individually (kind 'missing')`)
chk(V.issuesByField(D.fromDraft(d4)).size===0, `...but none are MARKED: an empty box already reads as empty, so red would be noise`)
chk(V.issuesByField(D.fromDraft(d4), { include:['missing','conflict'] }).size===6, `callers that want them can opt in`)

console.log('\n=== a genuinely good puzzle still passes ===')
const good = D.blankDraft(); good.title='Good'
good.categories = { A:'Sharp', B:'Metal', C:'Hot' }
good.terms = { A:'Scissors', B:'Spoon', C:'Kettle', AB:'Knife', AC:'Match', BC:'Pan', ABC:'Blowtorch' }
chk(V.validatePuzzle(D.fromDraft(good)).status==='complete', `distinct names and terms -> complete`)

console.log('\n=== the whole library is still valid under the stricter rules ===')
const dir=ROOT + '/public/puzzles'
let n=0, broke=[]
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')||f==='index.json') continue
  const p = JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'))
  n++
  if (V.validatePuzzle(p).status !== 'complete') broke.push(`${f}: ${V.validatePuzzle(p).issues.map(i=>i.field+' '+i.message).join('; ')}`)
}
chk(broke.length===0, `${n} library puzzles all still complete`)
for (const b of broke.slice(0,5)) console.log('   ' + b)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
