// Mantém os acessos institucionais fora das telas normais do aplicativo.
// O administrador acessa a gestão pelo mesmo fluxo interno do Painel Administrativo;
// convites institucionais usam a rota direta de ativação.

function hideGlobalInstitutionalLauncher(){
  document.querySelectorAll('section[aria-label="Acessos institucionais"]').forEach(section=>{
    section.style.display='none'
    section.setAttribute('aria-hidden','true')
  })
}

function findAdminPanel(){
  return [...document.querySelectorAll('.admin-page .admin-panel')].find(panel=>{
    const title=panel.querySelector('.admin-title h1')?.textContent.trim()
    const hasCoupons=[...panel.querySelectorAll('button')].some(button=>button.textContent.includes('Promoções e Cupons'))
    return title==='Administração'&&hasCoupons
  })||null
}

function installAdminInstitutionalButton(){
  const panel=findAdminPanel()
  if(!panel||panel.querySelector('[data-open-institutional-admin]'))return
  const buttons=[...panel.querySelectorAll('button.support-copy')]
  const clientsButton=buttons.find(button=>button.textContent.includes('Clientes'))
  if(!clientsButton)return
  const button=document.createElement('button')
  button.type='button'
  button.className=clientsButton.className
  button.dataset.openInstitutionalAdmin='true'
  button.textContent='🏢 Acessos institucionais — empresas, lotes e ativações'
  button.addEventListener('click',()=>{
    window.dispatchEvent(new CustomEvent('biblia-chimarrao:open-institutional-admin'))
    window.scrollTo(0,0)
  })
  clientsButton.insertAdjacentElement('afterend',button)
}

function applyInstitutionalContext(){
  hideGlobalInstitutionalLauncher()
  installAdminInstitutionalButton()
}

applyInstitutionalContext()
window.setInterval(applyInstitutionalContext,700)
window.addEventListener('pageshow',applyInstitutionalContext)
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')applyInstitutionalContext()})
