import { supabase } from './lib/supabase.js'

// Mantém o registro eletrônico de aceite alinhado aos documentos jurídicos atuais.
if (supabase?.auth?.signUp && !supabase.auth.__bcSignupHardened) {
  const originalSignUp = supabase.auth.signUp.bind(supabase.auth)
  supabase.auth.signUp = (credentials = {}) => {
    const options = credentials.options || {}
    const data = options.data || {}
    return originalSignUp({
      ...credentials,
      options: {
        ...options,
        data: { ...data, terms_version: '04/10/2026' }
      }
    })
  }
  supabase.auth.__bcSignupHardened = true
}

// Alinha a interface de criação/troca de senha ao mínimo de 8 caracteres do servidor.
function alignPasswordMinimum() {
  document.querySelectorAll('input[autocomplete="new-password"]').forEach(input => {
    input.minLength = 8
  })
}

alignPasswordMinimum()
new MutationObserver(alignPasswordMinimum).observe(document.documentElement, { childList: true, subtree: true })
