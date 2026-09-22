# Venn It To Win It — Build Plan

## Current Status

**Last updated:** 2026-09-22 · **At commit:** `7d0a2f6` · **Working tree:** Phase 16 Stage 1 in progress

**Shipped:** Phases 1–8, 10, 11, 13, 14, 15. The game is fully playable end to end — shuffled-start board (no term bank), true-swap placement, permutation-aware answer checking, per-circle submit chips drawing on a shared 5-attempt pool, group locking, weekly puzzle gating with `localStorage` progress, Home / Settings / How To Play screens, light-dark theming, and an animated game-over reveal that keeps already-solved circles pinned in place.

**Open work:**

| Item | Status |
|---|---|
| **Phase 9 — Feedback & Animation** | Not started. No `navigator.vibrate` and no `@keyframes` anywhere in `src/`. The existing `useShuffleAnimation` / `useRevealAnimation` hooks drive discrete swap steps — they are not the tap / submit / error feedback this phase describes. |
| **Phase 12 — Puzzle Editor** | **Scoped 2026-09-22.** Split into Phase 16 (overlay refactor — enabling work) and Phase 17 (custom puzzles + editor). All open questions answered; decisions locked in those sections. |
| **Phase 16 — Overlay Refactor** | In progress. Stage 1 (geometry extraction) done and verified byte-identical against `7d0a2f6`. Stage 2 (HTML overlays + text fitting) next — it is the visual review gate. |
| **Phase 17 — Custom Puzzles & Editor** | Planned, not started. Depends on Phase 16. |
| **Legacy puzzle cleanup** | 34 older-format puzzles are live in `index.json` with placeholder `year: 2025, sequence: 0`. Intentionally active as test content; a review sweep with the other devs will decide which to keep, then assign final `2026_NNN` filenames and real sequence numbers. See "Older Puzzle Conversion" in the parking lot. |
| **`docs/DEPLOYMENT.md`** | Knowingly stale — still documents `puzzle-XXX.json` naming and omits the required `year` / `sequence` manifest fields. Deliberately deferred until the puzzle sweep settles the naming scheme, so it only gets rewritten once. |

Everything else lives in the phase sections below, with the parking lot at the end of the file.

---

Decisions locked in before build started:
- App name: **Venn It To Win It**
- Max attempts: **5**
- ~~Term bank: **remove terms when placed** (not grayed out)~~ — **superseded 2026-05-22 (`ba20432`)**: the term bank was removed entirely; the board starts fully shuffled and placed
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
- [x] 3.3 Logic verified end-to-end during Phase 4 Venn diagram build

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

## Phase 5 — Term Bank — SUPERSEDED (2026-05-22, `ba20432`)

> **The term bank no longer exists.** Commit `ba20432` ("Got rid of term bank, shuffled start") removed it outright — the board now starts fully shuffled with all 7 terms already placed, so there are never any unplaced terms. `TermBank.jsx` and `TermTile.jsx` were deleted; `SubmitBar.jsx` followed in Phase 14. Items below stay checked as build history.

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

**Superseded (2026-09-01):** Phase 14 (Per-Circle Submit) removes the global SubmitBar entirely — ctrlSide will only ever show the TermBank. Section kept for history.

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

**Committed 2026-09-01 in `470f989`** ("Enhance layout and styling for landscape orientation"). The visual tuning that followed S.1–S.4 touched:
- `VennDiagram.jsx` — '23' region centroid/callout anchor nudged up (270→250, 352→340)
- `VennDiagram.module.css` — SVG `height: 100%` re-enabled
- `shared.module.css` — vennWrap cap multiplier raised 150→160 (vw portrait / vh landscape)
- `GameBoard.module.css` — landscape `.ctrlSide` fixed 160px width disabled, reverting to content-sized (per L.5) — moot as of Phase 14, which removed `ctrlSide` entirely
- `CircleLabels.module.css` — new landscape-specific chip positioning for circles 1/2/3
- [x] Finish visual pass, then commit
- [x] Clean up stray "Portrait positioning" comment left on the landscape block in `CircleLabels.module.css` — verified correct: the comment sits on the portrait block, with a separate `/* ── Landscape ── */` block below it

