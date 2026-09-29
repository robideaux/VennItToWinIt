import { useState, useCallback } from 'react'

// Remembers which list sections are collapsed, per screen.
//
// Lists here can run long — the curated library alone is dozens of rows — and a collapse
// that reset on every visit would be worse than none: you would close the same section
// every single time you came looking past it.
//
// Each screen passes its own storage key. Collapsing "My Venns" while picking something to
// play says nothing about whether you want it collapsed while editing.
export function useCollapsedSections(storageKey) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '[]')
      return new Set(Array.isArray(raw) ? raw : [])
    } catch {
      return new Set()
    }
  })

  const toggle = useCallback(key => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        /* a lost preference is not worth breaking the screen over */
      }
      return next
    })
  }, [storageKey])

  return { collapsed, toggle, isCollapsed: key => collapsed.has(key) }
}
