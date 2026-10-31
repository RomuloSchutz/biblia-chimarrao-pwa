// Correção isolada do retorno do Mercado Pago.
// Alguns navegadores restauram a página do PWA pelo BFCache exatamente no estado
// anterior à saída (modal aberto e botão em "Validando..."). Nesse caso o pagamento
// já pode estar confirmado no servidor, mas o React não é remontado.
// Recarregamos UMA vez somente quando a navegação saiu durante um checkout ativo.
const CHECKOUT_RETURN_KEY = 'bc-checkout-return-pending'
const CHECKOUT_RELOAD_KEY = 'bc-checkout-return-reloaded'

function checkoutIsActive() {
  const modal = document.querySelector('.coupon-modal')
  if (!modal) return false
  const status = modal.querySelector('.coupon-modal-status')?.textContent || ''
  const button = modal.querySelector('.coupon-pay-button')
  return Boolean(button?.disabled) && /Mercado Pago|Validando|checkout/i.test(status + ' ' + (button?.textContent || ''))
}

window.addEventListener('pagehide', () => {
  if (checkoutIsActive()) {
    sessionStorage.setItem(CHECKOUT_RETURN_KEY, '1')
    sessionStorage.removeItem(CHECKOUT_RELOAD_KEY)
  }
})

window.addEventListener('pageshow', event => {
  if (sessionStorage.getItem(CHECKOUT_RETURN_KEY) !== '1') return
  // pageshow.persisted identifica a restauração pelo cache de navegação que causava
  // a tela presa. Também aceitamos o modal ainda ativo como fallback entre navegadores.
  if (!event.persisted && !checkoutIsActive()) {
    sessionStorage.removeItem(CHECKOUT_RETURN_KEY)
    sessionStorage.removeItem(CHECKOUT_RELOAD_KEY)
    return
  }
  if (sessionStorage.getItem(CHECKOUT_RELOAD_KEY) === '1') return
  sessionStorage.setItem(CHECKOUT_RELOAD_KEY, '1')
  sessionStorage.removeItem(CHECKOUT_RETURN_KEY)
  window.location.reload()
})
