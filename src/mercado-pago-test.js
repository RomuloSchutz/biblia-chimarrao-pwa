import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada: abre somente o checkout já salvo da Order confirmada.
// NÃO cria nova Order e NÃO consulta/recria a Order no Mercado Pago.
const ORDER_AUTORIZADA = 'd0267f09-c633-4eff-84d8-83d53ffdcd6d'

async function obterCheckoutSalvo() {
  if (!supabase) throw new Error('Supabase não configurado')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const session = sessionData?.session
  if (!session?.access_token) throw new Error('Faça login no aplicativo antes do teste')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl) throw new Error('URL do Supabase não configurada')
  if (!publishableKey) throw new Error('Chave publishable do Supabase não configurada')

  const response = await fetch(`${supabaseUrl}/functions/v1/mercado-pago-saved-checkout`, {
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
      !data && raw ? `resposta=${raw}` : ''
    ].filter(Boolean)
    throw new Error(parts.join(' | '))
  }

  if (data?.order_id !== ORDER_AUTORIZADA) throw new Error('A resposta não corresponde à Order autorizada')
  if (data?.product_code !== 'ebook_cristo_marco') throw new Error('Produto inesperado')
  if (data?.amount_cents !== 1990 || data?.currency !== 'BRL') throw new Error('Valor ou moeda inesperados')
  if (!data?.checkout_url) throw new Error('checkout_url salvo não disponível')
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
  status.textContent = `ORDER CONFERIDA\n${ORDER_AUTORIZADA}\n\nProduto: ebook_cristo_marco\nValor: R$ 19,90\ncheckout_url: SALVO NO BANCO\n\nO botão apenas abrirá este checkout. Nenhuma nova Order será criada.`

  const button = document.createElement('button')
  button.id = 'mp-checkout-test-button'
  button.type = 'button'
  button.textContent = 'ABRIR CHECKOUT SALVO — NÃO CRIAR ORDER'
  Object.assign(button.style, {
    padding: '12px 16px', border: '2px solid #d5a63b', borderRadius: '999px',
    background: '#111', color: '#fff', font: '700 13px system-ui, sans-serif',
    cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)'
  })

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'ABRINDO CHECKOUT SALVO...'
    status.textContent = `ORDER CONFERIDA\n${ORDER_AUTORIZADA}\n\nBuscando somente o checkout_url já salvo no banco...`

    try {
      const checkoutUrl = await obterCheckoutSalvo()
      status.textContent = `CHECKOUT SALVO CONFIRMADO\n${ORDER_AUTORIZADA}\n\nAbrindo o checkout desta mesma Order. Nenhuma nova Order foi criada.`
      window.location.assign(checkoutUrl)
    } catch (error) {
      console.error('Mercado Pago — checkout salvo:', error)
      status.textContent = `ORDER CONFERIDA\n${ORDER_AUTORIZADA}\n\nFalha ao abrir checkout salvo:\n${error?.message || 'erro desconhecido'}\n\nNenhuma nova Order foi criada.`
      button.disabled = false
      button.textContent = 'TENTAR ABRIR O MESMO CHECKOUT SALVO'
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
