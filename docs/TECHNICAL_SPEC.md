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
│   │   ├── HomeScreen.jsx       # Screen: landing page (Play Latest / All Venns / Settings / How To Play / Edit)
│   │   ├── PuzzleSelector.jsx   # Screen: choose a puzzle — All Venns / My Venns / Shared With Me
│   │   ├── MyVennsScreen.jsx    # Screen: your own puzzles; new, edit, delete
│   │   ├── EditorScreen.jsx     # Screen: the puzzle editor, with test-play
│   │   ├── SettingsScreen.jsx   # Screen: theme and vibration (sound is a disabled placeholder)
│   │   ├── HowToPlayScreen.jsx  # Screen: static rules explainer
│   │   ├── GameBoard.jsx        # Screen: main game
│   │   ├── VennDiagram.jsx      # Geometry-only SVG shell: the three circles and a bare-diagram hit-test
│   │   ├── PlayOverlay.jsx      # HTML overlay for play: term pills, callout lines, target rings
│   │   ├── EditOverlay.jsx      # HTML overlay for the editor: the same coordinates, but inputs
│   │   ├── TermPill.jsx         # One term, as HTML; text fitted by utils/fitText.js
│   │   ├── CircleLabels.jsx     # Per-circle chip — doubles as that circle's SUBMIT button
│   │   ├── WinScreen.jsx        # Win state
│   │   └── GameOverScreen.jsx   # Loss state + animated solution reveal
│   ├── hooks/
│   │   ├── useGameState.js      # Core game logic hook
│   │   ├── usePuzzleLoader.js   # Fetch & parse puzzle JSON
│   │   ├── useProgress.js       # localStorage for "vennit_progress"; keeps the FIRST result per puzzle
│   │   ├── useCustomPuzzles.js  # localStorage store of your own and received puzzles
│   │   ├── useShare.js          # Share action, clipboard fallback and its feedback
│   │   ├── useCollapsedSections.js  # Remembers which selector sections are collapsed
│   │   ├── useShuffleAnimation.js  # Game-start shuffle, plus the category-colour flash
│   │   └── useRevealAnimation.js   # Animates the game-over solution reveal
│   ├── copy/
│   │   └── oneShot.js           # All One Shot wording, tunable without touching logic
│   ├── utils/
│   │   ├── puzzleUtils.js       # Region key logic, answer checking, reveal/swap helpers
│   │   ├── puzzleSchedule.js    # ISO-week gating, display dates, unlocked-puzzle fetch
│   │   ├── vennGeometry.js      # Circle, centroid and callout coordinates; shared by every overlay
│   │   ├── fitText.js           # Line-breaking and shrink-to-fit for term labels
│   │   ├── gameRules.js         # MISSES (5) and the One Shot cost
│   │   ├── validatePuzzle.js    # complete | incomplete | invalid, and the editor's field flags
│   │   ├── puzzleDraft.js       # Puzzle <-> the editor's seven fixed slots
│   │   ├── customPuzzles.js     # Custom-puzzle records, ids, content key, dedupe
│   │   ├── shareLink.js         # ?p= (versioned, compressed) and ?puzzle= links; clipboard text
│   │   ├── resultBlock.js       # The shareable result row
│   │   ├── haptics.js           # Vibration cues; support detection; the cue for each submit
│   │   ├── settings.js          # "vennit_settings": theme and vibration
│   │   └── theme.js             # Applies the theme at boot; keeps browser chrome in step
│   └── styles/
│       ├── global.css           # Theme variables, including the --pick-* and --target-* highlights
│       ├── colors.js            # Category colours (A/B/C) and emoji; keyed by CATEGORY, not circle
│       ├── shared.module.css    # vennWrap sizing shared across game/win/gameover
│       └── *.module.css         # Per-component styles
├── scripts/
│   ├── checks/                  # Standalone Node checks against the real modules: run-all.mjs
│   └── make-og-image.mjs        # Draws public/og-image.png, the link preview card
├── index.html                   # Includes the Open Graph / Twitter preview-card tags
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
  missesLeft: 5,         // Shared pool; ONLY a wrong submit (or a missed One Shot) spends one
  revealedCircles: [],   // [{ circleId: '1', category: 'B', name: 'Things that Swim' }]
  lastSubmitResult: null,// { circleId, correct } — the most recent circle submit
  oneShotUsed: false,    // One Shot is spent once pressed, hit or miss
  lastOneShot: null,     // { correctCount, won } — all a missed One Shot reveals
  submissions: [],       // Ordered log of every submit: feeds the share row, the haptic cue and saved progress
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
  - `submitCircle(circleId)` — check **only that circle**; reveal + lock on success (free), or spend a miss on failure; recompute phase
  - `submitAll()` — **One Shot**: opening move only. A clean sweep wins outright at no cost; otherwise it spends one miss and records only `lastOneShot.correctCount`, revealing and locking nothing
  - `resetGame()` — restart same puzzle with a fresh shuffle
