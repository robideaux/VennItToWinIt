# Venn It To Win It — Technical Specification

> **Scope of this document.** This describes the architecture **as built**, updated 2026-09-15 against commit `7d0a2f6`. For build history, phase checklists and the decisions log, see [PLAN.md](PLAN.md) — that file, not this one, is the running record of what is done and what is next.

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
│       ├── index.json           # Puzzle manifest (id, title, file, year, sequence)
│       ├── 2026_001.json        # Individual puzzle definitions
│       ├── 2026_002.json
│       └── *.json               # 34 legacy-format puzzles, live as test content
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component, screen routing, progress recording
│   ├── components/
│   │   ├── HomeScreen.jsx       # Screen: landing page (Play Latest / All Venns / Settings / How To Play)
│   │   ├── PuzzleSelector.jsx   # Screen: choose a puzzle ("All Venns…")
│   │   ├── SettingsScreen.jsx   # Screen: theme + audio preferences
│   │   ├── HowToPlayScreen.jsx  # Screen: static rules explainer
│   │   ├── GameBoard.jsx        # Screen: main game
│   │   ├── VennDiagram.jsx      # SVG Venn diagram; hit-test, term labels, shuffle overlay
│   │   ├── CircleLabels.jsx     # Per-circle chip — doubles as that circle's SUBMIT button
│   │   ├── WinScreen.jsx        # Win state
│   │   └── GameOverScreen.jsx   # Loss state + animated solution reveal
│   ├── hooks/
│   │   ├── useGameState.js      # Core game logic hook
│   │   ├── usePuzzleLoader.js   # Fetch & parse puzzle JSON
│   │   ├── useProgress.js       # localStorage read/write for "vennit_progress"
│   │   ├── useShuffleAnimation.js  # Animates the game-start shuffle
│   │   └── useRevealAnimation.js   # Animates the game-over solution reveal
│   ├── utils/
│   │   ├── puzzleUtils.js       # Region key logic, answer checking, reveal/swap helpers
│   │   └── puzzleSchedule.js    # ISO-week gating, display dates, unlocked-puzzle fetch
│   └── styles/
│       ├── global.css
│       ├── colors.js            # Centralized circle colors (shared by SVG + chips)
│       ├── shared.module.css    # vennWrap sizing shared across game/win/gameover
│       └── *.module.css         # Per-component styles
├── index.html
├── vite.config.js
└── package.json
```

**Components named in earlier drafts that no longer exist:** `TermBank.jsx` and `TermTile.jsx` (removed in `ba20432` — see below), `SubmitBar.jsx` (removed in Phase 14, per-circle submit), and `VennRegion.jsx` (never implemented; `VennDiagram` renders and hit-tests all 7 regions itself).

---

## Data Model

### Region Key Convention — two separate key spaces

This is the single most important thing to understand about the data model, and it is what makes permutation-aware answer checking possible. There are **two** kinds of region key, and they are deliberately never conflated:

**1. Category keys — `A` / `B` / `C`.** Used only in puzzle JSON. They describe *grouping relationships* between terms, not positions on screen. A term's category region key is its `regions` array sorted and joined: `["B","A"] → "AB"`.

| Key | Meaning |
|---|---|
| `"A"` / `"B"` / `"C"` | Category A / B / C only |
| `"AB"` / `"AC"` / `"BC"` | Both those categories, not the third |
| `"ABC"` | All three categories |

**2. Physical circle keys — `1` / `2` / `3`.** Used everywhere in runtime state. Circle 1 = top, 2 = bottom-left, 3 = bottom-right. `REGION_KEYS` in [`puzzleUtils.js`](../src/utils/puzzleUtils.js) is the canonical list:

```js
['1', '2', '3', '12', '13', '23', '123']
```

`CIRCLE_REGIONS` maps each circle to the 4 regions it owns — e.g. circle `'1'` owns `['1','12','13','123']`. This is what per-circle submit checks against.

**Why the split:** the puzzle JSON never says which category belongs on which physical circle. Any of the 6 assignments of `{A,B,C}` onto `{1,2,3}` is a valid solution, so `placements` is keyed by circle and the category mapping is discovered at check time. Keeping the two key spaces distinct is what allows that.

### Game State Shape

The puzzle itself is passed into `useGameState(puzzle)` and is not held in its state. State is:

```js
{
  placements: {          // Map of PHYSICAL region key → termId
    '1': 't4', '2': 't7', '3': 't1',
    '12': 't3', '13': 't6', '23': 't2', '123': 't5'
  },
  selectedTermId: null,  // Currently tapped term (always already on the board)
  attemptsLeft: 5,       // Shared pool; every per-circle submit costs 1
  revealedCircles: [],   // [{ circleId: '1', category: 'B', name: 'Things that Swim' }]
  lastSubmitResult: null,// { circleId, correct } — feedback for the most recent submit
  phase: 'playing',      // 'playing' | 'won' | 'lost'
  gameKey: 0,            // Bumped by resetGame() to force a fresh shuffle animation
}
```

Two things differ from earlier drafts:

- **`placements` is never null in practice.** `randomizePlacements` seeds all 7 regions on mount, re-rolling until no circle is accidentally already correct. There is no empty/unplaced state — see the term bank note below.
- **`revealedCircles` holds objects, not category strings.** Each entry records which *physical* circle was solved and which category landed there — exactly the mapping that group locking (`getValidTargets`) and the game-over reveal (`buildRevealState`) need.

---

## Component Responsibilities

### `useGameState.js`
- Owns all game state
- Actions:
  - `selectTerm(termId)` — toggle selection
  - `placeTerm(regionKey)` — true-swap the selected term into the target region; rejects the move outright if the target isn't in `getValidTargets` (group locking)
  - `submitCircle(circleId)` — check **only that circle**, decrement the shared `attemptsLeft`, reveal + lock on success, recompute phase
  - `resetGame()` — restart same puzzle with a fresh shuffle
- Derived: `unplacedTerms`, `isTermPlaced(termId)`, `termInRegion(regionKey)`, `isCircleFilled(circleId)`, `validTargetsFor(termId)`

`submitCircle` is guarded against double-submitting an already-revealed circle, so a circle can never cost two attempts.

### `VennDiagram.jsx`
- Renders the **SVG** diagram: 3 overlapping circles, fills using `mix-blend-mode: multiply`, plus a separate always-colored stroke circle layered on top (avoids blend artifacts at overlap edges)
- **One `onClick` on the SVG root** performs a layered hit-test — no per-region elements, no clipPaths. Order: inline term pills → callout anchor dots and pills → empty callout zones → geometric point-in-circle fallback. See the layout section below.
- Renders each region's term: inline pill at the centroid for regions `1`/`2`/`3`/`123`; anchor dot + leader line + pill in dead space for the lens-shaped `12`/`13`/`23`
- Visual states per term: source (selected, yellow), valid target (purple), inactive, plus a hint ring on empty valid targets
- Hosts `ShuffleOverlay`, the animated swap used by both the game-start shuffle and the game-over reveal

### `CircleLabels.jsx`
- One absolutely-positioned chip per circle, overlaid on the `vennWrap` next to its circle
- **Unrevealed → it is a `<button>`:** reads "SUBMIT / Group", bordered in that circle's color, and firing it submits that circle. Enabled only when that circle's own 4 regions are filled.
- **Revealed → plain chip:** shows the real category name and stops being a submit target. Outline-vs-filled is the only "solved" signal.
- `pointer-events: auto` on the button variant so taps are captured rather than falling through to the SVG hit-test underneath

Attempts pips live in the `GameBoard` header (right side), not next to any submit control.

---

## Venn Diagram Layout

As built (values live at the top of [`VennDiagram.jsx`](../src/components/VennDiagram.jsx)):

- SVG `viewBox="0 0 320 380"`, `preserveAspectRatio="none"` — the diagram stretches to fill its container; the hit-test compensates via `getBoundingClientRect`
- Three circles, **radius 97**: circle `1` at (160, 115) top, `2` at (105, 235) bottom-left, `3` at (215, 235) bottom-right
- **No clipPaths.** The 7 regions are not elements at all — a single SVG `onClick` resolves the region mathematically (see `VennDiagram.jsx` above)
- `vennWrap` caps its size to keep the stretch reasonable on large screens — portrait `max-height` and landscape `max-width`, cap multiplier 160, defined once in `shared.module.css` and shared by the game, win and game-over screens

### Region Centroids (as shipped)

| Region | cx  | cy  | Rendering |
|--------|-----|-----|---|
| `1`   | 160 | 70  | Inline pill |
| `2`   | 55  | 250 | Inline pill |
| `3`   | 265 | 250 | Inline pill |
| `12`  | 120 | 175 | Callout |
| `13`  | 200 | 175 | Callout |
| `23`  | 160 | 250 | Callout |
| `123` | 160 | 195 | Inline pill |

The three two-circle overlaps are thin lens shapes that can't hold a readable pill, so they render **callout-style**: a small anchor dot at the centroid, a leader line, and the label pill parked in dead space at `CALLOUT_ANCHORS` — `12` → (38, 133), `13` → (282, 133), `23` → (160, 340). Both the dot and the parked pill are tappable, and the empty dead-space zone is tappable too, so a term can be placed before any label is there.

---

## Answer Checking Logic (`puzzleUtils.js`)

Read [`puzzleUtils.js`](../src/utils/puzzleUtils.js) for the real implementations — it is short and commented. The exported surface:

| Function | Role |
|---|---|
| `getCorrectCircles(puzzle, placements)` | **Lenient check, drives per-circle submit.** A circle is correct when the *set* of 4 terms inside it matches some category's term set — the sub-region each term occupies doesn't matter. Returns `[{ circleId, category, name }]`. |
| `getValidTargets(term, lockedCircles)` | **Group locking.** A region is a valid target iff, for every locked circle, "term belongs to that category" matches "region is inside that circle". Keeps locked terms in their circle and everyone else out. |
| `buildRevealState(puzzle, lockedCircles)` | Game-over solution. Circles the player already locked keep their category pinned to that same physical circle; remaining categories fill the remaining circles. |
| `computeSwapSequence(from, to)` | Decomposes one full placement map into another as a series of pairwise swaps, so the reveal animates through the same `ShuffleOverlay` as the game-start shuffle. |
| `isSolved(puzzle, placements)` | **Strict** check — all 7 regions exactly right under any of the 6 permutations. |

**Why lenient and strict both exist:** the circle reveal is deliberately forgiving (get the right 4 terms into a circle and it unlocks, even if they're scrambled within it), while a win requires the whole board. In practice the two converge — revealing all 3 circles forces every term into its correct region, because circle membership uniquely determines each of the 7 regions.

That convergence means **`isSolved` is currently dead code**: `useGameState` sets `phase: 'won'` on `revealedCircles.length === 3` and never calls it. `PERMUTATIONS`, `buildCategoryAnswerKey` and `physicalToCategory` exist only to support it. Retained as an explicit statement of the win condition and as a safety net if the lenient rule is ever loosened further — but nothing executes it today.

---

## Puzzle Data Files

Manifest entries carry `year` and `sequence` so release gating and sorting need no per-file loads. `puzzleSchedule.js` unlocks a puzzle when `sequence ≤` the current ISO week within the same year, or when `year <` the current year.

### `/public/puzzles/index.json`
```json
{
  "puzzles": [
    { "id": "2026_001", "year": 2026, "sequence": 1, "title": "Fly, Swim, or Cold?", "file": "2026_001.json" }
  ]
}
```

### `/public/puzzles/2026_001.json`
```json
{
  "id": "2026_001",
  "year": 2026,
  "sequence": 1,
  "title": "Fly, Swim, or Cold?",
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

The board starts **fully populated** — all 7 terms shuffled into the 7 regions. There is no bank and no empty state, so every interaction is a rearrangement.

1. **Tap a term on the board** → selects it (yellow); valid target regions highlight purple, invalid ones dim
2. **Tap another region** → **true swap**: the selected term moves there and that region's occupant moves back to where the selected term came from
3. **Tap the selected term again** → deselect
4. Targets excluded by group locking are inert — tapping one does nothing rather than failing silently mid-swap

### Submit

- **Each circle submits independently**, via its own label chip. A chip is enabled once that circle's 4 regions are filled — effectively always, given the pre-filled board.
- Every per-circle submit costs **1 attempt from the shared pool**, the same price the old global submit charged. Submitting an already-revealed circle is a no-op and costs nothing.
- A correct circle reveals its category name and **locks** its 4 terms into that circle: they can still be rearranged among its own 4 sub-regions, but can never leave.
- Win: all 3 circles revealed. Loss: `attemptsLeft` hits 0 first → `'lost'` phase.

**Why per-circle:** with one global Submit, a player could fill the board while only ever reasoning about a single circle, then win everything on one accidental submit — never deliberately committing to the other two groups. Per-circle submit forces an explicit commitment per group.

---

## Responsive Design Notes

- The diagram fills its container in both orientations, capped by `vennWrap`'s portrait `max-height` / landscape `max-width` so circles never stretch absurdly on large screens
- Minimum tap target size: 44×44px (WCAG AA) — audited, Lighthouse accessibility 100
- Portrait-first; landscape is a first-class layout, not a fallback. Circle label chips reposition per orientation via `@media (orientation: landscape)`
- Avoid fixed pixel heights that break on small screens (use flex/grid with `min-height`)
- Screens nest as `.screen` → `.body` (`flex: 1; min-height: 0`) → `.vennWrap`; the header always stays a top bar in both orientations. Win and Game Over must match GameBoard's nesting depth or `vennWrap` mis-sizes.

---

## Visual Design Direction

- Clean, playful aesthetic — think puzzle-game, not productivity tool
- Clear visual states for: filled region, selected term (source), valid target, inactive target, revealed circle
- Use color and subtle animation (CSS transitions) for state changes
- Each circle owns a distinct color, defined once in `src/styles/colors.js` and shared by the SVG stroke, the fill and the label chip border
- **Circles are colored from turn 1**, not on reveal. Color is taught as "this circle = this group" before any guess: colored stroke and colored chip border from the start, with unrevealed chips reading "Group N" in italic. Submitting adds the fill and the real category name — outline vs. filled is the solved signal.
- Both light and dark themes are supported via CSS custom properties, following `prefers-color-scheme` with a manual override in Settings (`data-theme` on `<html>`)

---

## Development Phases

The original 8-phase sketch has been superseded. The project now tracks 15 phases plus several layout-redesign passes — **see [PLAN.md](PLAN.md)** for the live checklist, decisions log and parking lot.

---

## Open Questions — all resolved

| # | Question | Resolution |
|---|---|---|
| 1 | How many max attempts? | **5**, read from each puzzle's `maxAttempts`, so it's tunable per puzzle without code changes |
| 2 | Show placed terms in term bank (grayed) or remove them? | **Moot** — the bank was removed entirely (`ba20432`). The board starts fully shuffled and placed. |
| 3 | Swapping behavior — swap two board terms, or return to bank? | **True swap** between regions. With no bank there is nowhere to return to. |
| 4 | What feedback for incorrect regions? | **Deferred.** No per-region right/wrong marking — circle reveal is the feedback. `lastSubmitResult` is in state for a future incorrect-submit cue (Phase 9, not started). |
| 5 | Should partial progress be saveable? | **Partly.** Per-puzzle *results* persist to `localStorage` (`vennit_progress`, via `useProgress`), as do settings. An in-progress board is still not resumable. |
