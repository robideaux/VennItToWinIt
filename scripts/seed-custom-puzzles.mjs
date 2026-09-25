// Prints a localStorage seed for the custom-puzzle store, so Stage 3 can be exercised
// in the browser before the editor exists (Stage 4).
//
//   node scripts/seed-custom-puzzles.mjs
//
// Copy the printed line into the browser console on the running app, then reload.
// Covers all three record states: complete local, incomplete draft, and received.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const load = f => JSON.parse(fs.readFileSync(path.join(root, 'public/puzzles', f), 'utf8'))

const iso = daysAgo => new Date(Date.now() - daysAgo * 864e5).toISOString()
const id  = n => `custom_seed${n}_demo`

const base = load('2026_001.json')
const other = load('2026_002.json')

// A finished puzzle of your own — playable, appears under My Venns
const mine = { ...base, id: id(1), title: 'Kitchen Things', source: 'local', createdAt: iso(1) }

// A draft: same shape, but three terms still blank. Must stay visible and editable.
const draft = {
  ...base,
  id: id(2),
  title: 'Half Finished',
  source: 'local',
  createdAt: iso(0),
  terms: base.terms.map((t, i) => (i < 3 ? t : { ...t, label: '' })),
}

// Received via a share link — play/delete only, never editable
const received = { ...other, id: id(3), title: other.title, source: 'shared', createdAt: iso(2) }

const store = { version: 1, puzzles: [mine, draft, received] }

console.log('\n--- paste into the browser console, then reload ---\n')
console.log(`localStorage.setItem('vennit_custom', ${JSON.stringify(JSON.stringify(store))})`)
console.log('\n--- to clear again ---\n')
console.log(`localStorage.removeItem('vennit_custom')`)
console.log('\nSeeds: 2 local (1 complete "Kitchen Things", 1 draft "Half Finished") + 1 shared.\n')
