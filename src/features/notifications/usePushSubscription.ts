import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../core/auth/useAuth'
import { supabase } from '../../core/supabase/client'

// Use a simple array buffer to base64 converter
function arrayBufferToBase64(buffer: ArrayBuffer | null) {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function usePushSubscription() {
  const { session } = useAuth()
  const userId = session?.user.id

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not logged in')
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push messaging is not supported in this browser.')
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          throw new Error('VITE_VAPID_PUBLIC_KEY is not defined.')
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        })
      }

      const p256dh = arrayBufferToBase64(subscription.getKey('p256dh'))
      const auth = arrayBufferToBase64(subscription.getKey('auth'))

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth
      }, { onConflict: 'endpoint' })

      if (error) throw error
    },
  })

  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        
        if (userId) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
        }
      }
    },
  })

  return { subscribe, unsubscribe }
}
