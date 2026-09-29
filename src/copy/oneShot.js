// All One Shot wording, in one place so it can be tuned without touching game logic.
//
// Three moments, each doing a different job:
//   HINT     the first time you ever open a game — says the button exists and is worth a look
//   CONFIRM  the first time you ever press it — the stakes, before it is spent
//   RESULT   after a miss — what you were told, and what you were not

export const ONE_SHOT_HINT = {
  title: 'One Shot',
  body: 'Click to solve the puzzle in one guess!',
  // How long it lingers if nothing is clicked. It also dismisses on the first tap anywhere.
  durationMs: 6000,
}

export const ONE_SHOT_CONFIRM = {
  title: '↯ One Shot',
  // The part players do not expect is that a miss reveals NOTHING. Without saying so,
  // a board that fails to light up reads as a broken button.
  body: [
    'Checks all three groups at once, for one attempt.',
    'Get every group right and you win immediately. Otherwise you are told how many are correct — but not which, and nothing is revealed.',
    'You only get one, and it has to be your opening move.',
  ],
  confirm: 'Go for it',
  cancel: 'Cancel',
}

// Keyed by how many of the three groups were correct. A win never reaches here.
export const ONE_SHOT_RESULT = {
  0: 'None of your three groups are correct yet.',
  1: 'One group is correct — not telling you which, though.',
  2: 'Two groups are correct. One left to find.',
}

export const ONE_SHOT_RESULT_FOOTER =
  'Nothing has been revealed or locked. Keep going with the circle submits.'

export const ONE_SHOT_RESULT_DISMISS = 'Got it'

// Heading above the result, e.g. "↯ 2 of 3"
export const oneShotResultTitle = count => `↯ ${count} of 3`
