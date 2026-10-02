import { ROOT } from './_root.mjs'
// Visual feedback (Phase 9): the swap on a drop, the dim-then-resolve beat on a submit, and
// the miss pip. The decisions are pure and tested here; what they look like needs a person.
import fs from 'fs'
import { pathToFileURL } from 'url'
const I = p => import(pathToFileURL(ROOT + p).href)
const F = await I('/src/utils/feedback.js')
const { isMiss } = await I('/src/utils/gameRules.js')
const P = await I('/src/utils/puzzleUtils.js')
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const read = p => fs.readFileSync(ROOT + p, 'utf8')

console.log('=== a drop swaps two terms ===')
const board = Object.fromEntries(P.REGION_KEYS.map((k, i) => [k, `t${i + 1}`]))
const sw = F.swapFor(board, board['1'], '23')
chk(sw && sw.fromKey === '1' && sw.toKey === '23' && sw.movedId === 't1' && sw.displacedId === board['23'], `the moved and displaced terms are named: ${JSON.stringify(sw)}`)
// the committed move is "target gets the moved term, source gets the displaced one"
const after = { ...board, [sw.toKey]: sw.movedId, [sw.fromKey]: sw.displacedId }
chk(Object.values(after).sort().join() === Object.values(board).sort().join(), `the swap loses and duplicates nothing`)
chk(F.swapFor(board, board['1'], '1') === null, `dropping a term where it already is moves nothing`)
chk(F.swapFor({ ...board, '23': null }, board['1'], '23') === null, `dropping on an empty region has no displaced term to swap`)
chk(F.swapFor(board, null, '23') === null && F.swapFor(board, 'nope', '23') === null, `no selection, or one not on the board -> nothing`)

console.log('\n=== a submit is a beat: the view lags the state ===')
const revealed = (id, category) => ({ circleId: id, category, name: 'x' })
const base = { revealedCircles: [], missesLeft: 5, isMiss }
const circle = (id, correct, category = null) => ({ type: 'circle', circleId: id, correct, category })
const oneShot = c => ({ type: 'oneShot', correctCount: c })

let v = F.feedbackView({ ...base, submissions: [], resolved: 0 })
chk(!v.pending && v.pulseIds.length === 0 && v.shownMisses === 5, `before any submit, nothing is pending`)

v = F.feedbackView({ ...base, submissions: [circle('2', true, 'B')], resolved: 0, revealedCircles: [revealed('2', 'B')] })
chk(v.pending && v.pulseIds.join() === '2', `a solve pulses only its own circle`)
chk(v.shownRevealed.length === 0, `...and shows it unsolved until the result lands, though the state already has it`)
chk(v.shownMisses === 5, `a solve costs no pip, now or later`)

v = F.feedbackView({ ...base, submissions: [circle('2', true, 'B')], resolved: 1, revealedCircles: [revealed('2', 'B')] })
chk(!v.pending && v.shownRevealed.length === 1 && v.pulseIds.length === 0, `once resolved, the colour is shown`)

v = F.feedbackView({ ...base, submissions: [circle('1', false)], resolved: 0, missesLeft: 4 })
chk(v.pending && v.pulseIds.join() === '1' && v.shownMisses === 5, `a miss: the circle dims, and the pip has NOT gone yet (state says 4, view says 5)`)
v = F.feedbackView({ ...base, submissions: [circle('1', false)], resolved: 1, missesLeft: 4 })
chk(v.shownMisses === 4, `...and goes when the result lands`)

v = F.feedbackView({ ...base, submissions: [oneShot(1)], resolved: 0, missesLeft: 4 })
chk(v.pulseIds.join() === '1,2,3' && v.shownMisses === 5, `a missed One Shot dims all three circles and holds its pip`)
v = F.feedbackView({ ...base, submissions: [oneShot(3)], resolved: 0, missesLeft: 5, revealedCircles: [revealed('1', 'A'), revealed('2', 'B'), revealed('3', 'C')] })
chk(v.pulseIds.length === 3 && v.shownRevealed.length === 0 && v.shownMisses === 5, `a One Shot sweep dims all three and shows none solved until the result lands, at no pip cost`)

v = F.feedbackView({ ...base, submissions: [circle('1', true, 'A'), circle('2', false)], resolved: 1, missesLeft: 4, revealedCircles: [revealed('1', 'A')] })
chk(v.pending && v.pulseIds.join() === '2' && v.shownRevealed.length === 1, `an earlier solved circle stays solved while a later submit pulses`)

