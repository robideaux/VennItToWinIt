import { ROOT } from './_root.mjs'
// Haptic feedback (Phase 9.1): which devices get it, that it is off until chosen, which cue
// each moment earns, and that the cues are ones a phone can actually deliver.
import fs from 'fs'
import { pathToFileURL } from 'url'
const I = p => import(pathToFileURL(ROOT + p).href)
const H = await I('/src/utils/haptics.js')
const St = await I('/src/utils/settings.js')
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const nav = has => { const calls = []; const n = has ? { vibrate: p => (calls.push(p), true) } : {}; n.calls = calls; return n }
const mm  = coarse => q => ({ matches: q.includes('coarse') ? coarse : !coarse })
const store = (init = {}) => { const d = { ...init }; return { getItem: k => d[k] ?? null, setItem: (k, v) => { d[k] = v }, d } }
const on = () => store({ [St.SETTINGS_KEY]: JSON.stringify({ vibration: true }) })

console.log('=== which devices get it ===')
chk(H.vibrationSupported(nav(true),  mm(true))  === true,  `Android phone (API + touch) -> supported`)
chk(H.vibrationSupported(nav(false), mm(true))  === false, `iPhone (no API at all) -> not supported`)
chk(H.vibrationSupported(nav(true),  mm(false)) === false, `desktop Chrome (API exists, does nothing) -> not supported`)
chk(H.vibrationSupported(undefined, undefined) === false && H.vibrationSupported(nav(true), () => { throw 1 }) === false, `missing or throwing environment -> not supported`)

console.log('\n=== off until the player turns it on ===')
chk(St.SETTING_DEFAULTS.vibration === false, `default is off`)
let n = nav(true)
chk(H.haptic('pick', { nav: n, mm: mm(true), storage: store() }) === false && n.calls.length === 0, `a fresh phone does not buzz`)
n = nav(true)
chk(H.haptic('pick', { nav: n, mm: mm(true), storage: on() }) === true && n.calls[0] === H.PATTERNS.pick, `once on, it buzzes the pick cue`)
n = nav(true)
chk(H.haptic('pick', { nav: n, mm: mm(false), storage: on() }) === false && n.calls.length === 0, `on but unsupported -> silent, and no throw`)
n = nav(true)
chk(H.haptic('solve', { force: true, nav: n, mm: mm(true), storage: store() }) === true, `force plays the confirming buzz while the setting is still unsaved`)
n = nav(false)
chk(H.haptic('solve', { force: true, nav: n, mm: mm(true), storage: store() }) === false, `...but force never overrides missing support`)
chk(H.haptic('nope', { nav: nav(true), mm: mm(true), storage: on() }) === false, `an unknown cue does nothing`)
const throwing = { vibrate() { throw new Error('blocked') } }
chk(H.haptic('miss', { nav: throwing, mm: mm(true), storage: on() }) === false, `a vibrate that throws is swallowed`)

console.log('\n=== settings never throw ===')
chk(St.loadSettings(store({ [St.SETTINGS_KEY]: '{not json' })).vibration === false, `corrupt JSON -> defaults`)
chk(St.loadSettings({ getItem() { throw new Error('private mode') } }).theme === 'system', `a throwing store -> defaults`)
chk(St.loadSettings(store({ [St.SETTINGS_KEY]: JSON.stringify({ theme: 'dark', audio: true }) })).theme === 'dark', `an older saved object keeps its theme (extra keys are harmless)`)
const s = store(); St.saveSettings({ theme: 'dark', vibration: true }, s)
chk(St.loadSettings(s).vibration === true, `a saved choice reads back`)

console.log('\n=== which cue each moment earns ===')
const circle = correct => ({ type: 'circle', correct })
const oneShot = c => ({ type: 'oneShot', correctCount: c })
const cases = [
  ['solving a circle',               circle(true),  'playing', 'solve'],
  ['a wrong circle',                 circle(false), 'playing', 'miss'],
  ['a One Shot that missed',         oneShot(1),    'playing', 'miss'],
  ['the final solve',                circle(true),  'won',     'win'],
  ['a One Shot sweep',               oneShot(3),    'won',     'win'],
  ['the fatal miss',                 circle(false), 'lost',    'loss'],
  ['a One Shot that used the last pip', oneShot(0), 'lost',    'loss'],
]
for (const [what, last, phase, want] of cases) chk(H.cueForSubmit(last, phase) === want, `${what.padEnd(34)} -> ${want}`)

console.log('\n=== the cues themselves ===')
const P = H.PATTERNS
const pulses = p => Array.isArray(p) ? p.filter((_, i) => i % 2 === 0) : [p]
const total = p => (Array.isArray(p) ? p : [p]).reduce((a, b) => a + b, 0)
chk(Object.values(P).every(p => (Array.isArray(p) ? p : [p]).every(x => Number.isInteger(x) && x > 0)), `every duration is a positive whole number of ms`)
chk(Math.min(...Object.values(P).flatMap(pulses)) >= 10, `no pulse shorter than 10 ms, which many motors cannot render`)
chk(pulses(P.miss).length === 2, `a miss is a double buzz`)
chk(pulses(P.loss).length === 3 && Math.max(...pulses(P.loss)) <= 100, `a loss is three short pulses`)
chk(P.solve > P.pick && P.solve > P.put, `a solve is longer than a pick or a put`)
chk(total(P.win) > total(P.solve) && pulses(P.win).length >= 3, `a win is the longest, a drawn-out pattern`)
chk(P.pick === P.put, `pick-up and put-down are the same tick (10 vs 15 ms could not be told apart by feel)`)

console.log('\n=== wired to the board without a cue for a refused move ===')
const gb = fs.readFileSync(ROOT + '/src/components/GameBoard.jsx', 'utf8')
chk(/validTargetsFor\(game\.selectedTermId\)\.includes\(regionKey\)\) \{[\s\S]*?game\.placeTerm\(regionKey\)\s*haptic\('put'\)/.test(gb), `a put-down buzzes only when the move was allowed`)
chk(/game\.selectTerm\(term\.id\)\s*haptic\('pick'\)/.test(gb), `picking up buzzes`)
chk(/haptic\(cueForSubmit\(last, game\.phase\)\)\s*const t = setTimeout/.test(gb), `a submit buzzes via cueForSubmit AT THE TAP, before the reveal timer, so the press is felt as it happens`)
chk(!/vibrate/.test(fs.readFileSync(ROOT + '/src/hooks/useGameState.js', 'utf8')), `the reducer stays pure: no vibration inside it`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
