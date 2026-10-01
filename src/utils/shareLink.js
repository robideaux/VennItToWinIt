// Share links. Two kinds, because the two sorts of puzzle are reachable in different ways:
//
//   ?puzzle=2026_001   a curated puzzle, referenced by id — the recipient already has the
//                      file, so the link only has to name it
//   ?p=<payload>       a custom puzzle, carried whole — it exists only in the sender's
//                      browser, so nothing else can fetch it
//
// No backend is involved in either case.

import { deflateSync, inflateSync, strToU8, strFromU8 } from 'fflate'
import { toShareable, isCustomId } from './customPuzzles.js'
import { validatePuzzle, CATEGORY_KEYS, CATEGORY_REGION_KEYS } from './validatePuzzle.js'
import { toDraft, fromDraft } from './puzzleDraft.js'

// URL-safe base64. Plain base64 uses + and /, which are meaningful inside a query string,
// and the = padding gets percent-encoded by some clients — all three survive a round trip
// far less reliably than they should.
const bytesToB64 = bytes => {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const b64ToBytes = payload => {
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), c => c.charCodeAt(0))
}

// ── Link format versions ────────────────────────────────────────────────────────
//
// The first character of a ?p= payload names its format, and sits OUTSIDE any
// compression, so the decoder knows how to read the rest before touching it. A future
// version can change anything, compression included.
//
//   v0  no version character: base64url of the puzzle's JSON. Every link sent before
//       Phase 21. Always begins "eyJ" (base64 of `{"`), so "e" is never assigned.
//   v1  "1" + base64url(deflateRaw(the 11 fields joined by FIELD_SEP)): title, categories
//       A/B/C, then the 7 terms in CATEGORY_REGION_KEYS order. Position carries the
//       region, so regions, ids and JSON keys cost nothing. About a quarter the length of
//       v0. Compressed rather than plain text so a glance at the link does not spoil the
//       answers.
export const LINK_VERSION = '1'
const FIELD_SEP = '\u001f'
const FIELD_COUNT = 1 + CATEGORY_KEYS.length + CATEGORY_REGION_KEYS.length

// Control characters are never meaningful in a label, and a stray separator would shift
// every field after it, so they become spaces on the way out.
const clean = s => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ')

// Encodes only shareable content: the author's title, categories and terms. Local
// bookkeeping — your id for it, when you received it, any suffix you needed to tell two
// arrivals apart — is yours and must not travel.
export function encodePuzzle(puzzle) {
  const d = toDraft(toShareable(puzzle))
  const fields = [d.title, ...CATEGORY_KEYS.map(k => d.categories[k]),
    ...CATEGORY_REGION_KEYS.map(k => d.terms[k])].map(clean)
  return LINK_VERSION + bytesToB64(deflateSync(strToU8(fields.join(FIELD_SEP)), { level: 9 }))
}

function decodeV1(body) {
  const fields = strFromU8(inflateSync(b64ToBytes(body))).split(FIELD_SEP)
  if (fields.length !== FIELD_COUNT) return null
  const [title, ...rest] = fields
  const cats = rest.slice(0, CATEGORY_KEYS.length)
  const terms = rest.slice(CATEGORY_KEYS.length)
  return fromDraft({
    title,
    categories: Object.fromEntries(CATEGORY_KEYS.map((k, i) => [k, cats[i]])),
    terms: Object.fromEntries(CATEGORY_REGION_KEYS.map((k, i) => [k, terms[i]])),
  })
}

const decodeV0 = payload => JSON.parse(strFromU8(b64ToBytes(payload)))

// Returns a puzzle, or null for anything that is not one. Everything here arrives from a
// URL, so it is untrusted: a truncated link, an unknown version, or someone's idea of a
// joke.
export function decodePuzzle(payload) {
  try {
    const puzzle =
      payload.startsWith('e')            ? decodeV0(payload)
      : payload[0] === LINK_VERSION      ? decodeV1(payload.slice(1))
      : null                             // a version from the future, or garbage
    // Complete only. Received puzzles cannot be edited, so an unfinished one could never
    // be repaired by whoever got it.
    return puzzle && validatePuzzle(puzzle).status === 'complete' ? puzzle : null
  } catch {
    return null
  }
}

function appBase(loc = window.location) {
  return `${loc.origin}${loc.pathname}`.replace(/\/+$/, '') || loc.origin
}

// `target` is either a whole custom puzzle or anything carrying a library id
// (a manifest entry or the puzzle itself).
export function shareUrlFor(target, loc = window.location) {
  const base = appBase(loc)
  return isCustomId(target?.id)
    ? `${base}/?p=${encodePuzzle(target)}`
    : `${base}/?puzzle=${encodeURIComponent(target.id)}`
}

export function readShareParams(search) {
  const params = new URLSearchParams(search)
  const payload = params.get('p')
  if (payload) return { kind: 'custom', payload }
  const id = params.get('puzzle')
  if (id) return { kind: 'library', id }
  return null
}

// A shared puzzle should not re-import on every refresh, and the payload makes for an ugly
// address bar. Dropping the parameter keeps the history entry, just without the cargo.
export function clearShareParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('p')
  url.searchParams.delete('puzzle')
  history.replaceState(history.state, '', url.pathname + url.search + url.hash)
}

// Whether to use the native share sheet, rather than merely whether it exists.
//
// Chrome and Edge on Windows expose navigator.share and implement it by delegating to the
// Windows share sheet, which frequently fails with "We couldn't show you all the ways you
// could share". We cannot detect that: navigator.share RESOLVES as soon as the sheet
// opens, so the failure happens after we have already been told it worked — there is no
// error to fall back from.
//
// So the test is the device, not the API. A coarse primary pointer means a phone or
// tablet, where the sheet is the whole point (the link goes straight to Messages or
// WhatsApp). On a desktop the clipboard is both more reliable and more useful.
export function prefersNativeShare(nav = globalThis.navigator, mm = globalThis.matchMedia) {
  if (typeof nav?.share !== 'function') return false
  if (typeof mm !== 'function') return false
  try {
    return mm('(pointer: coarse)').matches
  } catch {
    return false
  }
}

// What goes on the clipboard. A result block has to travel with its link — on desktop the
// clipboard is the only route, so copying the link alone silently dropped the result.
export function clipboardText({ text = null, url }) {
  return text ? `${text}\n${url}` : url
}

export async function sharePuzzle({ title, url, text = null }) {
  if (prefersNativeShare()) {
    try {
      await navigator.share({ title, text: title, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // Permission or payload problems fall through to the clipboard below
    }
  }
  try {
    await navigator.clipboard.writeText(clipboardText({ text, url }))
    return 'copied'
  } catch {
    // Non-secure context, or permission denied. The caller shows the link so it can be
    // copied by hand rather than leaving the user with nothing.
    return 'failed'
  }
}
