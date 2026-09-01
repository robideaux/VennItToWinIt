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

## Layout Redesign — TermBank / SubmitBar Co-location

**Decision:** Move SubmitBar out of `.header` and into `.ctrlSide`, co-located with the TermBank.
Reverses the Phase 5.5 decision (SubmitBar in header) in favor of a single unified slot at the bottom (portrait) or right panel (landscape).

**Logic:**
- `unplacedTerms.length > 0` → show TermBank in ctrlSide
- `unplacedTerms.length === 0` → show SubmitBar in ctrlSide (bank slot, not header)
- ctrlSide is always rendered; only its child swaps
- After a failed submit all terms remain placed → bank stays empty → SubmitBar stays visible with decremented pips ✓

**Portrait behavior:**
- ctrlSide (bottom strip, `flex-shrink:0`) shows TermBank OR SubmitBar horizontally (pips left, Submit right)
- Swapping bank→submit actually *shrinks* ctrlSide (~90px → ~56px), giving the diagram more room right at submission time
- Header becomes title-only — shorter, cleaner

**Landscape behavior:**
- ctrlSide (200px right panel, `height:100dvh`, `flex-direction:column`) shows TermBank OR SubmitBar stacked vertically: Submit button centered, pips below
- Header becomes title-only — frees vertical height for the Venn diagram (removes ~44px header overhead from SVG sizing)

### Tasks
- [x] R.1 `GameBoard.jsx` — remove `<SubmitBar>` from `.header`; header renders title only
- [x] R.2 `GameBoard.jsx` — ctrlSide always rendered; renders `<TermBank>` when `unplacedTerms.length > 0`, else `<SubmitBar>`
- [x] R.3 `SubmitBar.module.css` — add `@media (orientation: landscape)` block: `flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 16px; padding: 16px`; submit button width auto-sized; pips row stays horizontal and centered
- [x] R.4 `GameBoard.module.css` — landscape `.ctrlSide` already has `display:flex; flex-direction:column`; no changes needed
- [x] R.5 Verify portrait: bank→submit swap is visually clean; diagram gets extra height on swap
- [x] R.6 Verify landscape: Submit + pips centered in 200px panel; header title-only; diagram taller

---

## Layout Redesign — Circle Label Repositioning

**Decision:** Remove the top and bottom CircleLabel strip rows from the GameBoard layout entirely. Replace with absolutely-positioned chips overlaid on the vennWrap, placing each label visually adjacent to its circle.

**Implementation:** `vennWrap` gets `position: relative`. CircleLabel chips are `position: absolute` children using percentage-based coordinates derived from the SVG viewBox (320×380) geometry.

**Portrait placement** (SVG fills full vennWrap width — no horizontal dead space):
| Chip | CSS | Rationale |
|---|---|---|
| Circle 1 | `top: 4px; left: 50%; transform: translateX(-50%)` | Circle 1 top edge is at y≈5%; chip sits just above it, centered |
| Circle 2 | `bottom: 4px; left: 4px` | Circle 2 left edge at x≈2.5%; bottom-left corner is adjacent |
| Circle 3 | `bottom: 4px; right: 4px` | Circle 3 right edge at x≈97.5%; bottom-right corner is adjacent |

Circles 2 & 3 chips sit below the `'23'` callout anchor (y=352/380≈93%) — `bottom:0` is definitively below it.

**Landscape placement** (SVG is height-constrained and centered; ~87px dead zone on each side):
| Chip | CSS | Rationale |
|---|---|---|
| Circle 1 | `top: 4px; left: 25%; transform: translateX(-50%)` | Circle 1 center = 50% of vennWrap; midpoint between left edge and circle center = 25%. Long labels may spill into circle — acceptable. |
| Circle 2 | `bottom: 4px; left: 4px` | Circle 2 left edge at x=8/320 of viewBox — nearly at SVG left boundary; chip is adjacent |
| Circle 3 | `bottom: 4px; right: 4px` | Circle 3 right edge at x=312/320 — nearly at SVG right boundary; chip is adjacent |

Only Circle 1's `left` value differs between modes (`50%` portrait → `25%` landscape).

