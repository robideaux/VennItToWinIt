import { useState, useCallback, useRef, useEffect } from 'react'
import { shareUrlFor, sharePuzzle } from '../utils/shareLink.js'

const MESSAGES = {
  copied: 'Link copied',
}

// Wraps the share action and its transient feedback. The native sheet gives its own
// confirmation, so only the clipboard fallback needs a message — and an outright failure,
// which otherwise looks like nothing happened at all.
export function useShare() {
  const [status, setStatus] = useState(null)
  // Shown only when copying failed outright, so there is still a way to get the link.
  const [fallbackUrl, setFallbackUrl] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  // `resultBlock` is passed only from the win/lose screens. Deliberately kept out of the
  // URL: navigator.share appends the link itself, and a message containing it as well
  // gets it twice on several platforms.
  const share = useCallback(async (target, resultBlock = null) => {
    const url = shareUrlFor(target)
    const result = await sharePuzzle({
      title: resultBlock ?? target.title ?? 'Venn It To Win It',
      url,
    })
    clearTimeout(timer.current)

    if (result === 'failed') {
      setStatus(null)
      setFallbackUrl(url)   // stays until dismissed; there is nothing else to fall back to
      return result
    }

    setFallbackUrl(null)
    const message = MESSAGES[result] ?? null
    setStatus(message)
    if (message) timer.current = setTimeout(() => setStatus(null), 2200)
    return result
  }, [])

  return { share, status, fallbackUrl, dismissFallback: () => setFallbackUrl(null) }
}
