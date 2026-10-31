import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase.js'

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(value)||0)/100)
const date=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—'
const monthKey=value=>{if(!value)return '';const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
const monthName=month=>new Intl.DateTimeFormat('pt-BR',{month:'long'}).format(new Date(2026,month-1,1)).replace(/^./,c=>c.toUpperCase())
const monthLabel=key=>{const [year,month]=key.split('-').map(Number);return `${monthName(month)} de ${year}`}
const monthRange=year=>{const start=year===2026?10:1;return Array.from({length:12-start+1},(_,i)=>`${year}-${String(start+i).padStart(2,'0')}`)}
const LEDGER_RETURN_KEY='biblia-chimarrao:commercial-ledger-return'

export default function CommercialLedgerRoute(){
  const [auth,setAuth]=useState('loading')
  const [rows,setRows]=useState([])
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [search,setSearch]=useState('')
  const [status,setStatus]=useState('')
  const [kind,setKind]=useState('')
  const [view,setView]=useState('ledger')
  const [selectedYear,setSelectedYear]=useState(2026)
  const [selectedMonth,setSelectedMonth]=useState('')

  async function load(){
    setLoading(true);setError('')
    const [ledgerResult,catalogResult]=await Promise.all([
      supabase.rpc('admin_commercial_ledger'),
      supabase.from('commercial_products').select('code,title,product_type,amount_cents,is_active').order('title')
    ])
    setLoading(false)
    if(ledgerResult.error){setError('Não foi possível carregar o Livro Caixa.');setRows([]);return}
    setRows(Array.isArray(ledgerResult.data)?ledgerResult.data:[])
    if(!catalogResult.error)setProducts(Array.isArray(catalogResult.data)?catalogResult.data:[])
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

  const years=useMemo(()=>{
    const current=new Date().getFullYear()
    const dataYears=rows.map(r=>Number(monthKey(r.purchased_at).slice(0,4))).filter(Boolean)
    return [...new Set([2026,2027,current,...dataYears])].filter(y=>y>=2026).sort((a,b)=>a-b)
  },[rows])
  const yearMonths=useMemo(()=>monthRange(selectedYear),[selectedYear])

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

  const openAdmin=()=>{
    const url=new URL(window.location.href)
    url.searchParams.delete('commercial-ledger')
    url.searchParams.set('open-admin','1')
    window.location.assign(url.pathname+url.search+url.hash)
  }
  // Voltar consulta a origem registrada quando o Livro Caixa foi aberto.
  // Não depende mais de history.back(), que não representa as telas internas do React.
  const goBack=()=>{
    const origin=sessionStorage.getItem(LEDGER_RETURN_KEY)
    sessionStorage.removeItem(LEDGER_RETURN_KEY)
    if(origin==='admin'){openAdmin();return}
    const url=new URL(window.location.href)
    url.searchParams.delete('commercial-ledger')
    window.location.assign(url.pathname+url.search+url.hash)
  }
  const goPanel=()=>{
    sessionStorage.removeItem(LEDGER_RETURN_KEY)
    openAdmin()
  }

  const monthlyRows=useMemo(()=>selectedMonth?rows.filter(r=>monthKey(r.purchased_at)===selectedMonth):[],[rows,selectedMonth])
  const monthlyPaid=monthlyRows.filter(r=>r.status==='paid')
  const monthlyOriginal=monthlyPaid.reduce((s,r)=>s+(Number(r.original_amount_cents)||0),0)
  const monthlyDiscount=monthlyPaid.reduce((s,r)=>s+(Number(r.discount_amount_cents)||0),0)
  const monthlyReceived=monthlyPaid.reduce((s,r)=>s+(Number(r.paid_amount_cents)||0),0)
  const monthlyPending=monthlyRows.filter(r=>r.status==='pending').length
  const monthlyCancelled=monthlyRows.filter(r=>r.status==='cancelled').length
  const productClosing=useMemo(()=>{
    const catalog=new Map(products.map(p=>[p.code,p]))
    monthlyRows.forEach(r=>{if(r.product_code&&!catalog.has(r.product_code))catalog.set(r.product_code,{code:r.product_code,title:r.product_title||r.product_code,product_type:r.product_type||'',amount_cents:r.original_amount_cents||0})})
    return [...catalog.values()].map(product=>{
      const sales=monthlyPaid.filter(r=>r.product_code===product.code)
      return {...product,units:sales.length,full:sales.filter(r=>(Number(r.discount_amount_cents)||0)===0).length,promo:sales.filter(r=>(Number(r.discount_amount_cents)||0)>0).length,discount:sales.reduce((s,r)=>s+(Number(r.discount_amount_cents)||0),0),received:sales.reduce((s,r)=>s+(Number(r.paid_amount_cents)||0),0)}
    }).sort((a,b)=>b.units-a.units||String(a.title).localeCompare(String(b.title),'pt-BR'))
  },[products,monthlyRows,monthlyPaid])

  if(auth==='loading')return <main className="dashboard admin-page"><section className="admin-panel"><p>Validando acesso administrativo…</p></section></main>
  if(auth==='denied')return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Livro Caixa</small></div><div className="header-actions"><button className="logout" onClick={goBack}>← Voltar</button><button className="logout" onClick={goPanel}>Painel</button></div></header><section className="admin-panel"><h1>Acesso restrito</h1><p>Entre com uma conta de administrador para consultar o Livro Caixa.</p></section></main>

  return <main className="dashboard admin-page commercial-ledger-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Livro Caixa · Controle Comercial</small></div><div className="header-actions"><button className="logout" onClick={goBack}>← Voltar</button><button className="logout" onClick={goPanel}>Painel</button></div></header>
    <section className="admin-panel commercial-ledger-native">
      <div className="admin-title"><p className="eyebrow">CONTROLE COMERCIAL</p><h1>Livro Caixa</h1><p>Movimentações individuais e fechamentos organizados por exercício e mês.</p></div>
      <nav className="ledger-view-tabs" aria-label="Visões do Livro Caixa"><button className={view==='ledger'?'active':''} onClick={()=>setView('ledger')}>Movimentações</button><button className={view==='monthly'?'active':''} onClick={()=>{setView('monthly');setSelectedMonth('')}}>Fechamentos</button></nav>
      {view==='ledger'?<>
        <div className="ledger-head"><div><h2>Vendas e recebimentos</h2><p>Consulte comprador, produto, desconto, cupom e valor efetivamente recebido.</p></div><button type="button" onClick={load} disabled={loading}>{loading?'Atualizando…':'Atualizar'}</button></div>
        <div className="ledger-filters"><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar comprador, e-mail, produto ou cupom"/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os status</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="cancelled">Cancelados</option></select><select value={kind} onChange={e=>setKind(e.target.value)}><option value="">Todas as vendas</option><option value="full">Preço normal</option><option value="promo">Com desconto</option></select></div>
        <div className="ledger-kpis"><article><strong>{paid.length}</strong><span>vendas pagas</span></article><article><strong>{money(original)}</strong><span>valor original</span></article><article><strong>{money(discount)}</strong><span>descontos</span></article><article><strong>{money(received)}</strong><span>recebido</span></article></div>
        {error&&<p className="admin-message" role="status">{error}</p>}
        <div className="ledger-table-wrap"><table><thead><tr><th>Data</th><th>Comprador</th><th>Produto</th><th>Venda</th><th>Original</th><th>Desconto</th><th>Pago</th><th>Status</th></tr></thead><tbody>{loading&&!rows.length?<tr><td colSpan="8">Carregando movimentações…</td></tr>:filtered.length?filtered.map(r=>{const promo=(Number(r.discount_amount_cents)||0)>0;return <tr key={r.order_id}><td>{date(r.purchased_at)}</td><td><strong>{r.buyer_name||'Cliente'}</strong><small>{r.buyer_email||''}</small></td><td>{r.product_title||r.product_code||'—'}</td><td>{promo?<span className="ledger-promo">{r.coupon_code||'Desconto'}</span>:'Preço normal'}</td><td>{money(r.original_amount_cents)}</td><td>{money(r.discount_amount_cents)}</td><td><strong>{money(r.paid_amount_cents)}</strong></td><td>{statusLabel[r.status]||r.status||'—'}</td></tr>}):<tr><td colSpan="8">Nenhuma movimentação encontrada.</td></tr>}</tbody></table></div>
      </>:<>
        <div className="ledger-head"><div><h2>Fechamentos mensais</h2><p>Escolha primeiro o ano. Depois abra somente o mês que deseja consultar.</p></div><button type="button" onClick={load} disabled={loading}>{loading?'Atualizando…':'Atualizar'}</button></div>
        <div className="ledger-years">{years.map(year=><button key={year} className={selectedYear===year?'active':''} onClick={()=>{setSelectedYear(year);setSelectedMonth('')}}>{year}</button>)}</div>
        <div className="ledger-months ledger-month-grid">{yearMonths.map(key=><button key={key} className={selectedMonth===key?'active':''} onClick={()=>setSelectedMonth(key)}><strong>{monthName(Number(key.slice(5,7)))}</strong><small>{selectedYear}</small></button>)}</div>
        {!selectedMonth?<div className="ledger-month-placeholder"><strong>{selectedYear}</strong><span>Selecione um mês acima para abrir o relatório de fechamento.</span></div>:<>
          <div className="ledger-open-month-head"><div><p className="eyebrow">FECHAMENTO DO MÊS</p><h2 className="ledger-month-title">{monthLabel(selectedMonth)}</h2></div><button type="button" onClick={()=>setSelectedMonth('')}>Fechar relatório</button></div>
          <div className="ledger-kpis ledger-kpis-month"><article><strong>{monthlyPaid.length}</strong><span>vendas pagas</span></article><article><strong>{money(monthlyOriginal)}</strong><span>valor bruto</span></article><article><strong>{money(monthlyDiscount)}</strong><span>descontos</span></article><article><strong>{money(monthlyReceived)}</strong><span>total recebido</span></article><article><strong>{monthlyPending}</strong><span>pendentes</span></article><article><strong>{monthlyCancelled}</strong><span>canceladas</span></article></div>
          <h3>Fechamento por produto</h3>
          <div className="ledger-table-wrap"><table className="ledger-products-table"><thead><tr><th>Produto</th><th>Unidades pagas</th><th>Preço normal</th><th>Com desconto</th><th>Descontos</th><th>Recebido</th></tr></thead><tbody>{productClosing.length?productClosing.map(p=><tr key={p.code}><td><strong>{p.title||p.code}</strong><small>{p.product_type||p.code}</small></td><td>{p.units}</td><td>{p.full}</td><td>{p.promo}</td><td>{money(p.discount)}</td><td><strong>{money(p.received)}</strong></td></tr>):<tr><td colSpan="6">Nenhum produto cadastrado.</td></tr>}</tbody></table></div>
          <h3 className="ledger-detail-title">Movimentações de {monthLabel(selectedMonth)}</h3>
          <div className="ledger-table-wrap"><table><thead><tr><th>Data</th><th>Comprador</th><th>Produto</th><th>Venda</th><th>Original</th><th>Desconto</th><th>Pago</th><th>Status</th></tr></thead><tbody>{monthlyRows.length?monthlyRows.map(r=>{const promo=(Number(r.discount_amount_cents)||0)>0;return <tr key={r.order_id}><td>{date(r.purchased_at)}</td><td><strong>{r.buyer_name||'Cliente'}</strong><small>{r.buyer_email||''}</small></td><td>{r.product_title||r.product_code||'—'}</td><td>{promo?<span className="ledger-promo">{r.coupon_code||'Desconto'}</span>:'Preço normal'}</td><td>{money(r.original_amount_cents)}</td><td>{money(r.discount_amount_cents)}</td><td><strong>{money(r.paid_amount_cents)}</strong></td><td>{statusLabel[r.status]||r.status||'—'}</td></tr>}):<tr><td colSpan="8">Nenhuma movimentação neste mês.</td></tr>}</tbody></table></div>
        </>}
      </>}
    </section>
  </main>
}
