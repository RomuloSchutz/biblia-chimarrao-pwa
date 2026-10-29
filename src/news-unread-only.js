// Notificações funcionam como caixa de entrada pessoal.
// Abrir marca como lida, mas mantém o item visível. Excluir remove somente
// da caixa deste usuário, sem apagar a publicação original do autor.
function notificationStorageKey(kind){
  const userId=Object.keys(localStorage).find(key=>key.startsWith('bc-author-read-')&&!key.includes('reset-'))?.replace('bc-author-read-','')
  return userId?`bc-author-${kind}-${userId}`:`bc-author-${kind}-session`
}

function getDeletedIds(){
  const key=notificationStorageKey('deleted')
  try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}
}

// Os cards React atuais não expõem o UUID da publicação no DOM.
// Até o componente receber esse atributo, usamos uma assinatura estável do
// próprio conteúdo visível para identificar a notificação neste dispositivo.
function notificationId(card){
  const explicit=card?.dataset?.notificationId
  if(explicit)return explicit
  const title=card?.querySelector('.admin-user-head strong')?.textContent?.trim()||''
  const theme=card?.querySelector('.admin-user-head small')?.textContent?.trim()||''
  const quote=card?.querySelector('blockquote')?.textContent?.trim()||''
  return [title,theme,quote].join('|')
}

function syncAuthorNews(){
  const deleted=new Set(getDeletedIds())
  document.querySelectorAll('.author-news-card').forEach(card=>{
    const id=notificationId(card)
    card.hidden=Boolean(id&&deleted.has(id))
    card.setAttribute('aria-hidden',card.hidden?'true':'false')
    if(card.querySelector('.author-news-delete'))return

    // Evita <button> dentro de <button>, que é HTML inválido e pode impedir
    // o clique em alguns navegadores móveis.
    const button=document.createElement('span')
    button.className='author-news-delete'
    button.textContent='Excluir'
    button.setAttribute('role','button')
    button.setAttribute('tabindex','0')
    button.setAttribute('aria-label','Excluir esta notificação')

    const remove=event=>{
      event.preventDefault();event.stopPropagation()
      const itemId=notificationId(card)
      if(!itemId)return
      const key=notificationStorageKey('deleted')
      const next=Array.from(new Set([...getDeletedIds(),itemId]))
      localStorage.setItem(key,JSON.stringify(next))
      card.hidden=true
      card.setAttribute('aria-hidden','true')
    }
    button.addEventListener('click',remove)
    button.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();remove(event)}
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
