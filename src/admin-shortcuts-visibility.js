// Garante que atalhos criados dinamicamente para funções administrativas
// existam somente na tela principal do Painel Administrativo.
// Ao retornar de Livro Caixa ou Acessos institucionais, o React pode reutilizar
// temporariamente nós do painel na dashboard; este saneamento remove esse vazamento.

function isMainAdminPanel(panel){
  if(!panel)return false
  const title=panel.querySelector('.admin-title h1')?.textContent.trim()
  const hasCoupons=[...panel.querySelectorAll('button')].some(button=>button.textContent.includes('Promoções e Cupons'))
  return title==='Administração'&&hasCoupons
}

function cleanAdminShortcuts(){
  document.querySelectorAll('[data-open-commercial-ledger],[data-open-institutional-admin]').forEach(button=>{
    const panel=button.closest('.admin-page .admin-panel')
    if(!isMainAdminPanel(panel))button.remove()
  })
}

cleanAdminShortcuts()
window.setInterval(cleanAdminShortcuts,350)
window.addEventListener('pageshow',cleanAdminShortcuts)
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')cleanAdminShortcuts()})
