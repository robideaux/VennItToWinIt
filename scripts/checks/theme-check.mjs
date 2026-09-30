import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
import fs from 'fs'

// Minimal DOM so the module can be exercised outside a browser
const metas = []
const html = { dataset: {} }
globalThis.document = {
  documentElement: html,
  head: {
    querySelector: sel => metas.find(m => sel.includes('data-managed') ? m.dataset.managed : true) ?? null,
    querySelectorAll: () => ({ forEach: fn => [...metas].forEach(m => fn(m)) }),
    appendChild: m => metas.push(m),
  },
  createElement: () => ({ dataset: {}, name: '', content: '', remove() { metas.splice(metas.indexOf(this), 1) } }),
}
let systemDark = false
globalThis.matchMedia = q => ({ matches: q.includes('dark') ? systemDark : !systemDark, addEventListener(){}, removeEventListener(){} })
let store = {}
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k,v) => { store[k]=v } }

const T = await import(pathToFileURL(ROOT + '/src/utils/theme.js').href)
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }
const colour = () => metas.find(m => m.dataset.managed)?.content

console.log('=== the bug: a saved preference on startup ===')
store['vennit_settings'] = JSON.stringify({ theme: 'light', audio: true })
systemDark = true                                  // dark phone, user chose light
chk(T.readTheme()==='light', `reads the saved preference`)
T.applyTheme(T.readTheme())
chk(html.dataset.theme==='light', `data-theme="light" applied at boot, not only inside Settings`)
chk(colour()==='#ffffff', `chrome follows it: ${colour()}`)

console.log('\n=== chrome follows an explicit choice either way ===')
T.applyTheme('dark');  chk(colour()==='#1a1a1a', `dark  -> ${colour()}`)
T.applyTheme('light'); chk(colour()==='#ffffff', `light -> ${colour()}`)

console.log('\n=== system mode resolves against the OS ===')
systemDark = true;  T.applyTheme('system')
chk(html.dataset.theme==='' && colour()==='#1a1a1a', `dark OS  -> ${colour()}, no data-theme override`)
systemDark = false; T.applyTheme('system')
chk(colour()==='#ffffff', `light OS -> ${colour()}`)

console.log('\n=== exactly one managed tag, however many times it is applied ===')
for (let i=0;i<5;i++) T.applyTheme(i % 2 ? 'dark' : 'light')
chk(metas.filter(m=>m.dataset.managed).length===1, `${metas.filter(m=>m.dataset.managed).length} managed meta`)

console.log('\n=== degrades without storage or matchMedia ===')
store = {}
chk(T.readTheme()==='system', `no saved settings -> system`)
store['vennit_settings'] = 'not json'
chk(T.readTheme()==='system', `corrupt settings -> system, no throw`)
const mm = globalThis.matchMedia; delete globalThis.matchMedia
chk(T.resolveTheme('system')==='light', `no matchMedia -> light, no throw`)
globalThis.matchMedia = mm

console.log('\n=== index.html carries both schemes for the first paint ===')
const idx = fs.readFileSync(ROOT + '/index.html','utf8')
chk(/theme-color.*prefers-color-scheme: light/.test(idx), `light meta present`)
chk(/theme-color.*prefers-color-scheme: dark/.test(idx),  `dark meta present`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