---

## Phase 6 — Submit Logic

- [~] 6.1 ~~Build `SubmitBar.jsx` — single Submit button + pip display~~ — superseded by Phase 14 (per-circle submit)
- [~] 6.2 ~~Wire Submit button to `submitGuess()` in game state~~ — superseded by Phase 14 (`submitCircle(circleId)`)
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

- [~] 8.1 ~~Responsive tuning~~ — superseded by Layout Redesign sections above (TermBank/SubmitBar, Circle Labels, SVG Scaling)
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

## Phase 12 — Puzzle Editor — SCOPED (2026-09-22)

> **Scoping discussion complete.** Split into Phase 16 (overlay refactor — the enabling work)
> and Phase 17 (custom puzzles + editor). See those sections below.

Original open questions, now answered:
- *Where does the editor live?* In-app screen, reached from the Home screen's **Edit** button.
- *Where are custom puzzles stored?* `localStorage` under `vennit_custom`; shareable via a
  `?p=<base64>` URL that carries the whole puzzle (no backend).
- *Is there a "test play" mode?* Yes — a Preview toggle that swaps `EditOverlay` → `PlayOverlay`
  in place. Actually playing it for score is done from the selector like any other puzzle.
- *Validation?* 7 terms + 3 categories enforced by the fixed-slot editor layout (one input per
  region), so the structure can't be malformed by construction.
- *Sharing?* Yes — supersedes the "Puzzle Pre-Selection via Query Parameter" parking-lot item.

---

## Phase 14 — Per-Circle Submit — COMPLETE (2026-09-02)

**Decision (2026-09-01):** Replace the single global Submit button with a per-circle submit built into each circle's label chip. Motivation: with one global Submit checking the whole board, a player can fill all 7 regions while only ever consciously reasoning about one circle at a time, then win the entire puzzle off a single accidental submit — never deliberately committing to the other two groups. Builds directly on existing group-locking (`getValidTargets`, see "Partial Credit / Group Locking" above).

**Key decisions locked:**
- Attempts stay a single shared pool per puzzle (`maxAttempts` from JSON, unchanged) — each per-circle submit decrements it by 1, same cost as today's global submit. No puzzle JSON/schema changes.
- A circle's submit chip is enabled only when that circle's own 4 regions are filled — a per-circle version of today's `allRegionsFilled`, independent of the other two circles.
- Once a circle is revealed correct, its chip switches to its existing revealed-state display (real category name) and stops being a submit target — no separate "locked" visual needed.
- Attempts pips move from the ctrlSide SubmitBar into the header (right side).
- Supersedes Phase 6.1/6.2 and the "TermBank / SubmitBar Co-location" layout section above.

**Correction found during implementation:** the "TermBank / SubmitBar Co-location" decision this phase supersedes assumed ctrlSide still held a TermBank — it doesn't (removed in commit `ba20432`, "Got rid of term bank, shuffled start" — the board starts fully shuffled/placed, no bank). So `ctrlSide` was removed entirely rather than "kept for TermBank only."

