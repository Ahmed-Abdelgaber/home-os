import { IonSearchbar } from '@ionic/react'
import './SearchBar.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** Reusable search/filter input for list pages. Filtering is client-side. */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <IonSearchbar
      className="homeos-search-bar"
      value={value}
      onIonInput={(e) => onChange(e.detail.value ?? '')}
      placeholder={placeholder}
      mode="ios" // Force iOS mode for a cleaner pill look if desired, or remove to use platform default
    />
  )
}
