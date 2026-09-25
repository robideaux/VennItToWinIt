import { useState, useCallback } from 'react'
import {
  listCustom, saveCustom, deleteCustom, importShared, titleExists,
} from '../utils/customPuzzles.js'
import { validatePuzzle } from '../utils/validatePuzzle.js'

// Thin React wrapper over the customPuzzles store, mirroring how useProgress wraps its
// own key. The store itself stays a pure module so it can be tested outside a browser;
// this exists only because the list changes at runtime (save, delete, import) and three
// screens read it — without state here, saving a puzzle would not re-render the selector.
//
// Every mutation re-reads the store rather than patching local state, so what is on
// screen always reflects what is actually persisted. The lists are small enough that
// the extra parse costs nothing.
export function useCustomPuzzles() {
  const [puzzles, setPuzzles] = useState(() => listCustom())

  const refresh = useCallback(() => setPuzzles(listCustom()), [])

  const save = useCallback(puzzle => {
    const result = saveCustom(puzzle)
    if (result.ok) setPuzzles(listCustom())
    return result
  }, [])

  const remove = useCallback(id => {
    const ok = deleteCustom(id)
    if (ok) setPuzzles(listCustom())
    return ok
  }, [])

  const receive = useCallback(puzzle => {
    const result = importShared(puzzle)
    if (result.ok) setPuzzles(listCustom())
    return result
  }, [])

  return {
    puzzles,                                              // newest first, both sources
    mine:     puzzles.filter(p => p.source === 'local'),
    shared:   puzzles.filter(p => p.source === 'shared'),
    save,
    remove,
    receive,
    refresh,
    titleExists,
    statusOf: puzzle => validatePuzzle(puzzle).status,
  }
}
