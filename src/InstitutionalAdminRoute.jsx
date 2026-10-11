import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './lib/supabase.js'
import InstitutionalAccessAdminPanel from './InstitutionalAccessAdminPanel.jsx'
import InstitutionalCodeRedeem from './InstitutionalCodeRedeem.jsx'

export default function InstitutionalAdminRoute(){
  const params=new URLSearchParams(window.location.search)
  const redeemMode=params.get('institutional-redeem')==='1'
  const [user,setUser]=useState(null)
  const [isAdmin,setIsAdmin]=useState(false)
  const [loading,setLoading]=useState(true)
  const [message,setMessage]=useState('')

  useEffect(()=>{
    if(!supabaseConfigured||!supabase){setMessage('Supabase não configurado.');setLoading(false);return}
    let cancelled=false
    supabase.auth.getSession().then(async({data})=>{
      if(cancelled)return
      const sessionUser=data.session?.user||null
      setUser(sessionUser)
      if(!sessionUser){setLoading(false);return}
      if(redeemMode){setLoading(false);return}
      const {data:admin,error}=await supabase.rpc('is_app_admin')
      if(cancelled)return
      setIsAdmin(!error&&admin===true)
      setLoading(false)
    })
    const {data:listener}=supabase.auth.onAuthStateChange(async(_event,session)=>{
      if(cancelled)return
      const sessionUser=session?.user||null
      setUser(sessionUser)
      if(!sessionUser){setIsAdmin(false);setLoading(false);return}
      if(redeemMode){setLoading(false);return}
      const {data:admin,error}=await supabase.rpc('is_app_admin')
      if(!cancelled)setIsAdmin(!error&&admin===true)
      setLoading(false)
    })
    return()=>{cancelled=true;listener.subscription.unsubscribe()}
  },[redeemMode])

  function back(){window.location.href=window.location.origin+window.location.pathname}

  if(loading)return <main className="dashboard admin-page"><p>Carregando...</p></main>
  if(!user)return <main className="dashboard admin-page"><section className="admin-panel"><h1>Entre no Bíblia + Chimarrão</h1><p>Faça login no aplicativo antes de usar este recurso.</p><button type="button" onClick={back}>Voltar ao aplicativo</button></section></main>

  if(redeemMode)return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Acesso Institucional</small></div><button className="logout" onClick={back}>← Aplicativo</button></header><InstitutionalCodeRedeem supabase={supabase} onActivated={()=>setMessage('Acesso atualizado. Volte ao aplicativo para continuar.')}/>{message&&<p className="admin-message">{message}</p>}</main>

  if(!isAdmin)return <main className="dashboard admin-page"><section className="admin-panel"><h1>Acesso restrito</h1><p>Este painel é exclusivo do administrador.</p><button type="button" onClick={back}>Voltar ao aplicativo</button></section></main>

  return <main className="dashboard admin-page"><header className="dash-header"><div><strong>BÍBLIA + CHIMARRÃO</strong><small>Acessos Institucionais</small></div><button className="logout" onClick={back}>← Aplicativo</button></header><section className="admin-panel"><InstitutionalAccessAdminPanel supabase={supabase}/></section></main>
}
