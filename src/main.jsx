import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import InstitutionalAdminRoute from './InstitutionalAdminRoute.jsx'
import InstitutionalAccessLauncher from './InstitutionalAccessLauncher.jsx'
import ReaderSettingsRoute from './ReaderSettingsRoute.jsx'
import CommercialLedgerRoute from './CommercialLedgerRoute.jsx'
import './styles.css'
import './institutional.css'
import './dashboard-card-fixes.css'
import './dashboard-mobile-final.css'
import './share-app-card.css'
import './site-share-contrast.css'
import './admin-button-uniformity.css'
import './single-session-hardening.js'
import './share-app-card.js'
import './site-share-card-v2.js'
import './news-unread-only.js'
import './remove-legacy-site-card.js'
import './reset-test-notifications.js'
import './social-mobile-fix.js'
import './signup-hardening.js'
import './settings-route-hardening.js'
import './journey-month-cards.css'
import './checkout-return-hardening.js'
import './coupon-archive-admin.js'
import './commercial-sales-summary.js'
import './commercial-ledger-admin.css'
import './commercial-ledger-admin.js'
import './admin-return-bridge.js'

const params=new URLSearchParams(window.location.search)
const institutionalRoute=params.get('institutional-admin')==='1'||params.get('institutional-redeem')==='1'
const readerSettingsRoute=params.get('reader-settings')==='1'
const commercialLedgerRoute=params.get('commercial-ledger')==='1'

function AppShell(){
  const [ledgerOpen,setLedgerOpen]=React.useState(false)

  React.useEffect(()=>{
    const openLedger=()=>setLedgerOpen(true)
    window.addEventListener('biblia-chimarrao:open-commercial-ledger',openLedger)
    return()=>window.removeEventListener('biblia-chimarrao:open-commercial-ledger',openLedger)
  },[])

  const handleLedgerNavigationCapture=event=>{
    const button=event.target.closest?.('button')
    if(!button)return
    if(button.textContent.includes('Voltar')||button.textContent.trim()==='Painel'){
      event.preventDefault()
      event.stopPropagation()
      setLedgerOpen(false)
    }
  }

  return <>
    <div style={{display:ledgerOpen?'none':''}}><App/><InstitutionalAccessLauncher/></div>
    {ledgerOpen&&<div className="commercial-ledger-inline-shell" onClickCapture={handleLedgerNavigationCapture}>
      <style>{`.commercial-ledger-inline-shell .commercial-ledger-page .header-actions button:last-child{display:none!important}`}</style>
      <CommercialLedgerRoute/>
    </div>}
  </>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  institutionalRoute
    ? <InstitutionalAdminRoute/>
    : readerSettingsRoute
      ? <ReaderSettingsRoute/>
      : commercialLedgerRoute
        ? <CommercialLedgerRoute/>
        : <AppShell/>
)

// Mantém o service worker do PWA ativo para notificações e atualizações.
// A atualização é verificada sem apagar dados locais, compras, favoritos ou anotações.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    let reloadingForNewWorker = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadingForNewWorker) return
      reloadingForNewWorker = true
      window.location.reload()
    })

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {scope:'/',updateViaCache:'none'})
      await registration.update()
      const UPDATE_INTERVAL_MS = 60 * 60 * 1000
      window.setInterval(() => registration.update().catch(error => console.warn('[Bíblia + Chimarrão] Não foi possível verificar atualização do PWA:', error)),UPDATE_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(error => console.warn('[Bíblia + Chimarrão] Não foi possível verificar atualização ao retornar:', error))
      })
    } catch (error) {
      console.error('[Bíblia + Chimarrão] Falha ao registrar o service worker:', error)
    }
  })
}
