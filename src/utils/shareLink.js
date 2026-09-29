// Share links. Two kinds, because the two sorts of puzzle are reachable in different ways:
//
//   ?puzzle=2026_001   a curated puzzle, referenced by id — the recipient already has the
//                      file, so the link only has to name it
//   ?p=<payload>       a custom puzzle, carried whole — it exists only in the sender's
//                      browser, so nothing else can fetch it
//
// No backend is involved in either case.

import { toShareable, isCustomId } from './customPuzzles.js'
import { validatePuzzle } from './validatePuzzle.js'

// URL-safe base64. Plain base64 uses + and /, which are meaningful inside a query string,
// and the = padding gets percent-encoded by some clients — all three survive a round trip
// far less reliably than they should.
const b64encode = str => {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const b64decode = payload => {
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))
}

// Encodes only shareable content: the author's title, categories and terms. Local
// bookkeeping — your id for it, when you received it, any suffix you needed to tell two
// arrivals apart — is yours and must not travel.
export function encodePuzzle(puzzle) {
  return b64encode(JSON.stringify(toShareable(puzzle)))
}

// Returns a puzzle, or null for anything that is not one. Everything here arrives from a
// URL, so it is untrusted: a truncated link, an old format, or someone's idea of a joke.
export function decodePuzzle(payload) {
  try {
    const puzzle = JSON.parse(b64decode(payload))
    // Complete only. Received puzzles cannot be edited, so an unfinished one could never
    // be repaired by whoever got it.
    return validatePuzzle(puzzle).status === 'complete' ? puzzle : null
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

export async function sharePuzzle({ title, url }) {
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
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    // Non-secure context, or permission denied. The caller shows the link so it can be
    // copied by hand rather than leaving the user with nothing.
    return 'failed'
  }
}
