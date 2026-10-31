import { supabase } from './lib/supabase.js'

const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(cents)||0)/100)
let loading=false

function periodStart(period){
  const now=new Date()
  if(period==='today')return new Date(now.getFullYear(),now.getMonth(),now.getDate())
  if(period==='month')return new Date(now.getFullYear(),now.getMonth(),1)
  if(period==='year')return new Date(now.getFullYear(),0,1)
  return null
}

async function loadSummary(period='all'){
  const start=periodStart(period)
  let ordersQuery=supabase.from('orders').select('id,product_code,status,amount_cents,original_amount_cents,discount_amount_cents,coupon_code,created_at,paid_at')
  if(start)ordersQuery=ordersQuery.gte('created_at',start.toISOString())
  const [ordersResult,productsResult]=await Promise.all([
    ordersQuery.order('created_at',{ascending:false}),
    supabase.from('commercial_products').select('code,title,product_type,amount_cents').order('title')
  ])
  if(ordersResult.error)throw ordersResult.error
  if(productsResult.error)throw productsResult.error
  const orders=ordersResult.data||[]
  const products=productsResult.data||[]
  const rows=products.map(product=>{
    const own=orders.filter(o=>o.product_code===product.code)
    const paid=own.filter(o=>o.status==='paid')
    const pending=own.filter(o=>o.status==='pending')
    const cancelled=own.filter(o=>['cancelled','failed','refunded'].includes(o.status))
    const original=paid.reduce((sum,o)=>sum+(Number(o.original_amount_cents)||Number(o.amount_cents)||0),0)
    const discount=paid.reduce((sum,o)=>sum+(Number(o.discount_amount_cents)||0),0)
    const received=paid.reduce((sum,o)=>sum+(Number(o.amount_cents)||0),0)
    const promo=paid.filter(o=>(Number(o.discount_amount_cents)||0)>0).length
    return {...product,paid:paid.length,pending:pending.length,cancelled:cancelled.length,promo,original,discount,received}
  })
  const totals=rows.reduce((t,r)=>({paid:t.paid+r.paid,pending:t.pending+r.pending,cancelled:t.cancelled+r.cancelled,promo:t.promo+r.promo,original:t.original+r.original,discount:t.discount+r.discount,received:t.received+r.received}),{paid:0,pending:0,cancelled:0,promo:0,original:0,discount:0,received:0})
  return {rows,totals}
}

function ensureStyles(){
  if(document.getElementById('commercial-sales-summary-style'))return
  const style=document.createElement('style')
  style.id='commercial-sales-summary-style'
  style.textContent=`.sales-summary{margin:18px 0 28px;padding:18px;border:1px solid rgba(185,139,63,.45);border-radius:16px;background:rgba(7,28,23,.5)}.sales-summary-head{display:flex;align-items:end;justify-content:space-between;gap:12px;flex-wrap:wrap}.sales-summary h2{margin:.15em 0}.sales-period{display:flex;gap:6px;flex-wrap:wrap}.sales-period button{padding:8px 12px}.sales-period button.active{outline:2px solid rgba(218,172,88,.8)}.sales-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}.sales-kpi{padding:13px;border-radius:12px;background:rgba(185,139,63,.1)}.sales-kpi strong,.sales-kpi small{display:block}.sales-kpi strong{font-size:1.25rem}.sales-products{display:grid;gap:10px}.sales-product{padding:14px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(185,139,63,.2)}.sales-product h3{margin:0 0 10px;font-size:1.08rem}.sales-product-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.sales-product-grid span{font-size:.82rem;opacity:.78;display:block}.sales-product-grid strong{display:block;margin-top:3px}.sales-note{opacity:.78;font-size:.9rem;margin-top:12px}@media(max-width:760px){.sales-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.sales-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`
  document.head.appendChild(style)
}

function render(root,data,period){
  root.innerHTML=`<div class="sales-summary-head"><div><p class="eyebrow">CONTROLE DE VENDAS</p><h2>Resumo Comercial</h2></div><div class="sales-period" aria-label="Período"><button data-period="today">Hoje</button><button data-period="month">Mês</button><button data-period="year">Ano</button><button data-period="all">Tudo</button></div></div><div class="sales-kpis"><div class="sales-kpi"><strong>${data.totals.paid}</strong><small>Vendas pagas</small></div><div class="sales-kpi"><strong>${money(data.totals.original)}</strong><small>Valor original</small></div><div class="sales-kpi"><strong>${money(data.totals.discount)}</strong><small>Descontos concedidos</small></div><div class="sales-kpi"><strong>${money(data.totals.received)}</strong><small>Receita recebida</small></div></div><div class="sales-products">${data.rows.map(r=>`<article class="sales-product"><h3>${r.title}</h3><div class="sales-product-grid"><div><span>Pagos</span><strong>${r.paid}</strong></div><div><span>Com desconto</span><strong>${r.promo}</strong></div><div><span>Pendentes</span><strong>${r.pending}</strong></div><div><span>Cancelados</span><strong>${r.cancelled}</strong></div><div><span>Descontos</span><strong>${money(r.discount)}</strong></div><div><span>Receita</span><strong>${money(r.received)}</strong></div></div></article>`).join('')}</div><p class="sales-note">Somente pedidos pagos entram na receita. Acessos gratuitos, institucionais ou concedidos manualmente não são contabilizados como venda.</p>`
  root.querySelectorAll('[data-period]').forEach(btn=>{
    if(btn.dataset.period===period)btn.classList.add('active')
    btn.addEventListener('click',()=>refresh(root,btn.dataset.period))
  })
}

async function refresh(root,period='all'){
  if(loading)return
  loading=true
  root.innerHTML='<p>Atualizando resumo comercial...</p>'
  try{render(root,await loadSummary(period),period)}catch(error){root.innerHTML=`<p>Não foi possível carregar o resumo comercial: ${error.message||'erro inesperado'}</p>`}finally{loading=false}
}

function mount(){
  ensureStyles()
  const page=document.querySelector('.commercial-admin-page .commercial-admin')
  if(!page||page.querySelector('[data-sales-summary]'))return
  const root=document.createElement('section')
  root.className='sales-summary'
  root.dataset.salesSummary='1'
  const campaignsHeading=[...page.querySelectorAll('h2')].find(h=>h.textContent?.includes('Campanhas cadastradas'))
  if(campaignsHeading)page.insertBefore(root,campaignsHeading)
  else page.appendChild(root)
  refresh(root,'all')
}

const observer=new MutationObserver(()=>mount())
window.addEventListener('DOMContentLoaded',()=>{
  observer.observe(document.body,{childList:true,subtree:true})
  mount()
})
