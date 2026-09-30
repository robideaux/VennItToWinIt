import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
const C = await import(pathToFileURL(ROOT + '/src/utils/customPuzzles.js').href)
const base = JSON.parse(fs.readFileSync('public/puzzles/2026_001.json','utf8'))

// ONE storage, shared by both tabs — as localStorage is
const m = new Map()
const shared = { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,v) }

// Each tab holds its own in-memory React state, read once at mount
const mountTab = name => ({
  name,
  activePuzzle: null,
  customList: C.listCustom(null, shared),
  progress: JSON.parse(shared.getItem('vennit_progress') || '{}'),
})
const writeProgress = tab => shared.setItem('vennit_progress', JSON.stringify(tab.progress))

const saved = C.saveCustom({...base, id:null, title:'Kitchen Things'}, shared)
const pid = saved.puzzle.id

const A = mountTab('Tab A')
A.activePuzzle = saved.puzzle                       // played it
A.progress[pid] = { won:true, attempts:3 }; writeProgress(A)
A.progress['2026_001'] = { won:true, attempts:2 }; writeProgress(A)

const B = mountTab('Tab B')                          // opened fresh, sees both

console.log('=== Tab B deletes the puzzle Tab A just played ===')
C.deleteCustom(pid, shared)
delete B.progress[pid]; writeProgress(B)
console.log(`  storage now: ${C.listCustom(null,shared).length} custom puzzle(s), progress keys = ${Object.keys(JSON.parse(shared.getItem('vennit_progress'))).join(', ')}`)

console.log('\n=== Tab A presses Back to the results screen ===')
console.log(`  activePuzzle in Tab A memory : ${A.activePuzzle ? 'still there ("'+A.activePuzzle.title+'")' : 'null'}`)
console.log(`  -> renders the reveal normally. NO "no longer available" fallback.`)

console.log('\n=== but Tab A is now stale ===')
console.log(`  Tab A's selector still lists : ${A.customList.map(p=>p.title).join(', ') || '(none)'}`)
console.log(`  storage actually holds       : ${C.listCustom(null,shared).map(p=>p.title).join(', ') || '(none)'}`)

console.log('\n=== Tab A plays another game, writing progress from stale memory ===')
A.progress['2026_002'] = { won:false, attempts:5 }
writeProgress(A)
const final = JSON.parse(shared.getItem('vennit_progress'))
console.log(`  progress keys after Tab A writes: ${Object.keys(final).join(', ')}`)
console.log(`  >>> deleted puzzle's progress ${pid in final ? 'RESURRECTED — Tab B\'s delete was clobbered' : 'stayed deleted'}`)

console.log('\n=== does the same happen to the custom puzzles store? ===')
const r = C.saveCustom({...base, id:null, title:'Another One'}, shared)
console.log(`  Tab A saves a new puzzle -> store holds: ${C.listCustom(null,shared).map(p=>p.title).join(', ')}`)
console.log(`  >>> deleted puzzle ${C.getCustom(pid,shared) ? 'RESURRECTED' : 'stayed deleted'} (mutations re-read storage first)`)
