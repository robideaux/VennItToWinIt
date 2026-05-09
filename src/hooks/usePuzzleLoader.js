import { useState, useEffect } from 'react'

// Fetches a puzzle JSON file from /puzzles/{file} when file changes.
// Returns null puzzle while loading or if file is null.
export function usePuzzleLoader(file) {
  const [puzzle, setPuzzle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!file) return
    setLoading(true)
    setPuzzle(null)
    setError(null)
    fetch(`/puzzles/${file}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load ${file} (HTTP ${r.status})`)
        return r.json()
      })
      .then(data => {
        setPuzzle(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [file])

  return { puzzle, loading, error }
}
