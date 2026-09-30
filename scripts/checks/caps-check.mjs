import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const V = await import(U('validatePuzzle.js'))
const F = await import(U('fitText.js'))
const D = await import(U('puzzleDraft.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

console.log(`editor cap (MAX_TERM_CHARS)        = ${V.MAX_TERM_CHARS}`)
console.log(`renderer ceiling (MAX_LABEL_CHARS) = ${V.MAX_LABEL_CHARS}  (average-case figure)`)
chk(V.MAX_TERM_CHARS === 40, `editor cap is the locked 40`)
chk(V.COUNTER_WITHIN === 8, `counter appears over the last 8 chars (from ${V.MAX_TERM_CHARS - V.COUNTER_WITHIN})`)

// fitText picks logical lines; CSS overflow-wrap then breaks anything still too wide.
// That second pass is the backstop, so the real question is how TALL the pill ends up.
const visualLines = label => {
  const { lines, scale } = F.fitText(label)
  return lines.reduce((n, l) => n + Math.max(1, Math.ceil((F.textWidthEm(l) * scale) / F.LINE_EM)), 0)
}

console.log('\n=== realistic labels at or near the cap ===')
for (const label of [
  'The Presidents of the United States of Am',
  'Antidisestablishmentarianism',
  'Supercalifragilisticexpialidocious',
  'Wolfeschlegelsteinhausenbergerdorff',
  'Everybody on the floor right now please',
]) {
  const v = visualLines(label), { scale } = F.fitText(label)
  chk(v <= F.MAX_LINES, `${v} line(s) @ ${scale.toFixed(2)} — "${label.slice(0,34)}" (${label.length}ch)`)
}

console.log('\n=== pathological: 40 unbreakable widest glyphs ===')
const p40 = 'M'.repeat(40)
const f40 = F.fitText(p40)
console.log(`   fitText alone          : ${f40.lines.length} logical line @ scale ${f40.scale.toFixed(2)} (cannot wrap a single word)`)
console.log(`   after CSS overflow-wrap: ~${visualLines(p40)} visual lines`)
chk(visualLines(p40) <= 4, `bounded at ${visualLines(p40)} lines — grows the pill, never spills across the diagram`)

console.log('\n=== so what IS guaranteed ===')
let over = 0
for (let n = 1; n <= V.MAX_TERM_CHARS; n++) for (const g of ['M','W','m','w','i','l','e'])
  if (visualLines(g.repeat(n)) > 4) over++
chk(over === 0, `no label up to ${V.MAX_TERM_CHARS} chars of any single repeated glyph exceeds 4 visual lines`)

console.log('\n=== a label at exactly the cap validates clean ===')
const d = D.blankDraft()
// Distinct values: identical labels are duplicates, which is a separate (and correct) failure
d.title = 'T'
;['A','B','C'].forEach((k,i) => { d.categories[k] = String.fromCharCode(65+i) + 'c'.repeat(V.MAX_TERM_CHARS-1) })
;['A','B','C','AB','AC','BC','ABC'].forEach((k,i) => { d.terms[k] = String(i) + 'x'.repeat(V.MAX_TERM_CHARS-1) })
const capRes = V.validatePuzzle(D.fromDraft(d))
chk(capRes.status === 'complete', `all fields at ${V.MAX_TERM_CHARS} chars -> ${capRes.status}${capRes.issues.length ? ': '+capRes.issues[0].field+' '+capRes.issues[0].message : ''}`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
