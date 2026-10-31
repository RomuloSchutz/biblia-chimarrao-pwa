const LEDGER_PARAM='commercial-ledger'
const LEDGER_RETURN_KEY='biblia-chimarrao:commercial-ledger-return'

function installLedgerButton(){
  const panel=document.querySelector('.admin-page .admin-panel')
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
    // O Livro Caixa nasce a partir do Painel Administrativo, que é uma tela
    // interna do React e não uma entrada confiável no histórico do navegador.
    // Guardamos explicitamente essa origem para o botão Voltar.
    sessionStorage.setItem(LEDGER_RETURN_KEY,'admin')
    const url=new URL(window.location.href)
    url.searchParams.delete('open-admin')
    url.searchParams.set(LEDGER_PARAM,'1')
    window.location.assign(url.pathname+url.search+url.hash)
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
