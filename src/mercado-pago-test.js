import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada para validar o Checkout Pro.
// Nesta etapa não cria nova order: recupera exclusivamente o checkout da order já confirmada.
const ORDER_AUTORIZADA = 'e370599f-bab9-4305-a0f8-fccb524edc56'

async function recuperarCheckoutConfirmado() {
  if (!supabase) throw new Error('Supabase não configurado')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData?.session
  if (!session?.access_token) throw new Error('Faça login no aplicativo antes do teste')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl) throw new Error('URL do Supabase não configurada')
  if (!publishableKey) throw new Error('Chave publishable do Supabase não configurada')

  const response = await fetch(`${supabaseUrl}/functions/v1/mercado-pago-recover-checkout`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_token: session.access_token,
      order_id: ORDER_AUTORIZADA
    })
  })

  const raw = await response.text()
  let data = null
  try { data = raw ? JSON.parse(raw) : null } catch {}

  if (!response.ok) {
    const parts = [
      `HTTP ${response.status}`,
      data?.error ? `erro=${data.error}` : '',
      data?.provider_status != null ? `provider_status=${data.provider_status}` : '',
      !data && raw ? `resposta=${raw}` : ''
    ].filter(Boolean)
    throw new Error(parts.join(' | '))
  }

  if (data?.order_id !== ORDER_AUTORIZADA) throw new Error('A resposta não corresponde à order autorizada')
  if (!data?.checkout_url) throw new Error('Checkout não disponível para a order autorizada')
  return data.checkout_url
}

function instalarBotaoTeste() {
  if (document.getElementById('mp-checkout-test-button')) return

  const box = document.createElement('div')
  box.id = 'mp-checkout-test-box'
  Object.assign(box.style, {
    position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647',
    display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'
  })

  const status = document.createElement('div')
  status.id = 'mp-checkout-test-status'
  Object.assign(status.style, {
    display: 'block', maxWidth: '560px', padding: '10px 12px', borderRadius: '10px',
    background: '#111', color: '#fff', font: '14px system-ui, sans-serif',
    boxShadow: '0 4px 18px rgba(0,0,0,.35)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'
  })
  status.textContent = `ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nO botão recuperará somente o checkout desta order pelo backend.`

  const button = document.createElement('button')
  button.id = 'mp-checkout-test-button'
  button.type = 'button'
  button.textContent = 'RECUPERAR E ABRIR CHECKOUT CONFIRMADO'
  Object.assign(button.style, {
    padding: '12px 16px', border: '2px solid #d5a63b', borderRadius: '999px',
    background: '#111', color: '#fff', font: '700 13px system-ui, sans-serif',
    cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)'
  })

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'RECUPERANDO CHECKOUT...'
    status.textContent = `ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nConsultando o checkout desta mesma order no backend...`

    try {
      const checkoutUrl = await recuperarCheckoutConfirmado()
      status.textContent = `CHECKOUT RECUPERADO\n${ORDER_AUTORIZADA}\n\nAbrindo exclusivamente o checkout desta order.`
      button.textContent = 'CHECKOUT CONFIRMADO ABERTO'
      window.location.assign(checkoutUrl)
    } catch (error) {
      console.error('Mercado Pago — recuperação do checkout:', error)
      status.textContent = `ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nFalha ao recuperar o checkout:\n${error?.message || 'erro desconhecido'}\n\nNenhuma nova order foi criada.`
      button.disabled = false
      button.textContent = 'TENTAR RECUPERAR O MESMO CHECKOUT'
    }
  })

  box.append(status, button)
  document.body.appendChild(box)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', instalarBotaoTeste, { once: true })
} else {
  instalarBotaoTeste()
}
