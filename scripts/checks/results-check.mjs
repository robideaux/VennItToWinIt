import { ROOT } from './_root.mjs'
// Leaving the results screen, and what a finished game leaves behind.
//
// The results screens' only way out is ‹ Back, which is plain history.back() — so it lands
// wherever the game was started from only if the entry beneath the results is that place.
// It once wasn't: "Play Another" pushed a selector over the results, whose own Back then
// returned to those results, a loop with no way Home.
//
// Mirrors App.jsx's history calls over a simulated stack; the source guards below fail if
// App.jsx stops matching the mirror.
import fs from 'fs'
import { pathToFileURL } from 'url'
const I = p => import(pathToFileURL(ROOT + p).href)
const { applyResult } = await I('/src/hooks/useProgress.js')
const R = await I('/src/utils/resultBlock.js')
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const app = fs.readFileSync(ROOT + '/src/App.jsx','utf8')
chk(/function handleResultsBack\(\) \{\s*history\.back\(\)\s*\}/.test(app), `results Back is plain history.back()`)
chk(/if \(gameOverlay\) \{\s*history\.back\(\)/.test(app), `picking mid-game pops the selector overlay`)
chk(/history\.replaceState\(\{ screen: 'win' \}/.test(app) && /history\.replaceState\(\{ screen: 'gameover' \}/.test(app), `results replace the game entry`)
chk(!/Play Another|New Puzzle/.test(fs.readFileSync(ROOT + '/src/components/WinScreen.jsx','utf8') + fs.readFileSync(ROOT + '/src/components/GameOverScreen.jsx','utf8')), `Play Another / New Puzzle are gone`)

let stack, idx
const push    = s => { stack.splice(idx+1); stack.push(s); idx = stack.length-1 }
const replace = s => { stack[idx] = s }
const back    = () => { if (idx > 0) idx--; return stack[idx].screen }

const allVenns     = () => push({screen:'selector'})
const selectPuzzle = (overlayOpen=false) => overlayOpen ? back() : push({screen:'game'})
const playLatest   = () => push({screen:'game'})
const sharedLink   = () => push({screen:'game'})      // after the boot replaceState(home)
const openSelector = () => push({screen:'game', overlay:'selector'})
const win          = () => replace({screen:'win'})
const lose         = () => replace({screen:'gameover'})
const retry        = () => replace({screen:'game'})

console.log('\n=== ‹ Back from the results lands where the game started ===')
for (const [label, steps, expect] of [
  ['All Venns > puzzle > win',                () => { allVenns(); selectPuzzle(); win() },                           'selector'],
  ['Play Latest > win',                       () => { playLatest(); win() },                                         'home'],
  ['shared link > win',                       () => { sharedLink(); win() },                                         'home'],
  ['All Venns > lose > Try Again > win',      () => { allVenns(); selectPuzzle(); lose(); retry(); win() },          'selector'],
  ['Play Latest, switch puzzle mid-game',     () => { playLatest(); openSelector(); selectPuzzle(true); win() },      'home'],
  ['All Venns, switch puzzle mid-game',       () => { allVenns(); selectPuzzle(); openSelector(); selectPuzzle(true); lose() }, 'selector'],
]) {
  stack = [{screen:'home'}]; idx = 0
  steps()
  const first = back()
  const rest = []; let g = 0; while (g++ < 8 && idx > 0) rest.push(back())
  chk(first === expect && ![first, ...rest].some(s => s === 'win' || s === 'gameover' || s === 'game'),
    `${label.padEnd(38)} Back -> ${[first, ...rest].join(' -> ')}`)
}

console.log('\n=== the first play is the record; replays only count ===')
const hit  = cat => ({ type:'circle', correct:true, category:cat })
const miss = () => ({ type:'circle', correct:false, category:null })
const lost = [miss(), hit('A'), miss(), miss(), miss(), miss()]
const clean = [hit('A'), hit('B'), hit('C')]
let e = applyResult(undefined, { won:false, misses:5, submissions:lost }, 't1')
chk(e.plays===1 && e.won===false && e.submissions===lost && e.completedAt==='t1', `first play recorded in full`)
e = applyResult(e, { won:true, misses:0, submissions:clean }, 't2')
chk(e.plays===2, `a replay counts: plays ${e.plays}`)
chk(e.won===false && e.submissions===lost && e.completedAt==='t1', `...but does not overwrite the first result`)
const legacy = applyResult({ won:true, attempts:3, completedAt:'old' }, { won:true, misses:0, submissions:clean }, 't3')
chk(legacy.plays===2 && legacy.attempts===3 && !('submissions' in legacy), `a pre-Phase-20 entry counts as one play and is otherwise untouched`)
chk(R.buildResultBlock({ title:'T', won:false, submissions:e.submissions }).includes('✗🔴✗✗✗✗'),
  `the stored first play rebuilds its share row: ${R.attemptRow(e.submissions)}`)

console.log('\n=== a replay says so in the share text ===')
chk(R.buildResultBlock({ title:'T', won:true, submissions:clean }).endsWith('Solved with no misses'), `first play: no mark`)
chk(R.buildResultBlock({ title:'T', won:true, submissions:clean, play:3 }).endsWith('Solved with no misses · play: 3'), `third play: "· play: 3"`)
chk(R.buildResultBlock({ title:'T', won:false, submissions:lost, play:2 }).endsWith('Out of misses · play: 2'), `losses too`)
chk(/play=\{progress\[activePuzzle\.id\]\?\.plays \?\? 1\}/.test(app), `App hands the results screens the recorded play count`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
