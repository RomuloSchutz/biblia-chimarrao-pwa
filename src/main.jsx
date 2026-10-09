import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './dashboard-card-fixes.css'
import './dashboard-mobile-final.css'
import './social-mobile-fix.js'
import './signup-hardening.js'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// Mantém o service worker do PWA ativo para notificações e atualizações.
// A atualização é verificada sem apagar dados locais, compras, favoritos ou anotações.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    let reloadingForNewWorker = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadingForNewWorker) return
      reloadingForNewWorker = true
      // Quando uma nova versão assume o controle, recarrega uma única vez
      // para entregar ao leitor os arquivos atuais do aplicativo.
      window.location.reload()
    })

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      // Verifica uma nova versão ao abrir o aplicativo.
      await registration.update()

      // Se o usuário mantiver o PWA aberto, faz nova verificação periodicamente.
      const UPDATE_INTERVAL_MS = 60 * 60 * 1000
      window.setInterval(() => {
        registration.update().catch(error => {
          console.warn('[Bíblia + Chimarrão] Não foi possível verificar atualização do PWA:', error)
        })
      }, UPDATE_INTERVAL_MS)

      // Ao voltar para o aplicativo depois de deixá-lo em segundo plano,
      // verifica novamente sem exigir limpeza de cache ou reinstalação.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(error => {
            console.warn('[Bíblia + Chimarrão] Não foi possível verificar atualização ao retornar:', error)
          })
        }
      })
    } catch (error) {
      console.error('[Bíblia + Chimarrão] Falha ao registrar o service worker:', error)
    }
  })
}
