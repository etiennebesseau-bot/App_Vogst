/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: unknown[] }

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() as { title?: string; body?: string } | undefined
  event.waitUntil(
    self.registration.showNotification(data?.title ?? '🏠 Vogesenstrasse', {
      body: data?.body ?? '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'trash-reminder',
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/'))
})
