import { supabase } from './lib/supabase.js'

// No painel comercial, "Excluir" significa arquivar: a campanha sai da lista,
// mas compras/redemptions permanecem preservadas para histórico financeiro.
const archivedCodes=new Set()
let loading=false

async function refreshArchived(){
  if(loading||!supabase)return
  loading=true
  try{
    const {data,error}=await supabase.from('commercial_coupons').select('code').not('archived_at','is',null)
    if(!error){archivedCodes.clear();(data||[]).forEach(row=>archivedCodes.add(row.code))}
  }finally{loading=false;decorate()}
}

async function archiveCoupon(code,card,button){
  if(!code||!supabase)return
  const ok=window.confirm(`Excluir o cupom ${code} da lista?\n\nO histórico de compras e receita será preservado.`)
  if(!ok)return
  button.disabled=true
  button.textContent='Excluindo...'
  const {error}=await supabase.from('commercial_coupons').update({is_active:false,archived_at:new Date().toISOString()}).eq('code',code)
  if(error){button.disabled=false;button.textContent='Excluir';window.alert('Não foi possível excluir o cupom: '+error.message);return}
  archivedCodes.add(code)
  card.remove()
}

function decorate(){
  document.querySelectorAll('.commercial-admin-page .coupon-card').forEach(card=>{
    const code=card.querySelector('.coupon-code')?.textContent?.trim()
    if(!code)return
    if(archivedCodes.has(code)){card.remove();return}
    const actions=card.querySelector('.coupon-actions')
    if(!actions||actions.querySelector('[data-coupon-archive]'))return
    const button=document.createElement('button')
    button.type='button'
    button.dataset.couponArchive='1'
    button.textContent='Excluir'
    button.setAttribute('aria-label',`Excluir cupom ${code}`)
    button.addEventListener('click',()=>archiveCoupon(code,card,button))
    actions.appendChild(button)
  })
}

const observer=new MutationObserver(()=>decorate())
window.addEventListener('DOMContentLoaded',()=>{
  observer.observe(document.body,{childList:true,subtree:true})
  refreshArchived()
  decorate()
})
