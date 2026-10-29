// Notificações funcionam como caixa de entrada pessoal.
// Abrir marca como lida, mas mantém o item visível. Excluir remove somente
// da caixa deste usuário, sem apagar a publicação original do autor.
function notificationStorageKey(kind){
  const userId=Object.keys(localStorage).find(key=>key.startsWith('bc-author-read-')&&!key.includes('reset-'))?.replace('bc-author-read-','')
  return userId?`bc-author-${kind}-${userId}`:null
}

function getDeletedIds(){
  const key=notificationStorageKey('deleted')
  if(!key)return []
  try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}
}

function notificationId(card){
  return card?.dataset?.notificationId||''
}

function syncAuthorNews(){
  const deleted=new Set(getDeletedIds())
  document.querySelectorAll('.author-news-card').forEach(card=>{
    const id=notificationId(card)
    card.hidden=Boolean(id&&deleted.has(id))
    card.setAttribute('aria-hidden',card.hidden?'true':'false')
    if(card.querySelector('.author-news-delete'))return
    const button=document.createElement('button')
    button.type='button'
    button.className='author-news-delete'
    button.textContent='Excluir'
    button.setAttribute('aria-label','Excluir esta notificação')
    button.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation()
      const itemId=notificationId(card)
      const key=notificationStorageKey('deleted')
      if(!itemId||!key)return
      const next=Array.from(new Set([...getDeletedIds(),itemId]))
      localStorage.setItem(key,JSON.stringify(next))
      card.hidden=true
      card.setAttribute('aria-hidden','true')
    })
    card.appendChild(button)
  })
}

let newsSyncQueued=false
const newsObserver=new MutationObserver(()=>{
  if(newsSyncQueued)return
  newsSyncQueued=true
  requestAnimationFrame(()=>{newsSyncQueued=false;syncAuthorNews()})
})
newsObserver.observe(document.documentElement,{childList:true,subtree:true})
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncAuthorNews);else syncAuthorNews()
