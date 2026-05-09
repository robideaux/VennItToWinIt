# Venn It To Win It — Technical Specification

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 | Functional components + hooks only |
| Build Tool | Vite | Fast dev server, simple config |
| Styling | CSS Modules or plain CSS | No Tailwind — keep it lightweight |
| State | React `useState` / `useReducer` | No Redux needed for v1 |
| Data | JSON files via `fetch()` | Served from `/public/puzzles/` |
| Deployment | Static host (Netlify, Vercel, GitHub Pages) | No backend |

---

## Project Structure

```
venn-it-to-win-it/
├── public/
│   └── puzzles/
│       ├── index.json          # Puzzle manifest
│       ├── puzzle-001.json     # Individual puzzle definitions
│       └── puzzle-002.json
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Root component, routing between screens
│   ├── components/
│   │   ├── PuzzleSelector.jsx  # Screen: choose a puzzle
│   │   ├── GameBoard.jsx       # Screen: main game
│   │   ├── VennDiagram.jsx     # SVG Venn diagram with 7 interactive regions
│   │   ├── VennRegion.jsx      # Individual region (clickable drop target)
│   │   ├── TermBank.jsx        # Scrollable list of unplaced terms
│   │   ├── TermTile.jsx        # Individual term chip (selectable)
│   │   ├── SubmitBar.jsx       # Submit button + attempts remaining display
│   │   ├── WinScreen.jsx       # Win state overlay
│   │   └── GameOverScreen.jsx  # Loss state overlay
│   ├── hooks/
│   │   ├── useGameState.js     # Core game logic hook
│   │   └── usePuzzleLoader.js  # Fetch & parse puzzle JSON
│   ├── utils/
│   │   └── puzzleUtils.js      # Region key logic, answer checking
│   └── styles/
│       ├── global.css
│       └── *.module.css        # Per-component styles
├── index.html
├── vite.config.js
└── package.json
```

---

## Data Model

### Region Key Convention

Each of the 7 Venn regions is identified by a sorted string key derived from which circles it belongs to:

| Key | Meaning |
|---|---|
| `"A"` | Circle A only |
| `"B"` | Circle B only |
| `"C"` | Circle C only |
| `"AB"` | A and B overlap (not C) |
| `"AC"` | A and C overlap (not B) |
| `"BC"` | B and C overlap (not A) |
| `"ABC"` | Center — all three |

A term's correct region key is derived by sorting its `regions` array and joining: `["B","A"] → "AB"`.

### Game State Shape

```js
{
  puzzle: {              // Loaded from JSON
    id, title, maxAttempts,
    categories: { A, B, C },
    terms: [{ id, label, regions }]
  },
  placements: {          // Map of regionKey → termId (or null)
    A: null, B: null, C: null,
    AB: null, AC: null, BC: null, ABC: null
  },
  selectedTermId: null,  // Currently tapped term (in bank or on board)
  attemptsLeft: 5,       // Counts down on each Submit
  revealedCircles: [],   // e.g. ["A", "C"] — circles fully solved
  phase: "playing"       // "playing" | "won" | "lost"
}
```

---

## Component Responsibilities

### `useGameState.js`
- Owns all game state
- Exposes:
  - `selectTerm(termId)` — toggle selection
  - `placeTerm(regionKey)` — place selected term into region (or swap)
  - `submitGuess()` — check answer, update revealedCircles, decrement attempts, set phase
  - `resetGame()` — restart with same puzzle
  - Derived: `unplacedTerms`, `isTermPlaced(termId)`, `termInRegion(regionKey)`

### `VennDiagram.jsx`
- Renders an **SVG** Venn diagram
- 3 overlapping circles drawn with SVG `<circle>` or `<ellipse>` elements
- 7 clickable region areas — use SVG `<path>` clipping or positioned `<div>` overlays
- Each region shows: placed term label (or empty placeholder), and highlights on hover/selection
- Category label shown next to each circle: `?` if not yet revealed, real name if in `revealedCircles`

### `TermBank.jsx`
- Shows all terms NOT yet placed (or all terms, with placed ones grayed out — TBD)
- Tapping a term calls `selectTerm(termId)` and highlights it

### `VennRegion.jsx`
- Receives `regionKey`, `placedTerm`, `isSelected`, `isCorrect` (post-submit)
- On tap: if a term is selected in state, calls `placeTerm(regionKey)`
- Visual states: empty, filled, selected, correct, incorrect

### `SubmitBar.jsx`
- "Submit" button — disabled if not all 7 regions filled
- Displays attempts remaining (e.g. `● ● ● ○ ○` pip display)

---

## Venn Diagram Layout

The Venn diagram must work on a **~360px wide mobile screen** in portrait orientation.

Suggested approach:
- SVG `viewBox="0 0 300 260"` (scales to container width)
- Three circles, radius ~90, arranged in an equilateral triangle formation:
  - Circle A: top center
  - Circle B: bottom left
  - Circle C: bottom right
- Use SVG clipPath combinations to define the 7 distinct interactive regions
- Term tiles placed inside regions should be centered in the visual centroid of each region

