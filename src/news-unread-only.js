import { supabase } from './lib/supabase.js'

// Caixa de entrada pessoal das publicações do autor.
// A publicação original nunca é apagada: Excluir grava somente o estado
// individual do leitor em author_notification_state.
let currentUserId=''
let dismissedIds=new Set()
let contentByTitle=new Map()
let stateLoaded=false
let loadingState=null

function cardTitle(card){
  return card?.querySelector('.admin-user-head strong')?.textContent?.trim()||''
}

async function loadNotificationState(force=false){
  if(!supabase)return
  if(loadingState&&!force)return loadingState
  loadingState=(async()=>{
    const {data:sessionData}=await supabase.auth.getSession()
    const user=sessionData?.session?.user
    currentUserId=user?.id||''
    dismissedIds=new Set()
    contentByTitle=new Map()
    if(!currentUserId){stateLoaded=true;return}

    const [contentResult,stateResult]=await Promise.all([
      supabase.from('author_content').select('id,title').eq('is_published',true),
      supabase.from('author_notification_state').select('content_id,dismissed_at').eq('user_id',currentUserId)
    ])

    if(!contentResult.error){
      ;(contentResult.data||[]).forEach(item=>{
        if(item?.id&&item?.title&&!contentByTitle.has(item.title.trim()))contentByTitle.set(item.title.trim(),item.id)
      })
    }
    if(!stateResult.error){
      ;(stateResult.data||[]).forEach(item=>{if(item?.content_id&&item?.dismissed_at)dismissedIds.add(item.content_id)})
    }
    stateLoaded=true
  })().finally(()=>{loadingState=null})
  return loadingState
}

async function dismissNotification(card,control){
  if(!supabase)return
  if(!stateLoaded)await loadNotificationState()
  if(!currentUserId)await loadNotificationState(true)
  const title=cardTitle(card)
  let contentId=card?.dataset?.notificationId||contentByTitle.get(title)||''

  // Fallback seguro caso uma publicação tenha surgido depois do carregamento inicial.
  if(!contentId&&title){
    const {data,error}=await supabase.from('author_content').select('id').eq('is_published',true).eq('title',title).limit(1).maybeSingle()
    if(!error&&data?.id){contentId=data.id;contentByTitle.set(title,data.id)}
  }
  if(!contentId||!currentUserId)return

  if(control){control.setAttribute('aria-disabled','true');control.textContent='Excluindo...'}
  const now=new Date().toISOString()
  const {error}=await supabase.from('author_notification_state').upsert({
    user_id:currentUserId,
    content_id:contentId,
    dismissed_at:now,
    updated_at:now
  },{onConflict:'user_id,content_id'})

  if(error){
    console.info('Não foi possível excluir a notificação:',error)
    if(control){control.removeAttribute('aria-disabled');control.textContent='Excluir'}
    return
  }

  dismissedIds.add(contentId)
  card.hidden=true
  card.setAttribute('aria-hidden','true')
}

function syncAuthorNews(){
  document.querySelectorAll('.author-news-card').forEach(card=>{
    const title=cardTitle(card)
    const contentId=contentByTitle.get(title)||card.dataset.notificationId||''
    if(contentId)card.dataset.notificationId=contentId
    card.hidden=Boolean(contentId&&dismissedIds.has(contentId))
    card.setAttribute('aria-hidden',card.hidden?'true':'false')
    if(card.querySelector('.author-news-delete'))return

    // O card React é um <button>; por isso o controle é um span com semântica
    // de botão, evitando HTML inválido de botão dentro de botão.
    const control=document.createElement('span')
    control.className='author-news-delete'
    control.textContent='Excluir'
    control.setAttribute('role','button')
    control.setAttribute('tabindex','0')
    control.setAttribute('aria-label','Excluir esta notificação')

    const remove=event=>{
      event.preventDefault();event.stopPropagation()
      if(control.getAttribute('aria-disabled')==='true')return
      dismissNotification(card,control)
    }
    control.addEventListener('click',remove)
    control.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();remove(event)}
    })
    card.appendChild(control)
  })
}

let newsSyncQueued=false
const newsObserver=new MutationObserver(()=>{
  if(newsSyncQueued)return
  newsSyncQueued=true
  requestAnimationFrame(()=>{newsSyncQueued=false;syncAuthorNews()})
})
newsObserver.observe(document.documentElement,{childList:true,subtree:true})

async function startAuthorNews(){
  await loadNotificationState()
  syncAuthorNews()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startAuthorNews);else startAuthorNews()

supabase?.auth?.onAuthStateChange(()=>{
  stateLoaded=false
  loadNotificationState(true).then(syncAuthorNews)
})
