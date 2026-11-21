const SHARE_ID='bc-share-app-card'
const OFFICIAL_SITE_URL='https://bibliachimarrao.com.br/'

function appUrl(){return OFFICIAL_SITE_URL}
function messageText(){return 'Conheça o Bíblia + Chimarrão — um espaço de pausa, reflexão e encontro com Deus. Acesse o site oficial: '+appUrl()}

async function shareApp(status){
  const url=appUrl(),text='Conheça o Bíblia + Chimarrão — um espaço de pausa, reflexão e encontro com Deus. Acesse o site oficial.'
  if(navigator.share){
    try{await navigator.share({title:'Bíblia + Chimarrão — Site oficial',text,url});status.textContent='✓ Compartilhamento aberto.';return}catch(error){if(error?.name==='AbortError')return}
  }
  try{await navigator.clipboard.writeText(messageText());status.textContent='✓ Mensagem e link do site oficial copiados. Cole no WhatsApp ou onde desejar.'}
  catch{status.textContent='Acesse o site oficial: '+url}
}

async function copyLink(status){
  try{await navigator.clipboard.writeText(appUrl());status.textContent='✓ Link do site oficial copiado.'}
  catch{status.textContent='Site oficial: '+appUrl()}
}

function mountShareCard(){
  const bottom=document.querySelector('.visual-bottom')
  if(!bottom||document.getElementById(SHARE_ID))return
  const card=document.createElement('section');card.id=SHARE_ID;card.className='bc-share-app-card';card.setAttribute('aria-label','Compartilhe o site oficial Bíblia + Chimarrão')
  const url=appUrl();const qr='https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data='+encodeURIComponent(url)
  card.innerHTML=`<div class="bc-share-copy"><span class="bc-share-icon" aria-hidden="true">↗</span><div><strong>Compartilhe o site oficial Bíblia + Chimarrão</strong><small>Indique para alguém especial. Aponte a câmera para o QR Code ou compartilhe o endereço oficial.</small></div></div><img class="bc-share-qr" src="${qr}" alt="QR Code para acessar o site oficial bibliachimarrao.com.br" loading="lazy" referrerpolicy="no-referrer"/><div class="bc-share-actions"><button type="button" data-share>Compartilhar</button><button type="button" data-copy>Copiar link do site</button></div><p class="bc-share-status" role="status"></p>`
  const status=card.querySelector('.bc-share-status')
  card.querySelector('[data-share]').addEventListener('click',()=>shareApp(status))
  card.querySelector('[data-copy]').addEventListener('click',()=>copyLink(status))
  bottom.appendChild(card)
}

const observer=new MutationObserver(mountShareCard)
observer.observe(document.documentElement,{childList:true,subtree:true})
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountShareCard);else mountShareCard()
