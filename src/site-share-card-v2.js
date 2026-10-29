const SITE_SHARE_ID='bc-share-site-card-v2'
const SITE_URL='https://bibliachimarrao.com.br/'

function siteMessage(){return 'Conheça o site oficial Bíblia + Chimarrão — livros, projeto e novidades. Acesse aqui: '+SITE_URL}

async function shareSite(status){
  if(navigator.share){
    try{await navigator.share({title:'Bíblia + Chimarrão — Site oficial',text:'Conheça o site oficial Bíblia + Chimarrão.',url:SITE_URL});status.textContent='✓ Compartilhamento aberto.';return}catch(error){if(error?.name==='AbortError')return}
  }
  try{await navigator.clipboard.writeText(siteMessage());status.textContent='✓ Link e mensagem copiados. Cole no WhatsApp ou onde desejar.'}
  catch{status.textContent='Site oficial: '+SITE_URL}
}

async function copySite(status){
  try{await navigator.clipboard.writeText(SITE_URL);status.textContent='✓ Link do site copiado.'}
  catch{status.textContent='Site oficial: '+SITE_URL}
}

function mountSiteShareCard(){
  const appCard=document.getElementById('bc-share-app-card')
  if(!appCard||document.getElementById(SITE_SHARE_ID))return
  const card=document.createElement('section')
  card.id=SITE_SHARE_ID
  card.className='bc-share-app-card bc-share-site-card-v2'
  card.setAttribute('aria-label','Conheça e compartilhe o site oficial Bíblia + Chimarrão')
  const qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data='+encodeURIComponent(SITE_URL)
  card.innerHTML=`<div class="bc-share-copy"><span class="bc-share-icon" aria-hidden="true">↗</span><div><strong>Conheça o site oficial</strong><small>Apresente o projeto, os livros e as novidades. Aponte a câmera para o QR Code ou compartilhe o link.</small></div></div><img class="bc-share-qr" src="${qr}" alt="QR Code para acessar o site oficial Bíblia + Chimarrão" loading="lazy" referrerpolicy="no-referrer"/><div class="bc-share-actions"><button type="button" data-share-site>Compartilhar</button><button type="button" data-copy-site>Copiar link</button></div><p class="bc-share-status" role="status"></p>`
  const status=card.querySelector('.bc-share-status')
  card.querySelector('[data-share-site]').addEventListener('click',()=>shareSite(status))
  card.querySelector('[data-copy-site]').addEventListener('click',()=>copySite(status))
  appCard.insertAdjacentElement('afterend',card)
}

const siteShareObserver=new MutationObserver(mountSiteShareCard)
siteShareObserver.observe(document.documentElement,{childList:true,subtree:true})
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSiteShareCard);else mountSiteShareCard()
