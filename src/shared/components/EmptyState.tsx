import './EmptyState.css'

export function EmptyState({ message }: { message: string }) {
  return <p className="homeos-empty-state">{message}</p>
}
