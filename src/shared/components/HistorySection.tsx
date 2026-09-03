import { chevronForwardOutline } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import { StatusChip, type ItemStatus } from './StatusChip'
import './HistorySection.css'

export interface HistoryEntry {
  id: string
  title: string
  subtitle?: string
  meta?: string
  status?: ItemStatus
}

/** Rich contextual history section for Item and Product details per v2.1. */
export function HistorySection({
  title,
  summary,
  entries,
  onEntryClick,
}: {
  title: string
  summary?: string
  entries: HistoryEntry[]
  onEntryClick?: (id: string) => void
}) {
  if (entries.length === 0) return null

  return (
    <section className="homeos-history-section">
      <div className="homeos-history-section__header">
        <h2 className="homeos-history-section__title">{title}</h2>
        {summary && <span className="homeos-history-section__summary">{summary}</span>}
      </div>
      <div className="homeos-history-section__list">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="homeos-history-section__entry"
            onClick={() => onEntryClick?.(entry.id)}
          >
            <div className="homeos-history-section__entry-main">
              <div className="homeos-history-section__entry-top">
                <span className="homeos-history-section__entry-title">{entry.title}</span>
                {entry.status && <StatusChip status={entry.status} />}
              </div>
              {entry.subtitle && (
                <span className="homeos-history-section__entry-subtitle">{entry.subtitle}</span>
              )}
              {entry.meta && (
                <span className="homeos-history-section__entry-meta">{entry.meta}</span>
              )}
            </div>
            {onEntryClick && (
              <IonIcon icon={chevronForwardOutline} className="homeos-history-section__entry-chevron" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}
