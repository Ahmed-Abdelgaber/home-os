import { closeCircleOutline, searchOutline } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import './SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Reusable search/filter input for list pages. Filtering is client-side. */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div className="homeos-search-bar">
      <IonIcon icon={searchOutline} className="homeos-search-bar__icon" />
      <input
        type="text"
        className="homeos-search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="homeos-search-bar__clear" onClick={() => onChange('')} aria-label="Clear search">
          <IonIcon icon={closeCircleOutline} />
        </button>
      )}
    </div>
  )
}
