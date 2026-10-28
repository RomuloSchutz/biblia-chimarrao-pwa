import { useState } from 'react'
import { annualEdition2027, digitalPurchasePolicy, digitalLicense, purchaseAcceptanceText } from './commercial-policy.js'
import { formatCommercialPrice } from './lib/commercial-catalog-api.js'
import { supabase } from './lib/supabase.js'

function LegalDocument({document,onClose}){
  return <div className="purchase-legal-overlay" role="dialog" aria-modal="true" aria-label={document.title}>
    <article className="purchase-legal-document">
      <header><div><small>{document.version ? `VERSÃO ${document.version}` : 'DOCUMENTO VIGENTE'}</small><h2>{document.title}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
      {document.sections.map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}
      <button type="button" className="primary" onClick={onClose}>Li o documento</button>
    </article>
  </div>
}

const couponErrors={coupon_invalid:'Cupom não encontrado.',coupon_inactive:'Este cupom não está ativo.',coupon_not_started:'Esta promoção ainda não começou.',coupon_expired:'Este cupom já expirou.',coupon_not_applicable:'Este cupom não vale para a Edição 2027.',coupon_usage_limit_reached:'O limite de utilizações deste cupom foi atingido.',coupon_user_limit_reached:'Você já utilizou este cupom o número máximo de vezes permitido.',coupon_minimum_not_met:'O valor mínimo desta promoção não foi atingido.'}

