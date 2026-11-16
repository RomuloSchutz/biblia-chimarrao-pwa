import React from 'react'
import book from './desejo-esperanca.json'

const assets = '/desejo-esperanca'
export const desejoEpub = assets + '/livro.epub'
export const desejoBook = {
  title: book.title, sub: book.subtitle, text: book.synopsis,
  meta: 'Fé · Esperança · Vida cotidiana', image: assets + '/capa.webp',
  status: 'E-book gratuito', group: 'disponivel',
}

export default function DesejoEsperanca({ onBack, onRead }) {
  return <main className="dashboard">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Biblioteca de Romulo Schutz</small></div><button className="logout" onClick={onBack}>← Voltar</button></header>
    <section className="welcome"><h2>{book.title}</h2><p>{book.subtitle}</p>
      <div className="book-actions"><button onClick={onRead}>Ler EPUB gratuito</button><a href={desejoEpub} download>Baixar EPUB ↓</a></div>
    </section>
    <section className="welcome">
      <h3>Capa aberta</h3>
      <a href={assets + '/capa-aberta.webp'} target="_blank" rel="noreferrer"><img style={{width:'100%',height:'auto'}} src={assets + '/capa-aberta.webp'} alt="Ampliar capa aberta com contracapa, lombada e orelhas" loading="lazy"/></a>
      <h3>O significado da capa</h3><p>{book.meaning}</p>
      <h3>Sinopse</h3><p>{book.synopsis}</p>
      <h3>Mapa mental</h3>
      <ol>{book.map.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol>
      <figure style={{margin:'1.5rem 0'}}><img style={{width:'100%',height:'auto',borderRadius:12}} src={assets + '/autor.webp'} alt="Romulo Schutz escrevendo em um caderno no horto" loading="lazy"/>
      <figcaption><blockquote>“{book.quote}”</blockquote><p>Romulo Schutz</p></figcaption></figure>
    </section>
  </main>
}
