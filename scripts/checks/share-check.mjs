import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const S = await import(U('shareLink.js'))
const C = await import(U('customPuzzles.js'))
const D = await import(U('puzzleDraft.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const loc = { origin:'https://vennittowinit.netlify.app', pathname:'/' }
const mk = () => { const m=new Map(); return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) } }

const d = D.blankDraft()
d.title='Kitchen Things'; d.maxAttempts=5
d.categories={A:'Sharp',B:'Metal',C:'Hot'}
d.terms={A:'Scissors',B:'Spoon',C:'Kettle',AB:'Knife',AC:'Match',BC:'Pan',ABC:'Blowtorch'}
let s = mk()
const saved = C.saveCustom(D.fromDraft(d), s).puzzle

console.log('=== round trip ===')
const url = S.shareUrlFor(saved, loc)
const parsed = S.readShareParams(new URL(url).search)
chk(parsed.kind==='custom', `custom puzzle -> ?p= link`)
const back = S.decodePuzzle(parsed.payload)
chk(back && back.title==='Kitchen Things', `decodes back to "${back?.title}"`)
chk(JSON.stringify(back)===JSON.stringify(C.toShareable(saved)), `content identical to toShareable output`)
chk(!('id' in back) && !('source' in back) && !('createdAt' in back) && !('localTitle' in back),
    `no local bookkeeping travelled: ${Object.keys(back).join(', ')}`)

console.log('\n=== url safety ===')
chk(!/[+/=]/.test(parsed.payload), `payload has no + / or = (URL-safe alphabet)`)
chk(encodeURIComponent(parsed.payload)===parsed.payload, `survives encodeURIComponent unchanged`)
console.log(`   length: ${url.length} chars total, ${parsed.payload.length} of payload (safe limit ~2000)`)
chk(url.length < 2000, `comfortably inside the URL limit`)

console.log('\n=== non-ASCII survives ===')
const u = D.blankDraft()
u.title='Café Crème ☕'; u.maxAttempts=5
u.categories={A:'Naïve',B:'Zoë',C:'日本語'}
u.terms={A:'Ünïcode',B:'émoji 🎉',C:'Ω',AB:'ß',AC:'åäö',BC:'中文',ABC:'🧩 puzzle'}
const uni = S.decodePuzzle(S.encodePuzzle(D.fromDraft(u)))
chk(uni?.title==='Café Crème ☕', `title "${uni?.title}"`)
chk(uni?.terms.find(t=>t.regions.join('')==='ABC')?.label==='🧩 puzzle', `emoji term survives`)
chk(uni?.categories.C==='日本語', `CJK category survives`)

console.log('\n=== library puzzles use an id, not a payload ===')
const entry = { id:'2026_001', title:'Fly, Swim, or Cold?', file:'2026_001.json', year:2026, sequence:1 }
const lurl = S.shareUrlFor(entry, loc)
const lp = S.readShareParams(new URL(lurl).search)
chk(lp.kind==='library' && lp.id==='2026_001', `-> ${lurl}`)
chk(lurl.length < 80, `short link (${lurl.length} chars) — the recipient already has the file`)

console.log('\n=== untrusted input is rejected, never thrown on ===')
for (const [label, bad] of [
  ['truncated payload', parsed.payload.slice(0, -20)],
  ['not base64',        '!!!not-a-payload!!!'],
  ['empty',             ''],
  ['valid b64, not json', S.encodePuzzle ? 'aGVsbG8' : 'x'],
  ['json but not a puzzle', Buffer.from('{"hello":"world"}').toString('base64url')],
]) {
  let threw = false, out
  try { out = S.decodePuzzle(bad) } catch { threw = true }
  chk(!threw && out === null, `${label} -> null`)
}

console.log('\n=== an incomplete puzzle cannot be shared into someone else\'s app ===')
const draft = D.blankDraft(); draft.title='Half'; draft.terms.A='Only one'
chk(S.decodePuzzle(S.encodePuzzle(D.fromDraft(draft))) === null,
    `draft payload decodes to null (import requires complete)`)

console.log('\n=== re-sharing a received puzzle passes on the author title ===')
let me2 = mk()
C.importShared({...C.toShareable(saved)}, me2)
const second = C.importShared({...C.toShareable(saved), terms: C.toShareable(saved).terms.map((t,i)=>i===0?{...t,label:'Different'}:t)}, me2)
chk(C.displayTitle(second.puzzle)==='Kitchen Things 02', `filed locally as "${C.displayTitle(second.puzzle)}"`)
const onward = S.decodePuzzle(S.encodePuzzle(second.puzzle))
chk(onward.title==='Kitchen Things', `but the link carries "${onward.title}"`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
