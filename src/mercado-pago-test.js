import { supabase } from './lib/supabase'

// Ferramenta temporária e isolada para validar o primeiro Checkout Pro.
// Não altera os botões comerciais nem o layout do aplicativo.
// Uso no console, já autenticado: window.testarMercadoPagoCristo()
window.testarMercadoPagoCristo = async function testarMercadoPagoCristo() {
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

  if (error) {
    console.error('Mercado Pago — erro no teste:', error)
    throw error
  }

  console.log('Mercado Pago — resposta do teste:', data)
  return data
}
