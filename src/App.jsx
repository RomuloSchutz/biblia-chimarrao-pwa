import { useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage('Entrada realizada com sucesso.')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        setMessage(data.session
          ? 'Conta criada e acesso realizado com sucesso.'
          : 'Conta criada. Confira seu e-mail para confirmar o cadastro.')
      }
    } catch (error) {
      setMessage(error?.message || 'Não foi possível concluir. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (screen === 'login' || screen === 'signup') {
    const creating = screen === 'signup'
    return (
      <main className="app">
        <section className="auth-card">
          <button className="back-button" onClick={() => { setScreen('access'); setMessage('') }}>← Voltar</button>
          <p className="eyebrow">BÍBLIA + CHIMARRÃO</p>
          <h2>{creating ? 'Criar minha conta' : 'Entrar na minha conta'}</h2>
          <p className="auth-intro">{creating ? 'Crie seu acesso para registrar sua caminhada diária.' : 'Use seu e-mail e senha para continuar sua caminhada.'}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {creating && (
              <label>Nome
                <input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required />
              </label>
            )}
            <label>E-mail
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </label>
            <label>Senha
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={creating ? 'new-password' : 'current-password'} minLength="6" required />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : creating ? 'Criar minha conta' : 'Entrar'}</button>
          </form>
          {message && <p className="form-message" role="status">{message}</p>}
        </section>
      </main>
    )
  }

  if (screen === 'access') {
    return (
      <main className="app">
        <section className="auth-card">
          <button className="back-button" onClick={() => setScreen('home')} aria-label="Voltar">← Voltar</button>
          <p className="eyebrow">BÍBLIA + CHIMARRÃO</p>
          <h2>Bem-vindo ao seu encontro</h2>
          <p className="auth-intro">Entre na sua conta para continuar sua caminhada ou crie seu acesso para começar.</p>
          <div className="auth-actions">
            <button type="button" className="primary-action" onClick={() => setScreen('login')}>Entrar</button>
            <button type="button" className="secondary-action" onClick={() => setScreen('signup')}>Criar minha conta</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">365 ENCONTROS</p>
        <h1>Bíblia +<br />Chimarrão</h1>
        <p className="subtitle">Uma pausa. Uma Palavra. Um novo começo.</p>
        <button type="button" onClick={() => setScreen('access')}>Começar meu encontro</button>
      </section>
      <section className="card">
        <span>Edição 2027</span>
        <h2>Seu encontro diário com a Palavra</h2>
        <p>Reflexão, aplicação, oração e uma caminhada que fica registrada na sua conta.</p>
      </section>
    </main>
  )
}
