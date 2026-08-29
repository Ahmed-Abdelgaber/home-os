import './FactRow.css'

export function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="homeos-fact-row">
      <span className="homeos-fact-row__label">{label}</span>
      <span className="homeos-fact-row__value">{value}</span>
    </div>
  )
}
