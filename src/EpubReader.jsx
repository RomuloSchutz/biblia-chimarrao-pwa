import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'

export default function EpubReader({ title, epubUrl, onBack }) {
  const host = useRef(null)
  const rendition = useRef(null)
  const [fontSize, setFontSize] = useState(100)
  const [location, setLocation] = useState('')
  const [chapters, setChapters] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!epubUrl || !host.current) { setLoading(false); setError('Arquivo EPUB não encontrado.'); return }
    let cancelled = false
    let book
    try {
      setLoading(true); setError('')
      book = ePub(epubUrl)
      const view = book.renderTo(host.current, { width:'100%', height:'65vh', flow:'paginated' })
      rendition.current = view
      view.themes.fontSize(fontSize + '%')
      view.on('relocated', place => {
        if (cancelled) return
        const href=place?.start?.href || ''
        setLocation(href)
        try { localStorage.setItem('bc-epub-progress:'+title, href) } catch {}
      })
      book.loaded.navigation.then(nav => { if (!cancelled) setChapters(nav.toc || []) }).catch(()=>{})
      const saved=localStorage.getItem('bc-epub-progress:'+title)
      view.display(saved || undefined).then(()=>{if(!cancelled)setLoading(false)}).catch(()=>{if(!cancelled){setLoading(false);setError('Não foi possível abrir este arquivo EPUB.')}})
    } catch {
      setLoading(false); setError('Não foi possível iniciar o leitor.')
    }
    return () => { cancelled=true; rendition.current=null; try{book?.destroy()}catch{} }
  }, [epubUrl,title])

  useEffect(()=>{rendition.current?.themes.fontSize(fontSize+'%')},[fontSize])

  return <main className="dashboard epub-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Leitor digital</small></div><button className="logout" onClick={onBack}>← Minha biblioteca</button></header>
    <section className="epub-panel">
      <p className="eyebrow">LEITURA DIGITAL</p><h2>{title}</h2>
      <div className="epub-toolbar">
        <button onClick={()=>setFontSize(n=>Math.max(75,n-10))} aria-label="Diminuir letra">A−</button>
        <span>Tamanho do texto: {fontSize}%</span>
        <button onClick={()=>setFontSize(n=>Math.min(180,n+10))} aria-label="Aumentar letra">A+</button>
        {chapters.length>0&&<select aria-label="Selecionar capítulo" value={location} onChange={ev=>rendition.current?.display(ev.target.value)}><option value="">Capítulos</option>{chapters.map((chapter,i)=><option key={i} value={chapter.href}>{chapter.label}</option>)}</select>}
      </div>
      {loading&&<p className="epub-notice">Preparando o livro…</p>}
      {error&&<p className="epub-notice" role="alert">{error}</p>}
      <div className="epub-content" ref={host} aria-label="Conteúdo do livro" />
      <div className="epub-navigation"><button onClick={()=>rendition.current?.prev()}>← Página anterior</button><button onClick={()=>rendition.current?.next()}>Próxima página →</button></div>
    </section>
  </main>
}
