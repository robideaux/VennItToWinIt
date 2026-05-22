function isoWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const yearStart = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - yearStart) / 86400000 - 3 + (yearStart.getDay() + 6) % 7) / 7)
}

function isoWeekYear(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  return d.getFullYear()
}

export function getCurrentYearWeek() {
  const now = new Date()
  return { year: isoWeekYear(now), isoWeek: isoWeekNumber(now) }
}

export function isPuzzleUnlocked(year, sequence) {
  const { year: curYear, isoWeek: curWeek } = getCurrentYearWeek()
  return year < curYear || (year === curYear && sequence <= curWeek)
}

// Returns the Monday of ISO week `sequence` in `year`
export function sequenceToDate(year, sequence) {
  const jan4 = new Date(year, 0, 4)
  const week1Mon = new Date(jan4)
  week1Mon.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7)
  const result = new Date(week1Mon)
  result.setDate(week1Mon.getDate() + (sequence - 1) * 7)
  return result
}

// "Mar 16" — short enough for compact list rows
export function formatDisplayDate(year, sequence) {
  const date = sequenceToDate(year, sequence)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Fetches manifest, filters to unlocked puzzles, returns newest-first
export async function fetchUnlockedPuzzles() {
  const r = await fetch('/puzzles/index.json')
  if (!r.ok) throw new Error('Could not load puzzle list')
  const { puzzles } = await r.json()
  return puzzles
    .filter(e => isPuzzleUnlocked(e.year, e.sequence))
    .sort((a, b) => b.year - a.year || b.sequence - a.sequence)
}