**Payoff:** Removes ~72px of strip overhead (two 36px rows) from the portrait layout; removes the top strip row (~36px) from landscape. That space goes entirely to the vennWrap/diagram.

### Tasks
- [x] C.1 `GameBoard.jsx` — remove both `<CircleLabels position="top">` and `<CircleLabels position="bottom">` from the vennSide column
- [x] C.2 `GameBoard.module.css` — add `position: relative` to `.vennWrap`; remove any strip-related styles
- [x] C.3 `CircleLabels.jsx` — change rendering model: accept a `circleId` prop (1, 2, or 3) and render a single chip; remove position/orientation strip logic
- [x] C.4 `CircleLabels.module.css` — replace strip layout with `position: absolute` chip styles; portrait and landscape coordinates per table above
- [x] C.5 `GameBoard.jsx` — render three `<CircleLabel circleId={n}>` chips inside `.vennWrap`; same treatment applied to `WinScreen.jsx` and `GameOverScreen.jsx`
- [x] C.6 Verify chips don't intercept Venn hit-test in active diagram regions (chips have solid backgrounds and sit in front of SVG — clicks on chips should not propagate to SVG)
- [x] C.7 Remove the "Corner-Anchored" future idea note from the parking lot (now implemented)

---

## Layout Redesign — Color Language & Placeholder Labels

**Decision:** Establish a consistent color system from the very first turn. The user should be able to associate each circle with its color immediately — before any guesses are submitted.

**The three-part system:**

### 1. Circle label chips — colored border + placeholder text
- Chip border is always the circle's color (`#ff6b6b` / `#51cf66` / `#339af0`), revealed or not
- Text color remains dark for readability regardless of state
- The colored dot (already present) is retained alongside the border
- **Unrevealed state:** placeholder text "Group 1 / 2 / 3" in italic at ~65% opacity — signals "more coming" without being cryptic
- **Revealed state:** real category name, normal weight, full opacity

### 2. Circle strokes — always colored
- SVG circles always render with a colored stroke in their circle color
- **Unrevealed:** colored stroke, no fill (or near-transparent fill)
- **Revealed:** colored fill added (current behavior); stroke remains
- Implementation note: circles use `mix-blend-mode: multiply` on their fill. A separate stroke-only circle element layered on top of the fill circle avoids blend-mode conflicts at overlap edges

### 3. Colored dot on chip
- The existing dot already changes color on reveal; under the new system the dot is always the circle's color (not grey when unrevealed), consistent with the always-colored stroke on the circle itself

**Net effect:** color = category group is established from turn 1. Submit reveals fill + real label text. The user learns the color code without needing to guess first.

### Tasks
- [x] V.1 `CircleLabels.jsx` — unrevealed chip renders "Group N" (italic, 65% opacity) instead of "?"; revealed chip renders real name (normal weight, full opacity)
- [x] V.2 `CircleLabels.module.css` — add colored border to chip using circle color; dot is always circle color (remove grey unrevealed state)
- [x] V.3 `VennDiagram.jsx` — add a stroke-only `<circle>` element above each fill circle, always rendered in the circle's color; unrevealed fill circles get no fill or near-transparent fill
- [x] V.4 Verify `mix-blend-mode: multiply` on fill circles is unaffected by the separate stroke layer
- [x] V.5 Verify chip border color and circle stroke color are consistent (same hex values for each circle — centralized in `src/styles/colors.js`)

---

## Layout Redesign — SVG Scaling & Dead Space

**Problem:** The SVG viewBox ratio (320:380 = 0.84) mismatches both portrait phones (too tall) and landscape phones (too wide). After removing label strips and moving SubmitBar to ctrlSide, the dead space gets worse in both orientations.

**Portrait** — height axis is the problem (SVG natural height < tall vennWrap):
| Device | vennWrap height | Natural SVG height | Dead space | Full-stretch distortion |
|---|---|---|---|---|
| iPhone SE (568px) | ~484px | ~444px | ~40px | ~9% taller circles |
| iPhone 14 Pro (932px) | ~848px | ~467px | ~381px | ~82% taller circles |

