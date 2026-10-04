// Correção móvel localizada: o Facebook pode não concluir a navegação em alguns PWAs/WebViews.
// Mantém os demais links sociais exatamente como estão.
document.addEventListener('click', event => {
  const link = event.target.closest?.('.visual-wide-social .wide-social-hotspots a[aria-label="Facebook"]')
  if (!link) return
  const mobile = window.matchMedia('(max-width: 700px)').matches
  if (!mobile) return
  event.preventDefault()
  window.location.href = 'https://m.facebook.com/romuloschutz/'
}, true)
