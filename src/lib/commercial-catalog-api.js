import { supabase } from './supabase.js'

// Camada de leitura do catálogo comercial público/controlado.
// Não altera DOM, não inicia checkout e não contém preços fixos.
export async function fetchCommercialCatalog() {
  if (!supabase) {
    return { products: [], error: new Error('Supabase não configurado') }
  }

  const { data, error } = await supabase.rpc('get_commercial_catalog')

  if (error) {
    return { products: [], error }
  }

  const products = Array.isArray(data)
    ? data.map((product) => ({
        code: product.code,
        title: product.title,
        productType: product.product_type,
        amountCents: product.amount_cents,
        currency: product.currency,
        isActive: product.is_active,
      }))
    : []

  return { products, error: null }
}

export function formatCommercialPrice(amountCents, currency = 'BRL') {
  if (!Number.isInteger(amountCents) || amountCents < 0) return ''

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amountCents / 100)
}
