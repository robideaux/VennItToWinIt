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

1. Player opens the app to the **home screen** — Play Latest Venn, All Venns…, Settings, How To Play
2. Player either jumps straight into the latest unlocked puzzle or picks one from the selector
3. Game board loads:
   - All 7 terms are **already placed**, shuffled into the 7 regions — there is no term bank
   - Each circle carries a colored label chip reading "Group 1 / 2 / 3", which doubles as that circle's **SUBMIT** button
   - The 3 real category names are hidden
4. Player **taps a placed term** to select it, then **taps another region** to move it
5. Every move is a **true swap** — the displaced term takes the selected term's old region. The board stays full at all times.
6. When confident about one circle's group, the player taps that circle's **SUBMIT** chip
7. App checks **only that circle**, leniently — right 4 terms inside it, in any arrangement:
   - Correct → the category name is revealed and those 4 terms are **locked** into that circle
   - Incorrect → nothing moves; the attempt is spent
8. Attempts are a **shared pool** (`maxAttempts`, currently 5) shown as pips in the header. Every per-circle submit costs one.
9. Game ends in:
   - **Win**: all 3 circles revealed
   - **Loss**: attempts exhausted first → the board animates from where the player left it into the full solution

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
  "maxAttempts": 5,
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
- **Each circle is submitted separately**, via its own label chip. Every submit costs one attempt from a single shared pool.
- A circle is judged **leniently**: it's correct when the right 4 terms are somewhere inside it, regardless of which sub-region each occupies
- On a correct circle:
  - Its category label is revealed
  - Its 4 terms are **locked** to that circle — still rearrangeable among its own 4 sub-regions, but they can never leave, and no outside term can enter
- Re-submitting an already-revealed circle is a no-op and costs nothing
- Any assignment of the 3 categories onto the 3 physical circles is a valid win — the circles are interchangeable
- When all attempts are used without a full solve → **Game Over** screen (animated solution reveal)
- When all 3 labels are revealed → **Win** screen

---

## Screens / Views

| Screen | Description |
|---|---|
| **Home** | Landing page — Play Latest Venn (with NEW badge when unplayed), All Venns…, Settings, How To Play |
| **Puzzle Selector** | "All Venns…" — compact scrollable list, newest first, with an `X / Y played` counter; played rows muted and checked |
| **Settings** | Theme (Light / System / Dark) and audio toggles, persisted to `localStorage` |
| **How To Play** | Static rules explainer |
| **Game Board** | Main gameplay screen — Venn diagram with per-circle submit chips and attempt pips in the header |
| **Win Screen** | Celebration state, shows the completed board |
| **Game Over Screen** | Animates the player's final board into the correct solution, keeping any circle they already solved pinned in place; retry or pick a new puzzle |

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
- Sound effects (a settings toggle exists, reserved for future audio)
- Multiplayer
- Resuming an in-progress board — only finished results are persisted

### Shipped since the original v1 scope

Two items originally listed as out of scope have since been built:

- **Date-based puzzle locking** — shipped in Phase 13 as a weekly system (`year` + `sequence`, ISO-week gating)
- **Progress tracking** — per-puzzle win/attempt results persisted to `localStorage`, surfaced as the selector's played counter and the home screen's NEW badge
