import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada para validar o primeiro Checkout Pro.
// Não altera os botões comerciais nem o layout permanente do aplicativo.
async function testarMercadoPagoCristo() {
  if (!supabase) throw new Error('Supabase não configurado')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (!sessionData?.session) throw new Error('Faça login no aplicativo antes do teste')

  const { data, error } = await supabase.functions.invoke('mercado-pago-create-order', {
    body: {
      product_code: 'ebook_cristo_marco',
      accepted: true,
      terms_version: '04/10/2026'
    }
  })

  if (error) throw error
  return data
}

window.testarMercadoPagoCristo = testarMercadoPagoCristo

function instalarBotaoTeste() {
  if (document.getElementById('mp-checkout-test-button')) return

  const box = document.createElement('div')
  box.id = 'mp-checkout-test-box'
  Object.assign(box.style, {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: '2147483647',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end'
  })

  const status = document.createElement('div')
  status.id = 'mp-checkout-test-status'
  Object.assign(status.style, {
    display: 'none',
    maxWidth: '330px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#111',
    color: '#fff',
    font: '14px system-ui, sans-serif',
    boxShadow: '0 4px 18px rgba(0,0,0,.35)'
  })

  const button = document.createElement('button')
  button.id = 'mp-checkout-test-button'
  button.type = 'button'
  button.textContent = 'TESTE MERCADO PAGO — R$ 19,90'
  Object.assign(button.style, {
    padding: '12px 16px',
    border: '2px solid #d5a63b',
    borderRadius: '999px',
    background: '#111',
    color: '#fff',
    font: '700 13px system-ui, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,.35)'
  })

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'CRIANDO PEDIDO DE TESTE...'
    status.style.display = 'block'
    status.textContent = 'Aguarde. Nenhum pagamento foi feito ainda.'
    try {
      const data = await testarMercadoPagoCristo()
      if (!data?.checkout_url) throw new Error('O Mercado Pago não devolveu o link do checkout.')
      status.innerHTML = ''
      const text = document.createElement('div')
      text.textContent = 'Pedido de teste criado. O próximo clique apenas abrirá o Checkout Pro; não conclua o pagamento sem orientação.'
      const link = document.createElement('a')
      link.href = data.checkout_url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.textContent = 'ABRIR CHECKOUT DE TESTE'
      Object.assign(link.style, {display:'inline-block', marginTop:'8px', color:'#ffd56a', fontWeight:'700'})
      status.append(text, link)
      button.textContent = 'PEDIDO DE TESTE CRIADO'
    } catch (error) {
      console.error('Mercado Pago — erro no teste:', error)
      status.textContent = `Falha no teste: ${error?.message || 'erro desconhecido'}. Tire uma foto desta mensagem e envie no chat.`
      button.disabled = false
      button.textContent = 'TENTAR TESTE NOVAMENTE'
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
