// Storage for user-created and received puzzles, in localStorage under `vennit_custom`.
//
// Records are FLAT: a custom puzzle is a normal puzzle object with two extra fields
// (`source`, `createdAt`). It is deliberately not wrapped, because App's
// handleSelectPuzzle already takes a full puzzle object and recordResult keys off
// puzzle.id — so a custom puzzle flows through the whole game unchanged, and a share
// link is the same object minus the metadata.
//
// This store is treated more defensively than `vennit_progress`, because the two hold
// very different things: losing progress costs some checkmarks, whereas losing this
// costs puzzles someone WROTE, with no backup anywhere. Hence the versioned wrapper and
// the per-record recovery in readStore — one unreadable entry must never take the rest
// with it.

import { validatePuzzle } from './validatePuzzle.js'

const STORAGE_KEY = 'vennit_custom'
const VERSION = 1

export const CUSTOM_ID_PREFIX = 'custom_'

// Namespaced so a custom id can never collide with a library id like "2026_001" in the
// shared `vennit_progress` map.
export function newCustomId() {
  return `${CUSTOM_ID_PREFIX}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const isCustomId = id => typeof id === 'string' && id.startsWith(CUSTOM_ID_PREFIX)

// Identity for deduplicating received puzzles: the content, ignoring id/title/metadata.
// Two links carrying the same puzzle should not produce two copies.
export function contentKey(puzzle) {
  const cats = ['A', 'B', 'C'].map(k => String(puzzle?.categories?.[k] ?? '').trim().toLowerCase())
  const terms = (puzzle?.terms ?? [])
    .map(t => `${[...(t.regions ?? [])].sort().join('')}:${String(t.label ?? '').trim().toLowerCase()}`)
    .sort()
  return JSON.stringify([cats, terms])
}

// ── Store I/O ───────────────────────────────────────────────────────────────

// Never throws. A record that cannot be read is skipped, not fatal — and "cannot be
// read" means structurally broken, NOT merely unfinished: drafts are expected here and
// are kept.
export function readStore(storage = safeStorage()) {
  if (!storage) return { version: VERSION, puzzles: [] }
  let raw
  try {
    raw = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return { version: VERSION, puzzles: [] }
  }
  if (!raw) return { version: VERSION, puzzles: [] }

  // Tolerate a bare array in case an older build ever wrote one
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.puzzles) ? raw.puzzles : []

  // A record needs a usable id to be addressable at all — that is a storage concern,
  // which is why it is enforced here rather than inside validatePuzzle.
  const puzzles = list.filter(
    p => isCustomId(p?.id) && validatePuzzle(p).status !== 'invalid'
  )
  return { version: VERSION, puzzles }
}

// Returns true on success. Quota and private-browsing failures are reported rather than
// thrown, so a caller can tell the user their puzzle did not save.
export function writeStore(puzzles, storage = safeStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, puzzles }))
    return true
  } catch {
    return false
  }
}

function safeStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null   // access itself throws when site data is blocked
  }
}

// ── Queries ─────────────────────────────────────────────────────────────────

// Newest first, matching how the curated library already sorts.
export function listCustom(source = null, storage = safeStorage()) {
  const all = readStore(storage).puzzles
  const filtered = source ? all.filter(p => p.source === source) : all
  return [...filtered].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
}

export function getCustom(id, storage = safeStorage()) {
  return readStore(storage).puzzles.find(p => p.id === id) ?? null
}

// Titles must be unique among YOUR puzzles, so the list can never show two identical
// names. Received puzzles are exempt: you do not control what someone else called
// theirs, and they live in a separate section where a clash is unambiguous.
export function titleExists(title, exceptId = null, storage = safeStorage()) {
  const t = String(title ?? '').trim().toLowerCase()
  if (!t) return false
  return readStore(storage).puzzles.some(
    p => p.source === 'local' && p.id !== exceptId && String(p.title ?? '').trim().toLowerCase() === t
  )
}

// The title to show when LISTING puzzles. `title` is always the author's, unchanged;
// `localTitle` is set only when a received puzzle needed disambiguating against another
// of yours.
//
// Use this in lists only — never while playing. A title often carries a deliberate hint
// about the hidden categories (the way a Strands clue does), so the player must see it
// exactly as its author wrote it. "Demo 03" would corrupt that hint with bookkeeping that
// is yours alone. GameBoard therefore reads `puzzle.title` directly, and should continue
// to: the canonical title is never the one carrying local decoration.
export const displayTitle = puzzle =>
  String(puzzle?.localTitle ?? puzzle?.title ?? '').trim()

// A puzzle stripped back to shareable content. Local bookkeeping — the id you assigned,
// where it came from, when you got it, and any suffix you needed to tell two apart — is
// yours and must not travel. Sharing a puzzle you received passes on the author's title,
// not the "Demo 03" you happen to file it under.
export function toShareable(puzzle) {
  // `year`/`sequence` go too: they schedule the curated weekly library and mean nothing
  // on a custom puzzle, which is never gated. Links pay for every byte they carry.
  const { id, source, createdAt, localTitle, year, sequence, ...content } = puzzle ?? {}
  return content
}

// Returns `title`, or the first free " NN" variant of it, among received puzzles.
//
// Only reachable when two DIFFERENT people send you same-titled puzzles: title
// uniqueness already stops any one person creating two of their own with the same name.
// Scoped to received puzzles because a local and a received puzzle sharing a title are
// already unambiguous — they sit in separate sections.
//
// The suffix is stored rather than applied at render time, so a title stays put instead
// of shifting when a neighbour is deleted. Numbers are reused once freed, so the list
// never grows gaps.
export function uniqueSharedTitle(title, storage = safeStorage()) {
  const base = String(title ?? '').trim() || 'Untitled'
  // Compares against DISPLAYED titles: an existing "Demo 02" occupies that name even
  // though its own `title` is still the author's plain "Demo".
  const taken = new Set(
    readStore(storage).puzzles
      .filter(p => p.source === 'shared')
      .map(p => displayTitle(p).toLowerCase())
  )
  if (!taken.has(base.toLowerCase())) return base

  for (let n = 2; n <= 999; n++) {
    const candidate = `${base} ${String(n).padStart(2, '0')}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
  // Absurd in practice; still better than looping forever or returning a clashing title.
  return `${base} ${Date.now().toString(36)}`
}

