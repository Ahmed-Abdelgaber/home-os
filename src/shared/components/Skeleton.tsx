import './Skeleton.css'

interface SkeletonProps {
  height?: number
  /** Any CSS width. Defaults to filling the container. */
  width?: string
  /** `block` matches a card or row; `text` matches a line of copy. */
  variant?: 'block' | 'text'
}

export function Skeleton({ height = 56, width, variant = 'block' }: SkeletonProps) {
  return (
    <div
      className={`homeos-skeleton homeos-skeleton--${variant}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  )
}
