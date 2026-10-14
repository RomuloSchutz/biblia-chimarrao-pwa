import { useEffect,useState } from 'react'
import { supabase,supabaseConfigured } from './lib/supabase.js'
import { getInstitutionalManagerContext } from './lib/institutional-licensing.js'
import InstitutionalAccessAdminPanel from './InstitutionalAccessAdminPanel.jsx'
import InstitutionalManagerAdmin from './InstitutionalManagerAdmin.jsx'
import InstitutionalManagerPanel from './InstitutionalManagerPanel.jsx'
import InstitutionalCodeRedeem from './InstitutionalCodeRedeem.jsx'

export default function InstitutionalAdminRoute(){
  const params=new URLSearchParams(window.location.search),redeemMode=params.get('institutional-redeem')==='1'
  const [user,setUser]=useState(null),[isAdmin,setIsAdmin]=useState(false),[managerContext,setManagerContext]=useState(null),[loading,setLoading]=useState(true),[message,setMessage]=useState('')
  async function resolveRole(sessionUser){setUser(sessionUser||null);setIsAdmin(false);setManagerContext(null);if(!sessionUser||redeemMode){setLoading(false);return}const {data:admin,error:adminError}=await supabase.rpc('is_app_admin');if(!adminError&&admin===true){setIsAdmin(true);setLoading(false);return}const {data,error}=await getInstitutionalManagerContext(supabase);if(!error&&Array.isArray(data)&&data[0]?.manager_status==='active'&&data[0]?.institution_status==='active')setManagerContext(data[0]);setLoading(false)}
  useEffect(()=>{if(!supabaseConfigured||!supabase){setMessage('Supabase não configurado.');setLoading(false);return}let cancelled=false;supabase.auth.getSession().then(({data})=>{if(!cancelled)resolveRole(data.session?.user||null)});const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(!cancelled)resolveRole(session?.user||null)});return()=>{cancelled=true;listener.subscription.unsubscribe()}},[redeemMode])
  function back(){window.location.href=window.location.origin+window.location.pathname}
  if(loading)return <main className="dashboard admin-page"><p>Carregando...</p></main>
  if(!user)return <main className="dashboard admin-page"><section className="admin-panel"><h1>Entre no Bíblia + Chimarrão</h1><p>Faça login no aplicativo antes de usar este recurso.</p><button type="button" onClick={back}>Voltar ao aplicativo</button></section></main>
  if(redeemMode)return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Acesso Institucional</small></div><button className="logout" onClick={back}>← Aplicativo</button></header><InstitutionalCodeRedeem supabase={supabase} onActivated={()=>setMessage('Acesso atualizado. Volte ao aplicativo para continuar.')}/>{message&&<p className="admin-message">{message}</p>}</main>
  if(!isAdmin&&!managerContext)return <main className="dashboard admin-page"><section className="admin-panel"><h1>Acesso restrito</h1><p>Este painel é destinado ao administrador geral ou a um Gestor Institucional autorizado.</p><button type="button" onClick={back}>Voltar ao aplicativo</button></section></main>
  return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>{isAdmin?'Acessos Institucionais':'Gestão Institucional'}</small></div><button className="logout" onClick={back}>← Aplicativo</button></header><section className="admin-panel">{isAdmin?<><InstitutionalAccessAdminPanel supabase={supabase}/><InstitutionalManagerAdmin supabase={supabase}/></>:<InstitutionalManagerPanel supabase={supabase} context={managerContext}/>}</section></main>
}
