// Service worker do Bíblia + Chimarrão. Base para notificações push.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch { payload = { body: event.data?.text() } }
  event.waitUntil(self.registration.showNotification(payload.title || 'Hora do Mate 🧉', {
    body: payload.body || 'Prepare seu chimarrão. Seu encontro com Deus está esperando.',
    icon: '/image.png', badge: '/image.png', tag: 'hora-do-mate',
    data: { url: payload.url || '/' }
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil((async () => {
    const url = new URL(event.notification.data?.url || '/', self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => client.url.startsWith(self.location.origin))
    if (existing) { await existing.focus(); existing.navigate(url); return }
    await self.clients.openWindow(url)
  })())
})
