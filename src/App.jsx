import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

const menuItems = [
  ['📖','Devocional','365 encontros com Deus'],
  ['☀️','Encontro de Hoje','Seu encontro de hoje'],
  ['🧭','Minha Caminhada','Registre, acompanhe e siga em frente'],
  ['♡','Favoritos','Encontros que tocaram você'],
  ['✍️','Meus Registros','Suas reflexões e orações'],
  ['▣','Meus Livros','Sua biblioteca particular'],
  ['📚','Livros do Romulo','Conheça todas as obras'],
  ['💡','Ideias e Reflexões','Palavras para levar consigo']
]

export default function App() {
  const [screen, setScreen] = useState('home')
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

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    setUser(null); setScreen('home'); setMessage('')
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
            <button className="menu-card" key={title} onClick={() => setMessage(title + ' será a próxima área a ser conectada.')}>
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