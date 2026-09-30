import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const S = await import(pathToFileURL(ROOT + '/src/utils/shareLink.js').href)
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

const nav = has => (has ? { share: () => {} } : {})
const mm  = coarse => q => ({ matches: q.includes('coarse') ? coarse : !coarse })

console.log('=== which devices get the native sheet ===')
chk(S.prefersNativeShare(nav(true),  mm(true))  === true,  `phone / tablet (coarse pointer, API present) -> native sheet`)
chk(S.prefersNativeShare(nav(true),  mm(false)) === false, `Windows desktop (API present but fine pointer) -> clipboard`)
console.log('   ^ this is the reported bug: Edge/Chrome on Windows expose navigator.share')
console.log('     and hand off to the Windows sheet, which fails on its own AFTER the')
console.log('     promise has already resolved — so there was no error to fall back from.')
chk(S.prefersNativeShare(nav(false), mm(true))  === false, `no Web Share API at all -> clipboard`)
chk(S.prefersNativeShare(nav(false), mm(false)) === false, `desktop, no API -> clipboard`)

console.log('\n=== degrades rather than throwing ===')
chk(S.prefersNativeShare(undefined, undefined) === false, `no navigator or matchMedia -> false`)
chk(S.prefersNativeShare(nav(true), () => { throw new Error('boom') }) === false, `matchMedia throwing -> false`)
chk(S.prefersNativeShare({}, mm(true)) === false, `navigator without share -> false`)

console.log('\n=== the link itself is unaffected ===')
const loc = { origin:'https://vennittowinit.netlify.app', pathname:'/' }
const url = S.shareUrlFor({ id:'2026_001' }, loc)
chk(url === 'https://vennittowinit.netlify.app/?puzzle=2026_001', url)

console.log('\n=== the clipboard carries the result, not just the link ===')
const block = 'Venn It To Win It — Just Relax\n🔴🟡🔵\nSolved with no misses'
chk(S.clipboardText({ text: block, url }) === block + '\n' + url, `result block, then the link on its own line`)
chk(S.clipboardText({ url }) === url, `a plain puzzle share is still just the link`)
const src = (await import('fs')).readFileSync(ROOT + '/src/utils/shareLink.js', 'utf8')
chk(src.includes('writeText(clipboardText({ text, url }))'), `sharePuzzle copies clipboardText, not the bare url`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