Cap formula: `max-height: calc(100vw * (380 / 320) * [cap-multiplier])`

**Landscape** — width axis is the problem (SVG natural width < wide vennSide):
| Device | vennSide width | Natural SVG width | Dead space | Full-stretch distortion |
|---|---|---|---|---|
| iPhone SE landscape (667px) | ~467px | ~292px | ~175px | ~60% wider circles |
| iPhone 14 Pro landscape (932px) | ~732px | ~338px | ~394px | ~116% wider circles |

Cap formula: `max-width: calc(100dvh * (320 / 380) * [cap-multiplier])`

Full stretch is never acceptable on large phones in either orientation. Both need a cap, tuned visually during implementation.

**Note on Circle 1 chip placement in landscape:** The `left: 25%` rule is device-independent. Circle 1 is at x=160 (50% of viewBox width) and the SVG is always centered in vennWrap — so circle 1's center always maps to 50% of vennWrap regardless of stretch amount. The 25% midpoint holds at any cap value.

**Two approaches — both worth implementing and comparing visually:**

### Option A — SVG-sized wrapper (chips track diagram edges perfectly)
Introduce a `position:relative` wrapper `<div>` inside vennWrap that is sized to match the SVG element (not the full vennWrap). Circle label chips are positioned inside this wrapper. Dead space exists outside the wrapper within vennWrap.
- Chips always sit at the actual circle edges regardless of dead space
- Requires an extra wrapper element matching the SVG's rendered size
- No distortion — SVG sizes at natural aspect ratio; wrapper matches it
- Works identically for portrait and landscape

### Option B — Cap vennWrap max-height / max-width (simpler, allows controlled stretch)
SVG fills the full vennWrap (`width:100%; height:100%`). Cap applied to vennWrap:
- Portrait: `max-height: calc(100vw * (380/320) * [multiplier])`
- Landscape: `max-width: calc(100dvh * (320/380) * [multiplier])`
- Starting cap multiplier: `1.2` (20% beyond natural ratio) — tune visually
- On large phones: vennWrap hits cap; remaining space becomes dead zone outside vennWrap
- Chips at `bottom:4px` / `top:4px` track vennWrap edges — only correct if SVG fills the full capped vennWrap

**Interaction with circle label chip placement:**
Option A solves the chip-tracking problem cleanly by design. Option B only fully solves it if the cap is tight enough that the SVG always fills the vennWrap (no internal dead space).

**Decision deferred to implementation** — build both and compare visually on small and large screens. Cap multiplier TBD.

### Tasks
- [x] S.1 Implement Option B first (simpler): fix `height:100%` resolution on SVG in flex context; add portrait `max-height` and landscape `max-width` caps to vennWrap; tune cap multipliers visually
- [~] S.2 ~~Implement Option A~~ — skipped; Option B looks good, no need to compare
- [~] S.3 ~~Compare both~~ — skipped; committing to Option B
- [x] S.4 Confirm circle label chip positions (bottom corners, top positions) still land at diagram edges under chosen approach

**In progress (2026-09-01, uncommitted):** further visual tuning of the layout landed in S.1–S.4, testing look & feel before committing. Currently touching:
- `VennDiagram.jsx` — '23' region centroid/callout anchor nudged up (270→250, 352→340)
- `VennDiagram.module.css` — SVG `height: 100%` re-enabled
- `shared.module.css` — vennWrap cap multiplier raised 150→160 (vw portrait / vh landscape)
- `GameBoard.module.css` — landscape `.ctrlSide` fixed 160px width disabled, reverting to content-sized (per L.5)
- `CircleLabels.module.css` — new landscape-specific chip positioning for circles 1/2/3
- [ ] Finish visual pass, then commit
- [ ] Clean up stray "Portrait positioning" comment left on the landscape block in `CircleLabels.module.css`

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
- [x] 7.4 Verify transitions: win → WinScreen, loss → GameOverScreen, retry → reset, new puzzle → selector

---

## Phase 8 — Polish

