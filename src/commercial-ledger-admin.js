const LEDGER_PARAM='commercial-ledger'
let installed=false

function installLedgerButton(){
  if(installed&&document.querySelector('[data-open-commercial-ledger]'))return true
  const panel=document.querySelector('.admin-page .admin-panel')
  if(!panel)return false
  const couponButton=[...panel.querySelectorAll('button')].find(button=>button.textContent.includes('Promoções e Cupons'))
  if(!couponButton)return false
  if(panel.querySelector('[data-open-commercial-ledger]')){installed=true;return true}
  const button=document.createElement('button')
  button.type='button'
  button.className=couponButton.className
  button.dataset.openCommercialLedger='true'
  button.textContent='📊 Livro Caixa — vendas e controle comercial'
  button.addEventListener('click',()=>{
    const url=new URL(window.location.href)
    url.searchParams.set(LEDGER_PARAM,'1')
    window.location.assign(url.toString())
  })
  couponButton.insertAdjacentElement('beforebegin',button)
  installed=true
  return true
}

// Este arquivo agora cuida somente do atalho no menu administrativo.
// O Livro Caixa é uma rota React própria; não observa nem altera a tela comercial.
let attempts=0
const timer=window.setInterval(()=>{
  attempts+=1
  if(installLedgerButton()||attempts>=40)window.clearInterval(timer)
},250)
installLedgerButton()
