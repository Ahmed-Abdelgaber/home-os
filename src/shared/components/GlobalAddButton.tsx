import { IonActionSheet, IonIcon } from '@ionic/react'
import { add } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GlobalAddButton.css'

/** Centered tab-bar action per docs/04_INFORMATION_ARCHITECTURE.md. */
export function GlobalAddButton() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <button
        type="button"
        slot="bottom"
        className="homeos-global-add-button"
        aria-label="Add"
        onClick={() => setIsOpen(true)}
      >
        <IonIcon icon={add} />
      </button>
      <IonActionSheet
        isOpen={isOpen}
        onDidDismiss={() => setIsOpen(false)}
        header="Add"
        buttons={[
          { text: 'Buy Product', handler: () => navigate('/app/purchase') },
          { text: 'Add Expense', handler: () => navigate('/app/expenses/add') },
          { text: 'Add Trip', handler: () => navigate('/app/trips/new') },
          { text: 'Add Product', handler: () => navigate('/app/products/new') },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />
    </>
  )
}
