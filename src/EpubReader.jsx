import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'

const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
const voiceLooksFemale=name=>/female|femin|luciana|francisca|maria|helena|leticia|camila|vitoria|brenda/i.test(name||'')
const voiceLooksMale=name=>/male|mascul|antonio|daniel|felipe|ricardo|thiago|paulo/i.test(name||'')

export default function EpubReader({ title, epubUrl, onBack }) {
  const host=useRef(null), rendition=useRef(null), bookRef=useRef(null)
  const [fontSize,setFontSize]=useState(100), [location,setLocation]=useState(''), [chapters,setChapters]=useState([])
  const [error,setError]=useState(''), [loading,setLoading]=useState(true)
  const selectedStartRef=useRef(null)
  const audioStateRef=useRef('parado')
  const [bookmarks,setBookmarks]=useState(()=>readJson('bc-epub-bookmarks:'+title,[]))
  const [highlights,setHighlights]=useState(()=>readJson('bc-epub-highlights:'+title,[]))
  const [audioState,setAudioState]=useState('parado'), [audioVoice,setAudioVoice]=useState('masculina'), [audioRate,setAudioRate]=useState(1)
  const audioRef=useRef({chunks:[],index:0,offset:0,utterance:null,token:0,continuous:false,startedAt:0,rate:.92})

  useEffect(()=>{audioStateRef.current=audioState},[audioState])

  const saveBookmarks=items=>{setBookmarks(items);localStorage.setItem('bc-epub-bookmarks:'+title,JSON.stringify(items))}
  const saveHighlights=items=>{setHighlights(items);localStorage.setItem('bc-epub-highlights:'+title,JSON.stringify(items))}

  useEffect(()=>{
    if(!epubUrl||!host.current){setLoading(false);setError('Arquivo EPUB não encontrado.');return}
    let cancelled=false, book
    try{
      setLoading(true);setError(''); book=ePub(epubUrl,{openAs:'epub'}); bookRef.current=book
      const view=book.renderTo(host.current,{width:'100%',height:'76vh',flow:'paginated'}); rendition.current=view
      view.themes.fontSize(fontSize+'%')
      view.on('relocated',place=>{if(cancelled)return;const href=place?.start?.href||'';setLocation(href);try{localStorage.setItem('bc-epub-progress:'+title,place?.start?.cfi||href)}catch{}
        const ref=audioRef.current
        if(ref && audioStateRef.current==='parado'){ref.chunks=[];ref.index=0;ref.offset=0;ref.continuous=false}
      })
      view.on('selected',(cfiRange,contents)=>{
        const text=contents?.window?.getSelection?.()?.toString?.().trim()||''
        selectedStartRef.current={cfi:cfiRange,text}
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
  const pageText=()=>{const contents=rendition.current?.getContents?.()||[];return contents.map(c=>c.document?.body?.innerText||'').join(' ').replace(/\\s+/g,' ').trim()}
  const splitSpeech=text=>{
    const parts=text.match(/[^.!?;:]+[.!?;:]?|[^.!?;:]+$/g)||[text];const chunks=[];let current=''
    for(const part of parts){if((current+' '+part).length>220&&current){chunks.push(current.trim());current=part}else current+=(current?' ':'')+part}
    if(current.trim())chunks.push(current.trim());return chunks
  }
  const chooseVoice=()=>{const voices=speechSynthesis.getVoices().filter(v=>/^pt(-|_)/i.test(v.lang)||/portugu/i.test(v.lang));return voices.find(v=>audioVoice==='feminina'?voiceLooksFemale(v.name):voiceLooksMale(v.name))||voices[audioVoice==='feminina'?1:0]||voices[0]}
  const clearSpokenHighlight=()=>{try{rendition.current?.getContents?.().forEach(c=>c.document.querySelectorAll('.bc-speaking').forEach(n=>n.classList.remove('bc-speaking')))}catch{}}
  const markSpeaking=words=>{
    clearSpokenHighlight();if(!words)return
    try{const needle=words.trim().slice(0,70).toLocaleLowerCase('pt-BR');for(const content of rendition.current?.getContents?.()||[]){const walker=content.document.createTreeWalker(content.document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){const txt=(n.nodeValue||'').toLocaleLowerCase('pt-BR');const pos=txt.indexOf(needle);if(pos>=0){const range=content.document.createRange();range.setStart(n,pos);range.setEnd(n,Math.min(n.nodeValue.length,pos+needle.length));const span=content.document.createElement('mark');span.className='bc-speaking';range.surroundContents(span);span.scrollIntoView({block:'center',behavior:'smooth'});return}}}}
    catch{}
  }
  const loadCurrentPage=()=>{const text=pageText();const ref=audioRef.current;ref.chunks=splitSpeech(text);ref.index=0;ref.offset=0;return ref.chunks.length>0}
  const advanceAndContinue=async token=>{
    if(token!==audioRef.current.token)return
    try{await rendition.current?.next();await new Promise(r=>setTimeout(r,180));if(token!==audioRef.current.token)return
      if(!loadCurrentPage()){return advanceAndContinue(token)}
      playChunk(token)
    }catch{setAudioState('parado')}
  }
  const playChunk=token=>{
    const ref=audioRef.current;if(token!==ref.token)return
    if(ref.index>=ref.chunks.length){clearSpokenHighlight();if(ref.continuous)return advanceAndContinue(token);setAudioState('parado');ref.index=0;ref.offset=0;return}
    const full=ref.chunks[ref.index], spoken=full.slice(ref.offset).trim();if(!spoken){ref.index++;ref.offset=0;return playChunk(token)}
    markSpeaking(spoken)
    const utter=new SpeechSynthesisUtterance(spoken);utter.lang='pt-BR';utter.rate=ref.rate;ref.startedAt=Date.now();utter.rate=audioRate;ref.rate=audioRate;const voice=chooseVoice();if(voice)utter.voice=voice;ref.utterance=utter
    utter.onboundary=ev=>{if(token===ref.token&&typeof ev.charIndex==='number')ref.offset=Math.min(full.length,ref.offset+ev.charIndex)}
    utter.onend=()=>{if(token!==ref.token)return;ref.index+=1;ref.offset=0;playChunk(token)}
    utter.onerror=()=>{if(token===ref.token)setAudioState('parado')}
    speechSynthesis.speak(utter);setAudioState('tocando')
  }
  const speak=()=>{
    if(!('speechSynthesis'in window)){setError('A leitura em voz alta não é suportada neste navegador.');return}
    const ref=audioRef.current
    if(audioState==='tocando'){
      /* Alguns Androids não disparam onboundary. Estimamos o avanço pelo tempo falado,
         preservando o ponto da frase em vez de reiniciar a página. */
      if(ref.utterance){
        const elapsed=Math.max(0,(Date.now()-ref.startedAt)/1000)
        const spoken=ref.chunks[ref.index]||''
        const estimated=Math.min(spoken.length-ref.offset,Math.floor(elapsed*14*ref.rate))
        ref.offset=Math.min(spoken.length,ref.offset+estimated)
      }
      ref.token+=1;speechSynthesis.cancel();clearSpokenHighlight();setAudioState('pausado');return
    }
    if(audioState==='pausado'){ref.token+=1;playChunk(ref.token);return}
    ref.chunks=[];ref.index=0;ref.offset=0
    if(!loadCurrentPage()){setError('Não encontrei texto nesta página para leitura em voz alta.');return}
    ref.continuous=true;ref.token+=1;speechSynthesis.cancel();playChunk(ref.token)
  }
  const startFromSelection=async()=>{
    const selected=selectedStartRef.current
    if(!selected?.cfi){setError('Selecione primeiro uma palavra ou trecho do livro.');return}
    stopAudio()
    try{await rendition.current?.display(selected.cfi);await new Promise(r=>setTimeout(r,120))}catch{}
    const text=pageText();if(!text)return
    const needle=(selected.text||'').trim();let start=needle?text.indexOf(needle):-1
    const from=start>=0?text.slice(start):text
    const ref=audioRef.current;ref.chunks=splitSpeech(from);ref.index=0;ref.offset=0;ref.continuous=true;ref.rate=audioRate;ref.token+=1
    speechSynthesis.cancel();playChunk(ref.token)
  }
  const stopAudio=()=>{const ref=audioRef.current;ref.token+=1;speechSynthesis?.cancel();clearSpokenHighlight();ref.chunks=[];ref.index=0;ref.offset=0;ref.utterance=null;ref.startedAt=0;ref.continuous=false;setAudioState('parado')}

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
        <label>Velocidade <select value={audioRate} onChange={e=>{const next=Number(e.target.value);stopAudio();setAudioRate(next)}}><option value="0.75">0,75× · Lento</option><option value="1">1,0× · Normal</option><option value="1.25">1,25× · Rápido</option></select></label>
        <button onClick={startFromSelection}>🎯 Ouvir a partir da seleção</button>
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
