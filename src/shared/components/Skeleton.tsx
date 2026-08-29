import './Skeleton.css'

export function Skeleton({ height = 56 }: { height?: number }) {
  return <div className="homeos-skeleton" style={{ height }} />
}
