import { chevronForwardOutline } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import './HistorySection.css'

export interface HistoryEntry {
  id: string
  label: string
}

/** "Previous cycles" pattern per docs/01 §13 — contextual history, reused by Item and Product details. */
export function HistorySection({ title, entries, onEntryClick }: { title: string; entries: HistoryEntry[]; onEntryClick?: (id: string) => void }) {
  if (entries.length === 0) return null

  return (
    <section className="homeos-history-section">
      <h2 className="homeos-history-section__title">{title}</h2>
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className="homeos-history-section__entry"
          onClick={() => onEntryClick?.(entry.id)}
        >
          <span className="homeos-history-section__entry-label">{entry.label}</span>
          {onEntryClick && <IonIcon icon={chevronForwardOutline} className="homeos-history-section__entry-chevron" />}
        </button>
      ))}
    </section>
  )
}
