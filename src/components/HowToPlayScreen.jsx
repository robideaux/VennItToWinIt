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
          <h2 className={styles.sectionTitle}>Placing Terms</h2>
          <ol className={styles.list}>
            <li>Tap a term in the bank to select it — it highlights yellow.</li>
            <li>Tap any region in the diagram to place it there.</li>
            <li>To move a placed term, tap it to select it, then tap the new region.</li>
            <li>Placing a term onto an occupied region swaps the two terms.</li>
          </ol>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Submitting</h2>
          <p>Once all 7 regions are filled, the Submit button appears. Tap it to check your arrangement.</p>
          <p>Each correctly placed circle reveals its category name. If not all circles are correct, nothing moves — adjust your terms and try again.</p>
          <p>Reveal all 3 circles to win!</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Attempts</h2>
          <p>You have 5 attempts per puzzle. The pips near the Submit button show how many remain.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Good to Know</h2>
          <p>The circles aren't labeled before you submit. Any valid arrangement of the 3 groups wins — it doesn't matter which circle holds which category.</p>
        </section>
      </main>
    </div>
  )
}
