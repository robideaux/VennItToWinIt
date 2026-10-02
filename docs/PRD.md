# Venn It To Win It — Product Requirements Document

## Overview

**Venn It To Win It** is a mobile-first, browser-based word puzzle game. Players are given 7 terms (words or phrases) and must place each into the correct region of a 3-circle Venn diagram. Each circle represents a hidden category; terms may belong to one, two, or all three categories. The goal is to correctly assign every term to its proper region.

It draws inspiration from NYT Connections (hidden category groupings) and adds a spatial/logical twist via the Venn diagram structure.

---

## Core Concept

- A **Venn diagram** of 3 overlapping circles produces **7 distinct regions**:
  - A only
  - B only
  - C only
  - A ∩ B (but not C)
  - A ∩ C (but not B)
  - B ∩ C (but not A)
  - A ∩ B ∩ C (center)
- Each region holds **exactly one term**.
- The player must figure out which term belongs in which region.
- The 3 circle labels (category names) are **hidden** until correctly solved.

---

## Target Platform

- Responsive web app (React + Vite)
- Optimized for **mobile portrait** layout first; also functional on desktop and landscape orientation
- No backend required — fully static, runs in the browser

---

## User Flow

1. Player opens the app to the **home screen** — Play Latest Venn, All Venns…, Settings, How To Play, Edit
2. Player either jumps straight into the latest unlocked puzzle or picks one from the selector
3. Game board loads:
   - All 7 terms are **already placed**, shuffled into the 7 regions — there is no term bank
   - The circles are **neutral grey**, each with a label chip reading "Group" that doubles as that circle's **SUBMIT** button. The opening shuffle flashes the three category colours across them before they settle grey, to show the colours are hidden too
   - The 3 real category names and the 3 category colours are hidden
4. Player **taps a placed term** to pick it up, then **taps another region** to move it. A picked-up term turns dark and lifts, and every spot it can move to gets a dashed outline; spots it cannot go are dimmed
5. Every move is a **true swap** — the displaced term takes the selected term's old region. The board stays full at all times.
6. When confident about one circle's group, the player taps that circle's **SUBMIT** chip
7. App checks **only that circle**, leniently — right 4 terms inside it, in any arrangement:
   - Correct → the category name is revealed, the circle takes its **category's colour**, and those 4 terms are **locked** into that circle. This is free
   - Incorrect → nothing moves; **a miss is spent**
8. Misses are a **shared pool of 5**, fixed for every puzzle and shown as pips in the header. Only a miss spends one
9. **One Shot** — once per game, as the opening move only, the player may check the whole board at once. A clean sweep wins outright and earns a ⚡ in the shared result; otherwise it costs a miss and reports only *how many* of the three groups are right, revealing and locking nothing
10. Game ends in:
    - **Win**: all 3 circles revealed
    - **Loss**: misses exhausted first → the board animates from where the player left it into the full solution
11. The results screen offers **Share**, **Try Again** (after a loss) and **‹ Back**, which returns to wherever the game was started from — the puzzle list, Home, or Home for a shared link. Replays are allowed: the **first** result is the one kept, and a replay's shared text says "· play: N"

---

## Puzzle Definition Format

Puzzles are stored as external `.json` files (not hardcoded). The game loads a list of available puzzles and allows the user to select one.

### Puzzle JSON Schema

```json
{
  "id": "2026_001",
  "year": 2026,
  "sequence": 1,
  "title": "Puzzle Title (shown in selector)",
  "categories": {
    "A": "Category A Name",
    "B": "Category B Name",
    "C": "Category C Name"
  },
  "terms": [
    { "id": "t1", "label": "Term One",   "regions": ["A"] },
    { "id": "t2", "label": "Term Two",   "regions": ["B"] },
    { "id": "t3", "label": "Term Three", "regions": ["C"] },
    { "id": "t4", "label": "Term Four",  "regions": ["A", "B"] },
    { "id": "t5", "label": "Term Five",  "regions": ["A", "C"] },
    { "id": "t6", "label": "Term Six",   "regions": ["B", "C"] },
    { "id": "t7", "label": "Term Seven", "regions": ["A", "B", "C"] }
  ]
}
```

- `regions` is an array of 1, 2, or 3 category keys indicating which **categories** the term belongs to — not which physical circle it sits in. The puzzle defines grouping relationships only; any assignment of the 3 categories onto the 3 circles is a valid solution.
- The combination of `regions` values uniquely maps each term to one of the 7 Venn regions
- `year` + `sequence` drive release gating and the displayed date; `id` matches the filename
- The miss budget is fixed at 5 for every puzzle (`MISSES` in `gameRules.js`), so scores compare. Older files still carry a `maxAttempts` field; it is ignored
- Category `A`, `B` and `C` are also the category **colours** (red, green, violet): a circle takes the colour of whichever category is solved into it
- Puzzle files should live in `/public/puzzles/` and be referenced by a manifest file (`/public/puzzles/index.json`)

### Puzzle Manifest Schema

```json
{
  "puzzles": [
    { "id": "2026_001", "year": 2026, "sequence": 1, "title": "My First Puzzle",     "file": "2026_001.json" },
    { "id": "2026_002", "year": 2026, "sequence": 2, "title": "Animals & Habitats", "file": "2026_002.json" }
  ]
}
```

