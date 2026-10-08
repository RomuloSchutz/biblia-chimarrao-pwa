import { supabase } from './supabase.js'

// Catálogo comercial lido sempre do backend; não fixa preços no aplicativo.
export async function fetchCommercialCatalog() {
  if (!supabase) return { products: [], error: new Error('Supabase não configurado') }

  let lastError = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.rpc('get_commercial_catalog')
    if (!error && Array.isArray(data) && data.length) {
      return {
        products: data.map((product) => ({
          code: product.code,
          title: product.title,
          productType: product.product_type,
          amountCents: product.amount_cents,
          currency: product.currency,
          isActive: product.is_active,
        })),
        error: null,
      }
    }
    lastError = error || new Error('Catálogo comercial vazio')
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
  }

  return { products: [], error: lastError }
}

export function formatCommercialPrice(amountCents, currency = 'BRL') {
  if (!Number.isInteger(amountCents) || amountCents < 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amountCents / 100)
}
