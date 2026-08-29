import type { ButtonHTMLAttributes } from 'react'
import './SecondaryButton.css'

/** Outline button per docs/05_UI_UX_DESIGN_SYSTEM.md §11. */
export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`homeos-secondary-button ${props.className ?? ''}`} />
}
