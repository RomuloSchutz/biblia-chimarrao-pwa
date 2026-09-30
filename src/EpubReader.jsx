import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'

const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
const voiceLooksFemale=name=>/female|femin|luciana|francisca|maria|helena|leticia|camila|vitoria|brenda/i.test(name||'')
const voiceLooksMale=name=>/male|mascul|antonio|daniel|felipe|ricardo|thiago|paulo/i.test(name||'')

export default function EpubReader({ title, epubUrl, onBack }) {
  const host=useRef(null), rendition=useRef(null), bookRef=useRef(null)
  const [fontSize,setFontSize]=useState(100), [location,setLocation]=useState(''), [chapters,setChapters]=useState([])
  const [error,setError]=useState(''), [loading,setLoading]=useState(true)
  const [bookmarks,setBookmarks]=useState(()=>readJson('bc-epub-bookmarks:'+title,[]))
  const [highlights,setHighlights]=useState(()=>readJson('bc-epub-highlights:'+title,[]))
  const [audioState,setAudioState]=useState('parado'), [audioVoice,setAudioVoice]=useState('masculina')

  const saveBookmarks=items=>{setBookmarks(items);localStorage.setItem('bc-epub-bookmarks:'+title,JSON.stringify(items))}
  const saveHighlights=items=>{setHighlights(items);localStorage.setItem('bc-epub-highlights:'+title,JSON.stringify(items))}

  useEffect(()=>{
    if(!epubUrl||!host.current){setLoading(false);setError('Arquivo EPUB não encontrado.');return}
    let cancelled=false, book
    try{
      setLoading(true);setError(''); book=ePub(epubUrl); bookRef.current=book
      const view=book.renderTo(host.current,{width:'100%',height:'76vh',flow:'paginated'}); rendition.current=view
      view.themes.fontSize(fontSize+'%')
      view.on('relocated',place=>{if(cancelled)return;const href=place?.start?.href||'';setLocation(href);try{localStorage.setItem('bc-epub-progress:'+title,place?.start?.cfi||href)}catch{}})
      view.on('selected',(cfiRange,contents)=>{
        const text=contents?.window?.getSelection?.()?.toString?.().trim()||''
        if(text&&confirm('Sublinhar este trecho e guardar em “Marcações do livro”?')){
          const item={cfi:cfiRange,text:text.slice(0,500),createdAt:Date.now()}
          const next=[...readJson('bc-epub-highlights:'+title,[]),item]; saveHighlights(next)
          try{view.annotations.highlight(cfiRange,{},undefined,'bc-highlight',{fill:'#e3b341','fill-opacity':'0.38','mix-blend-mode':'multiply'})}catch{}
          try{contents.window.getSelection().removeAllRanges()}catch{}
        }
      })
      book.loaded.navigation.then(nav=>{if(!cancelled)setChapters(nav.toc||[])}).catch(()=>{})
      const saved=localStorage.getItem('bc-epub-progress:'+title)
      view.display(saved||undefined).then(()=>{
        if(cancelled)return
        setLoading(false)
        readJson('bc-epub-highlights:'+title,[]).forEach(h=>{try{view.annotations.highlight(h.cfi,{},undefined,'bc-highlight',{fill:'#e3b341','fill-opacity':'0.38','mix-blend-mode':'multiply'})}catch{}})
      }).catch(()=>{if(!cancelled){setLoading(false);setError('Não foi possível abrir este arquivo EPUB.')}})
    }catch{setLoading(false);setError('Não foi possível iniciar o leitor.')}
    return()=>{cancelled=true;window.speechSynthesis?.cancel();rendition.current=null;bookRef.current=null;try{book?.destroy()}catch{}}
  },[epubUrl,title])

  useEffect(()=>{rendition.current?.themes.fontSize(fontSize+'%')},[fontSize])

  const addBookmark=()=>{
    const current=rendition.current?.currentLocation?.(); const cfi=current?.start?.cfi
    if(!cfi)return
    if(bookmarks.some(b=>b.cfi===cfi))return
    const label='Página marcada · '+new Date().toLocaleDateString('pt-BR')
    saveBookmarks([...bookmarks,{cfi,label,createdAt:Date.now()}])
  }
  const removeBookmark=cfi=>saveBookmarks(bookmarks.filter(b=>b.cfi!==cfi))
  const removeHighlight=cfi=>{try{rendition.current?.annotations.remove(cfi,'highlight')}catch{};saveHighlights(highlights.filter(h=>h.cfi!==cfi))}
  const speak=()=>{
    if(!('speechSynthesis'in window)){setError('A leitura em voz alta não é suportada neste navegador.');return}
    if(audioState==='tocando'){speechSynthesis.pause();setAudioState('pausado');return}
    if(audioState==='pausado'){speechSynthesis.resume();setAudioState('tocando');return}
    const contents=rendition.current?.getContents?.()||[]
    const text=contents.map(c=>c.document?.body?.innerText||'').join(' ').replace(/\s+/g,' ').trim()
    if(!text){setError('Não encontrei texto nesta página para leitura em voz alta.');return}
    const utter=new SpeechSynthesisUtterance(text); utter.lang='pt-BR'; utter.rate=.92
    const voices=speechSynthesis.getVoices().filter(v=>/^pt(-|_)/i.test(v.lang)||/portugu/i.test(v.lang))
    const preferred=voices.find(v=>audioVoice==='feminina'?voiceLooksFemale(v.name):voiceLooksMale(v.name))||voices[audioVoice==='feminina'?1:0]||voices[0]
    if(preferred)utter.voice=preferred
    utter.onend=()=>setAudioState('parado'); utter.onerror=()=>setAudioState('parado')
    speechSynthesis.cancel();speechSynthesis.speak(utter);setAudioState('tocando')
  }
  const stopAudio=()=>{speechSynthesis?.cancel();setAudioState('parado')}

  return <main className="dashboard epub-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Leitor digital</small></div><button className="logout" onClick={onBack}>← Minha biblioteca</button></header>
    <section className="epub-panel">
      <p className="eyebrow">LEITURA DIGITAL</p><h2>{title}</h2>
      <div className="epub-toolbar">
        <button onClick={()=>setFontSize(n=>Math.max(75,n-10))}>A−</button><span>Tamanho do texto: {fontSize}%</span><button onClick={()=>setFontSize(n=>Math.min(180,n+10))}>A+</button>
        {chapters.length>0&&<select aria-label="Selecionar capítulo" value={location} onChange={ev=>rendition.current?.display(ev.target.value)}><option value="">Capítulos</option>{chapters.map((chapter,i)=><option key={i} value={chapter.href}>{chapter.label}</option>)}</select>}
      </div>
      <div className="epub-tools" aria-label="Ferramentas do livro">
        <button onClick={addBookmark}>🔖 Favoritar página</button>
        <label>Áudio <select value={audioVoice} onChange={e=>{stopAudio();setAudioVoice(e.target.value)}}><option value="masculina">Voz masculina</option><option value="feminina">Voz feminina</option></select></label>
        <button onClick={speak}>{audioState==='tocando'?'⏸ Pausar':audioState==='pausado'?'▶ Continuar':'🔊 Ouvir página'}</button>
        {audioState!=='parado'&&<button onClick={stopAudio}>■ Parar</button>}
      </div>
      <p className="epub-tip">Para sublinhar uma frase, selecione o trecho dentro do livro e confirme a marcação.</p>
      {loading&&<p className="epub-notice">Preparando o livro…</p>}{error&&<p className="epub-notice" role="alert">{error}</p>}
      <div className="epub-content" ref={host} aria-label="Conteúdo do livro" />
      <div className="epub-navigation"><button onClick={()=>rendition.current?.prev()}>← Página anterior</button><button onClick={()=>rendition.current?.next()}>Próxima página →</button></div>
      {(bookmarks.length>0||highlights.length>0)&&<section className="epub-marks"><h3>Marcações deste livro</h3>
        {bookmarks.map((b,i)=><div className="epub-mark" key={b.cfi}><button onClick={()=>rendition.current?.display(b.cfi)}>🔖 Favorito {i+1}</button><button className="mark-remove" onClick={()=>removeBookmark(b.cfi)}>Remover</button></div>)}
        {highlights.map((h,i)=><div className="epub-mark" key={h.cfi}><button onClick={()=>rendition.current?.display(h.cfi)}>✍️ “{h.text.slice(0,90)}{h.text.length>90?'…':''}”</button><button className="mark-remove" onClick={()=>removeHighlight(h.cfi)}>Remover</button></div>)}
      </section>}
    </section>
  </main>
}
