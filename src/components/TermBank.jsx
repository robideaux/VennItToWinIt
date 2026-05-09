import TermTile from './TermTile.jsx'
import styles from './TermBank.module.css'

export default function TermBank({ terms, selectedTermId, onSelectTerm }) {
  if (terms.length === 0) return null
  return (
    <div className={styles.bank}>
      {terms.map(term => (
        <TermTile
          key={term.id}
          term={term}
          isSelected={term.id === selectedTermId}
          onSelect={() => onSelectTerm(term.id)}
        />
      ))}
    </div>
  )
}
