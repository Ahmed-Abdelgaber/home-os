import { IonIcon } from '@ionic/react'
import { addOutline, chevronForward, closeOutline, searchOutline } from 'ionicons/icons'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './CompactLedger.css'
import './CompactList.css'

export function ListHeaderActions({ searchOpen, onSearch, onAdd, addLabel }: { searchOpen: boolean; onSearch: () => void; onAdd?: () => void; addLabel?: string }) {
  return <>
    <button className="homeos-ledger-tool" type="button" aria-label={searchOpen ? 'Close search' : 'Search list'} aria-expanded={searchOpen} onClick={onSearch}><IonIcon icon={searchOpen ? closeOutline : searchOutline} aria-hidden="true" /></button>
    {onAdd && <button className="homeos-list-add" type="button" aria-label={addLabel ?? 'Add new'} onClick={onAdd}><IonIcon icon={addOutline} aria-hidden="true" /></button>}
  </>
}

interface CompactRowProps {
  title: string
  meta?: string
  glyph: ReactNode
  tone?: string
  accessory?: ReactNode
  to?: string
  onClick?: () => void
}
export function CompactRow({ title, meta, glyph, tone = 'violet', accessory, to, onClick }: CompactRowProps) {
  const body = <>
    <span className={`homeos-list-glyph homeos-list-glyph--${tone}`} aria-hidden="true">{glyph}</span>
    <span className="homeos-ledger-row__copy"><strong dir="auto">{title}</strong>{meta && <span className="homeos-list-meta">{meta}</span>}</span>
    {accessory}<IonIcon className="homeos-ledger-chevron" icon={chevronForward} aria-hidden="true" />
  </>
  return to ? <Link className="homeos-ledger-row homeos-list-row" to={to}>{body}</Link> : <button className="homeos-ledger-row homeos-list-row" type="button" onClick={onClick}>{body}</button>
}

export function ListGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="homeos-ledger-day" aria-label={title}>
    <div className="homeos-ledger-day__heading"><h2>{title}</h2><span>{count}</span></div>
    <ul className="homeos-ledger-rows">{children}</ul>
  </section>
}
