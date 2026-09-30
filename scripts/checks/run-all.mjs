// Runs every *-check.mjs and reports. No test framework: these exercise the real source
// modules against real puzzle data, which is the only kind of verification available here
// (no headless browser works in this environment).
//
//   node scripts/checks/run-all.mjs          all checks, pass/fail only
//   node scripts/checks/run-all.mjs -v       full output from each
//   node scripts/checks/run-all.mjs store    only checks matching "store"

import { spawnSync } from 'child_process'
import { readdirSync } from 'fs'
import path from 'path'
import { ROOT } from './_root.mjs'

const dir = path.join(ROOT, 'scripts', 'checks')
const args = process.argv.slice(2)
const verbose = args.includes('-v')
const filter = args.find(a => !a.startsWith('-'))

const checks = readdirSync(dir)
  .filter(f => f.endsWith('-check.mjs'))
  .filter(f => !filter || f.includes(filter))
  .sort()

if (!checks.length) {
  console.log(filter ? `No checks matching "${filter}"` : 'No checks found')
  process.exit(1)
}

let failed = 0
for (const file of checks) {
  const r = spawnSync(process.execPath, [path.join(dir, file)], { encoding: 'utf8' })
  const ok = r.status === 0
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${file.replace('-check.mjs', '')}`)
  if (verbose || !ok) {
    const out = (r.stdout || '') + (r.stderr || '')
    console.log(out.split('\n').map(l => '      ' + l).join('\n'))
  }
}

console.log(`\n${checks.length - failed}/${checks.length} passed`)
process.exit(failed ? 1 : 0)
