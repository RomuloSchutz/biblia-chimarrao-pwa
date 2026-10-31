import { supabase } from './lib/supabase.js'

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((Number(value)||0)/100)
const date=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—'
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const MODE_KEY='bc-commercial-admin-mode'
let menuPrepared=false
let lastAppliedMode=null

function prepareAdminMenu(){
  const panel=document.querySelector('.admin-page .admin-panel')
  if(!panel)return
  const existing=document.querySelector('[data-open-commercial-ledger]')
  if(existing){menuPrepared=true;return}
  const couponButton=[...panel.querySelectorAll('button')].find(b=>b.textContent.includes('Promoções e Cupons'))
  if(!couponButton)return
  couponButton.addEventListener('click',()=>sessionStorage.setItem(MODE_KEY,'coupons'))
  const ledgerButton=document.createElement('button')
  ledgerButton.type='button';ledgerButton.className=couponButton.className;ledgerButton.dataset.openCommercialLedger='true'
  ledgerButton.textContent='📊 Livro Caixa — vendas e controle comercial'
  ledgerButton.addEventListener('click',()=>{sessionStorage.setItem(MODE_KEY,'ledger');couponButton.click()})
  couponButton.insertAdjacentElement('afterend',ledgerButton)
  menuPrepared=true
}

function setHidden(el,hidden){if(el&&el.hidden!==hidden)el.hidden=hidden}
function applyMode(host,section){
  const ledgerMode=sessionStorage.getItem(MODE_KEY)==='ledger'
  if(lastAppliedMode===ledgerMode&&section.hidden===!ledgerMode)return
  const summary=document.querySelector('#commercial-sales-summary')
  setHidden(summary,!ledgerMode)
  setHidden(section,!ledgerMode)
  ;[...host.children].forEach(el=>{
    if(el===summary||el===section)return
    if(el.matches?.('.eyebrow,h1,.coupon-form,.admin-message,h2,.coupon-list'))setHidden(el,ledgerMode)
  })
  const header=document.querySelector('.commercial-admin-page .dash-header small')
  const title=ledgerMode?'Livro Caixa e controle comercial':'Administração comercial'
  if(header&&header.textContent!==title)header.textContent=title
  lastAppliedMode=ledgerMode
}

function mount(){
  if(!menuPrepared)prepareAdminMenu()
  const host=document.querySelector('.commercial-admin-page .commercial-admin')
  if(!host){lastAppliedMode=null;return}
  let section=document.getElementById('commercial-ledger')
  if(section){applyMode(host,section);return}
  section=document.createElement('section');section.id='commercial-ledger';section.className='commercial-ledger'
  section.innerHTML=`<div class="ledger-head"><div><h2>Livro Caixa Comercial</h2><p>Movimentações individuais de vendas e pagamentos.</p></div><button type="button" data-ledger-refresh>Atualizar</button></div><div class="ledger-filters"><input data-ledger-search type="search" placeholder="Buscar comprador, e-mail, produto ou cupom"><select data-ledger-status><option value="">Todos os status</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="cancelled">Cancelados</option></select><select data-ledger-kind><option value="">Todas as vendas</option><option value="full">Preço normal</option><option value="promo">Com desconto</option></select></div><div class="ledger-kpis" data-ledger-kpis></div><div class="ledger-table-wrap"><table><thead><tr><th>Data</th><th>Comprador</th><th>Produto</th><th>Venda</th><th>Original</th><th>Desconto</th><th>Pago</th><th>Status</th></tr></thead><tbody data-ledger-body><tr><td colspan="8">Carregando movimentações…</td></tr></tbody></table></div>`
  const summary=document.querySelector('#commercial-sales-summary')
  if(summary)summary.insertAdjacentElement('afterend',section);else host.prepend(section)
  let rows=[]
  const render=()=>{
    const q=section.querySelector('[data-ledger-search]').value.trim().toLowerCase(),status=section.querySelector('[data-ledger-status]').value,kind=section.querySelector('[data-ledger-kind]').value
    const filtered=rows.filter(r=>{const text=[r.buyer_name,r.buyer_email,r.product_title,r.product_code,r.coupon_code].join(' ').toLowerCase(),promo=(Number(r.discount_amount_cents)||0)>0;return(!q||text.includes(q))&&(!status||r.status===status)&&(!kind||(kind==='promo'?promo:!promo))})
    const paid=filtered.filter(r=>r.status==='paid'),original=paid.reduce((s,r)=>s+(Number(r.original_amount_cents)||0),0),discount=paid.reduce((s,r)=>s+(Number(r.discount_amount_cents)||0),0),received=paid.reduce((s,r)=>s+(Number(r.paid_amount_cents)||0),0)
    section.querySelector('[data-ledger-kpis]').innerHTML=`<article><strong>${paid.length}</strong><span>vendas pagas</span></article><article><strong>${money(original)}</strong><span>valor original</span></article><article><strong>${money(discount)}</strong><span>descontos</span></article><article><strong>${money(received)}</strong><span>recebido</span></article>`
    const statusLabel={paid:'Pago',pending:'Pendente',cancelled:'Cancelado'}
    section.querySelector('[data-ledger-body]').innerHTML=filtered.length?filtered.map(r=>{const promo=(Number(r.discount_amount_cents)||0)>0;return`<tr><td>${date(r.purchased_at)}</td><td><strong>${safe(r.buyer_name||'Cliente')}</strong><small>${safe(r.buyer_email||'')}</small></td><td>${safe(r.product_title||r.product_code||'—')}</td><td>${promo?`<span class="ledger-promo">${safe(r.coupon_code||'Desconto')}</span>`:'Preço normal'}</td><td>${money(r.original_amount_cents)}</td><td>${money(r.discount_amount_cents)}</td><td><strong>${money(r.paid_amount_cents)}</strong></td><td>${safe(statusLabel[r.status]||r.status||'—')}</td></tr>`}).join(''):`<tr><td colspan="8">Nenhuma movimentação encontrada.</td></tr>`
  }
  const load=async()=>{section.classList.add('is-loading');const{data,error}=await supabase.rpc('admin_commercial_ledger');section.classList.remove('is-loading');if(error){section.querySelector('[data-ledger-body]').innerHTML='<tr><td colspan="8">Não foi possível carregar o Livro Caixa.</td></tr>';return}rows=Array.isArray(data)?data:[];render()}
  section.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',render));section.querySelector('[data-ledger-refresh]').addEventListener('click',load)
  applyMode(host,section);load()
}

let mountQueued=false
const queueMount=()=>{if(mountQueued)return;mountQueued=true;requestAnimationFrame(()=>{mountQueued=false;mount()})}
const observer=new MutationObserver(queueMount)
observer.observe(document.documentElement,{childList:true,subtree:true})
mount()
