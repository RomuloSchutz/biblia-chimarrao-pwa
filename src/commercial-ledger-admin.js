const LEDGER_PARAM='commercial-ledger'

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
    const url=new URL(window.location.href)
    url.searchParams.delete('open-admin')
    url.searchParams.set(LEDGER_PARAM,'1')
    window.location.assign(url.pathname+url.search+url.hash)
  })
  couponButton.insertAdjacentElement('beforebegin',button)
  return true
}

// O painel administrativo é uma tela React que pode ser desmontada e montada
// novamente sem recarregar a página. Por isso o atalho não pode depender de
// uma janela curta de tentativas: ele precisa ser recolocado sempre que o
// painel voltar a existir. A checagem abaixo é pequena, limitada ao painel e
// não observa mutações do DOM, evitando o travamento que ocorreu na versão
// antiga baseada em MutationObserver.
function ensureLedgerButton(){
  if(document.visibilityState==='visible')installLedgerButton()
}

ensureLedgerButton()
window.setInterval(ensureLedgerButton,1000)
window.addEventListener('pageshow',ensureLedgerButton)
document.addEventListener('visibilitychange',ensureLedgerButton)
