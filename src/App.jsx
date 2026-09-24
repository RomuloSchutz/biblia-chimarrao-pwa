import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

const menuItems = [
  ['📖','Devocional','365 encontros com Deus'],
  ['☀️','Encontro de Hoje','Seu encontro de hoje'],
  ['🧭','Minha Caminhada','Registre, acompanhe e siga em frente'],
  ['♡','Meus Favoritos','Encontros que tocaram você'],
  ['✍️','Minhas Anotações','Suas reflexões e passos'],
  ['▣','Meus Livros','Sua biblioteca particular'],
  ['📚','Livros do Romulo','Conheça todas as obras'],
  ['💡','Ideias e Reflexões','Palavras para levar consigo']
]

export default function App() {
  const [screen, setScreen] = useState('home')
  const [favoritePreview, setFavoritePreview] = useState(false)
  const [savedPreview, setSavedPreview] = useState(false)
  const [pensarNote, setPensarNote] = useState('')
  const [passoNote, setPassoNote] = useState('')
  const [encounterStatus, setEncounterStatus] = useState('')
  const [encounter, setEncounter] = useState(null)
  const [encounterLoading, setEncounterLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)
  const [monthDays, setMonthDays] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [devotionalLoading, setDevotionalLoading] = useState(false)
  const [journey, setJourney] = useState({completed:0,lastDay:0,lastTitle:'',favorites:0,notes:0})
  const [journeyLoading, setJourneyLoading] = useState(false)
  const [favoriteItems, setFavoriteItems] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [noteItems, setNoteItems] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        setScreen('dashboard')
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!supabaseConfigured || !supabase) {
      setMessage('A conexão com o Supabase ainda não está disponível.')
      return
    }
    setLoading(true)
    try {
      if (screen === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setUser(data.user)
        setScreen('dashboard')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: fullName } }
        })
        if (error) throw error
        if (data.session) {
          setUser(data.user)
          setScreen('dashboard')
        } else {
          setMessage('Conta criada. Confira seu e-mail para confirmar o cadastro.')
        }
      }
    } catch (error) {
      setMessage(error?.message || 'Não foi possível concluir. Tente novamente.')
    } finally { setLoading(false) }
  }

  const months = [
    [1,'Janeiro','Recomeços'],[2,'Fevereiro','Intimidade'],[3,'Março','Fé'],
    [4,'Abril','A vida à luz da cruz e da ressurreição'],[5,'Maio','Relacionamentos'],[6,'Junho','Propósito'],
    [7,'Julho','Tempo e espera'],[8,'Agosto','Tempestades'],[9,'Setembro','Transformação'],
    [10,'Outubro','Gratidão'],[11,'Novembro','Generosidade'],[12,'Dezembro','Esperança e celebração']
  ]

  async function openNotes() {
    if (!user || !supabase) return
    setNotesLoading(true); setMessage('')
    const { data, error } = await supabase.from('reader_records')
      .select('id,updated_at,para_pensar_note,um_passo_para_hoje_note,encontros(day_number,day_of_month,month_name,title,para_pensar,um_passo_para_hoje)')
      .eq('user_id',user.id).order('updated_at',{ascending:false})
    if (error) { setMessage('Não foi possível carregar suas anotações.'); setNoteItems([]) }
    else setNoteItems((data || []).filter(item => item.encontros && (item.para_pensar_note?.trim() || item.um_passo_para_hoje_note?.trim())))
    setScreen('notes'); setNotesLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function openFavorites() {
    if (!user || !supabase) return
    setFavoritesLoading(true); setMessage('')
    const { data, error } = await supabase.from('favorites')
      .select('created_at,encontros(day_number,day_of_month,month_name,title,verse_reference,verse_text)')
      .eq('user_id',user.id).order('created_at',{ascending:false})
    if (error) { setMessage('Não foi possível carregar seus favoritos.'); setFavoriteItems([]) }
    else setFavoriteItems((data || []).filter(item => item.encontros))
    setScreen('favorites'); setFavoritesLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function removeFavoriteFromList(dayNumber) {
    const item = favoriteItems.find(x => x.encontros?.day_number === dayNumber)
    if (!item || !user || !supabase) return
    const { data: enc } = await supabase.from('encontros').select('id').eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6').eq('day_number',dayNumber).single()
    if (!enc) return
    const { error } = await supabase.from('favorites').delete().eq('user_id',user.id).eq('encontro_id',enc.id)
    if (!error) setFavoriteItems(items => items.filter(x => x.encontros?.day_number !== dayNumber))
  }

  async function openJourney() {
    if (!user || !supabase) return
    setJourneyLoading(true)
    const [{ data: progress }, { count: favorites }, { count: notes }] = await Promise.all([
      supabase.from('progress').select('completed,completed_at,encontros(day_number,title)').eq('user_id',user.id).eq('completed',true).order('completed_at',{ascending:false}),
      supabase.from('favorites').select('*',{count:'exact',head:true}).eq('user_id',user.id),
      supabase.from('reader_records').select('*',{count:'exact',head:true}).eq('user_id',user.id)
    ])
    const done = progress || []
    const last = done[0]?.encontros
    setJourney({completed:done.length,lastDay:last?.day_number || 0,lastTitle:last?.title || '',favorites:favorites || 0,notes:notes || 0})
    setScreen('journey'); setJourneyLoading(false); window.scrollTo({top:0,behavior:'smooth'})
  }

  async function markEncounterCompleted() {
    if (!user || !encounter || !supabase) return
    setEncounterStatus('Registrando sua caminhada...')
    const { error } = await supabase.from('progress').upsert({user_id:user.id,encontro_id:encounter.id,completed:true,completed_at:new Date().toISOString()},{onConflict:'user_id,encontro_id'})
    if (error) { setEncounterStatus('Não foi possível registrar este encontro: ' + error.message); return }
    setEncounterStatus('✓ Encontro concluído e registrado em Minha Caminhada.')
  }

  async function openMonth(monthNumber) {
    if (!supabase) return
    setDevotionalLoading(true)
    setMessage('')
    const { data, error } = await supabase.from('encontros')
      .select('day_number,day_of_month,title,month_name,theme')
      .eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6')
      .eq('month_number',monthNumber).eq('is_published',true).order('day_number')
    if (error) { setMessage('Não foi possível carregar este mês.'); setDevotionalLoading(false); return }
    setMonthDays(data || [])
    setSelectedMonth(monthNumber)
    setScreen('month')
    setDevotionalLoading(false)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  async function openEncounter(dayNumber = 1) {
    if (!user || !supabase) return
    setEncounterLoading(true)
    setEncounterStatus('')
    const { data, error } = await supabase.from('encontros').select('*').eq('edition_id','e9ced096-9c32-4f64-b3af-d25fc6781fb6').eq('day_number',dayNumber).eq('is_published',true).maybeSingle()
    if (error || !data) { setEncounterStatus('Este encontro ainda não está disponível.'); setEncounterLoading(false); return }
    setEncounter(data)
    const [{ data: note }, { data: fav }] = await Promise.all([
      supabase.from('reader_records').select('para_pensar_note,um_passo_para_hoje_note').eq('user_id', user.id).eq('encontro_id', data.id).maybeSingle(),
      supabase.from('favorites').select('encontro_id').eq('user_id', user.id).eq('encontro_id', data.id).maybeSingle()
    ])
    setPensarNote(note?.para_pensar_note || '')
    setPassoNote(note?.um_passo_para_hoje_note || '')
    setFavoritePreview(Boolean(fav))
    setScreen('encounter')
    setEncounterLoading(false)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  async function saveEncounterNotes() {
    setEncounterStatus('Salvando...')
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData.session?.user
    if (!activeUser) { setEncounterStatus('Sua sessão expirou. Entre novamente para salvar.'); return }
    const { data, error } = await supabase.from('reader_records').upsert({
      user_id:activeUser.id,encontro_id:encounter.id,
      para_pensar_note:pensarNote,um_passo_para_hoje_note:passoNote
    },{onConflict:'user_id,encontro_id'}).select('id,para_pensar_note,um_passo_para_hoje_note').single()
    if (error || !data) { setEncounterStatus('Erro ao salvar: ' + (error?.message || 'sem confirmação do banco')); return }
    setPensarNote(data.para_pensar_note || '')
    setPassoNote(data.um_passo_para_hoje_note || '')
    setSavedPreview(true); setEncounterStatus('✓ Anotações salvas na sua conta.')
    setTimeout(() => setSavedPreview(false),2200)
  }

  async function toggleEncounterFavorite() {
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData.session?.user
    if (!activeUser) { setEncounterStatus('Sua sessão expirou. Entre novamente para favoritar.'); return }
    if (favoritePreview) {
      const { error } = await supabase.from('favorites').delete().eq('user_id',activeUser.id).eq('encontro_id',encounter.id)
      if (error) { setEncounterStatus('Erro ao remover favorito: ' + error.message); return }
      setFavoritePreview(false); setEncounterStatus('Removido dos seus favoritos.')
    } else {
      const { data, error } = await supabase.from('favorites').upsert({user_id:activeUser.id,encontro_id:encounter.id},{onConflict:'user_id,encontro_id'}).select('encontro_id').single()
      if (error || !data) { setEncounterStatus('Erro ao favoritar: ' + (error?.message || 'sem confirmação do banco')); return }
      setFavoritePreview(true); setEncounterStatus('♥ Encontro salvo em Meus Favoritos.')
    }
  }

  async function shareMate() {
    if (!encounter) return
    const text = encounter.title + '\n\n' + encounter.reflection + '\n\nBíblia + Chimarrão — 365 Encontros com Deus | Romulo Schutz'
    try {
      if (navigator.share) await navigator.share({ title:'Mate da Reflexão — ' + encounter.title, text })
      else { await navigator.clipboard.writeText(text); setEncounterStatus('✓ Mate da Reflexão copiado para compartilhar.') }
    } catch (error) {
      if (error?.name !== 'AbortError') setEncounterStatus('Não foi possível compartilhar agora.')
    }
  }

  function goPrevious() {
    if (!encounter || encounter.day_number <= 1) { setEncounterStatus('Este é o primeiro encontro da edição.'); return }
    openEncounter(encounter.day_number - 1)
  }

  function goNext() {
    if (!encounter) return
    openEncounter(encounter.day_number + 1)
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    setUser(null); setScreen('home'); setMessage('')
  }




  if (screen === 'ideas' && user) {
    const reflections = [
      {kicker:'TEMPO',quote:'O tempo passa. O que fazemos com ele deixa marcas.',text:'Um espaço para perceber a vida com mais atenção — sem correr para uma resposta antes de compreender a pergunta.'},
      {kicker:'CAMINHADA',quote:'Nem todo passo precisa ser grande. Precisa ser verdadeiro.',text:'Há dias de avanço e dias de permanência. Ambos podem fazer parte de uma caminhada que amadurece.'},
      {kicker:'ESPERANÇA',quote:'Esperar não é ficar parado. É continuar caminhando sem possuir todas as respostas.',text:'A esperança sustenta o presente enquanto aquilo que ainda não vemos continua sendo construído.'},
      {kicker:'FÉ E VIDA',quote:'A fé não elimina as perguntas; ela muda o lugar de onde começamos a enfrentá-las.',text:'Aqui, fé, história e experiência humana podem conversar sem transformar a reflexão em respostas fáceis.'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Ideias e Reflexões</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome ideas-head"><p className="eyebrow">IDEIAS E REFLEXÕES</p><h2>Palavras para levar consigo.</h2><p>Um espaço para pensamentos, perguntas e pequenas pausas sobre tempo, história, fé, esperança e vida.</p><div className="ideas-author">Romulo Schutz<small>Notas do autor</small></div></section><section className="ideas-grid">{reflections.map((item,index)=><article className="idea-card" key={item.kicker}><div className="idea-number">{String(index+1).padStart(2,'0')}</div><div><span>{item.kicker}</span><blockquote>“{item.quote}”</blockquote><p>{item.text}</p><small>Romulo Schutz</small></div></article>)}</section><section className="ideas-note"><span>✦</span><div><strong>Um espaço que continuará crescendo.</strong><p>Novas ideias e reflexões poderão ser acrescentadas ao aplicativo ao longo da caminhada.</p></div></section></main>
  }

  if (screen === 'authorBooks' && user) {
    const works = [
      {title:'Bíblia + Chimarrão',sub:'365 encontros com Deus',meta:'Devocional diário 2027',image:'/image.png',status:'DEVOCIONAL 2027',text:'Uma pausa diária para abrir a Palavra, refletir, conversar com Deus e transformar o encontro em um passo concreto para o dia.'},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',meta:'História · Filosofia · Teologia',image:'/1000769251.jpg',status:'LIVRO PUBLICADO',text:'Uma obra sobre tempo, calendário, história e fé, percorrendo a construção humana do tempo e sua relação com a compreensão cristã.'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',meta:'Tempo · Corpo · Alma · Espírito',image:'/1000670931(1).jpg',status:'LIVRO PUBLICADO',text:'Uma reflexão sobre a vida no mundo acelerado e a esperança cristã, olhando para o ser humano em suas dimensões de tempo, corpo, alma e espírito.'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',meta:'Trilogia em desenvolvimento',image:'/image (1).png',status:'EM DESENVOLVIMENTO',text:'Uma narrativa sobre cidade, escolhas, relações, fé e consequências. Três movimentos de uma mesma história: NASCE, CRESCE e VIVE.'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obras de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome author-books-head"><p className="eyebrow">LIVROS DO ROMULO</p><h2>Tempo, história, fé e esperança.</h2><p>Conheça as obras e projetos de Romulo Schutz — livros que percorrem o tempo, a vida e as perguntas que acompanham a caminhada humana.</p><div className="author-signature">Romulo Schutz<small>Autor · História · Fé · Reflexão</small></div></section><section className="author-books-grid">{works.map(work=><article className="author-book-card" key={work.title}><div className="author-book-cover"><img src={work.image} alt={'Capa de '+work.title} loading="lazy" /></div><div className="author-book-copy"><span>{work.status}</span><h3>{work.title}</h3><h4>{work.sub}</h4><p>{work.text}</p><small>{work.meta}</small></div></article>)}</section><section className="author-books-footer"><strong>Uma obra. Uma ideia. Uma conversa que continua.</strong><p>Este espaço acompanhará os livros publicados e os projetos em desenvolvimento.</p></section></main>
  }

  if (screen === 'books' && user) {
    const books = [
      {title:'Bíblia + Chimarrão',sub:'365 encontros com Deus',kind:'Devocional diário 2027',cover:'devotional',image:'/image.png',status:'Disponível no aplicativo',action:'Abrir devocional',open:()=>setScreen('devotional')},
      {title:'Entre os Tempos',sub:'A Urgência de Compreender o Calendário de Deus',kind:'História · Filosofia · Teologia',cover:'tempos',image:'/1000769251.jpg',status:'Livro publicado',action:'Detalhes em breve'},
      {title:'Entre o Já e o Ainda Não',sub:'A Esperança Inabalável em um Mundo Acelerado',kind:'Tempo · Corpo · Alma · Espírito',cover:'ja',image:'/1000670931(1).jpg',status:'Livro publicado',action:'Detalhes em breve'},
      {title:'Entre a Cidade e o Silêncio',sub:'NASCE · CRESCE · VIVE',kind:'Trilogia em desenvolvimento',cover:'cidade',image:'/image (1).png',status:'Em breve',action:'Projeto em desenvolvimento'}
    ]
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Biblioteca de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome books-head"><p className="eyebrow">MEUS LIVROS</p><h2>História, fé e esperança para a sua jornada.</h2><p>Este espaço reúne as obras que fazem parte da caminhada do autor e do leitor.</p><div className="author-mark">Bíblia <b>+</b> Chimarrão <small>365 encontros com Deus · Romulo Schutz</small></div></section><section className="books-grid">{books.map(book=><article className="book-card" key={book.title}><div className={'book-cover '+book.cover}><img src={book.image} alt={'Capa de '+book.title} loading="lazy" /></div><div className="book-info"><span className="book-status">{book.status}</span><h3>{book.title}</h3><p>{book.sub}</p><small>{book.kind}</small>{book.open?<button onClick={book.open}>{book.action} →</button>:<button className="book-disabled" disabled>{book.action}</button>}</div></article>)}</section></main>
  }

  if (screen === 'notes' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome notes-head"><p className="eyebrow">MINHAS ANOTAÇÕES</p><h2>Palavras da sua caminhada</h2><p>Suas reflexões e passos ficam reunidos aqui para você revisitar quando quiser.</p></section>{notesLoading ? <p className="encounter-save-status">Carregando suas anotações...</p> : noteItems.length ? <section className="notes-list">{noteItems.map(item => { const e=item.encontros; return <article className="note-card" key={item.id}><div className="note-card-top"><span>✍️</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3>{item.para_pensar_note?.trim() && <div className="note-block"><strong>Para Pensar</strong><small>{e.para_pensar}</small><p>{item.para_pensar_note}</p></div>}{item.um_passo_para_hoje_note?.trim() && <div className="note-block"><strong>Um Passo para Hoje</strong><small>{e.um_passo_para_hoje}</small><p>{item.um_passo_para_hoje_note}</p></div>}<button className="note-open" onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button></article>})}</section> : <section className="empty-state"><span>✍️</span><h3>Nenhuma anotação ainda</h3><p>Nos encontros, escreva em Para Pensar ou Um Passo para Hoje e toque em Salvar. Suas palavras ficarão guardadas aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'favorites' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome favorites-head"><p className="eyebrow">MEUS FAVORITOS</p><h2>Encontros que falaram com você</h2><p>Guarde aqui as mensagens que deseja encontrar novamente.</p></section>{favoritesLoading ? <p className="encounter-save-status">Carregando seus favoritos...</p> : favoriteItems.length ? <section className="favorites-list">{favoriteItems.map(item => { const e=item.encontros; return <article className="favorite-card" key={e.day_number}><div className="favorite-card-top"><span>♥</span><small>DIA {e.day_number} · {e.day_of_month} DE {String(e.month_name||'').toUpperCase()}</small></div><h3>{e.title}</h3><blockquote>{e.verse_text}</blockquote><p className="favorite-reference">{e.verse_reference}</p><div className="favorite-actions"><button onClick={() => openEncounter(e.day_number)}>Abrir encontro →</button><button className="favorite-remove" onClick={() => removeFavoriteFromList(e.day_number)}>♡ Remover</button></div></article>})}</section> : <section className="empty-state"><span>♡</span><h3>Nenhum favorito ainda</h3><p>Quando uma mensagem falar especialmente com você, toque em Favoritar no encontro. Ela ficará guardada aqui.</p><button onClick={() => setScreen('devotional')}>Explorar o devocional →</button></section>}</main>
  }

  if (screen === 'journey' && user) {
    const pct = Math.round((journey.completed / 365) * 100)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome journey-head"><p className="eyebrow">MINHA CAMINHADA</p><h2>Um passo de cada vez</h2><p>Aqui você acompanha os encontros que já concluiu ao longo do ano.</p><div className="journey-progress"><div className="journey-progress-bar" style={{width:pct+'%'}}></div></div><strong className="journey-percent">{pct}% da caminhada · {journey.completed} de 365 encontros</strong></section>{journeyLoading ? <p className="encounter-save-status">Carregando sua caminhada...</p> : <><section className="journey-stats"><div><strong>{journey.completed}</strong><small>Concluídos</small></div><div><strong>{journey.notes}</strong><small>Anotações</small></div><div><strong>{journey.favorites}</strong><small>Favoritos</small></div></section><section className="journey-resume"><p className="eyebrow">CONTINUAR</p>{journey.lastDay ? <><h3>Seu último encontro concluído</h3><p>Dia {journey.lastDay} — {journey.lastTitle}</p><button onClick={() => openEncounter(Math.min(journey.lastDay + 1,365))}>Continuar do próximo encontro →</button></> : <><h3>Sua caminhada começa aqui</h3><p>Conclua seu primeiro encontro para começar a registrar seu progresso.</p><button onClick={() => openEncounter(1)}>Abrir o Dia 1 →</button></>}</section></>}</main>
  }

  if (screen === 'devotional' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><p className="eyebrow">DEVOCIONAL 2027</p><h2>Escolha um mês</h2><p>Uma caminhada de 365 encontros, um dia de cada vez.</p></section><section className="months-grid">{months.map(([number,name,theme]) => <button key={number} className="month-card" onClick={() => openMonth(number)}><span className="month-number">{String(number).padStart(2,'0')}</span><strong>{name}</strong><small>{theme}</small></button>)}</section></main>
  }

  if (screen === 'month' && user) {
    const info = months.find(m => m[0] === selectedMonth)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Devocional 2027</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('devotional')}>← Meses</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><p className="eyebrow">MÊS {selectedMonth}</p><h2>{info?.[1]}</h2><p>{info?.[2]}</p></section>{devotionalLoading ? <p className="encounter-save-status">Carregando...</p> : <section className="days-grid">{monthDays.map(day => <button key={day.day_number} className="day-card" onClick={() => openEncounter(day.day_number)}><span className="day-number">{day.day_of_month}</span><span className="day-copy"><small>Dia {day.day_number}</small><strong>{day.title}</strong></span><span className="day-arrow">›</span></button>)}</section>}</main>
  }

  if (screen === 'encounter' && user) {
    if (encounterLoading || !encounter) return <main className="dashboard"><p className="encounter-save-status">Carregando encontro...</p></main>
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Prévia da edição 2027</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><article className="welcome"><p className="eyebrow">DIA {encounter.day_number} · {encounter.day_of_month} DE {String(encounter.month_name || '').toUpperCase()}</p><h2>{encounter.title}</h2><div className="dash-message">☀️ <strong>Bom Dia, Deus</strong><p>{encounter.bom_dia_deus}</p></div><div className="dash-message">📖 <strong>A Palavra</strong><p>{encounter.verse_text}</p><small>{encounter.verse_reference}</small></div><div className="dash-message"><div className="mate-title-row"><strong>🧉 Mate da Reflexão</strong><button className="share-mate" onClick={shareMate}>↗ Compartilhar</button></div>{String(encounter.reflection || '').split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div><div className="dash-message">💭 <strong>Para Pensar</strong><p>{encounter.para_pensar}</p><textarea value={pensarNote} onChange={e => setPensarNote(e.target.value)} placeholder="Escreva aqui sua anotação..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><div className="dash-message">💬 <strong>Conversa com Deus</strong><p>{encounter.conversa_com_deus}</p></div><div className="dash-message">🌱 <strong>Um Passo para Hoje</strong><p>{encounter.um_passo_para_hoje}</p><textarea value={passoNote} onChange={e => setPassoNote(e.target.value)} placeholder="Registre seu passo de hoje..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><nav className="encounter-actions" aria-label="Ações do encontro"><button disabled={encounter.day_number <= 1} onClick={goPrevious}>← <span>Anterior</span></button><button onClick={saveEncounterNotes}>✓ <span>{savedPreview ? 'Salvo!' : 'Salvar'}</span></button><button className={favoritePreview ? 'is-favorite' : ''} onClick={toggleEncounterFavorite}>{favoritePreview ? '♥' : '♡'} <span>{favoritePreview ? 'Favoritado' : 'Favoritar'}</span></button><button onClick={goNext}><span>Próximo</span> →</button></nav><button className="complete-encounter" onClick={markEncounterCompleted}>✓ Concluir este encontro</button>{encounterStatus && <p className="encounter-save-status" role="status">{encounterStatus}</p>}</article></main>
  }

  if (screen === 'dashboard' && user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Leitor'
    return (
      <main className="dashboard">
        <header className="dash-header">
          <div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div>
          <button className="logout" onClick={handleLogout}>Sair</button>
        </header>
        <section className="welcome">
          <p className="eyebrow">SEU ESPAÇO</p>
          <h2>Olá, {name}!</h2>
          <p>Que bom ter você aqui.</p>
          <blockquote>“Uma palavra. Uma pausa. Um encontro.”</blockquote>
        </section>
        <section className="menu-grid">
          {menuItems.map(([icon,title,desc]) => (
            <button className="menu-card" key={title} onClick={() => title === 'Encontro de Hoje' ? openEncounter(1) : title === 'Devocional' ? setScreen('devotional') : title === 'Minha Caminhada' ? openJourney() : title === 'Meus Favoritos' ? openFavorites() : title === 'Minhas Anotações' ? openNotes() : title === 'Meus Livros' ? setScreen('books') : title === 'Livros do Romulo' ? setScreen('authorBooks') : title === 'Ideias e Reflexões' ? setScreen('ideas') : setMessage(title + ' será a próxima área a ser conectada.')}>
              <span className="menu-icon">{icon}</span><strong>{title}</strong><small>{desc}</small>
            </button>
          ))}
        </section>
        <section className="dash-tools">
          <button onClick={() => setMessage('Lembrete Diário será configurado na próxima etapa.')}>⏰ Lembrete Diário</button>
          <button onClick={() => setMessage('Configurações será conectada em seguida.')}>⚙ Configurações</button>
        </section>
        {message && <p className="dash-message">{message}</p>}
        <nav className="bottom-nav"><span>⌂<small>Início</small></span><span>📖<small>Devocional</small></span><span>▣<small>Livros</small></span><span>♡<small>Favoritos</small></span><span>•••<small>Mais</small></span></nav>
      </main>
    )
  }

  if (screen === 'login' || screen === 'signup') {
    const creating = screen === 'signup'
    return (
      <main className="app"><section className="auth-card">
        <button className="back-button" onClick={() => { setScreen('access'); setMessage('') }}>← Voltar</button>
        <p className="eyebrow">BÍBLIA + CHIMARRÃO</p>
        <h2>{creating ? 'Criar minha conta' : 'Entrar na minha conta'}</h2>
        <p className="auth-intro">{creating ? 'Crie seu acesso para registrar sua caminhada diária.' : 'Use seu e-mail e senha para continuar sua caminhada.'}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {creating && <label>Nome<input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required /></label>}
          <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Senha<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={creating ? 'new-password' : 'current-password'} minLength="6" required /><button type="button" className="eye-button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? '🙈' : '👁'}</button></div></label>
          <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : creating ? 'Criar minha conta' : 'Entrar'}</button>
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
      </section></main>
    )
  }

  if (screen === 'access') return (
    <main className="app"><section className="auth-card">
      <button className="back-button" onClick={() => setScreen('home')}>← Voltar</button>
      <p className="eyebrow">BÍBLIA + CHIMARRÃO</p><h2>Bem-vindo ao seu encontro</h2>
      <p className="auth-intro">Entre na sua conta para continuar sua caminhada ou crie seu acesso para começar.</p>
      <div className="auth-actions"><button onClick={() => setScreen('login')}>Entrar</button><button className="secondary-action" onClick={() => setScreen('signup')}>Criar minha conta</button></div>
    </section></main>
  )

  return <main className="app"><section className="hero"><p className="eyebrow">365 ENCONTROS</p><h1>Bíblia +<br/>Chimarrão</h1><p className="subtitle">Uma pausa. Uma Palavra. Um novo começo.</p><button onClick={() => setScreen('access')}>Começar meu encontro</button></section><section className="card"><span>Edição 2027</span><h2>Seu encontro diário com a Palavra</h2><p>Reflexão, aplicação, oração e uma caminhada que fica registrada na sua conta.</p></section></main>
}