- [ ] 8.1 ~~Responsive tuning~~ — superseded by Layout Redesign sections above (TermBank/SubmitBar, Circle Labels, SVG Scaling)
- [x] 8.2 Accessibility audit — all tap targets ≥ 44px, readable contrast (Lighthouse score: 100)
- [x] 8.3 Add a second puzzle (`puzzle-002.json`) to test selector with real data
- [x] 8.4 Final mobile test in Chrome DevTools (iPhone SE + iPhone 14 Pro, portrait + landscape)
- [x] 8.5 Gate debug mode behind `?debug` URL param — read in `App.jsx`, threaded down to `VennDiagram`

---

## Phase 9 — Feedback & Animation

### Selection & Placement Feedback
- [ ] 9.1 Haptic feedback on term selection (tap), placement, swap, and invalid action — use `navigator.vibrate()` where available
- [ ] 9.2 Visual feedback: brief scale-pop animation on TermTile tap; placement animation when term lands on a region
- [ ] 9.3 Visual feedback: region flash or ripple when a term is placed or swapped

### Submit Animations
- [ ] 9.4 Submit button press animation (scale down/up)
- [ ] 9.5 Correct circle reveal animation — circle fill fades in; chip label cross-fades from "Group N" to real name
- [ ] 9.6 Incorrect submit feedback — subtle shake or flash on the board; pip transitions from active to spent
- [ ] 9.7 Win / loss transition animation into result screen

---

## Phase 10 — Theme (Light / Dark Mode) — COMPLETE (2026-05-14)

- [x] 10.1 Audit all hardcoded color values across CSS modules and global.css
- [x] 10.2 Replace with CSS custom properties (`--color-bg`, `--color-surface`, `--color-text`, etc.)
- [x] 10.3 Define light theme (default) and dark theme values
- [x] 10.4 Follow device preference via `@media (prefers-color-scheme: dark)` — no manual toggle needed for v1
- [x] 10.5 Verify Venn diagram circle colors and callout labels remain readable in both themes
- [x] 10.6 Settings screen (Phase 11) exposes a manual Light/System/Dark override toggle

---

## Phase 11 — Landing Page, Settings & How To Play

### Landing Page
- [x] 11.1 New `HomeScreen` component replacing `PuzzleSelector` as the app entry point
- [x] 11.2 Four options: **Play**, **Settings**, **How To Play**, **Edit** (disabled, "Coming Soon" badge)
- [x] 11.3 Play → navigates to puzzle selector (existing `PuzzleSelector`); back button added to selector

### Settings Screen
- [x] 11.4 New `SettingsScreen` component
- [x] 11.5 Theme toggle: Light / Dark / System (segmented control)
- [x] 11.6 Audio toggle: On / Off (for future audio additions)
- [x] 11.7 Persist settings to `localStorage`; theme applied via `data-theme` on `<html>`

### How To Play Screen
- [x] 11.8 New `HowToPlayScreen` component
- [x] 11.9 Static instructional content — Venn regions, term placement, swap mechanic, group reveal, attempt pips, permutation note

---

## Phase 13 — Weekly Puzzle System & Progress Tracking

### Design decisions locked
- Puzzle filenames: `2026_001.json`, `2026_002.json`, etc. (year + zero-padded sequence)
- Puzzle JSON: adds `"year"` and `"sequence"` fields; `"id"` updated to match (e.g. `"2026_001"`)
- `index.json` manifest entries carry `year` and `sequence` so gating/sorting requires no per-file loads
- Gating: puzzle is unlocked when `sequence ≤ current ISO week` within the same year, or `year < current year`
- Display date: derived in UI from `(year, sequence)` → ISO week Monday → `"March 16"` format; no dates in JSON
- `"sequence"` is the release order number (1, 2, 3 …); maps 1:1 to ISO calendar week for now; can be revisited for monthly cadence
- Progress: `localStorage` key `"vennit_progress"`, object keyed by puzzle ID; schema `{ won, attempts, completedAt }`
- Home screen: "Play Latest Venn" (direct-to-game, no selector stop) + NEW badge when latest is unplayed; "All Venns..." opens selector
- Selector: compact scrollable rows newest-first; sticky header with "X / Y played" counter; played rows muted + checkmark; score badge placeholder

