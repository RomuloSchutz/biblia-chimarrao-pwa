import React from 'react'
import book from './promessa-cumprimento.json'

const assets = '/promessa-cumprimento'
export const promessaBook = {
  title: book.title, sub: book.subtitle, text: book.synopsis,
  meta: 'Bíblia · Teologia · Esperança cristã', image: assets + '/capa.webp',
  status: 'EM BREVE · LANÇAMENTO 2027', group: 'projetos', action: 'Conhecer a obra',
}

export default function PromessaCumprimento({ onBack, onHome, onRead, isAdmin, hasPreview }) {
  return <main className="dashboard">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Obra de Romulo Schutz</small></div><div className="header-actions"><button className="logout" onClick={onBack}>← Livros</button><button className="logout" onClick={onHome}>⌂ Início</button></div></header>
    <section className="author-work-detail"><div className="author-work-detail-cover"><img src={promessaBook.image} alt={'Capa de ' + book.title}/></div><div className="author-work-detail-copy"><span className="author-work-status">{promessaBook.status}</span><h1 style={{color:'#f9ebcf'}}>{book.title}</h1><h2>{book.subtitle}</h2><p>Romulo Schutz · 21 capítulos</p>{isAdmin&&hasPreview&&<div className="book-actions"><button onClick={onRead}>🔐 Abrir prévia do EPUB →</button><small className="book-license-note">Acesso exclusivo do administrador. O livro continua oculto para leitores até o lançamento.</small></div>}</div></section>
    <section className="author-work-editorial"><p className="eyebrow" style={{color:'#dab77a'}}>APRESENTAÇÃO DA OBRA</p><article><h2 style={{color:'#f9ebcf'}}>Sobre a obra</h2><h3 style={{color:'#dab77a'}}>Sinopse</h3><p>{book.synopsis}</p></article></section>
    <section className="author-work-editorial"><p className="eyebrow" style={{color:'#dab77a'}}>POR TRÁS DA OBRA</p><article><h2 style={{color:'#f9ebcf'}}>O significado da capa</h2><p>{book.meaning}</p></article><article><h2 style={{color:'#f9ebcf'}}>Uma conversa entre livros</h2><p>Esta obra se aproxima de temas presentes em outros livros de Romulo Schutz e aponta para eles quando uma explicação mais ampla pode ajudar. Seu foco próprio é a fidelidade de Deus às promessas, o modo como elas se cumprem em Cristo e a esperança fundada na palavra de sua volta.</p></article></section>
    <section className="author-work-editorial edition-spread-section"><p className="eyebrow" style={{color:'#dab77a'}}>CONHEÇA A EDIÇÃO</p><article><h2 style={{color:'#f9ebcf'}}>Capa, contracapa e orelhas</h2><a className="edition-spread-link" href={assets + '/capa-aberta.webp'} target="_blank" rel="noreferrer"><img className="edition-spread-image" src={assets + '/capa-aberta.webp'} alt="Capa aberta de Entre a Promessa e o Cumprimento, com contracapa, lombada, orelhas e foto do autor" loading="lazy"/><span>Clique para ampliar a capa aberta</span></a></article></section>
    <section className="author-work-editorial"><article><h2 style={{color:'#f9ebcf'}}>Do autor para o leitor</h2><figure style={{margin:'1.5rem 0'}}><img style={{width:'100%',height:'auto',borderRadius:12}} src={assets + '/autor.webp'} alt="Romulo Schutz em seu espaço de escrita e reflexão" loading="lazy"/><figcaption><blockquote>“{book.quote}”</blockquote><p>Romulo Schutz</p></figcaption></figure></article></section>
  </main>
}