console.log('\n=== a loss solves itself before it reveals ===')
const full = [revealed('1', 'A'), revealed('2', 'B'), revealed('3', 'C')]
let r = F.revealView({ revealedCircles: full, lockedCircles: [], done: false })
chk(r.shown.length === 0 && r.dimmed.join() === '1,2,3', `nothing solved: all three stay dim and unnamed while the board shuffles`)
r = F.revealView({ revealedCircles: full, lockedCircles: [revealed('2', 'B')], done: false })
chk(r.shown.map(c => c.circleId).join() === '2' && r.dimmed.join() === '1,3', `a circle you solved keeps its colour throughout; only the others dim`)
r = F.revealView({ revealedCircles: full, lockedCircles: [revealed('2', 'B')], done: true })
chk(r.shown.length === 3 && r.dimmed.length === 0, `once the shuffle is done, every circle is revealed and none is dim`)
const hook = read('/src/hooks/useRevealAnimation.js')
chk(/setDone\(true\), swaps\.length \* STEP_DURATION \+ SETTLE_MS/.test(hook), `"done" lands after the last swap plus a settling pause`)
chk(/setDone\(false\)/.test(hook) && /return \{ board, step, done \}/.test(hook), `it resets with each new animation and is returned`)
const go = read('/src/components/GameOverScreen.jsx')
chk((go.match(/revealedCircles=\{shown\}/g) ?? []).length === 4 && /dimmed=\{dimmed\}/.test(go), `the chips and the diagram show the staged view, never the full solution`)

console.log('\n=== timings ===')
chk(F.SWAP_MS >= 350, `the swap slides for ${F.SWAP_MS} ms (the shuffle's 200 ms slide was too quick to see)`)
chk(F.SUBMIT_DIM_MS >= 250 && F.SUBMIT_DIM_MS <= 600, `a submit dims for ${F.SUBMIT_DIM_MS} ms: a beat, not a wait`)
chk(F.RESULTS_HOLD_MS >= 500, `the board holds ${F.RESULTS_HOLD_MS} ms after the last result before moving on`)

console.log('\n=== wired the way the design needs ===')
const gb = read('/src/components/GameBoard.jsx')
chk(/if \(pending \|\| game\.phase !== 'playing'\) return/.test(gb), `no input while a submit is being checked, or once the game is over`)
chk(/if \(swap\) clearSwap\(\)/.test(gb), `a new tap cuts a swap short instead of waiting on it`)
chk(/prefersReducedMotion\(\) \? null : swapFor/.test(gb), `reduced motion skips the slide`)
chk(/if \(pending \|\| \(game\.phase !== 'won' && game\.phase !== 'lost'\)\) return/.test(gb) && /RESULTS_HOLD_MS/.test(gb), `the results screen waits for the last result, then holds`)
chk(!/\[game\.lastOneShot\]/.test(gb) && /setOneShotNotice\(last\.correctCount\)/.test(gb), `the One Shot popup is raised when the result lands, not before`)
chk(/resolved > 0 && game\.lastOneShot/.test(gb), `...and so is the header record of what it said`)
chk((gb.match(/revealedCircles=\{view\.shownRevealed\}/g) ?? []).length === 4, `the chips and the diagram all show only what has resolved`)
chk(/dimmed=\{view\.pulseIds\}/.test(gb) && /view\.shownMisses/.test(gb), `the dim and the pips follow the view`)
const po = read('/src/components/PlayOverlay.jsx')
chk(/swap && \(key === swap\.fromKey \|\| key === swap\.toKey\)\) return null/.test(po), `the two real pills are held out while their chips slide`)
chk(/slideMs=\{SWAP_MS\}/.test(po) && (po.match(/variant="shuffle(From|To)"/g) ?? []).length >= 4, `the swap reuses the shuffle's pill looks, at the slower speed`)
const vd = read('/src/components/VennDiagram.jsx')
const dim = Number(vd.match(/DIM_OPACITY = ([\d.]+)/)?.[1])
chk(dim > 0 && dim < 0.38, `a dimmed circle is fainter (${dim}) than a resting one (0.38)`)
const css = read('/src/components/VennDiagram.module.css')
const secs = re => Number(css.match(re)?.[1])
chk(secs(/\.tint \{[^}]*fill-opacity ([\d.]+)s/) > secs(/\.tintDim \{[^}]*fill-opacity ([\d.]+)s/), `it dims quickly and comes back up slowly`)
const gcss = read('/src/components/GameBoard.module.css')
chk(/@keyframes pipLose \{[\s\S]*?scale\(2\.\d\)/.test(gcss), `the lost pip swells to over twice its size`)
chk(/prefers-reduced-motion: reduce\) \{\s*\.pipLost \{ animation: pipLoseCalm/.test(gcss), `...but only changes colour under reduced motion`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