### Region Centroids (approximate, tune in code)

| Region | cx  | cy  |
|--------|-----|-----|
| A only | 150 | 60  |
| B only | 80  | 185 |
| C only | 220 | 185 |
| AB     | 110 | 120 |
| AC     | 190 | 120 |
| BC     | 150 | 185 |
| ABC    | 150 | 140 |

---

## Answer Checking Logic (`puzzleUtils.js`)

```js
// Derive the correct region key for a term
export function getCorrectRegionKey(term) {
  return [...term.regions].sort().join("");
}

// Build a map of regionKey → correct termId from puzzle data
export function buildAnswerKey(puzzle) {
  return Object.fromEntries(
    puzzle.terms.map(t => [getCorrectRegionKey(t), t.id])
  );
}

// Check which circles are fully correct given current placements
export function getCorrectCircles(puzzle, placements) {
  const answerKey = buildAnswerKey(puzzle);
  const circles = ["A", "B", "C"];
  return circles.filter(circle => {
    // All regions that involve this circle
    const relatedRegions = Object.keys(answerKey).filter(k => k.includes(circle));
    return relatedRegions.every(rk => placements[rk] === answerKey[rk]);
  });
}
```

---

## Puzzle Data Files

### `/public/puzzles/index.json`
```json
{
  "puzzles": [
    { "id": "puzzle-001", "title": "Example Puzzle", "file": "puzzle-001.json" }
  ]
}
```

### `/public/puzzles/puzzle-001.json`
```json
{
  "id": "puzzle-001",
  "title": "Example Puzzle",
  "maxAttempts": 5,
  "categories": {
    "A": "Things that Fly",
    "B": "Things that Swim",
    "C": "Things that are Cold"
  },
  "terms": [
    { "id": "t1", "label": "Eagle",       "regions": ["A"] },
    { "id": "t2", "label": "Salmon",      "regions": ["B"] },
    { "id": "t3", "label": "Snowflake",   "regions": ["C"] },
    { "id": "t4", "label": "Flying Fish", "regions": ["A", "B"] },
    { "id": "t5", "label": "Snow Goose",  "regions": ["A", "C"] },
    { "id": "t6", "label": "Orca",        "regions": ["B", "C"] },
    { "id": "t7", "label": "Arctic Tern", "regions": ["A", "B", "C"] }
  ]
}
```

---

## Interaction Model

### Term Selection & Placement

1. **Tap unplaced term** in term bank → selects it (highlight), deselects any prior selection
2. **Tap a Venn region** while a term is selected:
   - If region is **empty** → place term there; clear selection
   - If region is **occupied** → swap: move existing term back to bank (or swap positions), place selected term
3. **Tap an already-placed term** on the board → select it (can then tap another region to move it)
4. **Tap selected term again** → deselect (cancel)

### Submit

- All 7 regions must be filled to enable Submit
- On Submit: run answer check, reveal correct circles, show feedback, decrement attempts
- If `attemptsLeft` reaches 0 and not won → transition to `"lost"` phase

---

## Responsive Design Notes

- Use `vw`-relative sizing for the SVG container so it fills mobile width
- Term bank: horizontal scrolling pill row on mobile; wrapping grid on desktop
- Minimum tap target size: 44×44px (WCAG AA)
- Portrait-first layout; landscape should still be functional (side-by-side board + term bank)
- Avoid fixed pixel heights that break on small screens (use flex/grid with `min-height`)

---

## Visual Design Direction

- Clean, playful aesthetic — think puzzle-game, not productivity tool
- Clear visual states for: empty region, filled region, selected term, correct circle, incorrect feedback
- Use color and subtle animation (CSS transitions) for state changes
- The 3 circles should each have a distinct color (muted, semi-transparent fills) — revealed when that circle is solved
- Circles start as neutral/gray outlines; fill in with color when solved

---

## Development Phases (Suggested Order for Claude Code)

1. **Scaffold** — Vite + React setup, folder structure, routing between screens
2. **Data Layer** — `usePuzzleLoader`, puzzle manifest fetch, puzzle selector screen
3. **Game State** — `useGameState` hook with all actions and derived values
4. **Venn Diagram** — SVG layout, region click targets, term placement rendering
5. **Term Bank** — unplaced terms, selection highlighting
6. **Submit Logic** — answer checking, circle reveal, attempt tracking
7. **Win / Loss Screens** — overlays with replay option
8. **Polish** — responsive tuning, animations, accessibility

---

## Open Questions (Decide Before or During Build)

| # | Question | Notes |
|---|---|---|
| 1 | How many max attempts? | PRD placeholder is 5; adjust per playtesting |
| 2 | Show placed terms in term bank (grayed) or remove them? | Grayed out = less disorienting |
| 3 | Swapping behavior — swap two board terms, or return to bank? | Return to bank is simpler |
| 4 | What feedback for incorrect regions? | Shake animation + red flash suggested |
| 5 | Should partial progress be saveable? | Out of scope for v1 |
