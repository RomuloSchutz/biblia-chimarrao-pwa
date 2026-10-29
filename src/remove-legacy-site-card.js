// O novo card do site oficial foi aprovado. Mantemos o componente legado no JSX
// por segurança de histórico, mas ele não é mais exibido no dashboard.
function removeLegacySiteShareCard(){
  document.querySelectorAll('.dashboard-site-share').forEach(card=>card.remove())
}

const legacySiteCardObserver=new MutationObserver(removeLegacySiteShareCard)
legacySiteCardObserver.observe(document.documentElement,{childList:true,subtree:true})
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeLegacySiteShareCard);else removeLegacySiteShareCard()
