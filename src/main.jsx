import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './dashboard-card-fixes.css'
import './dashboard-mobile-final.css'
import './social-mobile-fix.js'
import './signup-hardening.js'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// Mantém o service worker do PWA ativo para notificações e futuras rotinas de atualização.
// O registro só ocorre em produção/preview, evitando interferência no servidor de desenvolvimento.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      // Solicita ao navegador uma verificação de versão sem forçar recarga da tela atual.
      await registration.update()
    } catch (error) {
      console.error('[Bíblia + Chimarrão] Falha ao registrar o service worker:', error)
    }
  })
}
