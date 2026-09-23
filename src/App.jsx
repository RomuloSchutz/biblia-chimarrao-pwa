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
  const ENCONTRO_ID = '3817029c-5fe8-4a98-a92b-226d7b86b390'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)

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

  async function loadEncounterState() {
    if (!user || !supabase) return
    const [{ data: note }, { data: fav }] = await Promise.all([
      supabase.from('reader_records').select('para_pensar_note,um_passo_para_hoje_note').eq('user_id', user.id).eq('encontro_id', ENCONTRO_ID).maybeSingle(),
      supabase.from('favorites').select('encontro_id').eq('user_id', user.id).eq('encontro_id', ENCONTRO_ID).maybeSingle()
    ])
    setPensarNote(note?.para_pensar_note || '')
    setPassoNote(note?.um_passo_para_hoje_note || '')
    setFavoritePreview(Boolean(fav))
  }

  async function saveEncounterNotes() {
    setEncounterStatus('Salvando...')
    const { data: sessionData } = await supabase.auth.getSession()
    const activeUser = sessionData.session?.user
    if (!activeUser) { setEncounterStatus('Sua sessão expirou. Entre novamente para salvar.'); return }
    const { data, error } = await supabase.from('reader_records').upsert({
      user_id:activeUser.id,encontro_id:ENCONTRO_ID,
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
      const { error } = await supabase.from('favorites').delete().eq('user_id',activeUser.id).eq('encontro_id',ENCONTRO_ID)
      if (error) { setEncounterStatus('Erro ao remover favorito: ' + error.message); return }
      setFavoritePreview(false); setEncounterStatus('Removido dos seus favoritos.')
    } else {
      const { data, error } = await supabase.from('favorites').upsert({user_id:activeUser.id,encontro_id:ENCONTRO_ID},{onConflict:'user_id,encontro_id'}).select('encontro_id').single()
      if (error || !data) { setEncounterStatus('Erro ao favoritar: ' + (error?.message || 'sem confirmação do banco')); return }
      setFavoritePreview(true); setEncounterStatus('♥ Encontro salvo em Meus Favoritos.')
    }
  }

  async function shareMate() {
    const text = 'O PRIMEIRO PASSO\n\nUm novo ano pode parecer uma página em branco, mas ninguém começa completamente do zero. Levamos conosco experiências, perdas, aprendizados, desejos e feridas. Ainda assim, Deus pode fazer algo novo a partir da história que já vivemos.\n\nO primeiro passo não precisa ser grandioso. Pode ser uma oração sincera, uma conversa necessária, uma escolha mais saudável ou a decisão de não repetir um padrão que trouxe sofrimento.\n\nEntregar o caminho ao Senhor não significa deixar de planejar. Significa reconhecer que nossos planos precisam ser conduzidos por uma sabedoria maior que a nossa.\n\nComece este ano sem exigir de si uma perfeição impossível. Caminhe com fidelidade. Deus não pede que você enxergue toda a estrada; pede que confie nele no passo de hoje.\n\nBíblia + Chimarrão — 365 Encontros com Deus | Romulo Schutz'
    try {
      if (navigator.share) await navigator.share({ title:'Mate da Reflexão — O Primeiro Passo', text })
      else { await navigator.clipboard.writeText(text); setEncounterStatus('✓ Mate da Reflexão copiado para compartilhar.') }
    } catch (error) {
      if (error?.name !== 'AbortError') setEncounterStatus('Não foi possível compartilhar agora.')
    }
  }

  function goPrevious() {
    setEncounterStatus('Este é o primeiro encontro da edição.')
  }

  function goNext() {
    setEncounterStatus('O próximo encontro será liberado quando o Dia 2 estiver importado.')
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    setUser(null); setScreen('home'); setMessage('')
  }


  if (screen === 'encounter' && user) {
    return <main className="dashboard"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Prévia da edição 2027</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><button className="logout" onClick={() => window.history.length > 1 ? window.history.back() : setScreen('dashboard')}>← Voltar</button><button className="logout" onClick={() => setScreen('dashboard')}>⌂ Início</button></div></header><article className="welcome"><p className="eyebrow">DIA 1 · 1º DE JANEIRO</p><h2>O Primeiro Passo</h2><div className="dash-message">☀️ <strong>Bom Dia, Deus</strong><p>Senhor, recebe este novo começo e guia meus primeiros passos.</p></div><div className="dash-message">📖 <strong>A Palavra</strong><p>“Entrega o teu caminho ao Senhor; confia nele, e ele o fará.”</p><small>Salmo 37:5</small></div><div className="dash-message"><div className="mate-title-row"><strong>🧉 Mate da Reflexão</strong><button className="share-mate" onClick={shareMate}>↗ Compartilhar</button></div><p>Um novo ano pode parecer uma página em branco, mas ninguém começa completamente do zero. Levamos conosco experiências, perdas, aprendizados, desejos e feridas. Ainda assim, Deus pode fazer algo novo a partir da história que já vivemos.</p><p>O primeiro passo não precisa ser grandioso. Pode ser uma oração sincera, uma conversa necessária, uma escolha mais saudável ou a decisão de não repetir um padrão que trouxe sofrimento.</p><p>Entregar o caminho ao Senhor não significa deixar de planejar. Significa reconhecer que nossos planos precisam ser conduzidos por uma sabedoria maior que a nossa.</p><p>Comece este ano sem exigir de si uma perfeição impossível. Caminhe com fidelidade. Deus não pede que você enxergue toda a estrada; pede que confie nele no passo de hoje.</p></div><div className="dash-message">💭 <strong>Para Pensar</strong><p>Qual é o primeiro passo que Deus está colocando diante de você?</p><textarea value={pensarNote} onChange={e => setPensarNote(e.target.value)} placeholder="Escreva aqui sua anotação..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><div className="dash-message">💬 <strong>Conversa com Deus</strong><p>Senhor, entrego-te este novo ano e tudo o que ele trará. Dá-me sabedoria para planejar, coragem para agir e humildade para seguir tua direção. Amém.</p></div><div className="dash-message">🌱 <strong>Um Passo para Hoje</strong><p>Escreva uma decisão simples que deseja colocar em prática neste início de ano.</p><textarea value={passoNote} onChange={e => setPassoNote(e.target.value)} placeholder="Registre seu passo de hoje..." style={{width:'100%',minHeight:90,padding:12,borderRadius:10}} /></div><nav className="encounter-actions" aria-label="Ações do encontro"><button disabled onClick={goPrevious} title="Este é o primeiro encontro">← <span>Anterior</span></button><button onClick={saveEncounterNotes}>✓ <span>{savedPreview ? 'Salvo!' : 'Salvar'}</span></button><button className={favoritePreview ? 'is-favorite' : ''} onClick={toggleEncounterFavorite}>{favoritePreview ? '♥' : '♡'} <span>{favoritePreview ? 'Favoritado' : 'Favoritar'}</span></button><button onClick={goNext}><span>Próximo</span> →</button></nav>{encounterStatus && <p className="encounter-save-status" role="status">{encounterStatus}</p>}</article></main>
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
            <button className="menu-card" key={title} onClick={() => title === 'Encontro de Hoje' ? (loadEncounterState(), setScreen('encounter')) : setMessage(title + ' será a próxima área a ser conectada.')}>
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