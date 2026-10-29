// A tela Notificações é uma caixa de entrada: conteúdos já abertos continuam
// publicados em suas áreas originais, mas deixam de ocupar a lista de novidades.
function syncUnreadAuthorNews(){
  document.querySelectorAll('.author-news-card').forEach(card=>{
    const unread=Boolean(card.querySelector('.admin-status.active'))
    card.hidden=!unread
    card.setAttribute('aria-hidden',unread?'false':'true')
  })
}

let newsSyncQueued=false
const newsObserver=new MutationObserver(()=>{
  if(newsSyncQueued)return
  newsSyncQueued=true
  requestAnimationFrame(()=>{newsSyncQueued=false;syncUnreadAuthorNews()})
})
newsObserver.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncUnreadAuthorNews);else syncUnreadAuthorNews()
