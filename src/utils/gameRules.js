// The rules that are the same for every puzzle.
//
// The budget counts MISSES, not submits (Phase 20, from beta testing). A correct submit is
// free; only a wrong one spends a pip. Under the old attempts budget you needed 3 hits out
// of 5, so only 2 misses were survivable — and after a 3rd the game was already lost but
// played on until the pips ran out. Counting misses means the game ends exactly when it
// becomes unwinnable, and every pip matters.
//
// 5 is deliberately generous, kept to see how it plays. 4 (Connections) or 3 are the
// obvious fallbacks if it proves too soft.
//
// It is fixed rather than per-puzzle so scores compare: a variable budget makes "1 miss"
// mean different things on different puzzles. Existing puzzle files still carry
// `maxAttempts`; it is ignored.
export const MISSES = 5

// One Shot: a single whole-board check, opening move only.
//
// A hit wins outright and costs nothing — the same 0 misses as three clean circle
// submits, so it earns no better score. What it earns is the brag: the share block marks
// a One Shot win with ⚡, "I called the whole board cold".
//
// A miss costs one miss and reveals only a count — how many of the three are right, not
// which, with nothing locked.
export const ONE_SHOT_MISS_COST = 1