### Tasks
- [x] 14.1 `CircleLabels.jsx` — chip becomes a button when its circle is unrevealed; `onClick` fires a per-circle submit
- [x] 14.2 `useGameState.js` — replace `submitGuess()` with `submitCircle(circleId)`: checks only that circle, decrements shared `attemptsLeft`, reveals+locks on success
- [x] 14.3 Per-circle enabled state: that circle's 4 regions filled, independent of the other two circles (not the old `allRegionsFilled`) — note: since the board starts fully shuffled with no empty bank, this gate is effectively always true in practice; harmless, just rarely visibly "disabled"
- [x] 14.4 Win condition unchanged (`revealedCircles.length === 3`); loss condition unchanged (`attemptsLeft <= 0`) — verified via a standalone script exercising the real reducer code against an actual puzzle
- [x] 14.5 Removed `SubmitBar.jsx` / `SubmitBar.module.css` and the `ctrlSide` panel entirely from `GameBoard.jsx`
- [x] 14.6 Added attempts pips to the header (right side), portrait + landscape
- [x] 14.7 Circle-1 chip tap target confirmed fine in the browser (user-verified)
- [x] 14.8 Repeated/duplicate submits on the same circle guarded in `submitCircle` (no double-decrement); verified via standalone reducer test

**Follow-on polish (2026-09-02):** button copy simplified to "SUBMIT" / "Group" (no circle number shown to the player), dot removed from chips, circle/button outlines switched to always use the bold circle color (outline vs. filled is now the only "solved" signal — the muted color variants in `colors.js` are unused now but left in place, not fully committed to this choice).

---

## Phase 15 — Game Over Reveal Fidelity — COMPLETE (2026-09-02)

**Problem:** On a loss, the reveal screen recomputed an arbitrary canonical solution (`buildSolutionPlacements`, category order → circle 1/2/3) with no knowledge of what the player had actually solved. A circle the player had already locked correct (e.g. "Beatles Albums" in the red circle) could show up reassigned to a different circle in the reveal — jarring, and inconsistent with the game's own group-locking rule.

