// The rules that are the same for every puzzle.
//
// Attempts used to be per-puzzle (`maxAttempts` in the JSON), but the lever was never
// pulled: all 37 library puzzles set 5, and the How To Play screen had "5 attempts"
// hardcoded in its copy, so any puzzle that differed would have made the instructions
// wrong. More importantly a variable budget makes scores incomparable — "solved in 4"
// would mean something different on a 3-attempt puzzle than a 10-attempt one, and a
// shared score is only worth sending if everyone is on the same scale. Wordle fixes six
// guesses and Connections four mistakes for exactly this reason.
//
// Existing puzzle files still carry `maxAttempts`; it is ignored.
export const ATTEMPTS = 5

// One Shot: a single whole-board check, available once per game.
//
// It costs an attempt like any submit, but pays in a different currency. A per-circle
// submit buys DEPTH — a permanent lock on one group. One Shot buys BREADTH — how many of
// the three are right, across the whole board, revealing and locking nothing. Neither
// dominates, so choosing between them is a real decision.
//
// Revealing nothing is the point, and the part players will not expect: a miss tells you
// only a number. Getting that across before the first press is a UI problem, not a
// mechanical one.
export const ONE_SHOT_COST = 1

// Three circles need three successful submits, so:
//   1   One Shot hits
//   2   impossible — no submit can lock more than one circle
//   3   three clean per-circle submits
//   4   a missed One Shot, or one wrong submit, then three clean
export const PERFECT_SCORE = 1
export const CLEAN_SCORE = 3
