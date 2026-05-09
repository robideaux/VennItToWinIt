# Venn It To Win It — Build Plan

Decisions locked in before build started:
- App name: **Venn It To Win It**
- Max attempts: **5**
- Term bank: **remove terms when placed** (not grayed out)
- Swap behavior: **true swap** — selected term goes to target region; displaced term goes to where selected term came from (bank or other region)
- Incorrect feedback: **simple win/loss text** for v1
- CSS: **CSS Modules**
- Routing: **state-based** (no router library; `screen` string in App.jsx)
- SVG approach: **hit-test click handler** (not clipPaths)
- Answer checking: **permutation-aware** — all 6 remappings of categories onto the 3 physical circles are valid wins; the puzzle JSON defines grouping relationships, not fixed circle assignments

---

## Phase 1 — Scaffold

- [x] 1.0 Move spec/reference docs into `docs/` folder
- [x] 1.1 Initialize Vite + React project (manual file creation; `create-vite` incompatible with Node v21.4.0)
- [x] 1.2 Install dependencies (`npm install`)
- [x] 1.3 Create full folder structure (`src/components`, `src/hooks`, `src/utils`, `src/styles`, `public/puzzles`)
- [x] 1.4 Create `index.html` and `main.jsx` entry point
- [x] 1.5 Create `App.jsx` with state-based screen router (`"selector" | "game" | "win" | "gameover"`)
- [x] 1.6 Create `src/styles/global.css` (reset, base font, mobile viewport)
- [x] 1.7 Create placeholder files for all components and hooks (empty shells so imports don't break)
- [x] 1.8 Verify `npm run dev` starts without errors

---

## Phase 2 — Data Layer

- [x] 2.1 Create `/public/puzzles/index.json` (manifest with puzzle-001)
- [x] 2.2 Create `/public/puzzles/puzzle-001.json` (example puzzle: Things that Fly / Swim / are Cold)
- [x] 2.3 Implement `usePuzzleLoader.js` hook (fetch manifest, fetch individual puzzle)
- [x] 2.4 Build `PuzzleSelector.jsx` screen end-to-end (list puzzles, tap to load)
- [x] 2.5 Style `PuzzleSelector` (mobile-friendly list, tap targets ≥ 44px)
- [x] 2.6 Verify puzzle loads and transitions to game screen

---

## Phase 3 — Game State

- [x] 3.1 Implement `puzzleUtils.js` — permutation-aware: `REGION_KEYS`, `CIRCLE_REGIONS`, `PERMUTATIONS`, `getCorrectRegionKey`, `getCorrectCircles`
- [x] 3.2 Implement `useGameState.js` with full state shape and all actions:
  - `selectTerm(termId)` — toggle selection
  - `placeTerm(regionKey)` — place or true-swap (region↔region or bank↔region)
  - `submitGuess()` — check all 6 permutations, reveal circles, decrement attempts, update phase
  - `resetGame()` — restart with same puzzle
  - Derived: `unplacedTerms`, `isTermPlaced(termId)`, `termInRegion(regionKey)`, `allRegionsFilled`
- [ ] 3.3 Logic verified end-to-end during Phase 4 Venn diagram build

---

## Phase 4 — Venn Diagram

- [x] 4.1 Build `VennDiagram.jsx` SVG visual — 3 overlapping circles with `mix-blend-mode: multiply`, semi-transparent colored fills, neutral until circle is revealed
- [x] 4.2 Implement hit-test click handler — single SVG onClick, point-in-circle math for 1/2/3, region key = joined circle IDs
- [x] 4.3 Add **debug mode** — red dot + label at each centroid (toggle via `debugMode` prop)
- [x] 4.4 Term labels rendered inline in VennDiagram — single/two-line pill with selection ring; empty region dot
- [x] 4.5 Category labels next to each circle (`?` until revealed, real name + bold when in `revealedCircles`)
- [x] 4.6 `GameBoard.jsx` wired to `useGameState` — handles region click (place or select), phase → screen transition
- [x] 4.7 Build passes clean (47 modules); tap-to-place flow ready to verify in browser

---

## Phase 5 — Term Bank

- [x] 5.1 Build `TermBank.jsx` — unplaced terms only; returns null when empty (bank disappears)
- [x] 5.2 Build `TermTile.jsx` — pill chip; default / selected states; compact sizing
- [x] 5.3 Connected to `useGameState` via `onSelectTerm`
- [x] 5.4 Portrait: compact wrapping row; landscape: full-width column in sidebar
- [x] 5.5 SubmitBar moved into header (inline with title + attempt pips); ctrlSide = term bank only
- [x] 5.6 `getCorrectCircles` changed to lenient set-based check (group reveal); `isSolved` added for strict win condition

---

## Phase 4.5 — Layout & Diagram Usability (post-Phase 5 iteration)

Fixes applied during iterative browser testing after Phase 5:

- [x] L.1 `preserveAspectRatio="none"` on SVG — diagram stretches to fill its container (hit-test already accounts for scaling via `getBoundingClientRect`)
- [x] L.2 Removed `max-width: 480px; margin: 0 auto` from `.screen` — diagram now fills full phone width edge-to-edge
- [x] L.3 Increased circle radii 85 → 97, viewBox height 380 → 320 — larger circles, more overlap area, bigger tap targets for all 7 regions
- [x] L.4 Circle centers adjusted: 1=(160,115), 2=(105,235), 3=(215,235). All 7 centroids re-verified mathematically
- [x] L.5 Landscape term bank: sidebar width `fit-content` (was fixed 200px), tiles right-aligned and content-sized
- [x] L.6 Portrait/landscape label switching: two `<text>` elements per circle, CSS `.labelPortrait`/`.labelLandscape` toggle via `@media (orientation: landscape)`. Portrait labels sit outside viewBox (overflow:visible); landscape labels at circle sides

**⚠ Known issue after L.6:** Portrait labels at y=6 and y=338 are clipped by the parent container even with SVG `overflow:visible` — the containing `<div>` clips them. Landscape side labels are also partially clipped.

**Decision: Move circle category labels out of the SVG entirely (Option A)**

### Option A — HTML label strips ← IMPLEMENTING NEXT
Two `<div>` rows in GameBoard flanking the `vennWrap`: one above for circle 1, one below for circles 2 & 3. Labels are normal HTML, color-coded, never clip. The SVG drops all category label markup and gains the freed viewBox space.

```
PORTRAIT                        LANDSCAPE
┌──────────────────────┐        ┌──────────────────────────────┐
│ Header               │        │ Header                       │
│  [ ● Circle 1: ? ]   │        │  [ ●C1:?  ●C2:?  ●C3:? ]   │
│ ┌──────────────────┐ │        │ ┌──────────────────┐ [bank] │
│ │   SVG (pure geo) │ │        │ │   SVG (pure geo) │        │
│ └──────────────────┘ │        │ └──────────────────┘        │
│ [●C2:?]    [●C3:?]   │        └──────────────────────────────┘
│ [ Term bank ]        │
└──────────────────────┘
```

Implementation:
- [x] A.1 Strip all category label `<text>` elements (portrait + landscape) from `VennDiagram.jsx`; remove `.labelPortrait`/`.labelLandscape` CSS
- [x] A.2 Add `CircleLabels` component: colored dot + label text, wired to `revealedCircles`; always renders all 3 chips, CSS controls visibility per position/orientation
- [x] A.3 Portrait: `position="top"` strip above `vennWrap` (circle 1 only, centered); `position="bottom"` strip below (circles 2 & 3, spread)
- [x] A.4 Landscape: `bottom` strip hidden via CSS; `top` strip reveals chips 2 & 3 → all 3 in one compact row above the diagram
- [x] A.5 `vennWrap` `flex:1` still owns all remaining vertical space — SVG fills it

### Option C — Labels inside circles' exclusive regions (alternative, not doing now)
Category label lives inside the exclusive sub-region of its circle (regions `1`, `2`, `3`), small text above the term pill. Visually elegant — labels belong to the circle — but requires the exclusive regions to be large enough to hold both label + term pill without crowding. Revisit if exclusive regions ever get significantly bigger. Both options are compatible with the current hit-test geometry.

---

## Phase 4.6 — Callout Labels & Click Redesign (post-Phase 4.5 iteration)

- [x] B.1 ViewBox height 320 → 380 — circles now fully contained (bottom edge y≈332); ~48px dead space below for '23' callout
- [x] B.2 Regions '1', '2', '3', '123': term label stays inline at centroid (existing pattern)
- [x] B.3 Regions '12', '13', '23': callout style — anchor dot at centroid, leader line, label pill in dead-space anchor area
  - '12' anchor: upper-left corner (30, 133)
  - '13' anchor: upper-right corner (290, 133)
  - '23' anchor: below-center (160, 352)
- [x] B.4 Hit-test rewritten from fixed LABEL_RADIUS to pill bounding-box checks:
  - Inline regions: `hitsPill()` rectangle match at centroid (60×20-30px + 5px touch margin)
  - Callout placed: anchor dot (r=8) OR `hitsPill()` at dead-space anchor
  - Empty callout dead-space: fixed rect check so user can place by clicking where label will appear
  - Geometric hit-test: unchanged fallback
- [x] B.5 Source/target visual states:
  - Selected term (source): yellow pill border + `#fff9db` fill + amber text; anchor dot + leader line turn yellow
  - Available regions (target): purple pill border + `#f3f0ff` fill + purple text; hint ring shown for empty targets
  - Pill backgrounds are solid (not transparent) so leader lines are always covered
- [x] B.6 TermTile selection color changed from purple to yellow (`#fcc419`) to match in-diagram source highlight

---

## Phase 6 — Submit Logic

- [x] 6.1 Build `SubmitBar.jsx` — Submit button (disabled until all 7 regions filled) + pip display for attempts remaining
- [x] 6.2 Wire Submit button to `submitGuess()` in game state
- [x] 6.3 Reveal correct circle labels after submit (update VennDiagram to show real name when in `revealedCircles`)
- [~] 6.4 ~~Per-region correct/incorrect feedback~~ — skipped for v1; circle-reveal already gives meaningful feedback
- [x] 6.5 Verify win condition triggers correctly (all 3 circles revealed)
- [x] 6.6 Verify loss condition triggers correctly (attempts reach 0)

---

## Phase 7 — Win / Game Over Screens

- [x] 7.1 Build `WinScreen.jsx` — "You got it!" + puzzle title + "Play Another" button
- [x] 7.2 Build `GameOverScreen.jsx` — "Out of attempts" + solution reveal (3 category groups with their terms) + "Try Again" / "Choose Different Puzzle"
- [x] 7.3 Wire both screens into `App.jsx` screen router (was already wired; added `puzzle` prop to WinScreen)
- [ ] 7.4 Verify transitions: win → WinScreen, loss → GameOverScreen, retry → reset, new puzzle → selector

---

## Phase 8 — Polish

- [ ] 8.1 Responsive tuning — portrait + landscape, no fixed heights that break on small screens
- [ ] 8.2 CSS transitions — subtle animations for term placement, circle reveal
- [ ] 8.3 Accessibility audit — all tap targets ≥ 44px, readable contrast
- [ ] 8.4 Add a second puzzle (`puzzle-002.json`) to test selector with real data
- [ ] 8.5 Final mobile test in Chrome DevTools (iPhone SE emulation)
- [ ] 8.6 Remove debug mode toggle (or gate it behind a URL param)

---

## Notes

- After Phase 1 and each subsequent phase, discuss before moving on
- SVG centroid coordinates start from spec values; tune during Phase 4 debug mode
- `maxAttempts` lives in puzzle JSON — easy to change per puzzle without touching code
- Puzzle JSON files in `/public/puzzles/` — adding new puzzles never requires code changes

---

## Future Ideas (Parking Lot)

### Circle Label Placement — Corner-Anchored

Current `CircleLabels` strips (above/below the SVG) feel disconnected from the circles when a label reveals.

Proposed: place labels in the corners of the diagram area, close to their circle:
- **Circle 2 (bottom-left):** bottom-left corner, multiline if needed
- **Circle 3 (bottom-right):** bottom-right corner, multiline if needed
- **Circle 1 (top):** centered at top, or top-left/top-right corner if multiline

This keeps the label visually anchored to its circle rather than floating in a separate strip. Implementation likely means absolutely-positioned HTML elements overlaying the `vennWrap` container, or repositioning `CircleLabels` chips into corner slots around the SVG.

---

### Puzzle Pre-Selection via Query Parameter

Allow a specific puzzle to be loaded directly via a URL query parameter, skipping the selector screen:

```
https://vennittowinit.netlify.app/?puzzle=puzzle-001
```

- On app load, `App.jsx` reads `URLSearchParams` for a `puzzle` key
- If a valid puzzle ID is found, skip the selector and load that puzzle directly into the game screen
- If the ID is invalid or not found, fall back to the selector as normal
- Makes it easy to share a direct link to a specific puzzle

No routing infrastructure changes needed — the existing state-based screen model handles this naturally.

---

### Easy / Demo Mode
- Add an optional game mode where category labels are revealed upfront (shown on the circles from the start)
- In this mode the answer IS fixed — only one correct arrangement, since the circles are labeled
- Could be toggled via a puzzle JSON flag (e.g. `"mode": "easy"`) or a separate UI toggle
- Useful for tutorials, demos, or younger players

### Partial Credit / Group Locking
- When a player submits and one full group is correctly identified (the right 4 terms all within the same circle, even if sub-regions are wrong), reward that:
  - Reveal that circle's category label
  - Lock those 4 terms to that circle — they can still move between the circle's 4 sub-regions, but cannot leave it
- **Interaction rules (per user spec):**
  - Clicking a term inside a locked circle → only that circle's 4 sub-regions are valid drop targets
  - Clicking a term outside any locked circle → valid drop targets exclude all sub-regions of locked circles
  - Swap mechanic: a locked term displaced by a swap must land within its own locked circle; if no valid sub-region is available, the swap is blocked
- **Visual communication TBD:** how to show a circle is locked (border? badge? greyed swap targets?)
- Fresh-evaluation submit (Option B) is already in place — locking makes reveals sticky again, but intentionally via lock rather than by accident
