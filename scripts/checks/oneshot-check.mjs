import { ROOT } from './_root.mjs'
// Exercises the real reducer logic (mirrored, since useState needs React) against real data.
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const P = await import(U('puzzleUtils.js'))
const { ATTEMPTS, ONE_SHOT_COST } = await import(U('gameRules.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const puzzle = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/2026_001.json','utf8'))
const solved = Object.fromEntries(
  puzzle.terms.map(t => [t.regions.map(c=>P.CATEGORY_TO_CIRCLE[c]).sort().join(''), t.id]))

const init = placements => ({ placements, attemptsLeft: ATTEMPTS, revealedCircles: [],
  oneShotUsed: false, lastOneShot: null, submissions: [], phase: 'playing' })

// Mirrors submitAll exactly
const oneShot = s => {
  // opening move only: any submit closes the window
  if (s.phase !== 'playing' || s.submissions.length > 0) return s
  const correct = P.getCorrectCircles(puzzle, s.placements)
  const won = correct.length === 3
  const left = s.attemptsLeft - ONE_SHOT_COST
  return { ...s, oneShotUsed: true, revealedCircles: won ? correct : s.revealedCircles,
    attemptsLeft: left, phase: won ? 'won' : left <= 0 ? 'lost' : 'playing',
    lastOneShot: { correctCount: correct.length, won },
    submissions: [...s.submissions, { type:'oneShot', correctCount: correct.length }] }
}
const circle = (s, id) => {
  if (s.phase !== 'playing' || s.revealedCircles.some(c=>c.circleId===id)) return s
  const r = P.getCorrectCircles(puzzle, s.placements).find(c=>c.circleId===id)
  const merged = r ? [...s.revealedCircles, r] : s.revealedCircles
  const left = s.attemptsLeft - 1
  return { ...s, revealedCircles: merged, attemptsLeft: left,
    phase: merged.length===3 ? 'won' : left<=0 ? 'lost' : 'playing',
    submissions: [...s.submissions, { type:'circle', circleId:id, correct:!!r, category:r?.category ?? null }] }
}
const score = s => ATTEMPTS - s.attemptsLeft

console.log(`fixed budget: ${ATTEMPTS} attempts\n`)

console.log('=== One Shot on a solved board ===')
let s = oneShot(init(solved))
chk(s.phase==='won', `wins outright`)
chk(score(s)===1, `score ${score(s)} — the perfect game`)
chk(s.revealedCircles.length===3, `all 3 revealed on the win`)

console.log('\n=== One Shot on a wrong board reveals NOTHING ===')
const keys = P.REGION_KEYS
const wrong = Object.fromEntries(keys.map((k,i)=>[k, solved[keys[(i+1)%keys.length]]]))
let w = oneShot(init(wrong))
chk(w.phase==='playing', `game continues`)
chk(w.revealedCircles.length===0, `revealedCircles still empty — no locks handed out`)
chk(w.lastOneShot.correctCount===0, `reports ${w.lastOneShot.correctCount} of 3 correct`)
chk(w.attemptsLeft===4, `${w.attemptsLeft} left — still enough for the 3 locks needed`)

console.log('\n=== partially-right board: a count, still no reveal ===')
// Solve circle 1 only: keep its 4 regions, scramble the rest among themselves
const partial = { ...solved }
;[partial['2'], partial['3']] = [partial['3'], partial['2']]
const p1 = oneShot(init(partial))
chk(p1.lastOneShot.correctCount===1, `${p1.lastOneShot.correctCount} of 3 correct`)
chk(p1.revealedCircles.length===0, `still nothing revealed — this is the whole point`)

console.log('\n=== it is spent either way ===')
chk(oneShot(w).attemptsLeft===w.attemptsLeft, `a second press does nothing`)
chk(w.oneShotUsed===true, `flagged used`)

console.log('\n=== the score ladder ===')
let clean = init(solved)
for (const id of ['1','2','3']) clean = circle(clean, id)
chk(clean.phase==='won' && score(clean)===3, `three clean submits -> ${score(clean)}`)

let missed = oneShot(init(wrong))
missed = { ...missed, placements: solved }          // player rearranges after the miss
for (const id of ['1','2','3']) missed = circle(missed, id)
chk(missed.phase==='won' && score(missed)===4, `missed One Shot then three clean -> ${score(missed)}`)
chk(missed.attemptsLeft===1, `finishes with ${missed.attemptsLeft} to spare — never unwinnable`)

console.log('\n=== worst case still winnable after a miss ===')
let tight = oneShot(init(wrong))
tight = circle(tight, '1')                           // one wrong per-circle submit too
tight = { ...tight, placements: solved }
for (const id of ['1','2','3']) tight = circle(tight, id)
chk(tight.phase==='won' && score(tight)===5, `miss + 1 wrong + 3 clean -> ${score(tight)}, exactly the budget`)

console.log('\n=== submission log captures what the share block needs ===')
chk(missed.submissions.length===4, `${missed.submissions.length} entries`)
chk(missed.submissions[0].type==='oneShot' && missed.submissions[0].correctCount===0, `first: One Shot, 0 correct`)
const perCircle = missed.submissions.filter(x=>x.type==='circle')
chk(perCircle.length===3 && perCircle.every(x=>x.correct), `then 3 correct circle submits`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
