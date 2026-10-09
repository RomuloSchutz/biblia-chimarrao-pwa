// Service worker do Bíblia + Chimarrão.
// Responsável pelas notificações push e pelo clique que conduz o leitor ao aplicativo.
const SW_VERSION = 'bloco3-2026-10-09-1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch { payload = { body: event.data?.text() } }

  const options = {
    body: payload.body || 'Prepare seu chimarrão. Seu encontro com Deus está esperando.',
    icon: '/image.png',
    badge: '/image.png',
    tag: 'hora-do-mate',
    renotify: true,
    // Dois pulsos curtos para diferenciar a Hora do Mate quando o navegador/SO suportar vibração.
    vibrate: [220, 120, 220],
    data: {
      url: payload.url || '/',
      swVersion: SW_VERSION
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Hora do Mate 🧉', options)
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const url = new URL(event.notification.data?.url || '/', self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => client.url.startsWith(self.location.origin))
    if (existing) {
      await existing.focus()
      await existing.navigate(url)
      return
    }
    await self.clients.openWindow(url)
  })())
})
