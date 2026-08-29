import { IonModal } from '@ionic/react'
import type { ReactNode } from 'react'
import './QuickAddSheet.css'

interface QuickAddSheetProps {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** Inline add/edit sheet for simple master-data forms per docs/03/05 component language. */
export function QuickAddSheet({ isOpen, title, onClose, children }: QuickAddSheetProps) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.6} breakpoints={[0, 0.6, 0.95]}>
      <div className="homeos-quick-add-sheet">
        <div className="homeos-quick-add-sheet__header">
          <h2 className="homeos-quick-add-sheet__title">{title}</h2>
          <button type="button" className="homeos-quick-add-sheet__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="homeos-quick-add-sheet__body">{children}</div>
      </div>
    </IonModal>
  )
}
