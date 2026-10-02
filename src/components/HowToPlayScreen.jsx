import styles from './HowToPlayScreen.module.css'

export default function HowToPlayScreen({ onBack }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">
          ‹ Back
        </button>
        <h1 className={styles.title}>How To Play</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Goal</h2>
          <p>Place all 7 terms into the correct regions of the Venn diagram so they match 3 hidden categories.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Diagram</h2>
          <p>The Venn diagram has 7 regions:</p>
          <ul className={styles.list}>
            <li>3 exclusive zones — inside only one circle</li>
            <li>3 overlap zones — where exactly two circles meet</li>
            <li>1 center zone — where all three circles overlap</li>
          </ul>
          <p>Each term belongs to exactly one region.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Moving Terms</h2>
          <p>All 7 terms start on the board, shuffled into random regions. Your job is to rearrange them.</p>
          <ol className={styles.list}>
            <li>Tap a term to pick it up — it turns dark and lifts, and every spot you can move it to gets a dashed outline.</li>
            <li>Tap one of those regions to move it there.</li>
            <li>The term already sitting there swaps back into the spot you just left — the board always stays full.</li>
            <li>Tap the term again, or tap empty space, to put it back down.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Submitting</h2>
          <p>Each circle is submitted on its own, using the SUBMIT button on that circle's label.</p>
          <p>Tap it when you think all 4 of that circle's terms are inside it. They don't have to be in the right regions within the circle — they just all have to be in there.</p>
          <p><strong>Correct:</strong> the circle's real category name appears, and those 4 terms lock to it. You can still slide them between that circle's own regions, but they can't leave.</p>
          <p><strong>Wrong:</strong> nothing moves. Rethink that group and try again.</p>
          <p>Reveal all 3 circles to win!</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sharing</h2>
          <p>After a game, Share sends your result without giving anything away:</p>
          <p className={styles.sample}>↯🔴✗🟢🟣</p>
          <ul className={styles.list}>
            <li>A coloured circle for each group you solved, in the order they fell</li>
            <li>✗ for a miss</li>
            <li>↯ for a One Shot that didn't sweep the board</li>
            <li>A lone ⚡ if your One Shot did</li>
          </ul>
          <p>You can replay a puzzle with Try Again, but your first result is the one that's kept, and a replay's shared result says which play it was.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Misses</h2>
          <p>Every puzzle gives you the same 5 misses, shared across all three circles and shown as pips in the header. A correct submit is free — only a wrong one costs a pip.</p>
          <p>Run out before you've revealed all 3 circles and the puzzle shows you the solution.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>↯ One Shot</h2>
          <p>Once per puzzle, you can check the whole board at once instead of a single circle.</p>
          <p><strong>Every group right:</strong> you win there and then, and your shared result gets a ⚡.</p>
          <p><strong>Otherwise:</strong> you're told <em>how many</em> groups are correct, but not which. Nothing is revealed and nothing locks.</p>
          <p>You only get one, and only as your opening move. A miss costs a pip, just like a wrong circle submit. It scores no better than three clean submits — it's for calling the whole board at once.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Good to Know</h2>
          <p>A circle keeps its category hidden until you solve it — until then it's grey and just says "Group". Solving it reveals the category's name and its colour.</p>
          <p>Each category has its own colour, the same for every player, wherever it lands on your board.</p>
          <p>It doesn't matter which circle holds which category. Any arrangement that groups the terms correctly wins.</p>
          <p>On a phone that supports it, Settings can switch on vibration: a tick as you move terms, a double buzz for a miss, a longer one for a solve.</p>
        </section>
      </main>
    </div>
  )
}
