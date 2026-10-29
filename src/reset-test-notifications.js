// Migração única de 29/10/2026: as notificações anteriores eram somente de teste.
// Remove apenas o histórico local de leitura; não apaga publicações do autor.
const RESET_KEY='bc-author-read-reset-2026-10-29-v1'

if(!localStorage.getItem(RESET_KEY)){
  Object.keys(localStorage).forEach(key=>{
    if(key.startsWith('bc-author-read-')) localStorage.removeItem(key)
  })
  localStorage.setItem(RESET_KEY,'1')
}
