import { ROOT } from './_root.mjs'
// End-to-end: sender builds a link, recipient's App logic resolves it.
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const S = await import(U('shareLink.js'))
const C = await import(U('customPuzzles.js'))
const D = await import(U('puzzleDraft.js'))
const { isPuzzleUnlocked } = await import(U('puzzleSchedule.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const mk=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)}}
const loc={origin:'https://vennittowinit.netlify.app',pathname:'/'}

// What App's effect does for a ?p= link
const openCustom = (url, storage) => {
  const params = S.readShareParams(new URL(url).search)
  if (params?.kind !== 'custom') return null
  const decoded = S.decodePuzzle(params.payload)
  if (!decoded) return null
  const r = C.importShared(decoded, storage)
  return r.ok ? r.puzzle : null
}

const d = D.blankDraft()
d.title='Kitchen Things'; d.maxAttempts=5
d.categories={A:'Sharp',B:'Metal',C:'Hot'}
d.terms={A:'Scissors',B:'Spoon',C:'Kettle',AB:'Knife',AC:'Match',BC:'Pan',ABC:'Blowtorch'}

let alice = mk()
const mine = C.saveCustom(D.fromDraft(d), alice).puzzle
const link = S.shareUrlFor(mine, loc)

console.log('=== Bob opens Alice\'s link ===')
let bob = mk()
const got = openCustom(link, bob)
chk(got?.title==='Kitchen Things', `plays "${got?.title}"`)
chk(got.source==='shared', `filed as shared`)
chk(C.listCustom(null,bob).length===1, `1 record saved on arrival`)

console.log('\n=== Bob opens it again (refresh, or the same link twice) ===')
openCustom(link, bob)
chk(C.listCustom(null,bob).length===1, `still 1 record — deduplicated on content`)

console.log('\n=== Alice tests her own link ===')
const backHome = openCustom(link, alice)
chk(backHome?.id===mine.id && backHome.source==='local',
    `gets her own editable copy back (${backHome?.source}), not a second entry`)
chk(C.listCustom(null,alice).length===1, `Alice still has 1 record`)

console.log('\n=== Bob re-shares to Carol: the author title travels ===')
let carol = mk()
C.importShared({...C.toShareable(mine), terms:C.toShareable(mine).terms.map((t,i)=>i===0?{...t,label:'Other'}:t)}, carol)
const carolGot = openCustom(S.shareUrlFor(got, loc), carol)
chk(C.displayTitle(carolGot)==='Kitchen Things 02', `Carol files it as "${C.displayTitle(carolGot)}" by her own numbering`)
chk(carolGot.title==='Kitchen Things', `and its title is still Alice's "${carolGot.title}"`)

console.log('\n=== library link honours the weekly gate ===')
const { puzzles } = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/index.json','utf8'))
const openLibrary = url => {
  const p = S.readShareParams(new URL(url).search)
  const e = puzzles.find(x => x.id === p.id)
  return e && isPuzzleUnlocked(e.year, e.sequence) ? e : null
}
const old = puzzles.find(e => isPuzzleUnlocked(e.year, e.sequence))
chk(!!openLibrary(S.shareUrlFor(old, loc)), `a released puzzle opens: "${old.title}"`)
const future = { id:'2099_052', title:'Not yet', file:'x.json', year:2099, sequence:52 }
chk(openLibrary(`${loc.origin}/?puzzle=2099_052`) === null,
    `an unreleased id does not open — a link is not a way past the gate`)
chk(openLibrary(`${loc.origin}/?puzzle=nonsense`) === null, `an unknown id does not open`)

console.log('\n=== a tampered payload just fails ===')
const tampered = link.slice(0, -30) + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
let threw=false, out
try { out = openCustom(tampered, mk()) } catch { threw=true }
chk(!threw && out===null, `garbled link -> no import, no crash`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
