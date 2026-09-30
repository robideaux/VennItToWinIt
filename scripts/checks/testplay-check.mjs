import { ROOT } from './_root.mjs'
// Drives the real reducer the way a test play does, then checks the result screens can
// render from what GameBoard hands back.
import { pathToFileURL } from 'url'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const D = await import(U('puzzleDraft.js'))
const P = await import(U('puzzleUtils.js'))
const { validatePuzzle } = await import(U('validatePuzzle.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const d = D.blankDraft()
d.title = 'Kitchen Things'
d.categories = { A:'Sharp', B:'Metal', C:'Hot' }
d.terms = { A:'Scissors', B:'Spoon', C:'Kettle', AB:'Knife', AC:'Match', BC:'Pan', ABC:'Blowtorch' }
const puzzle = D.fromDraft(d)
chk(validatePuzzle(puzzle).status==='complete', `draft under test is complete (Test Play requires it)`)

const solved = Object.fromEntries(
  puzzle.terms.map(t => [t.regions.map(c=>P.CATEGORY_TO_CIRCLE[c]).sort().join(''), t.id]))

console.log('\n=== winning path: what onWin hands to WinScreen ===')
const won = P.getCorrectCircles(puzzle, solved)
chk(won.length===3, `all 3 circles correct -> revealedCircles length ${won.length}`)
chk(P.isSolved(puzzle, solved), `board is a strict solve`)
chk(won.every(c => c.name && c.circleId && c.category), `each carries {circleId, category, name} WinScreen needs`)

console.log('\n=== losing path: what onGameOver hands to GameOverScreen ===')
// A wrong board: rotate every term one region onwards
const keys = P.REGION_KEYS
const wrong = Object.fromEntries(keys.map((k,i) => [k, solved[keys[(i+1)%keys.length]]]))
const locked = P.getCorrectCircles(puzzle, wrong)
const reveal = P.buildRevealState(puzzle, locked)
chk(reveal.revealedCircles.length===3, `buildRevealState returns all 3 circles`)
chk(keys.every(k => reveal.placements[k]), `and a full board to animate into`)
const swaps = P.computeSwapSequence(wrong, reveal.placements)
chk(swaps.every(s => s.fromKey!==s.toKey), `${swaps.length} reveal swaps, none a no-op`)
const after = { ...wrong }
for (const s of swaps) { const t=after[s.fromKey]; after[s.fromKey]=after[s.toKey]; after[s.toKey]=t }
chk(JSON.stringify(after)===JSON.stringify(reveal.placements), `replaying the swaps reconstructs the target exactly`)

console.log('\n=== an unsaved draft works throughout (no id needed) ===')
chk(!puzzle.id, `candidate has no id until saved`)
chk(P.getCorrectCircles(puzzle, solved).length===3, `...and the reducer does not care`)

console.log('\n=== the draft carries no budget, so the test board gets the standard one ===')
const G2 = await import(U('gameRules.js'))
chk(!('maxAttempts' in puzzle), `the draft carries no attempts value`)
chk(G2.MISSES===5, `so the test board gets the standard ${G2.MISSES} misses`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
