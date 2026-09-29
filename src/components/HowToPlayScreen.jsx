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
            <li>Tap a term to select it — it highlights yellow, and every region you can move it to highlights purple.</li>
            <li>Tap one of those regions to move it there.</li>
            <li>The term already sitting there swaps back into the spot you just left — the board always stays full.</li>
            <li>Tap a selected term again to deselect it.</li>
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
          <h2 className={styles.sectionTitle}>Attempts</h2>
          <p>Every puzzle gives you the same 5 attempts, shared across all three circles and shown as pips in the header. Every submit costs one — right or wrong.</p>
          <p>Run out before you've revealed all 3 circles and the puzzle shows you the solution.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⚡ One Shot</h2>
          <p>Once per puzzle, you can check the whole board at once instead of a single circle.</p>
          <p><strong>Every group right:</strong> you win there and then — in a single attempt.</p>
          <p><strong>Otherwise:</strong> you're told <em>how many</em> groups are correct, but not which. Nothing is revealed and nothing locks.</p>
          <p>It costs one attempt either way, and you only get one. Three clean circle submits will always win a puzzle; One Shot is the gamble that can win it in one — at the cost of finishing a move behind if you're wrong.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Good to Know</h2>
          <p>A circle keeps its category name hidden until you solve it — until then it's just "Group 1", "Group 2", "Group 3".</p>
          <p>It doesn't matter which circle holds which category. Any arrangement that groups the terms correctly wins.</p>
        </section>
      </main>
    </div>
  )
}