**Fix:**
- `buildSolutionPlacements` → `buildRevealState(puzzle, lockedCircles)`: any circle the player already had locked keeps its category pinned to that same physical circle; remaining categories fill the remaining circles; the whole board is computed as one consistent solution from that mapping (not a byte-exact freeze of the player's sub-region layout — sub-position within a locked circle was never meaningful, since the player could already freely rearrange it during play). Verified exhaustively (all 9 single-circle-lock combinations, plus 0- and 2-locked cases) against real puzzle data.
- `GameBoard.jsx` → `App.jsx` → `GameOverScreen.jsx`: threaded the player's actual final `placements` and `revealedCircles` through to the reveal screen (previously `GameOverScreen` only received `puzzle`).
- Added a reveal animation: `computeSwapSequence(from, to)` in `puzzleUtils.js` decomposes the transform from the player's actual final (unsolved) board into the revealed solution as a sequence of true-swaps; `useRevealAnimation` hook plays them one at a time reusing `VennDiagram`'s existing `ShuffleOverlay` (the same visual as the game-start shuffle). Verified with 200 randomized start/target pairs — always reconstructs the exact target, no no-op swaps.

**Incidental bugfixes found along the way:**
- `WinScreen`/`GameOverScreen` were flipping their whole `.screen` (header + diagram) to `flex-direction: row` in landscape, turning the header into a left-side panel — inconsistent with GameBoard/HowToPlay/Settings, which always keep the header as a top bar. Removed; both screens now match.
- That fix then exposed vennWrap rendering at the full `.screen` height regardless of the header above it — fixed by adding an intermediate `.body` flex wrapper (`flex:1; min-height:0`) between `.screen` and `.vennWrap`, matching GameBoard's nesting depth.

---

## Phase 16 — Overlay Refactor & Text Fitting

**Why:** Phase 17's editor needs the Venn diagram rendered with editable text boxes instead of read-only term pills. Forking `VennDiagram.jsx` into play and edit copies would mean two sources drifting apart — and the thing that actually drifts here is the *geometry*, which gets tuned constantly (radii 85→97, viewBox 320→380, '23' anchor 352→340). So the diagram splits into a geometry-only SVG shell plus swappable HTML overlays.

**The split also fixes a live bug.** `TermLabel` has no overflow handling at all: fixed 74×26/38px pill, fixed 11.5–12px font, and line-breaking that splits on the **first space only**. Measured across all 259 term labels in the library: median 6 chars, p90 14, max 46. The max is `thebeatgoeson.json` — "The Presidents of the United States of America" — which currently renders as "The" / "Presidents of the United States of America" spilling across the diagram. `ohjesus.json` has four more in the 17–22 range. Whatever fitting rule we adopt **must be shared between edit and play**, or the author's preview lies about how the puzzle will render.

**Key findings:**
- `preserveAspectRatio="none"` means the viewBox maps linearly with independent x/y scales and no centering offset — so a viewBox point is exactly `left: cx/320*100%; top: cy/380*100%`. No JS measurement needed for overlay positioning.
- The pattern is already proven here: `CircleLabel` chips are already absolutely-positioned HTML inside `.vennWrap` in front of the SVG (task C.6 confirmed they don't intercept the hit-test).
- **HTML pills won't distort — SVG ones do.** With the 160vw/160vh caps, the diagram stretches ~35% vertically at the portrait cap (circles are ellipses by design) and SVG `<text>` stretches with it. HTML pills won't. Real visual change, likely an improvement, needs eyes on it. Sizing pills in `cqw` via `container-type: inline-size` reproduces today's horizontal sizing exactly while dropping the vertical squash.
- **The hit-test mostly dissolves.** Layers 1–3 of `handleClick` (inline pills, callout anchors/pills, empty callout zones) become ordinary `onClick` on HTML elements; only the geometric fallback stays on the SVG, and `hitsPill` can be deleted. Overlay container needs `pointer-events: none` with `auto` on individual pills so gaps still fall through.
- `ShuffleOverlay`'s rAF double-frame trick becomes a CSS `transform` transition. `useShuffleAnimation` / `useRevealAnimation` keep their timing logic unchanged.

### Stage 1 — Geometry extraction (pure move, zero behavior change)
- [x] 16.1 New `src/utils/vennGeometry.js` — `VB_W`, `VB_H`, `CIRCLES`, `CENTROIDS`, `CALLOUT_REGIONS`, `CALLOUT_ANCHORS`, `visualCenter(key)`, plus `pctX(cx)` / `pctY(cy)` helpers for overlay positioning
- [x] 16.2 `VennDiagram.jsx` imports from it; nothing else changes. Verify: build passes, game pixel-identical

### Stage 2 — HTML overlays + fitting
- [x] 16.3 `src/utils/fitText.js` — `fitText(label) -> { lines, scale }`. Balanced wrap (binary-search the smallest max-line-length that fits in `MAX_LINES`) + character-count shrink `clamp(MIN_SCALE, TARGET_CHARS / longestLine, 1)`. No DOM measurement, deterministic, pure function
- [x] 16.4 **Tuned: `TARGET_CHARS=13, MIN_SCALE=0.62, MAX_LINES=2`.** At the original `TARGET_CHARS=11` the implied cap was `(11 / 0.62) × 2 = 35` chars — short of the 40 locked in Phase 17, which would have broken the "input limit equals render capability" principle. Widened the pill instead (11→13, so `PILL_W` 74→87 units): cap is now **41**, covering the locked 40, and it improves every label rather than just accommodating the worst one. Verified there is room — the `'2'` and `'3'` pills sit 210 viewBox units apart and are 87 wide.

  Verified against all 259 real labels:

  | Result | At `TARGET_CHARS=11` | At `13` (shipped) |
  |---|---|---|
  | Full size, no shrink | 256 | **258** |
  | Mild shrink (0.9–1.0) | 2 | 0 |
  | Pinned at the 0.62 floor | 1 | 1 (`thebeatgoeson.json`, 46 chars) |

  **The balanced wrap does the real work** — shrinking is near-irrelevant in practice. Only the one 46-char outlier shrinks at all, and it's the sole label over the 41-char cap, so it needs shortening in the puzzle sweep.
- [x] 16.5 `VennDiagram.jsx` → geometry only. Renders as a **fragment** (SVG + `children`), so the overlay is a sibling inside `.vennWrap` — that's what aligns the overlay's percentage coordinates with the SVG viewBox. Hit-test is now the geometric layer alone; `TermLabel`, `ShuffleChip`, `ShuffleOverlay` and `hitsPill` deleted
- [x] 16.6 `TermPill.jsx` + `.module.css` — shared HTML pill consuming `fitText`, with the source/target/inactive palette carried over verbatim from `TermLabel` so the conversion changes layout only, never color. Sized in `cqw` off `.vennWrap`'s new `container-type: inline-size`. `--pill-w` / `--pill-font` are set from JS (`PILL_W`, `BASE_FONT`) rather than hardcoded in CSS, so pill width can't drift from `TARGET_CHARS`
- [x] 16.7 `PlayOverlay.jsx` + `.module.css` — pills, leader lines, anchor/empty dots, hint rings, shuffle chips. Lines and dots stay SVG (geometric, must stretch); pills are HTML (must not). `pointer-events: none` on the overlay with `auto` on pills, so gaps fall through to the shell's hit-test
- [x] 16.8 `GameBoard` / `WinScreen` / `GameOverScreen` → `<VennDiagram …><PlayOverlay …/></VennDiagram>`. Win/GameOver now omit `onRegionClick` entirely, so their pills render as inert `<div>`s rather than buttons

  **Hit-test simplification verified safe:** all 7 centroids resolve geometrically to their own region, so the old pill-rectangle layers 1–2 were redundant. All 3 callout anchors sit outside every circle (returning `null`), which is why empty callout regions still need explicit tap slots — that's the old layer 3, preserved as `.emptySlot` with a 44px minimum.
- [ ] 16.5 `VennDiagram.jsx` → geometry only: keeps fill/stroke circles, callout leader lines, debug markers, and a slimmed `handleClick` with just the geometric fallback; accepts `children`. Deletes `TermLabel`, `ShuffleChip`, `ShuffleOverlay`, `hitsPill`
- [ ] 16.6 `TermPill.jsx` — shared HTML pill consuming `fitText`, carrying the source/target/inactive styling from today's `TermLabel`. Used by game, editor preview, shuffle and reveal
- [ ] 16.7 `PlayOverlay.jsx` — positions a `TermPill` per region, renders callout anchor dots and empty-region dots, owns per-pill `onClick`, renders the shuffle/reveal chip
- [ ] 16.8 `GameBoard` / `WinScreen` / `GameOverScreen` → `<VennDiagram …><PlayOverlay …/></VennDiagram>`
- [x] 16.9a Logic verified via Node scripts — geometry extraction byte-identical to `7d0a2f6`; `fitText` invariants hold across all 259 labels (never >2 lines, never below floor, never loses text); hit-test and pill-collision geometry as above
- [x] 16.10 **Two bugs found in the first visual review (2026-09-22):**
  - *Landscape pills ~3× too large.* Pills were sized in `cqw` (container width) alone, but landscape is height-constrained and very wide — `27.2cqw` of a ~978px wrap gave 266px pills and 37px text. Fixed with `UNIT_CSS = min(0.3125cqw, 0.263cqh)`: positions may map to each axis independently, but a *size* must pick one scale, and the smaller axis is the right one. Portrait numbers are unchanged (width was already binding there); landscape drops to 72–95px pills and 10–13px text. Needed `container-type: inline-size` → `size` on `.vennWrap`.
  - *Crowded text in both orientations.* `wrapBalanced` minimised the longest line **unconditionally**, so every multi-word label was split even when it fit — "Let It Be" (9 chars) became "Let" / "It Be". Now returns a single line when `text.length <= targetChars`. Across the corpus this moved **231 of 259 labels to one line**; only 28 genuinely need two. Didn't show in the first review because every term in that puzzle was 14+ characters.
  - *Board pills rendered at a different size from result-screen pills.* Pills are `<button>` on the game board (they take clicks) and `<div>` on the win/lost screens. The `.interactive` rule carried `font: inherit` to neutralise UA button styling — but `font` is a **shorthand**, so it also set `font-size`, overriding `.pill`'s calculated value at equal specificity and later source order. Board pills therefore rendered at the inherited page size and ignored `--fit-scale` entirely, which is why the 46-char label wrapped to six lines while playing but rendered correctly small on the reveal. Removed: `.pill` already sets `font-family`, `font-weight`, `font-size`, `line-height`, `align-items` and `text-align` explicitly, so UA button styling is fully covered without touching `font`. (The remaining `font: inherit` in `CircleLabels.module.css` is safe — those chips size text via child spans with explicit rem values, so there is no calculated value to clobber.)

    **Fixed by removing `.vennSide` (below), which made the nesting identical across all three screens.**
- [x] 16.11 **Removed the vestigial `.vennSide` wrapper.** It was one half of a two-panel split whose other half, `.ctrlSide` (TermBank in portrait / SubmitBar in landscape), was deleted in Phase 14.5 — leaving a wrapper whose name described a layout that no longer existed. It had become a duplicate of `.body` (`display:flex; flex-direction:column; flex:1; min-height:0`) differing only by padding, and it carried a second fossil: `.body { flex-direction: row }` in landscape, meaningful only while two children needed laying out side by side, plus a `min-width: 0` guard that existed to stop the diagram squeezing the control panel.

  Collapsed into `.body` with the padding halved to `2px 4px`, and the same padding added to `WinScreen`/`GameOverScreen` so all three screens now nest identically as `.body > .vennWrap`. That also closes the ~4% pill-size difference between the board and the result screens — which had always existed but was invisible while the SVG simply stretched to fill whatever box it was handed.
- [x] 16.12 **`MAX_LINES` 2 → 3.** At two lines the 46-character term was pinned to the `MIN_SCALE` floor and near-illegible, especially in landscape, despite obvious free space around the pill. Three lines let it render at **scale 0.89 instead of 0.63 — 40% larger text**.

  The care needed is that `MAX_LINES` is an upper bound, not a target: `wrapBalanced` minimises the widest line, so given three lines it will use three, and short labels would have split into needlessly narrow columns. `fitText` now tries line counts in increasing order and stops at the first needing no shrinking, so extra lines are spent only on labels that would otherwise be shrunk. Selection compares the raw ratio rather than the clamped scale, since two counts that both bottom out at the floor would otherwise tie and the fewer-lines one would win despite fitting less text.

  Verified across the corpus: 241 one-line, 17 two-line, **1 three-line — exactly the one label that shrinks**. No short label gained a line, nothing overflows, and a full-height three-line pill (~47 units) still clears its nearest neighbour ('1' to '123', 125 units apart).

  Side effect: `MAX_LABEL_CHARS` rises to 63, comfortably above the locked 40-character editor cap. The "input limit equals render capability" principle still holds — the renderer now simply exceeds the product cap rather than matching it.
  - *Text overflowing the pill (root cause).* Fitting was driven by **character count**, which is simply the wrong measure: `i` is ~0.30em and `M` ~0.88em, so a count is off by up to 3× for real strings. "The Presidents of the" computed to 113% of the pill's inner width and spilled across the circles; several 12-character labels sat 1–3px over their edges. Replaced with estimated text **width**: a per-character em table (`textWidthEm`), wrapping that balances by width rather than by character count, and `scale = LINE_EM / widestLineEm`. Still a pure function — estimates, not DOM measurement — so it stays testable outside a browser and identical on every render.

    Verified across all 259 labels: **zero overflow**, 241 single-line, 18 two-line, 1 shrunk. "The Presidents…" now lands at scale 0.63 and exactly 100% of the line. Width-based balancing also picks visibly better splits — "Everybody" / "on the floor" (72% of line) instead of "Everybody on" / "the floor" (91%), because the second line is full of narrow characters that a character count can't see.

    Belt and braces: `white-space: nowrap` was removed from the pill. `fitText` already chooses the breaks so it normally does nothing, but if a width estimate comes in low the text now wraps and the pill grows rather than spilling. Overflow is the one failure mode with no acceptable appearance; an extra line is survivable.
  - *Snug text in single-line pills.* `PILL_W` was derived as `TARGET_CHARS × CHAR_W`, calibrated against the old SVG pill where text ran edge to edge with no padding. The HTML pill has padding, so ~9 units of that width went to padding and only ~11.6 characters' worth of room was left for 13 — visible first on the longest single-line label on a board. Padding is now part of the derivation (`TARGET_CHARS × CHAR_W + 2 × PILL_PAD`, rounded **up**), giving `PILL_W = 97`. `--pill-pad` is fed to the CSS from the same constant so the two can't disagree. Slack on a 10-character label roughly doubles, 5.5u → 10u per side.
  - *Portrait pills hanging off the screen edge.* Self-inflicted by the 74→87 unit widening: the `'12'`/`'13'` callout anchors sit at x=38/282 of 320, so an 87-wide pill spanned −5.5→81.5. Added `clampX(x, width)` in `vennGeometry.js`, applied in JS rather than CSS — a `clamp()` built from `var()` computes to a pending-substitution value, which doesn't interpolate, and the shuffle chips would snap instead of slide.
- [ ] 16.9b **Visual review outstanding** — portrait + landscape, small + large phone. Specifically worth checking: pills should no longer look vertically stretched (they've stopped inheriting the diagram's ~35% vertical stretch); pill width went 74→87 units; tapping the gaps between pills should still place terms; the start-of-game shuffle and the game-over reveal should animate as before

---

## Phase 17 — Custom Puzzles & Editor

**Decisions locked (2026-09-22):**

| Decision | Choice |
|---|---|
| Term length | Hard stop at 40 chars (`maxLength`); counter fades in over last 8; never truncate |
| Identity | Stable `custom_<ts>_<rand>` id; unique-title check among local puzzles |
| Rename | True rename — same id, score history follows. No save-as-copy |
| Sections | All Venns / My Venns / Shared With Me, each with own `n / m` count |
| Received puzzles | Play and delete only, never edit |
| Editor preview | Preview toggle swaps `EditOverlay` → `PlayOverlay` in place |
| Attempts range | 3–10, default 5 (3 is a hard floor: each submit reveals at most one circle, so fewer is unwinnable) |

Rationale on identity: a stable id doesn't *cause* duplicate titles — the absence of a uniqueness check does. Keying on a generated id *and* refusing a colliding title gets both properties, and makes rename a real rename instead of a rename→save→delete-original dance that loses score history.

### Stage 3 — Storage (no editor UI yet; seed localStorage by hand)
- [ ] 17.1 `src/utils/customPuzzles.js` over key `vennit_custom` — `listCustom(source?)`, `saveCustom`, `deleteCustom`, `titleExists(title, exceptId)`, `importShared`. Record adds `id`, `source: 'local' | 'shared'`, `createdAt`
- [ ] 17.2 `custom_` id prefix namespaces away from `2026_001` in `vennit_progress` — `recordResult` needs no change
- [ ] 17.3 Title uniqueness enforced within `source: 'local'` only — a received puzzle may share a title with one of yours since they live in different sections
- [ ] 17.4 `PuzzleSelector` → three sections with independent counts; custom sections ungated (never touch `isPuzzleUnlocked`), no date column, empty sections hidden
- [ ] 17.5 `deleteCustom` also clears that id from `vennit_progress` so orphans don't accumulate
- [ ] 17.6 Verify via Node script — save/rename/delete/collision round-trips

### Stage 4 — Editor
- [ ] 17.7 `EditOverlay.jsx` — `<input>` per region with faint placeholders ("Term 1"…), category inputs at the `CircleLabel` chip positions, styled to match `TermPill` so layout previews truthfully. `maxLength={40}` with counter fading in over the last 8 chars
- [ ] 17.8 `EditorScreen.jsx` — diagram + title input + attempts pip selector (3–10, click N fills 1..N) + Preview toggle + Save/Cancel
- [ ] 17.9 `MyVennsScreen.jsx` — from the Home screen's currently-disabled **Edit** button. Local puzzles get Edit + Delete; received get Delete only
- [ ] 17.10 `App.jsx` — new `'editor'` / `'myvenns'` screens in the existing state router + `history.pushState` pattern
- [ ] 17.11 No game-logic change needed for `maxAttempts` — `useGameState` already reads `puzzle.maxAttempts` and `GameBoard` already renders that many pips

### Stage 5 — Share links
- [ ] 17.12 `?p=<base64>` carries a whole custom puzzle; `?puzzle=<id>` keeps working for library puzzles. ~250–400 bytes → ~340–540 base64 chars, well inside the ~2000-char safe URL limit
- [ ] 17.13 On load: decode, validate 7-term / 3-category shape, save as `source: 'shared'`, go straight to the game — no preview stop, no save prompt
- [ ] 17.14 Dedupe on a content hash of `categories + terms` so reopening the same link twice doesn't create a second copy

---

## Notes

- After Phase 1 and each subsequent phase, discuss before moving on
- SVG centroid coordinates start from spec values; tune during Phase 4 debug mode
- `maxAttempts` lives in puzzle JSON — easy to change per puzzle without touching code
- Puzzle JSON files in `/public/puzzles/` — adding new puzzles never requires code changes

---

## Future Ideas (Parking Lot)

### Puzzle Pre-Selection via Query Parameter

**Superseded (2026-09-22):** folded into Phase 17 Stage 5, which keeps `?puzzle=<id>` for library puzzles and adds `?p=<base64>` carrying a whole custom puzzle. Section kept for history.

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

**This is intentional for now** — decision confirmed 2026-09-01, reaffirmed 2026-09-15: leave them active. Every legacy puzzle was deliberately given a `year`/`sequence` that passes the unlock gate so it loads during testing. They're not production-ready but are useful test content while layout/UX work continues.

**Planned resolution:** a puzzle-review sweep with the other devs will decide which puzzles to keep. Final filenames, ids and sequence numbers come out of that sweep — and `docs/DEPLOYMENT.md` gets its naming/manifest rewrite at the same time, so it's only rewritten once. Still outstanding:
- [ ] Review each puzzle for quality (remove unwanted ones) — **dev sweep**
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

**Status: already implemented** (doc was stale — this shipped alongside the lenient circle-reveal logic). See `getValidTargets` in `src/utils/puzzleUtils.js`. This is the foundation Phase 14 (Per-Circle Submit) builds on.

- When a player submits and one full group is correctly identified (the right 4 terms all within the same circle, even if sub-regions are wrong), that circle is revealed and locked:
  - Reveal that circle's category label
  - Lock those 4 terms to that circle — they can still move between the circle's 4 sub-regions, but cannot leave it
- **Interaction rules (implemented as specified):**
  - Clicking a term inside a locked circle → only that circle's 4 sub-regions are valid drop targets
  - Clicking a term outside any locked circle → valid drop targets exclude all sub-regions of locked circles
  - Swap mechanic: a locked term displaced by a swap must land within its own locked circle; if no valid sub-region is available, the swap is blocked
- **Visual communication:** resolved via the existing revealed-chip styling (real category name, full opacity) — no separate locked indicator needed
- Fresh-evaluation submit (Option B) is already in place — locking makes reveals sticky again, but intentionally via lock rather than by accident
