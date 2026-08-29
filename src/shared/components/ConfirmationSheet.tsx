import { IonAlert } from '@ionic/react'

interface ConfirmationSheetProps {
  isOpen: boolean
  header: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Destructive-confirmation pattern per docs/03/05 component language. */
export function ConfirmationSheet({ isOpen, header, message, confirmLabel, onConfirm, onCancel }: ConfirmationSheetProps) {
  return (
    <IonAlert
      isOpen={isOpen}
      header={header}
      message={message}
      onDidDismiss={onCancel}
      buttons={[
        { text: 'Cancel', role: 'cancel', handler: onCancel },
        { text: confirmLabel, role: 'destructive', handler: onConfirm },
      ]}
    />
  )
}