// ── Mutations ───────────────────────────────────────────────────────────────

// Create or update one of YOUR puzzles. Accepts incomplete drafts by design — saving is
// how you avoid losing work, so completeness gates playability, not saving.
//
// Renaming is a true rename: the id is stable, so progress history follows the puzzle
// and no duplicate appears.
export function saveCustom(puzzle, storage = safeStorage()) {
  // Mint the id first: a new puzzle from the editor arrives without one, and validating
  // before assigning would make it permanently unsaveable.
  const id = isCustomId(puzzle?.id) ? puzzle.id : newCustomId()
  if (validatePuzzle(puzzle).status === 'invalid') {
    return { ok: false, reason: 'invalid', puzzle: null }
  }

  if (titleExists(puzzle.title, id, storage)) {
    return { ok: false, reason: 'duplicate-title', puzzle: null }
  }

  const { puzzles } = readStore(storage)
  const existing = puzzles.find(p => p.id === id)
  const record = {
    ...puzzle,
    id,
    source: 'local',
    createdAt: existing?.createdAt ?? puzzle.createdAt ?? new Date().toISOString(),
  }

  const next = existing
    ? puzzles.map(p => (p.id === id ? record : p))
    : [...puzzles, record]

  return writeStore(next, storage)
    ? { ok: true, puzzle: record }
    : { ok: false, reason: 'storage-full', puzzle: null }
}

// Save a puzzle received via a share link. Requires `complete`: received puzzles are
// play-and-delete only, so an unfinished one could never be repaired.
// Deduplicates on content, so opening the same link twice does not make a second copy.
export function importShared(puzzle, storage = safeStorage()) {
  if (validatePuzzle(puzzle).status !== 'complete') {
    return { ok: false, reason: 'invalid', puzzle: null }
  }

  const { puzzles } = readStore(storage)
  const key = contentKey(puzzle)
  // Matches ANY existing record, local or shared. Identical content is not a
  // coincidence: two people independently authoring the same 7 terms across the same 3
  // categories effectively never happens, so a match means this is a puzzle you already
  // have — most often your own, coming back from testing your own share link. Returning
  // the copy you already hold keeps your editable original and your progress intact,
  // where importing a second copy would split both across two ids for no gain.
  const dupe = puzzles.find(p => contentKey(p) === key)
  if (dupe) return { ok: true, puzzle: dupe, duplicate: true }

  const record = {
    ...puzzle,
    id: newCustomId(),
    source: 'shared',
    createdAt: new Date().toISOString(),
  }

  // `title` is left exactly as the author wrote it. A suffix, when one is needed, goes in
  // `localTitle` — it is how YOU tell two arrivals apart, not a property of the puzzle,
  // and it must not follow the puzzle onward if you share it yourself.
  const shown = uniqueSharedTitle(puzzle.title, storage)
  if (shown !== String(puzzle.title ?? '').trim()) record.localTitle = shown

  return writeStore([...puzzles, record], storage)
    ? { ok: true, puzzle: record, duplicate: false }
    : { ok: false, reason: 'storage-full', puzzle: null }
}

// Removes the puzzle only. The caller must also clear its progress entry via
// useProgress.clearResult — every write to `vennit_progress` stays inside that hook so
// its React state cannot go stale.
export function deleteCustom(id, storage = safeStorage()) {
  const { puzzles } = readStore(storage)
  const next = puzzles.filter(p => p.id !== id)
  if (next.length === puzzles.length) return false
  return writeStore(next, storage)
}
