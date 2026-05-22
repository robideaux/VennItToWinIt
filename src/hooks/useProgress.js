import { useState } from 'react'

const STORAGE_KEY = 'vennit_progress'

export function useProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
    } catch {
      return {}
    }
  })

  function recordResult(puzzleId, { won, attempts }) {
    setProgress(prev => {
      const next = {
        ...prev,
        [puzzleId]: { won, attempts, completedAt: new Date().toISOString() },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { progress, recordResult }
}
