# Claude Code — Initial Build Prompt

Use this prompt to kick off the Venn It To Win It project inside Claude Code (VS Code).

---

## Prompt to paste into Claude Code:

```
I want to build a mobile-first web puzzle game called "Venn It To Win It".
Please read the two spec files in this project before writing any code:

- PRD.md — product requirements and game rules
- TECHNICAL_SPEC.md — stack, component structure, data model, and logic

Once you've read both files, scaffold the full project using React + Vite.
Start with Phase 1 (project scaffold) and Phase 2 (data layer / puzzle loader) 
from the development phases listed in TECHNICAL_SPEC.md.

Create the folder structure as specified, including:
- /public/puzzles/index.json (manifest)
- /public/puzzles/puzzle-001.json (example puzzle from the spec)
- All src/ folders and placeholder components

After scaffolding, implement the puzzle selector screen end-to-end so I can 
load and browse available puzzles before starting the game board work.

Ask me any clarifying questions before you begin if anything in the specs 
is ambiguous.
```

---

## Tips for Working with Claude Code on This Project

- **Work phase by phase** — don't ask Claude Code to build everything at once. The 8 phases in TECHNICAL_SPEC.md are a good commit cadence.
- **SVG Venn diagram is the hardest part** — if the region hit targets are tricky, ask Claude Code to build a visual debug mode that outlines each region's clickable area.
- **Iterate on the puzzle JSON first** — add a second real puzzle to `/public/puzzles/` early so you can test the selector and loader with real data.
- **Test on mobile early** — use Chrome DevTools device emulation (iPhone SE size) from day one, not at the end.
- **Open questions** — TECHNICAL_SPEC.md has a table of 5 open decisions. You can answer them now or let Claude Code propose defaults and adjust later.
```
