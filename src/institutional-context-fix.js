// Mantém os acessos institucionais fora das telas normais do aplicativo.
// O administrador acessa a gestão pelo Painel Administrativo e o leitor
// sem acesso pode informar um código somente na tela de acesso restrito.

function goInstitutional(key){
  const url=new URL(window.location.href)
  url.search=''
  url.searchParams.set(key,'1')
  window.location.href=url.toString()
}

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
  button.addEventListener('click',()=>goInstitutional('institutional-admin'))
  clientsButton.insertAdjacentElement('afterend',button)
}

function installRedeemOnRestrictedAccess(){
  const restricted=[...document.querySelectorAll('main.dashboard')].find(main=>{
    const title=main.querySelector('.admin-hero h1')?.textContent||''
    return title.includes('Edição 2027')&&main.textContent.includes('Já recebeu seu acesso pela sua empresa?')
  })
  if(!restricted||restricted.querySelector('[data-open-institutional-redeem]'))return
  const hero=restricted.querySelector('.admin-hero')
  const backButton=[...hero.querySelectorAll('button')].find(button=>button.textContent.includes('Voltar ao menu'))
  if(!backButton)return
  const button=document.createElement('button')
  button.type='button'
  button.className='logout'
  button.dataset.openInstitutionalRedeem='true'
  button.textContent='🎟 Tenho um código institucional'
  button.addEventListener('click',()=>goInstitutional('institutional-redeem'))
  backButton.insertAdjacentElement('beforebegin',button)
}

function applyInstitutionalContext(){
  hideGlobalInstitutionalLauncher()
  installAdminInstitutionalButton()
  installRedeemOnRestrictedAccess()
}

applyInstitutionalContext()
window.setInterval(applyInstitutionalContext,700)
window.addEventListener('pageshow',applyInstitutionalContext)
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')applyInstitutionalContext()})
