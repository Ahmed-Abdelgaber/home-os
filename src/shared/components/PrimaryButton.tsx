import type { ButtonHTMLAttributes } from 'react'
import './PrimaryButton.css'

/** Primary button per docs/05_UI_UX_DESIGN_SYSTEM.md §11. */
export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`homeos-primary-button ${props.className ?? ''}`} />
}
