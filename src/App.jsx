import { useState } from 'react'

export default function App() {
  const [started, setStarted] = useState(false)

  if (started) {
    return (
      <main className="app">
        <section className="auth-card">
          <button className="back-button" onClick={() => setStarted(false)} aria-label="Voltar">
            ← Voltar
          </button>
          <p className="eyebrow">BÍBLIA + CHIMARRÃO</p>
          <h2>Bem-vindo ao seu encontro</h2>
          <p className="auth-intro">
            Entre na sua conta para continuar sua caminhada ou crie seu acesso para começar.
          </p>
          <div className="auth-actions">
            <button type="button" className="primary-action">Entrar</button>
            <button type="button" className="secondary-action">Criar minha conta</button>
          </div>
          <p className="next-note">A conexão destes dois acessos com o Supabase será a próxima etapa.</p>
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
        <button type="button" onClick={() => setStarted(true)}>Começar meu encontro</button>
      </section>
      <section className="card">
        <span>Edição 2027</span>
        <h2>Seu encontro diário com a Palavra</h2>
        <p>Reflexão, aplicação, oração e uma caminhada que fica registrada na sua conta.</p>
      </section>
    </main>
  )
}
