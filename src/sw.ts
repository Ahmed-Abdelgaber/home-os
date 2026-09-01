/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const payload = event.data.json()
    const title = payload.title || 'HomeOS'
    const options = {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/favicon.svg',
      data: { type: payload.type }
    }
    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Push event error:', err)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const type = event.notification.data?.type
  let targetUrl = '/'
  
  if (type === 'spend') targetUrl = '/app/expenses'
  else if (type === 'trip') targetUrl = '/app/trips'
  else if (type === 'long_stocked') targetUrl = '/app/products'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl)
          }
          return
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
