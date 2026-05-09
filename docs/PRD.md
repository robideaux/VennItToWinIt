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

1. Player opens the app
2. Player selects a puzzle from a list (populated from `.json` puzzle definition files)
3. Game board loads:
   - 7 terms shown in a **term bank** area
   - Venn diagram displayed with 7 empty, labeled regions
   - 3 circle category labels are hidden (shown as `?`)
4. Player **taps a term** to select it (highlighted), then **taps a region** to place it there
5. Player can continue moving terms freely — tapping an occupied region swaps or displaces the term
6. When satisfied, player taps **"Submit"**
7. App checks each region:
   - Fully correct circles have their **category label revealed**
   - Incorrect placements are indicated (visual feedback TBD — e.g. shake, color)
8. Player has a **limited number of attempts** (e.g. 5 — to be finalized) before game over
9. Game ends in:
   - **Win**: all 7 terms correctly placed (all 3 labels revealed)
   - **Loss**: attempts exhausted before solving

---

## Puzzle Definition Format

Puzzles are stored as external `.json` files (not hardcoded). The game loads a list of available puzzles and allows the user to select one.

### Puzzle JSON Schema

```json
{
  "id": "puzzle-001",
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

- `regions` is an array of 1, 2, or 3 category keys indicating which circles the term belongs to
- The combination of `regions` values uniquely maps each term to one of the 7 Venn regions
- Puzzle files should live in `/public/puzzles/` and be referenced by a manifest file (`/public/puzzles/index.json`)

### Puzzle Manifest Schema

```json
{
  "puzzles": [
    { "id": "puzzle-001", "title": "My First Puzzle", "file": "puzzle-001.json" },
    { "id": "puzzle-002", "title": "Animals & Habitats", "file": "puzzle-002.json" }
  ]
}
```

---

## Game Rules

- There are always exactly **7 terms** and **7 Venn regions** — one term per region
- Terms can be freely repositioned before submitting
- Each **Submit** costs one attempt
- After each submit:
  - Any circle where **all terms in that circle's regions** are correct → reveal that circle's label
  - A circle's label stays hidden if any of its regions are incorrect
  - Visual feedback distinguishes correct vs. incorrect placements
- When all attempts are used without a full solve → **Game Over** screen (reveal solution)
- When all 3 labels are revealed → **Win** screen

---

## Screens / Views

| Screen | Description |
|---|---|
| **Puzzle Selector** | List of available puzzles; tap to load |
| **Game Board** | Main gameplay screen — term bank + Venn diagram |
| **Win Screen** | Celebration state, shows completed board |
| **Game Over Screen** | Shows correct solution, option to retry or pick new puzzle |

---

## Non-Functional Requirements

- No login, no server, no data persistence required (v1)
- All puzzle data loaded via `fetch()` from `/public/puzzles/`
- Should work offline once loaded (PWA optional, not required for v1)
- Accessible tap targets (min 44px)
- Animations should be subtle and not disruptive on low-end devices

---

## Out of Scope (v1)

- User accounts or score tracking
- Timer
- Daily puzzle / date-based puzzle locking
- Hints system
- Sound effects
- Multiplayer