`year` and `sequence` are duplicated into the manifest so the app can gate and sort the whole library without loading every puzzle file. A puzzle is unlocked when its `sequence` is at or before the current ISO week of the same year, or when its `year` is in the past.

---

## Game Rules

- There are always exactly **7 terms** and **7 Venn regions** — one term per region
- The board starts fully populated with a shuffled arrangement, guaranteed not to have any circle already correct
- Terms are repositioned by **true swap**; the board is never partially empty
- **Each circle is submitted separately**, via its own label chip. A correct submit is free; a wrong one costs one **miss** from a single shared pool of 5.
- **Colour belongs to the category, not the circle.** Unsolved circles are neutral; a solved circle takes its category's colour wherever it sits, so colours mean the same to every player. Highlights use shape and contrast, never hue, so they stay readable on every circle colour and under every kind of colour vision
- **One Shot** is an opening-move-only whole-board check: a clean sweep wins at no cost; otherwise it costs a miss and gives only a count. Any circle submit closes the window
- A circle is judged **leniently**: it's correct when the right 4 terms are somewhere inside it, regardless of which sub-region each occupies
- On a correct circle:
  - Its category label is revealed
  - Its 4 terms are **locked** to that circle — still rearrangeable among its own 4 sub-regions, but they can never leave, and no outside term can enter
- Re-submitting an already-revealed circle is a no-op and costs nothing
- Any assignment of the 3 categories onto the 3 physical circles is a valid win — the circles are interchangeable
- When the fifth miss is spent without a full solve → **Game Over** screen (animated solution reveal). The game ends exactly when it becomes unwinnable
- When all 3 labels are revealed → **Win** screen
- **Sharing** produces a spoiler-free result row: a coloured circle per solved group in the order they fell (🔴🟢🟣), `✗` for a miss, `↯` for a missed One Shot, a lone `⚡` for a One Shot sweep, then an outcome line ("Solved with 1 miss", "Solved in one shot", "Out of misses"). On desktop it is copied with the puzzle link; on phones it goes through the share sheet
- **Feedback.** Dropping a term visibly swaps it with the one it displaces. A submit pauses for a beat on the circle concerned (all three for a One Shot): it dims, then the colour rises out of the dim if the group was right and the grey returns if not. A wrong submit's miss pip swells and flashes as it goes, and a small grey note under the pips says how many misses are left. The results screen follows after a short hold. All of this is skipped or calmed under reduced-motion settings
- **Vibration** is optional and **off by default**. The Settings toggle is disabled where the device cannot vibrate (iPhones, desktops). Cues: a short tick for pick-up and put-down, a double buzz for a miss, a longer buzz for a solve, a drawn-out pattern for a win and three slow pulses for a loss. A refused move (tapping a dimmed spot) deliberately gives none

---

## Screens / Views

| Screen | Description |
|---|---|
| **Home** | Landing page — Play Latest Venn (with NEW badge when unplayed), All Venns…, Settings, How To Play, Edit (your own puzzles) |
| **Puzzle Selector** | "All Venns…" — scrollable list in three collapsible sections (All Venns, My Venns, Shared With Me), newest first, with an `X / Y played` counter; played rows muted and checked |
| **Edit (My Venns) / Editor** | Author a puzzle in the seven region slots, test-play it, save it (an unfinished puzzle saves as a draft), and share it by link |
| **Settings** | Theme (Light / System / Dark) and Vibration, persisted to `localStorage`. A Sound Effects toggle is shown disabled until audio exists |
| **How To Play** | Static rules explainer |
| **Game Board** | Main gameplay screen — neutral Venn diagram with per-circle submit chips, miss pips and the One Shot button in the header |
| **Win Screen** | Shows the completed board in its category colours; Share and ‹ Back |
| **Game Over Screen** | Animates the player's final board into the correct solution, keeping any circle they already solved pinned in place; Share, Try Again and ‹ Back |

---

## Non-Functional Requirements

- No login and no server. Persistence is client-side only: puzzle results (`vennit_progress`) and settings live in `localStorage`.
- All puzzle data loaded via `fetch()` from `/public/puzzles/`
- Should work offline once loaded (PWA optional, not required for v1)
- Accessible tap targets (min 44px) — audited, Lighthouse accessibility 100
- Light and dark themes, following device preference with a manual override in Settings
- Animations should be subtle and not disruptive on low-end devices

---

## Out of Scope (v1)

- User accounts or server-side score tracking
- Timer
- Hints system
- Sound effects (a disabled settings toggle is a placeholder for future audio)
- Multiplayer
- Resuming an in-progress board — only finished results are persisted

### Shipped since the original v1 scope

Items originally listed as out of scope, and features added since:

- **Date-based puzzle locking** — shipped in Phase 13 as a weekly system (`year` + `sequence`, ISO-week gating)
- **Progress tracking** — per-puzzle results persisted to `localStorage`, surfaced as the selector's played counter and the home screen's NEW badge. The **first** play is kept in full, including its moves, and later plays only count up
- **Custom puzzles and the editor** — authored in the browser, stored locally, shared by link with no server (Phases 12 and 17)
- **Share links** — a custom puzzle travels whole in the link (`?p=`), as a versioned, compressed payload about a fifth the length of the original; links already sent keep working. Library puzzles share by id (`?puzzle=`). Every link carries the same preview card for chat apps (Phase 21)
- **Misses budget, One Shot and category colours** (Phases 18 and 20)

Still not built: a view of past results with re-share, sound, and a transition into the results screen.
