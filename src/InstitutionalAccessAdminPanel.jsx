import { useEffect, useMemo, useState } from 'react'
import {
  addInstitutionalLicenseLot,
  createInstitutionalAccount,
  issueInstitutionalActivationCode,
  listAnnualEditions,
  listInstitutionalAccounts,
  listInstitutionalActivations,
  listInstitutionalCodes,
  listInstitutionalLots,
  listInstitutionalSummary,
  revokeInstitutionalActivation,
  updateInstitutionalAccount
} from './lib/institutional-licensing.js'

const KIND_LABELS={empresa:'Empresa',prefeitura:'Prefeitura',igreja:'Igreja',livraria:'Livraria',associacao:'Associação',outro:'Outro'}
const SOURCE_LABELS={manual:'Manual',pix:'Pix',transferencia:'Transferência',boleto:'Boleto',empenho:'Empenho',mercado_pago:'Mercado Pago',cortesia:'Cortesia',outro:'Outro'}
const EMPTY_ORG={name:'',kind:'empresa',contact_name:'',contact_email:'',contact_phone:'',notes:''}
const EMPTY_PURCHASE={quantity:'',annual_edition_id:'',source:'manual',reference:'',amount_cents:''}

export default function InstitutionalAccessAdminPanel({supabase}){
  const [accounts,setAccounts]=useState([])
  const [summary,setSummary]=useState([])
  const [editions,setEditions]=useState([])
  const [selectedId,setSelectedId]=useState('')
  const [selectedEditionId,setSelectedEditionId]=useState('')
  const [lots,setLots]=useState([])
  const [codes,setCodes]=useState([])
  const [activations,setActivations]=useState([])
  const [loading,setLoading]=useState(false)
  const [message,setMessage]=useState('')
  const [newOrg,setNewOrg]=useState(EMPTY_ORG)
  const [initialPurchase,setInitialPurchase]=useState(EMPTY_PURCHASE)
  const [lotForm,setLotForm]=useState({quantity:'',source:'manual',reference:'',amount_cents:''})
  const [codeLabel,setCodeLabel]=useState('')

  const selected=useMemo(()=>accounts.find(item=>item.id===selectedId)||null,[accounts,selectedId])
  const selectedSummary=useMemo(()=>summary.filter(item=>item.institution_id===selectedId),[summary,selectedId])

  async function loadBase(){
    if(!supabase)return
    setLoading(true);setMessage('')
    const [a,s,e]=await Promise.all([
      listInstitutionalAccounts(supabase),
      listInstitutionalSummary(supabase),
      listAnnualEditions(supabase)
    ])
    if(a.error||s.error||e.error){
      setMessage('Não foi possível carregar o módulo institucional.')
    }else{
      setAccounts(a.data||[]);setSummary(s.data||[]);setEditions(e.data||[])
      if(!selectedId&&a.data?.length)setSelectedId(a.data[0].id)
      const defaultEdition=e.data?.find(x=>x.is_active)?.id||e.data?.[0]?.id||''
      if(!selectedEditionId&&defaultEdition)setSelectedEditionId(defaultEdition)
      setInitialPurchase(v=>v.annual_edition_id? v : {...v,annual_edition_id:defaultEdition})
    }
    setLoading(false)
  }

  async function loadDetail(){
    if(!supabase||!selectedId)return
    const [l,c,a]=await Promise.all([
      listInstitutionalLots(supabase,selectedId,selectedEditionId||null),
      listInstitutionalCodes(supabase,selectedId,selectedEditionId||null),
      listInstitutionalActivations(supabase,selectedId,selectedEditionId||null)
    ])
    if(!l.error)setLots(l.data||[])
    if(!c.error)setCodes(c.data||[])
    if(!a.error)setActivations(a.data||[])
  }

  useEffect(()=>{loadBase()},[])
  useEffect(()=>{loadDetail()},[selectedId,selectedEditionId])

  async function createOrg(){
    if(!newOrg.name.trim()){setMessage('Informe o nome da instituição.');return}
    const qty=Number(initialPurchase.quantity)
    if(!initialPurchase.annual_edition_id){setMessage('Selecione a edição/ano da compra inicial.');return}
    if(!Number.isInteger(qty)||qty<=0){setMessage('Informe a quantidade de acessos adquiridos na compra inicial.');return}
    setLoading(true);setMessage('Cadastrando instituição e compra inicial...')
    const {data,error}=await createInstitutionalAccount(supabase,newOrg)
    if(error){setMessage('Erro ao cadastrar instituição: '+error.message);setLoading(false);return}

    const lotResult=await addInstitutionalLicenseLot(supabase,{
      institution_id:data.id,
      annual_edition_id:initialPurchase.annual_edition_id,
      quantity:qty,
      source:initialPurchase.source,
      reference:initialPurchase.reference,
      amount_cents:initialPurchase.amount_cents
    })
    if(lotResult.error){
      setSelectedId(data.id)
      setMessage('A instituição foi cadastrada, mas a compra inicial não foi registrada. Abra a instituição e adicione o lote. Erro: '+lotResult.error.message)
      await loadBase();setLoading(false);return
    }

    const defaultEdition=editions.find(x=>x.is_active)?.id||editions[0]?.id||''
    setNewOrg(EMPTY_ORG)
    setInitialPurchase({...EMPTY_PURCHASE,annual_edition_id:defaultEdition})
    setSelectedEditionId(initialPurchase.annual_edition_id)
    await loadBase();setSelectedId(data.id);setLoading(false);setMessage(`✓ Instituição cadastrada com ${qty} acessos adquiridos.`)
  }

  async function addLot(){
    const qty=Number(lotForm.quantity)
    if(!selectedId||!selectedEditionId||!Number.isInteger(qty)||qty<=0){setMessage('Informe uma quantidade válida de acessos.');return}
    setLoading(true);setMessage('Adicionando lote...')
    const {error}=await addInstitutionalLicenseLot(supabase,{institution_id:selectedId,annual_edition_id:selectedEditionId,...lotForm,quantity:qty})
    if(error){setMessage('Erro ao adicionar lote: '+error.message);setLoading(false);return}
    setLotForm({quantity:'',source:'manual',reference:'',amount_cents:''})
    await Promise.all([loadBase(),loadDetail()]);setLoading(false);setMessage('✓ Novo lote somado ao saldo da instituição.')
  }

  async function issueCode(){
    if(!selectedId||!selectedEditionId)return
    setLoading(true);setMessage('Gerando código de ativação...')
    const {data,error}=await issueInstitutionalActivationCode(supabase,{institutionId:selectedId,annualEditionId:selectedEditionId,label:codeLabel})
    if(error){setMessage('Erro ao gerar código: '+error.message);setLoading(false);return}
    setCodeLabel('');await loadDetail();setLoading(false);setMessage('✓ Código criado: '+data)
  }

  async function toggleOrg(){
    if(!selected)return
    const next=selected.status==='active'?'blocked':'active'
    const {error}=await updateInstitutionalAccount(supabase,selected.id,{status:next})
    if(error){setMessage('Erro ao alterar instituição: '+error.message);return}
    await loadBase();setMessage(next==='active'?'✓ Instituição desbloqueada.':'✓ Instituição bloqueada.')
  }

  async function revoke(item){
    if(!window.confirm('Revogar este acesso e devolver 1 vaga ao saldo da instituição?'))return
    setLoading(true)
    const {error}=await revokeInstitutionalActivation(supabase,item.id)
    if(error){setMessage('Erro ao revogar acesso: '+error.message);setLoading(false);return}
    await Promise.all([loadBase(),loadDetail()]);setLoading(false);setMessage('✓ Acesso revogado e vaga devolvida ao saldo.')
  }

  const current=selectedSummary.find(item=>item.annual_edition_id===selectedEditionId)

  return <section className="institutional-admin">
    <div className="admin-title"><p className="eyebrow">ACESSOS INSTITUCIONAIS</p><h1>Empresas, prefeituras, igrejas e parceiros</h1><p>Controle lotes vendidos, ativações realizadas e saldo disponível por edição.</p></div>

    {message&&<p className="admin-message" role="status">{message}</p>}

    <section className="institutional-create-card">
      <h2>＋ Nova instituição</h2>
      <div className="institutional-form-grid">
        <label>Nome<input value={newOrg.name} onChange={e=>setNewOrg(v=>({...v,name:e.target.value}))} placeholder="Empresa X"/></label>
        <label>Tipo<select value={newOrg.kind} onChange={e=>setNewOrg(v=>({...v,kind:e.target.value}))}>{Object.entries(KIND_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label>Responsável<input value={newOrg.contact_name} onChange={e=>setNewOrg(v=>({...v,contact_name:e.target.value}))}/></label>
        <label>E-mail<input type="email" value={newOrg.contact_email} onChange={e=>setNewOrg(v=>({...v,contact_email:e.target.value}))}/></label>
        <label>Telefone<input value={newOrg.contact_phone} onChange={e=>setNewOrg(v=>({...v,contact_phone:e.target.value}))}/></label>
        <label>Observações<input value={newOrg.notes} onChange={e=>setNewOrg(v=>({...v,notes:e.target.value}))}/></label>
      </div>

      <div className="institutional-block" style={{marginTop:'16px'}}>
        <h3>Compra inicial</h3>
        <p>Registre aqui a primeira aquisição da empresa. Novas compras poderão ser acrescentadas depois como novos lotes, sem perder o histórico.</p>
        <div className="institutional-form-grid">
          <label>Quantidade de acessos adquiridos<input type="number" min="1" value={initialPurchase.quantity} onChange={e=>setInitialPurchase(v=>({...v,quantity:e.target.value}))} placeholder="Ex.: 40"/></label>
          <label>Edição / ano<select value={initialPurchase.annual_edition_id} onChange={e=>setInitialPurchase(v=>({...v,annual_edition_id:e.target.value}))}><option value="">Selecione</option>{editions.map(item=><option key={item.id} value={item.id}>{item.year} — {item.title}</option>)}</select></label>
          <label>Origem da aquisição<select value={initialPurchase.source} onChange={e=>setInitialPurchase(v=>({...v,source:e.target.value}))}>{Object.entries(SOURCE_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>Referência<input value={initialPurchase.reference} onChange={e=>setInitialPurchase(v=>({...v,reference:e.target.value}))} placeholder="Contrato, NF, empenho..."/></label>
          <label>Valor total em centavos (opcional)<input type="number" min="0" value={initialPurchase.amount_cents} onChange={e=>setInitialPurchase(v=>({...v,amount_cents:e.target.value}))}/></label>
        </div>
      </div>

      <button type="button" onClick={createOrg} disabled={loading}>Cadastrar instituição + compra inicial</button>
    </section>

    <div className="institutional-layout">
      <aside className="institutional-list">
        <h2>Instituições</h2>
        {accounts.length?accounts.map(item=><button type="button" key={item.id} className={item.id===selectedId?'active':''} onClick={()=>setSelectedId(item.id)}><strong>{item.name}</strong><small>{KIND_LABELS[item.kind]||item.kind} · {item.status==='active'?'Ativa':'Bloqueada'}</small></button>):<p>Nenhuma instituição cadastrada.</p>}
      </aside>

      <div className="institutional-detail">
        {selected?<>
          <div className="institutional-head"><div><h2>{selected.name}</h2><p>{KIND_LABELS[selected.kind]||selected.kind}{selected.contact_name?' · '+selected.contact_name:''}</p></div><button type="button" className={selected.status==='active'?'admin-block':''} onClick={toggleOrg}>{selected.status==='active'?'Bloquear':'Desbloquear'}</button></div>

          <label>Edição<select value={selectedEditionId} onChange={e=>setSelectedEditionId(e.target.value)}>{editions.map(item=><option key={item.id} value={item.id}>{item.year} — {item.title}</option>)}</select></label>

          <div className="institutional-kpis">
            <div><strong>{current?.purchased||0}</strong><span>Contratados</span></div>
            <div><strong>{current?.activated||0}</strong><span>Ativados</span></div>
            <div><strong>{current?.available||0}</strong><span>Disponíveis</span></div>
          </div>

          <section className="institutional-block"><h3>Adicionar novo lote</h3><p>Ex.: a empresa tinha 30 acessos e comprou mais 10. Cadastre apenas +10; o total será somado automaticamente.</p><div className="institutional-form-grid"><label>Quantidade<input type="number" min="1" value={lotForm.quantity} onChange={e=>setLotForm(v=>({...v,quantity:e.target.value}))}/></label><label>Forma<select value={lotForm.source} onChange={e=>setLotForm(v=>({...v,source:e.target.value}))}>{Object.entries(SOURCE_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Referência<input value={lotForm.reference} onChange={e=>setLotForm(v=>({...v,reference:e.target.value}))} placeholder="Contrato, NF, empenho..."/></label><label>Valor total em centavos<input type="number" min="0" value={lotForm.amount_cents} onChange={e=>setLotForm(v=>({...v,amount_cents:e.target.value}))}/></label></div><button type="button" onClick={addLot} disabled={loading}>＋ Somar acessos</button></section>

          <section className="institutional-block"><h3>Código de ativação</h3><p>O colaborador cria a conta e informa este código. Cada ativação consome uma vaga.</p><div className="institutional-code-row"><input value={codeLabel} onChange={e=>setCodeLabel(e.target.value)} placeholder="Ex.: RH Empresa X"/><button type="button" onClick={issueCode} disabled={loading}>Gerar código</button></div>{codes.length?<div className="institutional-code-list">{codes.map(item=><div key={item.id}><strong>{item.code}</strong><span>{item.label||'Código institucional'} · {item.status==='active'?'Ativo':'Bloqueado'}</span></div>)}</div>:<p>Nenhum código gerado para esta edição.</p>}</section>

          <section className="institutional-block"><h3>Histórico de lotes</h3>{lots.length?<div className="institutional-history">{lots.map(item=><article key={item.id}><strong>+{item.quantity} acessos</strong><span>{SOURCE_LABELS[item.source]||item.source}{item.reference?' · '+item.reference:''}</span><small>{new Date(item.purchased_at).toLocaleString('pt-BR')}</small></article>)}</div>:<p>Nenhum lote nesta edição.</p>}</section>

          <section className="institutional-block"><h3>Usuários ativados</h3>{activations.filter(item=>!item.revoked_at).length?<div className="institutional-history">{activations.filter(item=>!item.revoked_at).map(item=><article key={item.id}><strong>{item.user_id}</strong><span>Ativado em {new Date(item.activated_at).toLocaleString('pt-BR')}</span><button type="button" className="admin-block" onClick={()=>revoke(item)}>Revogar e devolver vaga</button></article>)}</div>:<p>Nenhum usuário ativo nesta edição.</p>}</section>
        </>:<p>Selecione uma instituição.</p>}
      </div>
    </div>
  </section>
}