export default function AnnualPurchasePanel({product,onContinue,onBack,busy=false,message=''}){
  const [accepted,setAccepted]=useState(false)
  const [document,setDocument]=useState(null)
  const [coupon,setCoupon]=useState('')
  const [couponBusy,setCouponBusy]=useState(false)
  const [couponMessage,setCouponMessage]=useState('')
  const [appliedCoupon,setAppliedCoupon]=useState(null)
  const [checkoutBusy,setCheckoutBusy]=useState(false)
  const price=product?formatCommercialPrice(product.amountCents,product.currency):''
  const finalPrice=appliedCoupon?formatCommercialPrice(appliedCoupon.amount_cents,appliedCoupon.currency):price
  const privacyDocument={title:'Política de Privacidade',sections:[['Privacidade e dados pessoais','A Política de Privacidade do Bíblia + Chimarrão explica como os dados da conta e os registros necessários ao funcionamento da plataforma são tratados.'],['Acesso ao documento completo','Use a opção Política de Privacidade disponível no aplicativo para consultar o texto completo e vigente.']]}
  async function applyCoupon(){
    const code=coupon.trim().toUpperCase();setCoupon(code);setCouponMessage('');setAppliedCoupon(null)
    if(!code){setCouponMessage('Digite o código do cupom.');return}
    setCouponBusy(true)
    try{
      const {data:sessionData}=await supabase.auth.getSession();const session=sessionData?.session
      if(!session){setCouponMessage('Sua sessão expirou. Entre novamente para aplicar o cupom.');return}
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-commercial-coupon`,{method:'POST',headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({product_code:'app_biblia_chimarrao',coupon_code:code})})
      let data={};try{data=await response.json()}catch{}
      if(!response.ok||!data?.valid){setCouponMessage(couponErrors[data?.error]||'Não foi possível validar este cupom.');return}
      setAppliedCoupon(data);setCouponMessage(`✓ Cupom ${data.coupon_code} aplicado. Você economiza ${formatCommercialPrice(data.discount_amount_cents,data.currency)}.`)
    }catch{setCouponMessage('Não foi possível validar o cupom agora. Tente novamente.')}
    finally{setCouponBusy(false)}
  }
  async function continuePurchase(){
    if(!appliedCoupon){onContinue?.({accepted:true,policyVersion:digitalPurchasePolicy.version,licenseVersion:digitalLicense.version});return}
    setCheckoutBusy(true);setCouponMessage('Preparando pagamento com o desconto aplicado...')
    try{
      const {data:sessionData}=await supabase.auth.getSession();const session=sessionData?.session
      if(!session){setCouponMessage('Sua sessão expirou. Entre novamente para continuar.');return}
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-create-order`,{method:'POST',headers:{'Content-Type':'application/json','apikey':import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,'Authorization':`Bearer ${session.access_token}`},body:JSON.stringify({product_code:'app_biblia_chimarrao',coupon_code:appliedCoupon.coupon_code,accepted:true,policy_version:digitalPurchasePolicy.version,license_version:digitalLicense.version,return_base_url:window.location.origin})})
      let data={};try{data=await response.json()}catch{}
      if(!response.ok||!data?.checkout_url){setCouponMessage(couponErrors[data?.error]||'Não foi possível iniciar a compra com este cupom.');return}
      window.location.assign(data.checkout_url)
    }catch{setCouponMessage('Não foi possível conectar ao checkout do Mercado Pago.')}
    finally{setCheckoutBusy(false)}
  }
  const isBusy=busy||couponBusy||checkoutBusy
  return <main className="dashboard annual-purchase-page">
    <style>{`.annual-purchase-page{padding-top:0!important}.annual-purchase-page .dash-header{position:sticky!important;top:0!important}.annual-purchase-page .annual-purchase-hero,.annual-purchase-page .annual-purchase-grid,.annual-purchase-page .annual-purchase-legal{position:relative;z-index:1;max-width:880px;margin-left:auto!important;margin-right:auto!important}.annual-purchase-page .annual-purchase-hero{padding-top:34px!important}.annual-purchase-page .annual-legal-links{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin:20px 0!important}.annual-purchase-page .annual-legal-links button{margin:0!important}.annual-purchase-page .annual-purchase-accept{display:grid!important;grid-template-columns:24px minmax(0,1fr)!important;gap:12px!important;align-items:start!important;margin:22px 0!important;padding:18px!important;border:1px solid rgba(185,139,63,.55)!important;border-radius:16px!important;background:rgba(7,28,23,.55)!important;line-height:1.55!important}.annual-purchase-page .annual-purchase-accept input{width:20px!important;height:20px!important;margin:2px 0 0!important}.annual-purchase-page .annual-payment-actions{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:12px!important;margin-top:8px!important}.annual-purchase-page .annual-pay-button{margin:0!important;max-width:100%!important}.annual-purchase-page .annual-payment-note{display:block!important;line-height:1.45!important;color:#e7d8b8!important}.annual-coupon{margin:22px 0;padding:18px;border:1px solid rgba(185,139,63,.55);border-radius:16px;background:rgba(7,28,23,.38)}.annual-coupon h3{margin:0 0 6px}.annual-coupon-row{display:flex;gap:10px;margin-top:12px}.annual-coupon-row input{flex:1;min-width:0;text-transform:uppercase}.annual-coupon-row button{white-space:nowrap}.annual-coupon-status{margin:10px 0 0}.annual-discount-summary{display:grid;gap:5px;margin-top:12px;padding:12px;border-radius:12px;background:rgba(185,139,63,.12)}.annual-discount-summary s{opacity:.72}.annual-discount-summary strong{font-size:1.2rem}@media(max-width:600px){.annual-purchase-page .annual-purchase-hero{padding-top:24px!important}.annual-purchase-page .annual-legal-links{display:grid!important;grid-template-columns:1fr!important}.annual-purchase-page .annual-legal-links button,.annual-purchase-page .annual-pay-button{width:100%!important}.annual-purchase-page .annual-purchase-accept{padding:14px!important;grid-template-columns:22px minmax(0,1fr)!important;gap:10px!important}.annual-coupon-row{display:grid;grid-template-columns:1fr}.annual-coupon-row button{width:100%}}`}</style>
    <header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Compra segura · Edição 2027</small></div><button className="logout" type="button" onClick={onBack}>← Voltar</button></header>
    <section className="annual-purchase-hero"><p className="eyebrow">RESUMO DA COMPRA</p><h1>{annualEdition2027.title}</h1><p>Uma edição anual da sua caminhada devocional. Você adquire 2027 uma única vez e mantém essa edição na sua conta mesmo quando novas edições forem lançadas.</p><div className="annual-purchase-price"><small>VALOR TOTAL</small><strong>{finalPrice||'Carregando valor...'}</strong><span>{appliedCoupon?`Cupom ${appliedCoupon.coupon_code} aplicado`:'Pagamento único da edição 2027'}</span></div></section>
    <section className="annual-purchase-grid"><article><h2>✓ O que está incluído</h2>{annualEdition2027.included.map(item=><p key={item}>✓ {item}</p>)}</article><article><h2>Informações importantes</h2>{annualEdition2027.excluded.map(item=><p key={item}>• {item}</p>)}<p>• A liberação da edição ocorre após a confirmação segura do pagamento.</p></article></section>
    <section className="annual-purchase-legal"><div className="annual-coupon"><h3>Tem um cupom de desconto?</h3><p>Digite o código promocional antes de seguir para o pagamento.</p><div className="annual-coupon-row"><input type="text" value={coupon} onChange={e=>{setCoupon(e.target.value.toUpperCase());if(appliedCoupon){setAppliedCoupon(null);setCouponMessage('Cupom alterado. Toque em Aplicar novamente.')}}} placeholder="Ex.: BLACKFRIDAY" autoComplete="off" disabled={isBusy}/><button type="button" onClick={applyCoupon} disabled={isBusy}>{couponBusy?'Validando...':'Aplicar'}</button></div>{couponMessage&&<p className="annual-coupon-status" role="status">{couponMessage}</p>}{appliedCoupon&&<div className="annual-discount-summary"><span>Preço normal: <s>{formatCommercialPrice(appliedCoupon.original_amount_cents,appliedCoupon.currency)}</s></span><span>Desconto: − {formatCommercialPrice(appliedCoupon.discount_amount_cents,appliedCoupon.currency)}</span><strong>Total com cupom: {finalPrice}</strong></div>}</div><p className="eyebrow">TRANSPARÊNCIA E RESPONSABILIDADE</p><h2>Revise as condições antes de pagar</h2><p>Os documentos abaixo explicam as condições da aquisição, os direitos do leitor, as regras de uso e o tratamento de dados da plataforma.</p><div className="annual-legal-links"><button type="button" onClick={()=>setDocument(digitalPurchasePolicy)}>Política de Compra Digital →</button><button type="button" onClick={()=>setDocument(digitalLicense)}>Licença de Uso →</button><button type="button" onClick={()=>setDocument(privacyDocument)}>Política de Privacidade →</button></div><label className="annual-purchase-accept"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/><span>{purchaseAcceptanceText}</span></label>{message&&<p className="book-access-message">{message}</p>}<div className="annual-payment-actions"><button type="button" className="primary annual-pay-button" disabled={!accepted||!product?.isActive||isBusy} onClick={continuePurchase}>{isBusy?'Preparando pagamento seguro...':`Prosseguir para pagamento seguro — ${finalPrice||'R$ 34,90'}`}</button><small className="annual-payment-note">Pagamento processado pelo Mercado Pago. O acesso somente é liberado após confirmação segura da transação.</small></div></section>
    {document&&<LegalDocument document={document} onClose={()=>setDocument(null)}/>} 
  </main>
}
