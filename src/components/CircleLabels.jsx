import styles from './CircleLabels.module.css'

const CIRCLE_META = [
  { id: '1', color: '#ff6b6b' },
  { id: '2', color: '#51cf66' },
  { id: '3', color: '#339af0' },
]

// position='top':
//   portrait  → shows only circle 1 (centered above diagram)
//   landscape → shows all 3 in one compact row
// position='bottom':
//   portrait  → shows circles 2 & 3 (spread below diagram)
//   landscape → hidden entirely (top strip covers all 3)
export default function CircleLabels({ revealedCircles, position }) {
  const revealMap = Object.fromEntries(revealedCircles.map(r => [r.circleId, r]))

  return (
    <div className={`${styles.strip} ${styles[position]}`}>
      {CIRCLE_META.map(({ id, color }) => {
        const revealed = revealMap[id]
        return (
          <div key={id} className={`${styles.chip} ${styles[`chip${id}`]}`}>
            <span
              className={styles.dot}
              style={{ background: revealed ? color : '#bbb' }}
            />
            <span className={`${styles.label} ${revealed ? styles.revealed : ''}`}>
              {revealed ? revealed.name : '?'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
