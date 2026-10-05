import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada para validar o Checkout Pro.
// Regra de segurança do teste: o checkout só é exibido depois que a Edge Function
// devolve uma nova order local identificável. Não altera os botões comerciais do app.
const ORDER_AUTORIZADA = 'e370599f-bab9-4305-a0f8-fccb524edc56'

async function criarPedidoTesteMercadoPagoCristo() {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData?.session
  if (!session?.access_token) throw new Error('Faça login no aplicativo antes do teste')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl) throw new Error('URL do Supabase não configurada')
  if (!publishableKey) throw new Error('Chave publishable do Supabase não configurada')

  const response = await fetch(`${supabaseUrl}/functions/v1/mercado-pago-create-order`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: session.access_token, product_code: 'ebook_cristo_marco', accepted: true, terms_version: '04/10/2026' })
  })

  const raw = await response.text()
  let data = null
  try { data = raw ? JSON.parse(raw) : null } catch {}
  if (!response.ok) {
    const parts = [`HTTP ${response.status}`, data?.error ? `erro=${data.error}` : '', data?.provider_status != null ? `provider_status=${data.provider_status}` : '', data?.provider_error ? `provider_error=${typeof data.provider_error === 'string' ? data.provider_error : JSON.stringify(data.provider_error)}` : '', data?.provider_details ? `provider_details=${typeof data.provider_details === 'string' ? data.provider_details : JSON.stringify(data.provider_details)}` : '', !data && raw ? `resposta=${raw}` : ''].filter(Boolean)
    throw new Error(parts.join(' | '))
  }
  if (!data?.order_id) throw new Error('A criação não devolveu o ID da nova order local. Checkout bloqueado.')
  if (!data?.checkout_url) throw new Error('A criação não devolveu um checkout novo. Checkout bloqueado.')
  return data
}

window.testarMercadoPagoCristo = criarPedidoTesteMercadoPagoCristo

function instalarBotaoTeste() {
  if (document.getElementById('mp-checkout-test-button')) return
  const box = document.createElement('div')
  box.id = 'mp-checkout-test-box'
  Object.assign(box.style, { position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' })
  const status = document.createElement('div')
  status.id = 'mp-checkout-test-status'
  Object.assign(status.style, { display: 'block', maxWidth: '560px', padding: '10px 12px', borderRadius: '10px', background: '#111', color: '#fff', font: '14px system-ui, sans-serif', boxShadow: '0 4px 18px rgba(0,0,0,.35)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' })
  status.textContent = `ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nO checkout desta order está autorizado. Não use nenhum checkout anterior.`

  const button = document.createElement('button')
  button.id = 'mp-checkout-test-button'
  button.type = 'button'
  button.textContent = 'ABRIR CHECKOUT DA ORDER CONFIRMADA'
  Object.assign(button.style, { padding: '12px 16px', border: '2px solid #d5a63b', borderRadius: '999px', background: '#111', color: '#fff', font: '700 13px system-ui, sans-serif', cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)' })

  button.addEventListener('click', () => {
    const saved = window.__mpUltimaOrderTeste
    if (!saved?.checkout_url || saved?.order_id !== ORDER_AUTORIZADA) {
      status.textContent = `ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nO link temporário não está mais nesta sessão. NÃO crie nem pague outra order.`
      return
    }
    window.open(saved.checkout_url, '_blank', 'noopener,noreferrer')
    button.disabled = true
    button.textContent = 'CHECKOUT CONFIRMADO ABERTO'
    status.textContent = `CHECKOUT ABERTO PARA A ORDER CONFIRMADA\n${ORDER_AUTORIZADA}\n\nUse somente esta janela do Mercado Pago.`
  })

  box.append(status, button)
  document.body.appendChild(box)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarBotaoTeste, { once: true })
else instalarBotaoTeste()
