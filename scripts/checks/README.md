# Verification checks

Standalone Node scripts that exercise the real source modules against real puzzle data.

There is no test framework and no browser here: headless Chromium cannot be installed in
this environment (the npm registry is reachable but the browser-binary CDN is not), so
these scripts are how game logic gets verified. Anything visual still needs a human.

```bash
node scripts/checks/run-all.mjs          # all checks
node scripts/checks/run-all.mjs -v       # with full output
node scripts/checks/run-all.mjs store    # just the ones matching "store"
```

Each script imports the actual module under test via `pathToFileURL` (plain ESM imports
trip over Windows drive letters) and exits non-zero on failure.

## What each covers

| check | what it protects |
|---|---|
| `fit` | text wrapping and shrink-to-fit across all library labels — nothing overflows its pill |
| `hittest` | diagram geometry: every centroid resolves to its own region, no pill escapes the box |
| `caps` | the two length limits — what the editor accepts vs what the renderer can draw |
| `draft` | puzzle ↔ editor-slot conversion round-trips unchanged |
| `editor` | authoring flow: save, rename, title collisions, fixed miss budget |
| `dupes` | duplicate categories and terms are rejected |
| `flags` | which fields get marked in the editor, and which deliberately do not |
| `store` | custom puzzle storage, defensive parsing, quota and blocked-storage handling |
| `suffix` | "Demo 02" disambiguation for same-titled received puzzles |
| `reshare` | re-sharing carries the author's title, never your local numbering |
| `linkformat` | the versioned ?p= format: v1 round-trips every library puzzle, v0 links still open, a frozen v1 link still decodes, hostile input is refused |
| `haptics` | vibration support detection, off by default, the cue each moment earns, and that a refused move gives none |
| `feedback` | the drop swap, the submit beat (the view lags the state), the lost pip, and that input, results and the One Shot popup wait for it |
| `card` | the link preview card: Open Graph tags present, image absolute, a PNG of the declared size, no per-puzzle data |
| `share` / `link-flow` | share link encode/decode, import, dedupe, the weekly gate |
| `sharemode` | native share sheet vs clipboard, per device |
| `oneshot` | the misses budget and the One Shot mechanic |
| `colour` | colour follows the category; the opening shuffle's colour flash |
| `block` | the shareable result block |
| `testplay` | data handed to the win/lose screens from a test play |
| `theme` | theme applied at boot, and browser chrome colour |
| `results` | leaving the results screen (Back lands where the game started), first-play record, play count, and the replay mark in the share text |
| `edge` / `nav` / `twotab` | one-off investigations kept as documentation of known behaviour |
