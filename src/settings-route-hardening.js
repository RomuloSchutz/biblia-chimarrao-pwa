// A tela de configurações usa uma rota isolada para evitar que falhas em módulos
// pesados do dashboard derrubem a área de conta no navegador móvel.
document.addEventListener('click',event=>{
  const button=event.target.closest?.('button')
  if(!button)return
  const text=(button.textContent||'').replace(/\s+/g,' ').trim()
  if(!text.includes('Configurações'))return
  if(new URLSearchParams(window.location.search).get('reader-settings')==='1')return
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.()
  const url=new URL(window.location.href)
  url.search='';url.searchParams.set('reader-settings','1')
  window.location.href=url.toString()
},true)
