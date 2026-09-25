import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'vennit_progress'

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

// Guarded: setItem throws on quota, and in Safari private browsing even touching
// localStorage can throw. This persists during the win/lose transition, so an unhandled
// throw would take the results screen down with it. Losing a progress entry is a far
// better outcome than losing the screen.
function write(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    /* progress is disposable — never let persistence failure break gameplay */
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(read)

  // Persist as an effect rather than inside the state updaters below. A setState updater
  // must be pure, and React double-invokes it under StrictMode in development — so a
  // write in there runs twice per call and is a side effect where none is allowed.
  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true   // skip the mount pass: that value came FROM storage
      return
    }
    write(progress)
  }, [progress])

  function recordResult(puzzleId, { won, attempts }) {
    setProgress(prev => ({
      ...prev,
      [puzzleId]: { won, attempts, completedAt: new Date().toISOString() },
    }))
  }

  // Called when a custom puzzle is deleted, so its result doesn't linger as an orphan.
  // Every write to this key stays inside this hook: a utility writing it directly would
  // leave this state stale, and the UI would show progress for a deleted puzzle.
  function clearResult(puzzleId) {
    setProgress(prev => {
      if (!(puzzleId in prev)) return prev   // same reference -> no write, no re-render
      const next = { ...prev }
      delete next[puzzleId]
      return next
    })
  }

  return { progress, recordResult, clearResult }
}
