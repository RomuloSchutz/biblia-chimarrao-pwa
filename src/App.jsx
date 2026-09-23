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


  if (screen === 'devotional' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>365 encontros com Deus</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><p className="eyebrow">DEVOCIONAL 2027</p><h2>Escolha um mês</h2><p>Uma caminhada de 365 encontros, um dia de cada vez.</p></section><section className="months-grid">{months.map(([number,name,theme]) => <button key={number} className="month-card" onClick={() => openMonth(number)}><span className="month-number">{String(number).padStart(2,'0')}</span><strong>{name}</strong><small>{theme}</small></button>)}</section></main>
  }

  if (screen === 'month' && user) {
    const info = months.find(m => m[0] === selectedMonth)
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Devocional 2027</small></div><div className="header-actions"><button className="logout" onClick={() => setScreen('devotional')}>← Meses</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><section className="welcome devotional-intro"><p className="eyebrow">MÊS {selectedMonth}</p><h2>{info?.[1]}</h2><p>{info?.[2]}</p></section>{devotionalLoading ? <p className="encounter-save-status">Carregando...</p> : <section className="days-grid">{monthDays.map(day => <button key={day.day_number} className="day-card" onClick={() => openEncounter(day.day_number)}><span className="day-number">{day.day_of_month}</span><span className="day-copy"><small>Dia {day.day_number}</small><strong>{day.title}</strong></span><span className="day-arrow">›</span></button>)}</section>}</main>
  }

  if (screen === 'encounter' && user) {
    if (encounterLoading || !encounter) return <main className="dashboard"><p className="encounter-save-status">Carregando encontro...</p></main>
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Prévia da edição 2027</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><button className="logout" onClick={() => setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><article className="welcome"><p className="eyebrow">DIA {encounter.day_number} · {encounter.day_of_month} DE {String(encounter.month_name || '').toUpperCase()}</p><h2>{encounter.title}</h2><div className="dash-message">☀️ <strong>Bom Dia, Deus</strong><p>{encounter.bom_dia_deus}</p></div><div className="dash-message">📖 <strong>A Palavra</strong><p>{encounter.verse_text}</p><small>{encounter.verse_reference}</small></div><div className="dash-message"><div className="mate-title-row"><strong>🧉 Mate da Reflexão</strong><button className="share-mate" onClick={shareMate}>↗ Compartilhar</button></div>{String(encounter.reflection || '').split('\n').filter(Boolean).map((p,i)=><p key={i}>{p}</p>)}</div><div className="dash-message">💭 <strong>Para Pensar</strong><p>{encounter.para_pensar}</p><textarea value={pensarNote} onChange={e => setPensarNote(e.target.value)} placeholder="Escreva aqui sua anotação..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><div className="dash-message">💬 <strong>Conversa com Deus</strong><p>{encounter.conversa_com_deus}</p></div><div className="dash-message">🌱 <strong>Um Passo para Hoje</strong><p>{encounter.um_passo_para_hoje}</p><textarea value={passoNote} onChange={e => setPassoNote(e.target.value)} placeholder="Registre seu passo de hoje..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><nav className="encounter-actions" aria-label="Ações do encontro"><button disabled={encounter.day_number <= 1} onClick={goPrevious}>← <span>Anterior</span></button><button onClick={saveEncounterNotes}>✓ <span>{savedPreview ? 'Salvo!' : 'Salvar'}</span></button><button className={favoritePreview ? 'is-favorite' : ''} onClick={toggleEncounterFavorite}>{favoritePreview ? '♥' : '♡'} <span>{favoritePreview ? 'Favoritado' : 'Favoritar'}</span></button><button onClick={goNext}><span>Próximo</span> →</button></nav>{encounterStatus && <p className="encounter-save-status" role="status">{encounterStatus}</p>}</article></main>
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
            <button className="menu-card" key={title} onClick={() => title === 'Encontro de Hoje' ? openEncounter(1) : title === 'Devocional' ? setScreen('devotional') : setMessage(title + ' será a próxima área a ser conectada.')}>
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