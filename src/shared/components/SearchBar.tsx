import { IonIcon } from '@ionic/react'
import { closeCircle, searchOutline } from 'ionicons/icons'
import './SearchBar.css'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

/**
 * Premium HomeOS search bar.
 * Built with native HTML/React primitives for predictable cross-platform behavior,
 * accessible keyboard interactions, and a restrained brand focus state.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
  ariaLabel,
  className = '',
}: SearchBarProps) {
  return (
    <div className={`homeos-search-bar ${disabled ? 'homeos-search-bar--disabled' : ''} ${className}`}>
      <IonIcon icon={searchOutline} className="homeos-search-bar__icon" aria-hidden="true" />
      <input
        type="text"
        className="homeos-search-bar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
      />
      {value.length > 0 && !disabled && (
        <button
          type="button"
          className="homeos-search-bar__clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <IonIcon icon={closeCircle} />
        </button>
      )}
    </div>
  )
}

export const HomeOSSearchBar = SearchBar
