import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const R = await import(pathToFileURL(ROOT + '/src/utils/resultBlock.js').href)
const C = await import(pathToFileURL(ROOT + '/src/styles/colors.js').href)
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const show = b => b.split('\n').map(l => '    ' + l).join('\n')
const one  = c => ({ type:'oneShot', correctCount:c })
const hit  = cat => ({ type:'circle', correct:true, category:cat })
const miss = () => ({ type:'circle', correct:false, category:null })
const [A, B, Cc] = ['A','B','C'].map(k => C.CATEGORY_EMOJI[k])

console.log('=== called it cold ===')
let b = R.buildResultBlock({ title:'Just Relax', won:true, submissions:[one(3)] })
console.log(show(b))
chk(b.split('\n').length===3, `three lines: title, row, outcome`)
chk(b.split('\n')[1]==='⚡', `a lone coloured bolt`)
chk(b.endsWith('Solved in one shot'), `outcome names the one shot`)

console.log('\n=== clean ===')
b = R.buildResultBlock({ title:'Just Relax', won:true, submissions:[hit('A'),hit('B'),hit('C')] })
console.log(show(b))
chk(b.includes(A+B+Cc), `groups in the order they fell, in category colour`)
chk(b.endsWith('Solved with no misses'), `no misses`)

console.log('\n=== gambled, missed, recovered ===')
b = R.buildResultBlock({ title:'Just Relax', won:true,
  submissions:[one(2), miss(), hit('B'), hit('A'), hit('C')] })
console.log(show(b))
chk(b.includes('↯✗'+B+A+Cc), `↯ for the missed One Shot, ✗ for the miss`)
chk(!/[⁰¹²³]/.test(b), `no count on the bolt`)
chk(b.endsWith('Solved with 2 misses'), `a missed One Shot counts as a miss`)
chk(R.outcomeLine([miss(), hit('A'), hit('B'), hit('C')], true)==='Solved with 1 miss', `singular`)

console.log('\n=== lost ===')
b = R.buildResultBlock({ title:'Just Relax', won:false,
  submissions:[one(0), hit('B'), miss(), miss(), miss(), miss()] })
console.log(show(b))
chk(b.endsWith('Out of misses'), `no score claimed`)

console.log('\n=== layout stays a flat row ===')
chk(!b.includes(' ') && !b.includes('·'), `no padding or placeholder glyphs`)
chk(b.split('\n').every(l => l === l.trim()), `every line is flush — nothing to misalign on paste`)
chk(!/[①②③]/.test(b), `no circled digits left over from Phase 18`)

console.log('\n=== colour is per category, so the same for every player ===')
chk(R.attemptRow([hit('A')]) === R.attemptRow([hit('A')]), `group A is the same colour for everyone`)
chk(new Set([A, B, Cc]).size===3, `three distinct category emoji`)
chk(Object.keys(C.CATEGORY_COLORS).join()==='A,B,C' && Object.keys(C.CATEGORY_EMOJI).join()==='A,B,C',
  `palette and emoji both keyed by category`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
