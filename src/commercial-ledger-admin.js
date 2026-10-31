function findAdminPanel(){
  return [...document.querySelectorAll('.admin-page .admin-panel')].find(panel=>{
    const title=panel.querySelector('.admin-title h1')?.textContent.trim()
    const hasCoupons=[...panel.querySelectorAll('button')].some(button=>button.textContent.includes('Promoções e Cupons'))
    return title==='Administração'&&hasCoupons
  })||null
}

function installLedgerButton(){
  // O atalho pertence somente à tela principal Administração. Ele não deve
  // aparecer em Clientes, Área do Autor, Imagens e Mídias ou outras subtelas.
  const panel=findAdminPanel()
  if(!panel)return false
  const couponButton=[...panel.querySelectorAll('button')].find(button=>button.textContent.includes('Promoções e Cupons'))
  if(!couponButton)return false
  if(panel.querySelector('[data-open-commercial-ledger]'))return true

  const button=document.createElement('button')
  button.type='button'
  button.className=couponButton.className
  button.dataset.openCommercialLedger='true'
  button.textContent='📊 Livro Caixa — vendas e controle comercial'
  button.addEventListener('click',()=>{
    // Abre dentro do mesmo fluxo React do aplicativo. Assim o painel permanece
    // montado por baixo e o Voltar pode simplesmente revelar a tela anterior,
    // exatamente como as demais subtelas administrativas.
    window.dispatchEvent(new CustomEvent('biblia-chimarrao:open-commercial-ledger'))
    window.scrollTo(0,0)
  })
  couponButton.insertAdjacentElement('beforebegin',button)
  return true
}

function ensureLedgerButton(){
  if(document.visibilityState==='visible')installLedgerButton()
}

ensureLedgerButton()
window.setInterval(ensureLedgerButton,1000)
window.addEventListener('pageshow',ensureLedgerButton)
document.addEventListener('visibilitychange',ensureLedgerButton)
