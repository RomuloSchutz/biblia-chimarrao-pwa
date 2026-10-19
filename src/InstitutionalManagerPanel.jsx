import { useEffect,useMemo,useState } from 'react'
import {getInstitutionalManagerSummary,issueInstitutionalActivationCode,listAnnualEditions,listInstitutionalCodes,revokeInstitutionalActivation,searchInstitutionalActivationUsers,setInstitutionalCodeStatus} from './lib/institutional-licensing.js'

export default function InstitutionalManagerPanel({supabase,context}){
  const institutionId=context?.institution_id
  const [editions,setEditions]=useState([]),[summary,setSummary]=useState([]),[editionId,setEditionId]=useState('')
  const [users,setUsers]=useState([]),[codes,setCodes]=useState([]),[search,setSearch]=useState(''),[codeLabel,setCodeLabel]=useState('')
  const [loading,setLoading]=useState(false),[message,setMessage]=useState('')
  const current=useMemo(()=>summary.find(x=>x.annual_edition_id===editionId)||null,[summary,editionId])
  const activeUsers=useMemo(()=>users.filter(x=>x.status==='active'),[users])
  const userByCode=useMemo(()=>{const map=new Map();for(const u of activeUsers){if(u.activation_code_id)map.set(u.activation_code_id,u)}return map},[activeUsers])
  const pendingCount=useMemo(()=>codes.filter(c=>c.status==='active').length,[codes])
  const occupiedCount=activeUsers.length+pendingCount
  const availableToIssue=Math.max(Number(current?.purchased||0)-occupiedCount,0)

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
    if(!editionId||availableToIssue<=0)return
    setLoading(true);setMessage('Gerando código...')
    const {data,error}=await issueInstitutionalActivationCode(supabase,{institutionId,annualEditionId:editionId,label:codeLabel,manager:true})
    if(error)setMessage(error.message?.includes('no_available_seats')?'Todas as licenças já estão ativas ou aguardando ativação. Revogue/bloqueie uma autorização ou adquira mais acessos.':'Não foi possível gerar o código: '+error.message)
    else{setCodeLabel('');setMessage('✓ Código individual criado: '+data);await Promise.all([loadBase(),loadDetail()])}
    setLoading(false)
  }
  async function toggleCode(item){
    if(item.status==='used')return
    const next=item.status==='active'?'blocked':'active'
    const {error}=await setInstitutionalCodeStatus(supabase,item.id,next)
    if(error)setMessage('Erro ao alterar o código: '+error.message);else{setMessage(next==='active'?'? Código reaberto e aguardando ativação.':'✕ Código bloqueado; a vaga voltou ao saldo disponível.');await Promise.all([loadBase(),loadDetail()])}
  }
  async function revoke(item){
    if(!window.confirm('Revogar este acesso? A vaga voltará ao saldo disponível da instituição. O código já utilizado continuará encerrado.'))return
    setLoading(true)
    const {error}=await revokeInstitutionalActivation(supabase,item.activation_id,{manager:true})
    if(error)setMessage('Erro ao revogar acesso: '+error.message);else{setMessage('✓ Acesso revogado e vaga devolvida ao saldo. Gere um novo código para uma nova autorização.');await Promise.all([loadBase(),loadDetail()])}
    setLoading(false)
  }
  const statusFor=item=>item.status==='active'?{icon:'?',label:'Aguardando ativação'}:item.status==='blocked'?{icon:'✕',label:'Bloqueado'}:{icon:'✓',label:'Ativo'}

  return <section className="institutional-admin institutional-manager">
    <div className="admin-title"><p className="eyebrow">GESTÃO INSTITUCIONAL</p><h1>{context?.institution_name||'Minha instituição'}</h1><p>Controle simples das licenças da instituição. O gestor vê somente nome, e-mail e situação administrativa; anotações, favoritos, orações, histórico de leitura e reflexões pessoais permanecem privados.</p></div>
    {message&&<p className="admin-message" role="status">{message}</p>}
    <div className="institutional-detail">
      <label>Edição<select value={editionId} onChange={e=>setEditionId(e.target.value)}>{editions.filter(e=>summary.some(s=>s.annual_edition_id===e.id)).map(e=><option key={e.id} value={e.id}>{e.year} — {e.title}</option>)}</select></label>
      <div className="institutional-kpis"><div><strong>{current?.purchased||0}</strong><span>Contratados</span></div><div><strong>{activeUsers.length}</strong><span>✓ Ativos</span></div><div><strong>{pendingCount}</strong><span>? Aguardando</span></div><div><strong>{availableToIssue}</strong><span>Disponíveis</span></div></div>
      <section className="institutional-block"><h3>Licenças e códigos individuais</h3><p>Cada código reserva uma licença. Um código aguardando ativação já conta entre os acessos contratados. Depois do primeiro uso, ele fica vinculado àquela pessoa e não pode ser reutilizado por outra conta.</p><div className="institutional-code-row"><input value={codeLabel} onChange={e=>setCodeLabel(e.target.value)} placeholder="Identificação opcional: nome ou setor"/><button type="button" disabled={loading||!editionId||availableToIssue<=0} onClick={issueCode}>{availableToIssue>0?'Gerar código':'Limite atingido'}</button></div>
      {codes.length?<div className="institutional-code-list">{codes.map(item=>{const st=statusFor(item);const person=userByCode.get(item.id);return <div key={item.id} className={'institutional-code-item status-'+item.status}><strong><span aria-hidden="true">{st.icon}</span> {item.code}</strong><span>{st.label}{item.label?' · '+item.label:''}</span>{person&&<small>{person.full_name||'Usuário'}{person.email?' · '+person.email:''}</small>}{item.status==='active'&&<button type="button" className="admin-block" onClick={()=>toggleCode(item)}>Bloquear código</button>}{item.status==='blocked'&&<button type="button" onClick={()=>toggleCode(item)}>Reabrir código</button>}</div>})}</div>:<p>Nenhum código nesta edição.</p>}</section>
      <section className="institutional-block"><h3>Pessoas e acessos</h3><label>Buscar por nome ou e-mail<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Digite nome ou e-mail"/></label>{loading&&!users.length?<p>Carregando...</p>:users.length?<div className="institutional-history">{users.map(item=><article key={item.activation_id}><strong>{item.status==='active'?'✓':'✕'} {item.full_name||item.email||'Usuário'}</strong><span>{item.email||''}</span><small>{item.status==='active'?'Ativo':'Revogado'} · ativado em {new Date(item.activated_at).toLocaleString('pt-BR')}</small>{item.status==='active'&&<button type="button" className="admin-block" onClick={()=>revoke(item)}>Revogar acesso</button>}</article>)}</div>:<p>Nenhum usuário encontrado.</p>}</section>
    </div>
  </section>
}
