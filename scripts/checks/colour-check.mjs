import { ROOT } from './_root.mjs'
// Colour belongs to the category, not the circle (Phase 20).
import { pathToFileURL } from 'url'
import fs from 'fs'
const I = p => import(pathToFileURL(ROOT + p).href)
const C = await I('/src/styles/colors.js')
const S = await I('/src/hooks/useShuffleAnimation.js')
const P = await I('/src/utils/puzzleUtils.js')
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

console.log('=== neutral until solved ===')
chk(C.categoryColor(null)===null && C.categoryColor(undefined)===null, `no category -> no colour (caller falls back to neutral)`)
chk(C.categoryColor('B')===C.CATEGORY_COLORS.B.bold, `category B -> colour 2`)

console.log('\n=== a solved circle takes its CATEGORY colour, wherever it sits ===')
const puzzle = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/2026_001.json','utf8'))
// Solve with categories rotated onto the circles: A in circle 2, B in 3, C in 1
const rot = { A:'2', B:'3', C:'1' }
const placements = Object.fromEntries(
  puzzle.terms.map(t => [t.regions.map(c=>rot[c]).sort().join(''), t.id]))
const got = P.getCorrectCircles(puzzle, placements)
chk(got.length===3, `rotated arrangement is a valid win`)
for (const r of got) chk(r.category && C.categoryColor(r.category)===C.CATEGORY_COLORS[r.category].bold,
  `circle ${r.circleId} holds ${r.category} -> ${C.categoryColor(r.category)}`)
const reveal = P.buildRevealState(puzzle, [])
chk(reveal.revealedCircles.every(r => r.category), `game-over reveal carries a category for every circle`)

console.log('\n=== opening shuffle flashes the colours ===')
for (let run = 0; run < 200; run++) {
  const seq = S.flashSequence()
  const ok = seq.length===5
    && seq.every(m => Object.keys(m).join()==='1,2,3' && [...Object.values(m)].sort().join()==='A,B,C')
    && seq.every((m, i) => i===0 || ['1','2','3'].some(id => m[id]!==seq[i-1][id]))
  if (!ok) { chk(false, `run ${run}: ${JSON.stringify(seq)}`); break }
}
chk(true, `200 runs: 5 steps, each a full A/B/C permutation, never repeating the previous step`)

const src = fs.readFileSync(ROOT + '/src/hooks/useShuffleAnimation.js','utf8')
chk(/setStep\(null\); setFlash\(null\)/.test(src), `settles back to neutral when the shuffle ends`)
chk(/function skip\(\)[\s\S]*?setFlash\(null\)/.test(src), `and when it is skipped`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