- Derived: `unplacedTerms`, `isTermPlaced(termId)`, `termInRegion(regionKey)`, `isCircleFilled(circleId)`, `validTargetsFor(termId)`, `canOneShot`

`submitCircle` is guarded against double-submitting an already-revealed circle, so a circle can never cost a miss twice. The reducer is pure and does no I/O: haptics, saved progress and navigation all happen in `GameBoard` and `App`, reacting to the state it produces.

### `VennDiagram.jsx`
- A **geometry-only SVG shell** (Phase 16): the three circles — a multiply-blended fill and a stroke — and nothing else. It has no idea what a term is
- **Colour follows the category.** Each circle's fill and stroke come from the category solved into it (`CATEGORY_COLORS`), neutral grey until then. During the opening shuffle `flash` overrides this with colours cycling across the circles. Colours are set through `style`, with a CSS transition, so a circle fades into its colour when solved
- One `onClick` resolves **bare diagram only** (point-in-circle against `CIRCLES`); term pills and callout slots handle their own clicks
- Everything term-related is passed in as children — the overlay. `PlayOverlay` draws the terms as HTML `TermPill`s at the coordinates in `vennGeometry.js`, plus the callout lines and dots for the lens-shaped regions `12`/`13`/`23`, and the dashed ring on empty target regions. `EditOverlay` is the same geometry with inputs
- Highlight states per term are **shape and contrast, not hue** (`TermPill`, theme variables `--pick-*` / `--target-*`): a picked-up term inverts to a dark pill and lifts; valid targets get a heavy dashed edge; invalid ones dim. Any highlight hue lands near one of the three category colours under some colour-vision type
- The animated swap used by the game-start shuffle and the game-over reveal runs in `PlayOverlay`, driven by `useShuffleAnimation` / `useRevealAnimation`

### `CircleLabels.jsx`
- One absolutely-positioned chip per circle, overlaid on the `vennWrap` next to its circle
- **Unrevealed → it is a `<button>`:** reads "SUBMIT / Group" with a neutral border, and firing it submits that circle. Enabled only when that circle's own 4 regions are filled. Its accessible name is by position ("Submit the top circle"), because there is no colour to name it by yet.
- **Revealed → plain chip:** shows the real category name, bordered in that category's colour. In dark mode the chip fills with the colour and uses that category's `ink` for its text (dark on the light green).
- `pointer-events: auto` on the button variant so taps are captured rather than falling through to the SVG hit-test underneath

Miss pips and the One Shot button live in the `GameBoard` header (right side), not next to any submit control.

---

## Venn Diagram Layout

As built. Every coordinate lives in [`vennGeometry.js`](../src/utils/vennGeometry.js) and is read by the SVG shell and by both overlays, so play and the editor cannot drift apart:

- SVG `viewBox="0 0 320 380"`, `preserveAspectRatio="none"` — the diagram stretches to fill its container; overlay positions are percentages of the same box, and sizes use `UNIT_CSS` (one viewBox unit as a CSS length, taking the smaller axis) so a pill is never stretched out of shape
- Three circles, **radius 97**: circle `1` at (160, 115) top, `2` at (105, 235) bottom-left, `3` at (215, 235) bottom-right
- **No clipPaths.** The 7 regions are not elements at all — a bare-diagram click is resolved mathematically in `VennDiagram.jsx`, and pills and callout slots take their own clicks
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

