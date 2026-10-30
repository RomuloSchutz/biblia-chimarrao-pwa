import { supabase } from './lib/supabase.js'

// Caixa de entrada pessoal das publicações do autor.
// Conteúdos anteriores à implantação definitiva das notificações continuam
// publicados em suas áreas originais, mas não entram na caixa de novidades.
const NOTIFICATION_CUTOFF=new Date('2026-10-30T01:20:00Z').getTime()

let currentUserId=''
let dismissedIds=new Set()
let contentByTitle=new Map()
let historicalTitles=new Set()
let stateLoaded=false
let loadingState=null

function cardTitle(card){
  return card?.querySelector('.admin-user-head strong')?.textContent?.trim()||''
}

function hideCard(card){
  if(!card)return
  card.hidden=true
  card.setAttribute('aria-hidden','true')
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
    historicalTitles=new Set()
    if(!currentUserId){stateLoaded=true;return}

    const [contentResult,stateResult]=await Promise.all([
      supabase.from('author_content').select('id,title,published_at,created_at').eq('is_published',true),
      supabase.from('author_notification_state').select('content_id,dismissed_at').eq('user_id',currentUserId)
    ])

    if(!contentResult.error){
      ;(contentResult.data||[]).forEach(item=>{
        const title=item?.title?.trim()
        if(!item?.id||!title)return
        if(!contentByTitle.has(title))contentByTitle.set(title,item.id)
        const stamp=Date.parse(item.published_at||item.created_at||'')
        if(Number.isFinite(stamp)&&stamp<NOTIFICATION_CUTOFF)historicalTitles.add(title)
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

  if(!contentId&&title){
    const {data,error}=await supabase.from('author_content').select('id').eq('is_published',true).eq('title',title).limit(1).maybeSingle()
    if(!error&&data?.id){contentId=data.id;contentByTitle.set(title,data.id)}
  }
  if(!contentId||!currentUserId){
    if(control){control.removeAttribute('aria-disabled');control.textContent='Excluir'}
    return
  }

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
  // Não remova nós criados pelo React. Remoção manual quebrava a reconciliação
  // ao sair da tela e deixava somente o fundo marrom. Ocultar preserva o DOM.
  hideCard(card)
}

function syncAuthorNews(){
  document.querySelectorAll('.author-news-card').forEach(card=>{
    const title=cardTitle(card)
    const contentId=contentByTitle.get(title)||card.dataset.notificationId||''
    if(contentId)card.dataset.notificationId=contentId

    // Corte único de implantação: publicações antigas não são notificações.
    if(historicalTitles.has(title)){
      hideCard(card)
      return
    }

    if(contentId&&dismissedIds.has(contentId)){
      hideCard(card)
      return
    }

    card.hidden=false
    card.setAttribute('aria-hidden','false')
    if(card.querySelector('.author-news-delete'))return

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
