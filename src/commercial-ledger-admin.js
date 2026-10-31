import { supabase } from './supabaseClient'

const money = value => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(value)||0)/100)
const date = value => value ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : '—'
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

function mount(){
  const host=document.querySelector('.commercial-admin-page .commercial-admin')
  if(!host || document.getElementById('commercial-ledger')) return
  const section=document.createElement('section')
  section.id='commercial-ledger'
  section.className='commercial-ledger'
  section.innerHTML=`<div class="ledger-head"><div><h2>Livro Caixa Comercial</h2><p>Movimentações individuais de vendas e pagamentos.</p></div><button type="button" data-ledger-refresh>Atualizar</button></div><div class="ledger-filters"><input data-ledger-search type="search" placeholder="Buscar comprador, e-mail, produto ou cupom"><select data-ledger-status><option value="">Todos os status</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="cancelled">Cancelados</option></select><select data-ledger-kind><option value="">Todas as vendas</option><option value="full">Preço normal</option><option value="promo">Com desconto</option></select></div><div class="ledger-kpis" data-ledger-kpis></div><div class="ledger-table-wrap"><table><thead><tr><th>Data</th><th>Comprador</th><th>Produto</th><th>Venda</th><th>Original</th><th>Desconto</th><th>Pago</th><th>Status</th></tr></thead><tbody data-ledger-body><tr><td colspan="8">Carregando movimentações…</td></tr></tbody></table></div>`
  const summary=document.querySelector('#commercial-sales-summary')
  if(summary) summary.insertAdjacentElement('afterend',section); else host.prepend(section)
  let rows=[]
  const render=()=>{
    const q=section.querySelector('[data-ledger-search]').value.trim().toLowerCase()
    const status=section.querySelector('[data-ledger-status]').value
    const kind=section.querySelector('[data-ledger-kind]').value
    const filtered=rows.filter(r=>{
      const text=[r.buyer_name,r.buyer_email,r.product_title,r.product_code,r.coupon_code].join(' ').toLowerCase()
      const promo=(Number(r.discount_amount_cents)||0)>0
      return (!q||text.includes(q))&&(!status||r.status===status)&&(!kind||(kind==='promo'?promo:!promo))
    })
    const paid=filtered.filter(r=>r.status==='paid')
    const original=paid.reduce((s,r)=>s+(Number(r.original_amount_cents)||Number(r.amount_cents)||0),0)
    const discount=paid.reduce((s,r)=>s+(Number(r.discount_amount_cents)||0),0)
    const received=paid.reduce((s,r)=>s+(Number(r.amount_cents)||0),0)
    section.querySelector('[data-ledger-kpis]').innerHTML=`<article><strong>${paid.length}</strong><span>vendas pagas</span></article><article><strong>${money(original)}</strong><span>valor original</span></article><article><strong>${money(discount)}</strong><span>descontos</span></article><article><strong>${money(received)}</strong><span>recebido</span></article>`
    section.querySelector('[data-ledger-body]').innerHTML=filtered.length?filtered.map(r=>{const promo=(Number(r.discount_amount_cents)||0)>0;return `<tr><td>${date(r.paid_at||r.created_at)}</td><td><strong>${safe(r.buyer_name||'Cliente')}</strong><small>${safe(r.buyer_email||'')}</small></td><td>${safe(r.product_title||r.product_code||'—')}</td><td>${promo?`<span class="ledger-promo">${safe(r.coupon_code||'Desconto')}</span>`:'Preço normal'}</td><td>${money(r.original_amount_cents||r.amount_cents)}</td><td>${money(r.discount_amount_cents)}</td><td><strong>${money(r.amount_cents)}</strong></td><td>${safe(r.status||'—')}</td></tr>`}).join(''):`<tr><td colspan="8">Nenhuma movimentação encontrada.</td></tr>`
  }
  const load=async()=>{
    section.classList.add('is-loading')
    const {data,error}=await supabase.rpc('admin_commercial_ledger')
    section.classList.remove('is-loading')
    if(error){section.querySelector('[data-ledger-body]').innerHTML='<tr><td colspan="8">Não foi possível carregar o Livro Caixa.</td></tr>';return}
    rows=Array.isArray(data)?data:[];render()
  }
  section.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',render))
  section.querySelector('[data-ledger-refresh]').addEventListener('click',load)
  load()
}

const observer=new MutationObserver(mount)
observer.observe(document.documentElement,{childList:true,subtree:true})
mount()
