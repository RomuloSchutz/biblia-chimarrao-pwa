import React from 'react'
import book from './desejo-esperanca.json'

const assets = '/desejo-esperanca'
export const desejoEpub = assets + '/livro.epub'
export const desejoBook = {
  title: book.title, sub: book.subtitle, text: book.synopsis,
  meta: 'Fé · Esperança · Vida cotidiana', image: assets + '/capa.webp',
  status: 'E-book gratuito', group: 'disponivel',
}

export default function DesejoEsperanca({ onBack, onHome, onRead }) {
  return <main className="dashboard">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obra de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={onBack}>← Livros</button><button className="logout" onClick={onHome}>⌂ Início</button></div></header>
    <section className="author-work-detail"><div className="author-work-detail-cover"><img src={desejoBook.image} alt={'Capa de ' + book.title}/></div><div className="author-work-detail-copy"><span className="author-work-status">E-book gratuito</span><h1 style={{color:'#f9ebcf'}}>{book.title}</h1><h2>{book.subtitle}</h2><p>Romulo Schutz · 18 capítulos</p>
      <div className="book-actions"><button onClick={onRead}>Ler EPUB gratuito</button><a href={desejoEpub} download>Baixar EPUB ↓</a></div>
    </div></section>
    <section className="author-work-editorial">
      <p className="eyebrow" style={{color:'#dab77a'}}>APRESENTAÇÃO DA OBRA</p>
      <article><h2 style={{color:'#f9ebcf'}}>Sobre a obra</h2><h3 style={{color:'#dab77a'}}>Sinopse</h3><p>{book.synopsis}</p></article>
    </section>
    <section className="author-work-editorial">
      <p className="eyebrow" style={{color:'#dab77a'}}>POR TRÁS DA OBRA</p>
      <article><h2 style={{color:'#f9ebcf'}}>O significado da capa</h2><p>{book.meaning}</p></article>
      <article className="author-work-special"><h2 style={{color:'#f9ebcf'}}>O caminho do livro</h2>
        <a href={assets + '/mapa-editorial.webp'} target="_blank" rel="noreferrer"><img className="author-work-editorial-image" src={assets + '/mapa-editorial.webp'} alt="Mapa mental ilustrado de ação, reação e transformação. Clique para ampliar." loading="lazy"/></a>
        <ol>{book.map.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol>
      </article>
    </section>
    <section className="author-work-editorial edition-spread-section">
      <p className="eyebrow" style={{color:'#dab77a'}}>CONHEÇA A EDIÇÃO</p>
      <article><h2 style={{color:'#f9ebcf'}}>Capa, contracapa e orelhas</h2>
      <a className="edition-spread-link" href={assets + '/capa-aberta.webp'} target="_blank" rel="noreferrer"><img className="edition-spread-image" src={assets + '/capa-aberta.webp'} alt="Capa aberta com contracapa, lombada e orelhas" loading="lazy"/><span>Clique para ampliar a capa aberta</span></a></article>
    </section>
    <section className="author-work-editorial">
      <article><h2 style={{color:'#f9ebcf'}}>Do autor para o leitor</h2>
      <figure style={{margin:'1.5rem 0'}}><img style={{width:'100%',height:'auto',borderRadius:12}} src={assets + '/autor.webp'} alt="Romulo Schutz escrevendo em um caderno no horto" loading="lazy"/>
      <figcaption><blockquote>“{book.quote}”</blockquote><p>Romulo Schutz</p></figcaption></figure></article>
    </section>
  </main>
}
