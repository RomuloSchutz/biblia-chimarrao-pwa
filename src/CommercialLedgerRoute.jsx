import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(value)||0)/100)
const date=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—'

export default function CommercialLedgerRoute(){
  const [auth,setAuth]=useState('loading')
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [status,setStatus]=useState('')
  const [kind,setKind]=useState('')

  async function load(){
    setLoading(true);setError('')
    const {data,error}=await supabase.rpc('admin_commercial_ledger')
    setLoading(false)
    if(error){setError('Não foi possível carregar o Livro Caixa.');setRows([]);return}
    setRows(Array.isArray(data)?data:[])
  }

  useEffect(()=>{
    let active=true
    ;(async()=>{
      const {data:{session}}=await supabase.auth.getSession()
      if(!active)return
      if(!session){setAuth('denied');return}
      const {data,error}=await supabase.rpc('is_app_admin')
      if(!active)return
      if(error||data!==true){setAuth('denied');return}
      setAuth('ok');load()
    })()
    return()=>{active=false}
  },[])

  const filtered=useMemo(()=>{
    const q=search.trim().toLocaleLowerCase('pt-BR')
    return rows.filter(r=>{
      const text=[r.buyer_name,r.buyer_email,r.product_title,r.product_code,r.coupon_code].join(' ').toLocaleLowerCase('pt-BR')
      const promo=(Number(r.discount_amount_cents)||0)>0
      return(!q||text.includes(q))&&(!status||r.status===status)&&(!kind||(kind==='promo'?promo:!promo))
    })
  },[rows,search,status,kind])

  const paid=filtered.filter(r=>r.status==='paid')
  const original=paid.reduce((s,r)=>s+(Number(r.original_amount_cents)||0),0)
  const discount=paid.reduce((s,r)=>s+(Number(r.discount_amount_cents)||0),0)
  const received=paid.reduce((s,r)=>s+(Number(r.paid_amount_cents)||0),0)
  const statusLabel={paid:'Pago',pending:'Pendente',cancelled:'Cancelado'}
  const back=()=>window.location.assign(window.location.origin+window.location.pathname)

  if(auth==='loading')return <main className="dashboard admin-page"><section className="admin-panel"><p>Validando acesso administrativo…</p></section></main>
  if(auth==='denied')return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Livro Caixa</small></div><button className="logout" onClick={back}>← Voltar</button></header><section className="admin-panel"><h1>Acesso restrito</h1><p>Entre com uma conta de administrador para consultar o Livro Caixa.</p></section></main>

  return <main className="dashboard admin-page commercial-ledger-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Livro Caixa · Controle Comercial</small></div><button className="logout" onClick={back}>← Painel</button></header>
    <section className="admin-panel commercial-ledger-native">
      <div className="admin-title"><p className="eyebrow">CONTROLE COMERCIAL</p><h1>Livro Caixa</h1><p>Movimentações individuais de vendas e pagamentos. Acesso administrativo separado de Promoções e Cupons.</p></div>
      <div className="ledger-head"><div><h2>Vendas e recebimentos</h2><p>Consulte comprador, produto, desconto, cupom e valor efetivamente recebido.</p></div><button type="button" onClick={load} disabled={loading}>{loading?'Atualizando…':'Atualizar'}</button></div>
      <div className="ledger-filters"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar comprador, e-mail, produto ou cupom"/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os status</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="cancelled">Cancelados</option></select><select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Todas as vendas</option><option value="full">Preço normal</option><option value="promo">Com desconto</option></select></div>
      <div className="ledger-kpis"><article><strong>{paid.length}</strong><span>vendas pagas</span></article><article><strong>{money(original)}</strong><span>valor original</span></article><article><strong>{money(discount)}</strong><span>descontos</span></article><article><strong>{money(received)}</strong><span>recebido</span></article></div>
      {error&&<p className="admin-message" role="status">{error}</p>}
      <div className="ledger-table-wrap"><table><thead><tr><th>Data</th><th>Comprador</th><th>Produto</th><th>Venda</th><th>Original</th><th>Desconto</th><th>Pago</th><th>Status</th></tr></thead><tbody>{loading&&!rows.length?<tr><td colSpan="8">Carregando movimentações…</td></tr>:filtered.length?filtered.map(r=>{const promo=(Number(r.discount_amount_cents)||0)>0;return <tr key={r.order_id}><td>{date(r.purchased_at)}</td><td><strong>{r.buyer_name||'Cliente'}</strong><small>{r.buyer_email||''}</small></td><td>{r.product_title||r.product_code||'—'}</td><td>{promo?<span className="ledger-promo">{r.coupon_code||'Desconto'}</span>:'Preço normal'}</td><td>{money(r.original_amount_cents)}</td><td>{money(r.discount_amount_cents)}</td><td><strong>{money(r.paid_amount_cents)}</strong></td><td>{statusLabel[r.status]||r.status||'—'}</td></tr>}):<tr><td colSpan="8">Nenhuma movimentação encontrada.</td></tr>}</tbody></table></div>
    </section>
  </main>
}
