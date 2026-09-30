import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const R = await import(pathToFileURL(ROOT + '/src/utils/resultBlock.js').href)
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const show = b => b.split('\n').map(l => '    ' + l).join('\n')
const one  = c => ({ type:'oneShot', correctCount:c })
const hit  = cat => ({ type:'circle', correct:true, category:cat })
const miss = () => ({ type:'circle', correct:false, category:null })

console.log('=== called it cold ===')
let b = R.buildResultBlock({ title:'Just Relax', won:true, submissions:[one(3)] })
console.log(show(b))
chk(b.split('\n').length===3, `three lines: title, attempts, outcome`)
chk(b.includes('\n↯\n'), `a lone ↯ — no count`)

console.log('\n=== clean ===')
b = R.buildResultBlock({ title:'Just Relax', won:true, submissions:[hit('A'),hit('B'),hit('C')] })
console.log(show(b))
chk(b.includes('①②③'), `groups in the order they fell`)

console.log('\n=== gambled, missed, recovered ===')
b = R.buildResultBlock({ title:'Just Relax', won:true,
  submissions:[one(2), miss(), hit('B'), hit('A'), hit('C')] })
console.log(show(b))
chk(b.includes('↯✗②①③'), `↯ carries no superscript even when it was told 2`)
chk(!/[⁰¹²³]/.test(b), `no superscripts anywhere in the block`)

console.log('\n=== lost ===')
b = R.buildResultBlock({ title:'Just Relax', won:false,
  submissions:[one(0), hit('B'), miss(), miss(), miss()] })
console.log(show(b))
chk(b.endsWith('Out of attempts'), `no score claimed`)

console.log('\n=== the triangle is gone ===')
chk(typeof R.layoutRows === 'undefined', `layoutRows no longer exported`)
chk(!b.includes('\u00A0') && !b.includes('·'), `no padding or placeholder glyphs left`)
chk(b.split('\n').every(l => l === l.trim()), `every line is flush — nothing to misalign on paste`)

console.log('\n=== still normalised across players ===')
chk(R.attemptRow([hit('A')]) === R.attemptRow([hit('A')]), `group A is ① for everyone`)
chk(R.attemptRow([hit('A')]) !== R.attemptRow([hit('B')]), `and B is not A`)

console.log('\n=== all glyphs text-class (consistent size) ===')
const used = [...new Set([...R.attemptRow([one(2), miss(), hit('A'), hit('B'), hit('C')])])]
chk(used.every(g => g.codePointAt(0) < 0x1F000), `${used.join(' ')}`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
