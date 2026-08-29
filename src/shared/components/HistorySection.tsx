import './HistorySection.css'

export interface HistoryEntry {
  id: string
  label: string
}

/** "Previous cycles" pattern per docs/01 §13 — contextual history, reused by Item and Product details. */
export function HistorySection({ title, entries }: { title: string; entries: HistoryEntry[] }) {
  if (entries.length === 0) return null

  return (
    <section className="homeos-history-section">
      <h2 className="homeos-history-section__title">{title}</h2>
      {entries.map((entry) => (
        <p key={entry.id} className="homeos-history-section__entry">
          {entry.label}
        </p>
      ))}
    </section>
  )
}
