import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada para validar uma única nova Order do Checkout Pro.
// Este teste cria a Order e exibe os identificadores, mas NÃO abre o checkout automaticamente.
const PRODUCT_CODE = 'ebook_cristo_marco'
let orderCriadaNestaPagina = null

async function criarOrderTesteControlada() {
  if (!supabase) throw new Error('Supabase não configurado')
  if (orderCriadaNestaPagina) throw new Error(`Já foi criada uma Order nesta página: ${orderCriadaNestaPagina}`)

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
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_token: session.access_token,
      product_code: PRODUCT_CODE,
      accepted: true
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

  if (!data?.order_id) throw new Error('Backend não retornou o ID da Order')
  if (!data?.checkout_url) throw new Error('Backend não retornou checkout_url')
  if (data?.product_code !== PRODUCT_CODE) throw new Error('Produto retornado não corresponde ao teste autorizado')
  if (data?.amount_cents !== 1990 || data?.currency !== 'BRL') throw new Error('Valor ou moeda não correspondem ao teste autorizado')

  orderCriadaNestaPagina = data.order_id
  return data
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
  status.textContent = 'TESTE CONTROLADO\nNenhuma nova Order foi criada nesta página.\n\nO botão criará somente 1 nova Order de R$ 19,90 e NÃO abrirá o checkout.'

  const button = document.createElement('button')
  button.id = 'mp-checkout-test-button'
  button.type = 'button'
  button.textContent = 'CRIAR 1 NOVA ORDER DE TESTE — R$ 19,90'
  Object.assign(button.style, {
    padding: '12px 16px', border: '2px solid #d5a63b', borderRadius: '999px',
    background: '#111', color: '#fff', font: '700 13px system-ui, sans-serif',
    cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)'
  })

  button.addEventListener('click', async () => {
    if (orderCriadaNestaPagina) return

    button.disabled = true
    button.textContent = 'CRIANDO A ÚNICA ORDER...'
    status.textContent = 'TESTE CONTROLADO\nCriando uma única Order. O checkout NÃO será aberto automaticamente...'

    try {
      const data = await criarOrderTesteControlada()
      status.textContent = `ORDER CRIADA E RETIDA PARA CONFERÊNCIA\n${data.order_id}\n\nProduto: ${data.product_code}\nValor: R$ ${(data.amount_cents / 100).toFixed(2).replace('.', ',')}\ncheckout_url recebido: SIM\n\nNÃO PAGUE. Aguarde a conferência do backend.`
      button.textContent = 'ORDER CRIADA — AGUARDAR CONFERÊNCIA'
    } catch (error) {
      console.error('Mercado Pago — criação controlada:', error)
      status.textContent = `FALHA NA CRIAÇÃO CONTROLADA\n${error?.message || 'erro desconhecido'}\n\nNão tente novamente até conferirmos o resultado.`
      button.textContent = 'TESTE INTERROMPIDO — NÃO CLICAR NOVAMENTE'
      // Mantém desabilitado de propósito: um erro pode ter ocorrido após a criação local.
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
