// Correção móvel localizada para o Facebook no PWA/WebView.
// Usa exatamente o link de compartilhamento fornecido pelo autor.
document.addEventListener('click', event => {
  const link = event.target.closest?.('.visual-wide-social .wide-social-hotspots a[aria-label="Facebook"]')
  if (!link) return
  const mobile = window.matchMedia('(max-width: 700px)').matches
  if (!mobile) return
  event.preventDefault()
  window.location.href = 'https://www.facebook.com/share/1C75xenphA/'
}, true)
