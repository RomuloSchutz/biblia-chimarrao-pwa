// Service worker do Bíblia + Chimarrão.
// Mantém o shell básico do PWA disponível sem rede e preserva push/notificações.
const SW_VERSION = 'pwa-mobile-2026-10-20-1'
const SHELL_CACHE = `biblia-chimarrao-shell-${SW_VERSION}`
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE)
    await cache.addAll(SHELL_ASSETS)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key.startsWith('biblia-chimarrao-shell-') && key !== SHELL_CACHE).map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navegação: rede primeiro para receber a versão nova; shell em cache como contingência offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response && response.ok) {
          const cache = await caches.open(SHELL_CACHE)
          cache.put('/', response.clone()).catch(() => {})
        }
        return response
      } catch {
        return (await caches.match('/')) || Response.error()
      }
    })())
    return
  }

  // Não cacheia APIs, Supabase, pagamentos ou dados privados; apenas ativos estáticos locais.
  const isStaticAsset = ['script','style','image','font','manifest'].includes(request.destination)
  if (!isStaticAsset) return

  event.respondWith((async () => {
    const cached = await caches.match(request)
    const networkPromise = fetch(request).then(async response => {
      if (response && response.ok) {
        const cache = await caches.open(SHELL_CACHE)
        await cache.put(request, response.clone())
      }
      return response
    }).catch(() => null)

    if (cached) {
      event.waitUntil(networkPromise)
      return cached
    }

    return (await networkPromise) || Response.error()
  })())
})

self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch { payload = { body: event.data?.text() } }

  const options = {
    body: payload.body || 'Prepare seu chimarrão. Seu encontro com Deus está esperando.',
    icon: '/image.png',
    badge: '/image.png',
    tag: 'hora-do-mate',
    renotify: true,
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
