import { useEffect, useState } from 'react'
import {
  ANNUAL_ACCESS_YEAR,
  ANNUAL_GRANT_SOURCES,
  annualGrantSourceLabel,
  canAdminRevokeAnnualGrant,
  grantAnnualEdition,
  hasActiveAnnualGrant,
  listAnnualEntitlements,
  revokeAnnualEntitlement
} from './lib/annual-access-admin.js'

export default function AnnualAccessAdminPanel({ supabase, reader, onChanged }) {
  const [items, setItems] = useState([])
  const [source, setSource] = useState('admin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    if (!reader?.user_id) return
    setLoading(true)
    setMessage('')
    const { data, error } = await listAnnualEntitlements(supabase, reader.user_id)
    if (error) {
      setItems([])
      setMessage('Não foi possível carregar os acessos anuais: ' + error.message)
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [reader?.user_id])

  async function grant() {
    setLoading(true)
    setMessage('Liberando Edição 2027...')
    const { error } = await grantAnnualEdition(supabase, reader.user_id, source)
    if (error) {
      setMessage('Não foi possível liberar a edição: ' + error.message)
      setLoading(false)
      return
    }
    await load()
    setMessage('✓ Edição 2027 liberada sem alterar compras ou EPUBs.')
    onChanged?.()
  }

  async function revoke(item) {
    if (!canAdminRevokeAnnualGrant(item)) return
    const label = annualGrantSourceLabel(item.source)
    if (!window.confirm(`Revogar somente a concessão ${label} da Edição 2027? Compras pessoais e outras concessões permanecerão intactas.`)) return
    setLoading(true)
    setMessage('Revogando concessão...')
    const { error } = await revokeAnnualEntitlement(supabase, item)
    if (error) {
      setMessage('Não foi possível revogar: ' + error.message)
      setLoading(false)
      return
    }
    await load()
    setMessage('✓ Concessão revogada. Outros direitos do leitor foram preservados.')
    onChanged?.()
  }

  const active = hasActiveAnnualGrant(items)

  return <section className="admin-book-access annual-access-admin">
    <div className="admin-book-access-head">
      <div>
        <p className="eyebrow">ACESSO ANUAL</p>
        <h2>Bíblia + Chimarrão — Edição {ANNUAL_ACCESS_YEAR}</h2>
        <p>{reader?.full_name || reader?.email}</p>
      </div>
      <span className={'admin-status ' + (active ? 'active' : 'pending')}>{active ? 'Liberado' : 'Não liberado'}</span>
    </div>

    {loading && !items.length ? <p>Carregando acessos...</p> : <>
      <div className="admin-book-list">
        {items.length ? items.map(item => <article key={item.id}>
          <div>
            <strong>{item.year ? `Edição ${item.year}` : `Edição ${ANNUAL_ACCESS_YEAR}`}</strong>
            <small>Origem: {annualGrantSourceLabel(item.source)}</small>
            <span>{item.revoked_at ? 'Revogado' : '✓ Ativo'}</span>
          </div>
          {canAdminRevokeAnnualGrant(item)
            ? <button type="button" className="admin-block" onClick={() => revoke(item)} disabled={loading}>Revogar esta concessão</button>
            : item.source === 'purchase'
              ? <small>Compra confirmada — não é removida pelo controle administrativo genérico.</small>
              : null}
        </article>) : <p>Nenhuma concessão anual registrada para esta conta.</p>}
      </div>

      <div className="admin-actions compact-actions">
        <label>Origem da liberação
          <select value={source} onChange={event => setSource(event.target.value)} disabled={loading}>
            {ANNUAL_GRANT_SOURCES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={grant} disabled={loading}>✓ Liberar Edição 2027</button>
      </div>
      <small>O controle anual é independente da biblioteca de EPUBs. Uma concessão corporativa ou administrativa não altera uma compra pessoal existente.</small>
    </>}
    {message && <p className="admin-message" role="status">{message}</p>}
  </section>
}
