import { useState } from 'react'
import { annualEdition2027, digitalPurchasePolicy, digitalLicense, purchaseAcceptanceText } from './commercial-policy.js'
import { formatCommercialPrice } from './lib/commercial-catalog-api.js'

function LegalDocument({document,onClose}){
  return <div className="purchase-legal-overlay" role="dialog" aria-modal="true" aria-label={document.title}>
    <article className="purchase-legal-document">
      <header><div><small>{document.version ? `VERSÃO ${document.version}` : 'DOCUMENTO VIGENTE'}</small><h2>{document.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
      {document.sections.map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}
      <button type="button" className="primary" onClick={onClose}>Li o documento</button>
    </article>
  </div>
}

export default function AnnualPurchasePanel({product,onContinue,onBack,busy=false,message=''}){
  const [accepted,setAccepted]=useState(false)
  const [document,setDocument]=useState(null)
  const price=product?formatCommercialPrice(product.amountCents,product.currency):''
  const privacyDocument={
    title:'Política de Privacidade',
    sections:[
      ['Privacidade e dados pessoais','A Política de Privacidade do Bíblia + Chimarrão explica como os dados da conta e os registros necessários ao funcionamento da plataforma são tratados.'],
      ['Acesso ao documento completo','Use a opção Política de Privacidade disponível no aplicativo para consultar o texto completo e vigente.']
    ]
  }
  return <main className="dashboard annual-purchase-page">
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Compra segura · Edição 2027</small></div><button className="logout" type="button" onClick={onBack}>← Voltar</button></header>
    <section className="annual-purchase-hero">
      <p className="eyebrow">RESUMO DA COMPRA</p>
      <h1>{annualEdition2027.title}</h1>
      <p>Uma edição anual da sua caminhada devocional. Você adquire 2027 uma única vez e mantém essa edição na sua conta mesmo quando novas edições forem lançadas.</p>
      <div className="annual-purchase-price"><small>VALOR TOTAL</small><strong>{price||'Carregando valor...'}</strong><span>Pagamento único da edição 2027</span></div>
    </section>
    <section className="annual-purchase-grid">
      <article><h2>✓ O que está incluído</h2>{annualEdition2027.included.map(item=><p key={item}>✓ {item}</p>)}</article>
      <article><h2>Informações importantes</h2>{annualEdition2027.excluded.map(item=><p key={item}>• {item}</p>)}<p>• A liberação da edição ocorre após a confirmação segura do pagamento.</p></article>
    </section>
    <section className="annual-purchase-legal">
      <p className="eyebrow">TRANSPARÊNCIA E RESPONSABILIDADE</p>
      <h2>Revise as condições antes de pagar</h2>
      <p>Os documentos abaixo explicam as condições da aquisição, os direitos do leitor, as regras de uso e o tratamento de dados da plataforma.</p>
      <div className="annual-legal-links"><button type="button" onClick={()=>setDocument(digitalPurchasePolicy)}>Política de Compra Digital →</button><button type="button" onClick={()=>setDocument(digitalLicense)}>Licença de Uso →</button><button type="button" onClick={()=>setDocument(privacyDocument)}>Política de Privacidade →</button></div>
      <label className="annual-purchase-accept"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/><span>{purchaseAcceptanceText}</span></label>
      {message&&<p className="book-access-message">{message}</p>}
      <div className="annual-payment-actions"><button type="button" className="primary annual-pay-button" disabled={!accepted||!product?.isActive||busy} onClick={()=>onContinue?.({accepted:true,policyVersion:digitalPurchasePolicy.version,licenseVersion:digitalLicense.version})}>{busy?'Preparando pagamento seguro...':`Prosseguir para pagamento seguro — ${price||'R$ 34,90'}`}</button><small className="annual-payment-note">Pagamento processado pelo Mercado Pago. O acesso somente é liberado após confirmação segura da transação.</small></div>
    </section>
    {document&&<LegalDocument document={document} onClose={()=>setDocument(null)}/>} 
  </main>
}
