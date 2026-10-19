import { useEffect,useMemo,useState } from 'react'
import {getInstitutionalManagerSummary,issueInstitutionalActivationCode,listAnnualEditions,listInstitutionalCodes,revokeInstitutionalActivation,searchInstitutionalActivationUsers,setInstitutionalCodeStatus} from './lib/institutional-licensing.js'

export default function InstitutionalManagerPanel({supabase,context}){
  const institutionId=context?.institution_id
  const [editions,setEditions]=useState([]),[summary,setSummary]=useState([]),[editionId,setEditionId]=useState('')
  const [users,setUsers]=useState([]),[codes,setCodes]=useState([]),[search,setSearch]=useState(''),[codeLabel,setCodeLabel]=useState('')
  const [loading,setLoading]=useState(false),[message,setMessage]=useState('')
  const current=useMemo(()=>summary.find(x=>x.annual_edition_id===editionId)||null,[summary,editionId])

  async function loadBase(){
    if(!institutionId)return
    setLoading(true)
    const [s,e]=await Promise.all([getInstitutionalManagerSummary(supabase,institutionId),listAnnualEditions(supabase)])
    if(s.error||e.error)setMessage('Não foi possível carregar os acessos da instituição.')
    else{setSummary(s.data||[]);setEditions(e.data||[]);if(!editionId){const first=(s.data||[])[0]?.annual_edition_id||(e.data||[]).find(x=>x.is_active)?.id;setEditionId(first||'')}}
    setLoading(false)
  }
  async function loadDetail(){
    if(!institutionId||!editionId)return
    const [u,c]=await Promise.all([searchInstitutionalActivationUsers(supabase,institutionId,editionId,search),listInstitutionalCodes(supabase,institutionId,editionId)])
    if(u.error)setMessage('Não foi possível carregar os usuários ativados.');else setUsers(u.data||[])
    if(!c.error)setCodes(c.data||[])
  }
  useEffect(()=>{loadBase()},[institutionId])
  useEffect(()=>{const timer=setTimeout(loadDetail,search?250:0);return()=>clearTimeout(timer)},[institutionId,editionId,search])

  async function issueCode(){
    if(!editionId)return
    setLoading(true);setMessage('Gerando código...')
    const {data,error}=await issueInstitutionalActivationCode(supabase,{institutionId,annualEditionId:editionId,label:codeLabel,manager:true})
    if(error)setMessage('Não foi possível gerar o código: '+error.message)
    else{setCodeLabel('');setMessage('✓ Código individual criado: '+data);await loadDetail()}
    setLoading(false)
  }
  async function toggleCode(item){
    if(item.status==='used')return
    const next=item.status==='active'?'blocked':'active'
    const {error}=await setInstitutionalCodeStatus(supabase,item.id,next)
    if(error)setMessage('Erro ao alterar o código: '+error.message);else{setMessage(next==='active'?'✓ Código desbloqueado.':'✓ Código bloqueado.');await loadDetail()}
  }
  async function revoke(item){
    if(!window.confirm('Revogar este acesso? A vaga voltará ao saldo disponível da instituição. O código já utilizado continuará encerrado.'))return
    setLoading(true)
    const {error}=await revokeInstitutionalActivation(supabase,item.activation_id,{manager:true})
    if(error)setMessage('Erro ao revogar acesso: '+error.message);else{setMessage('✓ Acesso revogado e vaga devolvida ao saldo. Gere um novo código para uma nova autorização.');await Promise.all([loadBase(),loadDetail()])}
    setLoading(false)
  }
  const codeStatus=item=>item.status==='used'?'✓ Utilizado':item.status==='active'?'Ativo':'× Bloqueado'

  return <section className="institutional-admin institutional-manager">
    <div className="admin-title"><p className="eyebrow">GESTÃO INSTITUCIONAL</p><h1>{context?.institution_name||'Minha instituição'}</h1><p>Administre somente os acessos da sua instituição. Anotações, favoritos, orações, histórico de leitura e reflexões pessoais dos usuários não são exibidos neste painel.</p></div>
    {message&&<p className="admin-message" role="status">{message}</p>}
    <div className="institutional-detail">
      <label>Edição<select value={editionId} onChange={e=>setEditionId(e.target.value)}>{editions.filter(e=>summary.some(s=>s.annual_edition_id===e.id)).map(e=><option key={e.id} value={e.id}>{e.year} — {e.title}</option>)}</select></label>
      <div className="institutional-kpis"><div><strong>{current?.purchased||0}</strong><span>Contratados</span></div><div><strong>{current?.activated||0}</strong><span>Acessos ativados</span></div><div><strong>{current?.available||0}</strong><span>Disponíveis</span></div></div>
      <section className="institutional-block"><h3>Códigos individuais</h3><p>Cada código libera somente uma vaga e é encerrado automaticamente após o primeiro uso. Se um acesso for revogado, a vaga volta ao saldo, mas o código antigo não pode ser reutilizado.</p><div className="institutional-code-row"><input value={codeLabel} onChange={e=>setCodeLabel(e.target.value)} placeholder="Ex.: Maria — cortesia"/><button type="button" disabled={loading||!editionId} onClick={issueCode}>Gerar código</button></div>{codes.length?<div className="institutional-code-list">{codes.map(item=><div key={item.id}><strong>{item.code}</strong><span>{item.label||'Código individual'} · {codeStatus(item)}</span>{item.status!=='used'&&<button type="button" className={item.status==='active'?'admin-block':''} onClick={()=>toggleCode(item)}>{item.status==='active'?'Bloquear':'Desbloquear'}</button>}</div>)}</div>:<p>Nenhum código nesta edição.</p>}</section>
      <section className="institutional-block"><h3>Usuários com acesso</h3><label>Buscar por nome ou e-mail<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite nome ou e-mail"/></label>{loading&&!users.length?<p>Carregando...</p>:users.length?<div className="institutional-history">{users.map(item=><article key={item.activation_id}><strong>{item.full_name||item.email||'Usuário'}</strong><span>{item.email||''}</span><small>Acesso ativado em {new Date(item.activated_at).toLocaleString('pt-BR')} · {item.status==='active'?'Ativo':'Revogado'}</small>{item.status==='active'&&<button type="button" className="admin-block" onClick={()=>revoke(item)}>Revogar acesso</button>}</article>)}</div>:<p>Nenhum usuário encontrado.</p>}</section>
    </div>
  </section>
}
