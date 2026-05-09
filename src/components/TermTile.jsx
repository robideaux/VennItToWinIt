import styles from './TermTile.module.css'

export default function TermTile({ term, isSelected, onSelect }) {
  return (
    <button
      className={`${styles.tile} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      {term.label}
    </button>
  )
}
