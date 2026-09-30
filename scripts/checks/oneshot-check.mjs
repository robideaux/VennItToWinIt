import { ROOT } from './_root.mjs'
// Exercises the real reducer logic (mirrored, since useState needs React) against real data.
import { pathToFileURL } from 'url'
import fs from 'fs'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const P = await import(U('puzzleUtils.js'))
const { MISSES, ONE_SHOT_MISS_COST } = await import(U('gameRules.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

// The mirrors below must track useGameState — fail loudly if the source moves on.
const src = fs.readFileSync(ROOT + '/src/hooks/useGameState.js','utf8')
chk(src.includes('const newMissesLeft = result ? s.missesLeft : s.missesLeft - 1'), `circle mirror matches source`)
chk(src.includes('const newMissesLeft = won ? s.missesLeft : s.missesLeft - ONE_SHOT_MISS_COST'), `One Shot mirror matches source`)

const puzzle = JSON.parse(fs.readFileSync(ROOT + '/public/puzzles/2026_001.json','utf8'))
const solved = Object.fromEntries(
  puzzle.terms.map(t => [t.regions.map(c=>P.CATEGORY_TO_CIRCLE[c]).sort().join(''), t.id]))

const init = placements => ({ placements, missesLeft: MISSES, revealedCircles: [],
  oneShotUsed: false, lastOneShot: null, submissions: [], phase: 'playing' })

// Mirrors submitAll
const oneShot = s => {
  if (s.phase !== 'playing' || s.submissions.length > 0) return s
  const correct = P.getCorrectCircles(puzzle, s.placements)
  const won = correct.length === 3
  const left = won ? s.missesLeft : s.missesLeft - ONE_SHOT_MISS_COST
  return { ...s, oneShotUsed: true, revealedCircles: won ? correct : s.revealedCircles,
    missesLeft: left, phase: won ? 'won' : left <= 0 ? 'lost' : 'playing',
    lastOneShot: { correctCount: correct.length, won },
    submissions: [...s.submissions, { type:'oneShot', correctCount: correct.length }] }
}
// Mirrors submitCircle
const circle = (s, id) => {
  if (s.phase !== 'playing' || s.revealedCircles.some(c=>c.circleId===id)) return s
  const r = P.getCorrectCircles(puzzle, s.placements).find(c=>c.circleId===id)
  const merged = r ? [...s.revealedCircles, r] : s.revealedCircles
  const left = r ? s.missesLeft : s.missesLeft - 1
  return { ...s, revealedCircles: merged, missesLeft: left,
    phase: merged.length===3 ? 'won' : left<=0 ? 'lost' : 'playing',
    submissions: [...s.submissions, { type:'circle', circleId:id, correct:!!r, category:r?.category ?? null }] }
}
const misses = s => MISSES - s.missesLeft

console.log(`fixed budget: ${MISSES} misses\n`)

console.log('=== One Shot on a solved board ===')
let s = oneShot(init(solved))
chk(s.phase==='won', `wins outright`)
chk(misses(s)===0, `costs nothing`)
chk(s.revealedCircles.length===3, `all 3 revealed on the win`)

console.log('\n=== One Shot on a wrong board reveals NOTHING ===')
const keys = P.REGION_KEYS
const wrong = Object.fromEntries(keys.map((k,i)=>[k, solved[keys[(i+1)%keys.length]]]))
let w = oneShot(init(wrong))
chk(w.phase==='playing', `game continues`)
chk(w.revealedCircles.length===0, `revealedCircles still empty — no locks handed out`)
chk(w.lastOneShot.correctCount===0, `reports ${w.lastOneShot.correctCount} of 3 correct`)
chk(w.missesLeft===MISSES-1, `costs one miss — ${w.missesLeft} left`)

console.log('\n=== partially-right board: a count, still no reveal ===')
const partial = { ...solved }
;[partial['2'], partial['3']] = [partial['3'], partial['2']]
const p1 = oneShot(init(partial))
chk(p1.lastOneShot.correctCount===1, `${p1.lastOneShot.correctCount} of 3 correct`)
chk(p1.revealedCircles.length===0, `still nothing revealed — this is the whole point`)

console.log('\n=== it is spent either way ===')
chk(oneShot(w).missesLeft===w.missesLeft, `a second press does nothing`)
chk(w.oneShotUsed===true, `flagged used`)
chk(oneShot(circle(init(solved),'1')).oneShotUsed===false, `closed once any circle is submitted`)

console.log('\n=== correct submits are free ===')
let clean = init(solved)
for (const id of ['1','2','3']) clean = circle(clean, id)
chk(clean.phase==='won' && misses(clean)===0, `three clean submits -> ${misses(clean)} misses, the same as a One Shot hit`)

let missed = oneShot(init(wrong))
missed = { ...missed, placements: solved }
for (const id of ['1','2','3']) missed = circle(missed, id)
chk(missed.phase==='won' && misses(missed)===1, `missed One Shot then three clean -> ${misses(missed)} miss`)

console.log('\n=== the game ends exactly when it is lost ===')
let dying = init(wrong)
for (let i = 0; i < MISSES - 1; i++) dying = circle(dying, '1')
chk(dying.phase==='playing' && dying.missesLeft===1, `${MISSES-1} misses -> still playing on the last pip`)
const save = circle({ ...dying, placements: solved }, '1')
chk(save.phase==='playing' && save.missesLeft===1, `a hit on the last pip keeps it`)
let fin = save
for (const id of ['2','3']) fin = circle(fin, id)
chk(fin.phase==='won', `and can still win from there`)
chk(circle(dying, '1').phase==='lost', `the ${MISSES}th miss ends it`)

console.log('\n=== submission log captures what the share block needs ===')
chk(missed.submissions.length===4, `${missed.submissions.length} entries`)
chk(missed.submissions[0].type==='oneShot' && missed.submissions[0].correctCount===0, `first: One Shot, 0 correct`)
const perCircle = missed.submissions.filter(x=>x.type==='circle')
chk(perCircle.length===3 && perCircle.every(x=>x.correct && x.category), `then 3 correct circle submits, each with its category`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
