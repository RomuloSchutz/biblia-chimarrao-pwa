import { useState } from 'react'
import { redeemInstitutionalCode } from './lib/institutional-licensing.js'

export default function InstitutionalCodeRedeem({supabase,onActivated}){
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')

  async function redeem(){
    const value=code.trim()
    if(!value){setMessage('Digite o código fornecido pela instituição.');return}
    setBusy(true);setMessage('Validando código...')
    const {data,error}=await redeemInstitutionalCode(supabase,value)
    if(error){
      const labels={
        invalid_code:'Código não encontrado.',
        institution_blocked:'A instituição está temporariamente bloqueada.',
        code_blocked:'Este código está bloqueado.',
        code_expired:'Este código expirou.',
        edition_inactive:'Esta edição não está disponível.',
        no_available_seats:'Todos os acessos contratados por esta instituição já foram utilizados.'
      }
      setMessage(labels[error.message]||('Não foi possível ativar: '+error.message));setBusy(false);return
    }
    if(data?.status==='already_has_access')setMessage('✓ Sua conta já possui acesso a esta edição.')
    else if(data?.status==='already_activated')setMessage('✓ Este acesso institucional já está ativo na sua conta.')
    else setMessage(`✓ Acesso liberado por ${data?.institution_name||'sua instituição'}.`)
    setBusy(false);onActivated?.(data)
  }

  return <section className="institutional-redeem">
    <p className="eyebrow">ACESSO INSTITUCIONAL</p>
    <h2>Recebeu um código da sua empresa, prefeitura, igreja ou parceiro?</h2>
    <p>Entre com sua conta e informe o código recebido. A ativação usa uma das vagas contratadas pela instituição.</p>
    <div className="institutional-code-entry"><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="BC-XXXX-XXXX" autoCapitalize="characters"/><button type="button" onClick={redeem} disabled={busy}>{busy?'Validando...':'Ativar acesso'}</button></div>
    {message&&<p className="admin-message" role="status">{message}</p>}
  </section>
}