### Data Format Migration
- [x] W.1 Rename existing files: `puzzle-001.json` → `2026_001.json`, `puzzle-002.json` → `2026_002.json`
- [x] W.2 Add `"year": 2026, "sequence": N` to each puzzle JSON; update `"id"` to `"2026_001"` etc.
- [x] W.3 Update `index.json`: new filenames, updated IDs, add `year` + `sequence` to each manifest entry

### Utilities
- [x] W.4 Create `src/utils/puzzleSchedule.js`:
  - `getCurrentYearWeek()` → `{ year, isoWeek }` (ISO 8601 week of year)
  - `isPuzzleUnlocked(year, sequence)` → boolean
  - `sequenceToDate(year, sequence)` → Date (Monday of that ISO week)
  - `formatDisplayDate(year, sequence)` → `"Mar 16"` string
  - `fetchUnlockedPuzzles()` → filtered + sorted manifest entries

### Progress Tracking
- [x] W.5 Create `src/hooks/useProgress.js`: read/write `"vennit_progress"` in localStorage; exports `progress` object and `recordResult(puzzleId, { won, attempts })`
- [x] W.6 `App.jsx` — call `recordResult` in `handleWin` and `handleGameOver` with the active puzzle's ID

### App & Data Wiring
- [x] W.7 Filtering/sorting handled in `fetchUnlockedPuzzles()` utility, used by HomeScreen and PuzzleSelector
- [x] W.8 `App.jsx` — `handlePlayLatest(entry)` fetches puzzle file from entry, loads directly into game

### Home Screen
- [x] W.9 `HomeScreen.jsx` — "Play Latest Venn" + NEW badge when unplayed; "All Venns…" button added
- [x] W.10 `HomeScreen.jsx` — on mount fetches unlocked manifest + checks progress for badge

### Selector Screen ("All Venns...")
- [x] W.11 Redesign `PuzzleSelector.jsx`: sticky header (back + "All Venns" + "X / Y played" counter); compact rows newest-first; row = `[display date] [title] [✓ muted if played]`; locked puzzles excluded
- [x] W.12 `PuzzleSelector.module.css` — compact row layout; muted/played state; checkmark; status slot

---

## Phase 12 — Puzzle Editor

> **Big item — full discussion needed before planning tasks.**

High-level scope: allow a user to create and play their own custom puzzles without touching code or JSON. Key questions to resolve before tasking:
- Where does the editor live? In-app screen, or separate tool/URL?
- Where are custom puzzles stored? `localStorage`, exported JSON file, shareable URL?
- Is there a "test play" mode within the editor?
- Validation — how do we ensure the 7 terms + 3-category structure is correct before saving?
- Sharing — can a custom puzzle be shared via link (ties into the query parameter parking lot idea)?

---

## Notes

- After Phase 1 and each subsequent phase, discuss before moving on
- SVG centroid coordinates start from spec values; tune during Phase 4 debug mode
- `maxAttempts` lives in puzzle JSON — easy to change per puzzle without touching code
- Puzzle JSON files in `/public/puzzles/` — adding new puzzles never requires code changes

---

## Future Ideas (Parking Lot)

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

### Older Puzzle Conversion

**Status (2026-09-01):** 34 puzzles from the older batch were imported and added to `index.json` (commit `8a452a9`, 2026-05-22) under their original filenames, each with placeholder `"year": 2025, "sequence": 0`. Since the unlock rule treats `year < current year` as always-unlocked, all 34 are currently live/playable.

**This is intentional for now** — decision confirmed 2026-09-01: leave them active. They're not production-ready but are useful test content while layout/UX work continues. Still outstanding before these are real content:
- [ ] Review each puzzle for quality (remove unwanted ones)
- [ ] Rename to final format: `2026_NNN.json`, real `year` + `sequence`, matching `id`
- [ ] Resolve duplicate title: `2026_002` ("Just Relax") and `relaxgame.json` (also "Just Relax") — likely the same puzzle twice
- [ ] Typo: `naturalirrational.json` title reads "Natrually Irrational"
- [ ] Assign final sequence numbers (subject to change until the library is finalized)

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
