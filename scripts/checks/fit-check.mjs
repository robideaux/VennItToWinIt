import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'
import path from 'path'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const F = await import(U('fitText.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const dir=ROOT + '/public/puzzles'
const labels=[]
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.json')||f==='index.json') continue
  for (const t of (JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')).terms??[])) labels.push(t.label)
}

console.log(`corpus: ${labels.length} labels · LINE_EM ${F.LINE_EM.toFixed(2)} · MAX_LINES ${F.MAX_LINES}`)
let over=0, byLines={1:0,2:0,3:0}, shrunk=0, lost=0
for (const label of labels) {
  const { lines, scale } = F.fitText(label)
  byLines[lines.length] = (byLines[lines.length]??0)+1
  if (scale < 1) shrunk++
  if (Math.max(...lines.map(F.textWidthEm))*scale > F.LINE_EM + 1e-6) over++
  if (lines.join(' ') !== label.trim().replace(/\s+/g,' ')) lost++
  if (lines.length > F.MAX_LINES) over++
}
chk(over===0, `nothing overflows its pill`)
chk(lost===0, `no text lost or reordered`)
console.log(`     ${byLines[1]} one-line · ${byLines[2]} two-line · ${byLines[3]} three-line · ${shrunk} shrunk`)
chk(byLines[3]===shrunk, `a third line is spent only where the label would otherwise shrink`)

console.log('\n--- short labels keep one line ---')
for (const s of ['Let It Be',"Don't Move",'Wallet','on the floor'])
  chk(F.fitText(s).lines.length===1, `"${s}" -> 1 line`)

console.log('\n--- balanced by width, not character count ---')
chk(F.fitText('Everybody on the floor').lines[0]==='Everybody',
    `"Everybody on the floor" -> ${JSON.stringify(F.fitText('Everybody on the floor').lines)}`)

console.log('\n--- the caps ---')
chk(F.PILL_W - 2*F.PILL_PAD > 0, `PILL_W ${F.PILL_W}u holds ${(F.LINE_EM).toFixed(2)}em after ${F.PILL_PAD}u padding each side`)
chk(F.MAX_LABEL_CHARS > 40, `renderer ceiling ${F.MAX_LABEL_CHARS} sits above the editor's 40-char cap`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