1. **Tap a term on the board** → picks it up (a dark, lifted pill); valid target regions get a dashed outline, invalid ones dim
2. **Tap another region** → **true swap**: the selected term moves there and that region's occupant moves back to where the selected term came from
3. **Tap the selected term again, or bare diagram** → put it back down
4. Targets excluded by group locking are inert — tapping one does nothing and keeps the term in hand, with no haptic cue (the dimming already says it)

### Haptics

`haptics.js`. The Vibration API takes only durations (one number, or alternating vibrate/pause), with no intensity control, so the cues differ in length and rhythm only. iOS Safari lacks the API entirely; desktop browsers may expose it and do nothing, so support means the API **and** a coarse primary pointer. Off by default, switched on in Settings (disabled where unsupported).

| Moment | Cue (ms) |
|---|---|
| Pick up / put down | `10` / `15` |
| Miss — a wrong circle, or a One Shot that did not sweep | `60 · 50 · 60` |
| Circle solved | `150` |
| Win | `60 · 40 · 60 · 40 · 60 · 40 · 220` |
| Loss | three `100` pulses |

`cueForSubmit(last, phase)` picks the cue after a submit, and the end of the game outranks the submit that caused it. Pulses stay at 10 ms or more, since many motors cannot render less.

### Submit

- **Each circle submits independently**, via its own label chip. A chip is enabled once that circle's 4 regions are filled — effectively always, given the pre-filled board.
- A **correct** circle submit is free; a **wrong** one spends 1 of the 5 misses. Submitting an already-revealed circle is a no-op and costs nothing.
- A correct circle reveals its category name and **locks** its 4 terms into that circle: they can still be rearranged among its own 4 sub-regions, but can never leave.
- **One Shot** (`submitAll`): a whole-board check, available only while `submissions` is empty. A clean sweep wins at no cost; otherwise one miss is spent and only the count is kept.
- Win: all 3 circles revealed. Loss: `missesLeft` hits 0 first → `'lost'` phase. Counting misses rather than submits means the game ends exactly when it becomes unwinnable.

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
- Clear visual states for: filled region, picked-up term, valid target, inactive target, revealed circle
- Use color and subtle animation (CSS transitions) for state changes
- **Colour belongs to the category, not the circle** (Phase 20). Category `A`, `B` and `C` are red, green and violet (`CATEGORY_COLORS` in `src/styles/colors.js`), the same for every player wherever the category lands. Circles and chips start **neutral grey** and take their category's colour only when solved; the opening shuffle flashes the three colours across them before settling grey, to show colour is hidden too. This is what lets the shared result row use coloured emoji again.
- The palette was chosen by simulation, not by eye: each colour-vision type (Machado 2009 matrices) scored by CIEDE2000 distance over every pair, maximising the worst pair. Every pair stays at 17 or more in every mode, where the original red/green/blue fell to 2. Highlights use shape and contrast instead of hue for the same reason.
- Both light and dark themes are supported via CSS custom properties, following `prefers-color-scheme` with a manual override in Settings (`data-theme` on `<html>`)

---

## Development Phases

The original 8-phase sketch has been superseded. The project now tracks 21 phases plus several layout-redesign passes — **see [PLAN.md](PLAN.md)** for the live checklist, decisions log and parking lot.

---

## Open Questions — all resolved

| # | Question | Resolution |
|---|---|---|
| 1 | How many max attempts? | **5 misses**, fixed for every puzzle (`MISSES` in `gameRules.js`) so scores compare. It started as a per-puzzle `maxAttempts`, then became a fixed attempts budget (Phase 18), then counted misses only (Phase 20). Old files still carry `maxAttempts`; it is ignored |
| 2 | Show placed terms in term bank (grayed) or remove them? | **Moot** — the bank was removed entirely (`ba20432`). The board starts fully shuffled and placed. |
| 3 | Swapping behavior — swap two board terms, or return to bank? | **True swap** between regions. With no bank there is nowhere to return to. |
| 4 | What feedback for incorrect regions? | **None per region** — circle reveal is the feedback. A wrong submit spends a miss pip and, where enabled, gives a double-buzz haptic. Visual submit feedback (shake, transitions) is Phase 9, partly done. |
| 5 | Should partial progress be saveable? | **Partly.** Per-puzzle *results* persist to `localStorage` (`vennit_progress`, via `useProgress`), as do settings. An in-progress board is still not resumable. |
