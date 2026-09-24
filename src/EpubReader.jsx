import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { supabase } from './lib/supabase.js'

// The EPUB URL must be supplied only after the server has verified access.
// Never use a public bucket URL for paid books.
export default function EpubReader({ title, onBack }) {
  const [epubUrl, setEpubUrl] = useState(null)
  const [checking, setChecking] = useState(true)
  const [availability, setAvailability] = useState('')

  useEffect(() => {
    let active = true
    let localUrl = null
    async function loadAuthorizedBook() {
      setChecking(true)
      setAvailability('')
      setEpubUrl(null)
      try {
        const { data: sessionData, error: authError } = await supabase.auth.getUser()
        if (authError || !sessionData.user) throw new Error('Entre na sua conta para acessar a biblioteca.')
        // Row-level security returns only available books owned by this reader.
        const { data: record, error: queryError } = await supabase.from('digital_books')
          .select('storage_path,title').eq('title',title).maybeSingle()
        if (queryError) throw queryError
        if (!record) {
          if (active) setAvailability('O EPUB ainda não está disponível nesta conta. Quando o arquivo for publicado e seu acesso estiver autorizado, ele aparecerá aqui.')
          return
        }
        // Download with the current user's JWT. No public or shareable signed URL.
        const { data: file, error: downloadError } = await supabase.storage.from('paid-epubs').download(record.storage_path)
        if (downloadError || !file) throw downloadError || new Error('Falha ao carregar o arquivo.')
        if (!active) return
        localUrl = URL.createObjectURL(file)
        setEpubUrl(localUrl)
      } catch (err) {
        if (active) setAvailability(err?.message || 'Não foi possível verificar seu acesso.')
      } finally {
        if (active) setChecking(false)
      }
    }
    if (supabase) loadAuthorizedBook()
    else { setAvailability('Biblioteca temporariamente indisponível.'); setChecking(false) }
    return () => { active = false; if (localUrl) URL.revokeObjectURL(localUrl) }
  }, [title])

  const host = useRef(null)
  const rendition = useRef(null)
  const bookRef = useRef(null)
  const [fontSize, setFontSize] = useState(100)
  const [location, setLocation] = useState('')
  const [chapters, setChapters] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!epubUrl || !host.current) return
    let cancelled = false
    let book
    try {
      setError('')
      book = ePub(epubUrl)
      bookRef.current = book
      const view = book.renderTo(host.current, { width: '100%', height: '65vh', flow: 'paginated' })
      rendition.current = view
      view.themes.fontSize(fontSize + '%')
      view.on('relocated', place => { if (!cancelled) setLocation(place?.start?.href || '') })
      book.loaded.navigation.then(nav => {
        if (!cancelled) setChapters(nav.toc || [])
      }).catch(() => {})
      view.display().catch(() => { if (!cancelled) setError('Não foi possível abrir este arquivo EPUB.') })
    } catch {
      setError('Não foi possível iniciar o leitor.')
    }
    return () => {
      cancelled = true
      rendition.current = null
      bookRef.current = null
      try { book?.destroy() } catch { /* cleanup */ }
    }
  }, [epubUrl])

  useEffect(() => {
    rendition.current?.themes.fontSize(fontSize + '%')
  }, [fontSize])

  return <main className="dashboard epub-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Leitor digital</small></div><button className="logout" onClick={onBack}>← Minha biblioteca</button></header>
    <section className="epub-panel">
      <p className="eyebrow">LEITURA DIGITAL</p><h2>{title}</h2>
      {!epubUrl ? <div className="epub-notice"><h3>{checking ? 'Verificando seu acesso...' : 'Leitor preparado'}</h3><p>{checking ? 'Consultando sua biblioteca particular.' : availability || 'A leitura estará disponível após a publicação do EPUB e a autorização da sua conta.'} Nenhuma compra está sendo realizada nesta tela.</p></div> : <>
        <div className="epub-toolbar">
          <button onClick={() => setFontSize(n => Math.max(75,n-10))} aria-label="Diminuir letra">A−</button>
          <span>Tamanho do texto: {fontSize}%</span>
          <button onClick={() => setFontSize(n => Math.min(180,n+10))} aria-label="Aumentar letra">A+</button>
          {chapters.length > 0 && <select aria-label="Selecionar capítulo" value={location} onChange={e => rendition.current?.display(e.target.value)}><option value="">Capítulos</option>{chapters.map((chapter,i)=><option key={i} value={chapter.href}>{chapter.label}</option>)}</select>}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="epub-content" ref={host} aria-label="Conteúdo do livro" />
        <div className="epub-navigation"><button onClick={() => rendition.current?.prev()}>← Página anterior</button><button onClick={() => rendition.current?.next()}>Próxima página →</button></div>
      </>}
    </section>
  </main>
}
