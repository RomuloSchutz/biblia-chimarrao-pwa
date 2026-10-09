export const ANNUAL_ACCESS_YEAR = 2027

export const ANNUAL_GRANT_SOURCES = Object.freeze([
  { value: 'admin', label: 'Administração' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'promotion', label: 'Promoção' }
])

export function annualGrantSourceLabel(source) {
  const labels = {
    purchase: 'Compra',
    corporate: 'Corporativo',
    admin: 'Administração',
    promotion: 'Promoção',
    legacy: 'Legado'
  }
  return labels[source] || source || 'Desconhecida'
}

export function canAdminRevokeAnnualGrant(entitlement) {
  return Boolean(
    entitlement?.id &&
    ['admin', 'corporate', 'promotion'].includes(entitlement.source) &&
    !entitlement.revoked_at
  )
}

export function hasActiveAnnualGrant(entitlements = []) {
  return entitlements.some(item => !item.revoked_at)
}

export async function listAnnualEntitlements(supabase, userId) {
  if (!supabase || !userId) return { data: [], error: new Error('Usuário inválido.') }
  const { data, error } = await supabase.rpc('admin_list_annual_entitlements', {
    target_user_id: userId
  })
  return { data: data || [], error }
}

export async function grantAnnualEdition(supabase, userId, source = 'admin', year = ANNUAL_ACCESS_YEAR) {
  if (!supabase || !userId) return { data: null, error: new Error('Usuário inválido.') }
  if (!ANNUAL_GRANT_SOURCES.some(item => item.value === source)) {
    return { data: null, error: new Error('Origem de concessão não permitida pelo painel.') }
  }
  return supabase.rpc('admin_grant_annual_edition', {
    target_user_id: userId,
    target_year: year,
    grant_source: source
  })
}

export async function revokeAnnualEntitlement(supabase, entitlement) {
  if (!supabase || !canAdminRevokeAnnualGrant(entitlement)) {
    return { data: null, error: new Error('Esta concessão não pode ser revogada por este controle.') }
  }
  return supabase.rpc('admin_revoke_annual_entitlement', {
    target_entitlement_id: entitlement.id
  })
}
