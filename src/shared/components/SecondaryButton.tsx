import type { ButtonHTMLAttributes } from 'react'
import './SecondaryButton.css'

export interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'neutral' | 'brand' | 'danger'
}

/** Outline button per docs/05_UI_UX_DESIGN_SYSTEM.md §11. */
export function SecondaryButton({ tone = 'neutral', className, ...props }: SecondaryButtonProps) {
  const toneClass = tone !== 'neutral' ? `homeos-secondary-button--${tone}` : ''
  return <button type="button" {...props} className={`homeos-secondary-button ${toneClass} ${className ?? ''}`.trim()} />
}
