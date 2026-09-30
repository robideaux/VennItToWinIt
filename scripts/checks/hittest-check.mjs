import { ROOT } from './_root.mjs'
import { pathToFileURL } from 'url'
const U = f => pathToFileURL(ROOT + '/src/utils/'+f).href
const G = await import(U('vennGeometry.js'))
const { PILL_W } = await import(U('fitText.js'))
let fails=0; const chk=(c,m)=>{ if(!c){fails++;console.log('FAIL '+m)} else console.log('ok   '+m) }

// Mirrors VennDiagram's simplified click handler
const hit = (x,y) => {
  const inside = G.CIRCLES.filter(c => Math.hypot(x-c.cx, y-c.cy) <= c.r)
  return inside.length === 0 ? null : inside.map(c=>c.id).join('')
}

console.log('--- every centroid resolves to its own region (why pill hit-layers could go) ---')
for (const [key,{cx,cy}] of Object.entries(G.CENTROIDS)) chk(hit(cx,cy)===key, `'${key}' (${cx},${cy}) -> ${hit(cx,cy)}`)

console.log('\n--- callout anchors sit outside every circle (why empty slots are needed) ---')
for (const key of G.CALLOUT_REGIONS) {
  const a = G.CALLOUT_ANCHORS[key]
  chk(hit(a.cx,a.cy)===null, `'${key}' anchor (${a.cx},${a.cy}) -> dead space`)
}

console.log('\n--- no pill escapes the diagram box ---')
for (const key of Object.keys(G.CENTROIDS)) {
  const v = G.CALLOUT_REGIONS.has(key) ? G.CALLOUT_ANCHORS[key] : G.CENTROIDS[key]
  const cx = G.clampX(v.cx, PILL_W)
  chk(cx-PILL_W/2 >= -0.01 && cx+PILL_W/2 <= G.VB_W+0.01,
      `'${key}' spans ${(cx-PILL_W/2).toFixed(1)}..${(cx+PILL_W/2).toFixed(1)} in 0..${G.VB_W}`)
}

console.log('\n--- neighbours stay clear at the current pill size ---')
chk(PILL_W < Math.abs(G.CENTROIDS['3'].cx-G.CENTROIDS['2'].cx),
    `'2'/'3': ${PILL_W}u wide vs ${Math.abs(G.CENTROIDS['3'].cx-G.CENTROIDS['2'].cx)}u apart`)
const pillH = 3*12*1.18 + 4
chk(pillH < Math.abs(G.CENTROIDS['123'].cy-G.CENTROIDS['1'].cy),
    `'1'/'123': ${pillH.toFixed(0)}u tall (3 lines) vs ${Math.abs(G.CENTROIDS['123'].cy-G.CENTROIDS['1'].cy)}u apart`)

console.log(fails===0?'\nPASS':`\nFAIL — ${fails}`); process.exit(fails?1:0)
